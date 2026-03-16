<?php
// house_handler.php

header('Content-Type: application/json');
ob_start();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method. Only POST allowed.");
    }

    $postData = $_POST;

    if (!isset($postData['action'])) {
        throw new Exception("No action specified.");
    }

    $action = $postData['action'];

    $databasePath = $_SERVER['DOCUMENT_ROOT'] . '/server/configs/database.php';
    if (!file_exists($databasePath)) {
        $databasePath = dirname(__FILE__) . '/../../../server/configs/database.php';
    }

    if (!file_exists($databasePath)) {
        throw new Exception("Database configuration file not found.");
    }

    include $databasePath;

    if (!isset($pdo)) {
        throw new Exception("Database connection not established.");
    }

    switch ($action) {
        case 'get_all_houses':
            $result = getAllHouses();
            break;

        case 'save_house':
            $result = saveHouse($postData);
            break;

        case 'delete_house':
            if (!isset($postData['house_id'])) {
                throw new Exception("No house_id specified for delete action.");
            }
            $result = deleteHouse($postData['house_id']);
            break;

        case 'recalculate_areas':
            $result = recalculateAllAreas();
            break;

        default:
            throw new Exception("Unknown action: $action");
    }

    ob_clean();
    echo json_encode($result);

} catch (Exception $e) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// ─── Get all houses ───────────────────────────────────────────────────────────
function getAllHouses() {
    global $pdo;

    try {
        $sql = "SELECT
                    house_id,
                    osm_id,
                    address,
                    street_name,
                    house_number,
                    coordinates,
                    center_lat,
                    center_lng,
                    area_sqm,
                    created_at,
                    updated_at
                FROM house_polygons
                ORDER BY house_id ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // coordinates is stored as jsonb — decode it so the frontend gets a real array
        foreach ($houses as &$house) {
            if (!empty($house['coordinates'])) {
                $house['coordinates'] = json_decode($house['coordinates'], true);
            }
        }

        return [
            'success' => true,
            'count'   => count($houses),
            'houses'  => $houses
        ];

    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}

// ─── Save house (insert or update) ───────────────────────────────────────────
function saveHouse($data) {
    global $pdo;

    try {
        $houseId = !empty($data['house_id']) ? intval($data['house_id']) : null;

        // Coordinates are optional — manager may update only text fields
        $coordinatesJson = null;
        $centerLat = null;
        $centerLng = null;
        $areaSqm   = null;

        if (!empty($data['coordinates'])) {
            $coordinates = is_string($data['coordinates'])
                ? json_decode($data['coordinates'], true)
                : $data['coordinates'];

            if (!$coordinates || !is_array($coordinates)) {
                throw new Exception("Invalid coordinates format.");
            }

            // Normalise to a flat ring of [lng, lat] pairs.
            // Accept both flat [[lng,lat],...] and GeoJSON-wrapped [[[lng,lat],...]] formats.
            $ring = (isset($coordinates[0]) && is_array($coordinates[0]) && is_array($coordinates[0][0]))
                ? $coordinates[0]   // unwrap outer ring
                : $coordinates;     // already flat

            if (count($ring) < 3) {
                throw new Exception("Polygon needs at least 3 points.");
            }

            // Ensure ring is closed
            $first = $ring[0];
            $last  = $ring[count($ring) - 1];
            if ($first[0] !== $last[0] || $first[1] !== $last[1]) {
                $ring[] = $first;
            }

            $coordinatesJson = json_encode($ring); // store as flat ring [[lng,lat],...]

            // Centroid and area (auto-computed; caller may override below)
            $openRing  = array_slice($ring, 0, -1);
            $count     = count($openRing);
            $centerLng = round(array_sum(array_column($openRing, 0)) / $count, 8);
            $centerLat = round(array_sum(array_column($openRing, 1)) / $count, 8);
            $areaSqm   = computeApproxAreaSqm($openRing);
        }


        // Caller (manager UI) may supply explicit overrides
        $finalLat  = (!empty($data["center_lat"])) ? floatval($data["center_lat"]) : $centerLat;
        $finalLng  = (!empty($data["center_lng"])) ? floatval($data["center_lng"]) : $centerLng;
        $finalArea = (!empty($data["area_sqm"]))   ? floatval($data["area_sqm"])   : $areaSqm;
        $osmId     = (!empty($data["osm_id"]))     ? intval($data["osm_id"])       : null;
        if ($houseId) {
            // Build UPDATE — only include coordinates if provided
            $setClauses = [
                'osm_id       = :osm_id',
                'address      = :address',
                'street_name  = :street_name',
                'house_number = :house_number',
                'updated_at   = CURRENT_TIMESTAMP'
            ];

            $params = [
                ':osm_id'       => $osmId,
                ':address'      => $data['address']      ?? null,
                ':street_name'  => $data['street_name']  ?? null,
                ':house_number' => $data['house_number'] ?? null,
                ':house_id'     => $houseId
            ];

            if ($coordinatesJson !== null) {
                $setClauses[] = 'coordinates = :coordinates::jsonb';
                $setClauses[] = "geom = ST_SetSRID(ST_GeomFromGeoJSON(json_build_object('type','Polygon','coordinates',json_build_array(:coordinates2::jsonb))::text), 4326)";
                $params[':coordinates'] = $coordinatesJson;
                $params[':coordinates2'] = $coordinatesJson;
            }

            $setClauses[] = 'center_lat = :center_lat';
            $setClauses[] = 'center_lng = :center_lng';
            $setClauses[] = 'area_sqm   = :area_sqm';
            $params[':center_lat'] = $finalLat;
            $params[':center_lng'] = $finalLng;
            $params[':area_sqm']   = $finalArea;

            $sql = "UPDATE house_polygons SET " . implode(', ', $setClauses) .
                   " WHERE house_id = :house_id RETURNING house_id";

        } else {
            // INSERT — coordinates optional
            $cols   = ['osm_id', 'address', 'street_name', 'house_number', 'center_lat', 'center_lng', 'area_sqm'];
            $vals   = [':osm_id', ':address', ':street_name', ':house_number', ':center_lat', ':center_lng', ':area_sqm'];
            $params = [
                ':osm_id'       => $osmId,
                ':address'      => $data['address']      ?? null,
                ':street_name'  => $data['street_name']  ?? null,
                ':house_number' => $data['house_number'] ?? null,
                ':center_lat'   => $finalLat,
                ':center_lng'   => $finalLng,
                ':area_sqm'     => $finalArea
            ];

            if ($coordinatesJson !== null) {
                $cols[] = 'coordinates';
                $vals[] = ':coordinates::jsonb';
                $cols[] = 'geom';
                $vals[] = "ST_SetSRID(ST_GeomFromGeoJSON(json_build_object('type','Polygon','coordinates',json_build_array(:coordinates2::jsonb))::text), 4326)";
                $params[':coordinates'] = $coordinatesJson;
                $params[':coordinates2'] = $coordinatesJson;
            }

            $sql = "INSERT INTO house_polygons (" . implode(', ', $cols) . ")
                    VALUES (" . implode(', ', $vals) . ")
                    RETURNING house_id";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $row        = $stmt->fetch(PDO::FETCH_ASSOC);
        $newHouseId = $row['house_id'] ?? $houseId;

        return [
            'success'  => true,
            'message'  => $houseId ? 'House updated successfully' : 'House created successfully',
            'house_id' => $newHouseId
        ];

    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}

// ─── Delete house ─────────────────────────────────────────────────────────────
function deleteHouse($houseId) {
    global $pdo;

    try {
        $houseId = intval($houseId);
        if ($houseId <= 0) {
            throw new Exception("Invalid house ID.");
        }

        $stmt = $pdo->prepare("DELETE FROM house_polygons WHERE house_id = :house_id");
        $stmt->execute([':house_id' => $houseId]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("House not found.");
        }

        return ['success' => true, 'message' => 'House deleted successfully'];

    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}

// ─── Shoelace spherical area approximation ────────────────────────────────────
// Input: open ring of [lng, lat] pairs — returns area in sqm
function computeApproxAreaSqm(array $ring): float {
    $n = count($ring);
    if ($n < 3) return 0.0;

    $R    = 6371000.0; // Earth radius in metres
    $area = 0.0;

    // Spherical shoelace (Gauss area on a sphere):
    // sum of (lng2 - lng1) * (2 + sin(lat1) + sin(lat2))
    // Coordinates must be [lng, lat] in DEGREES — converted here.
    for ($i = 0; $i < $n; $i++) {
        $j     = ($i + 1) % $n;
        $lng1  = deg2rad((float)$ring[$i][0]);
        $lat1  = deg2rad((float)$ring[$i][1]);
        $lng2  = deg2rad((float)$ring[$j][0]);
        $lat2  = deg2rad((float)$ring[$j][1]);
        $dLng  = $lng2 - $lng1;
        $area += $dLng * (2.0 + sin($lat1) + sin($lat2));
    }

    // |area| * R^2 / 2  =>  square metres
    return round(abs($area) * $R * $R / 2.0, 2);
}

// ─── Recalculate area_sqm for every row that has coordinates ─────────────────
function recalculateAllAreas() {
    global $pdo;

    try {
        $sql  = "SELECT house_id, coordinates FROM house_polygons WHERE coordinates IS NOT NULL";
        $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

        $updated = 0;
        $skipped = 0;

        $upd = $pdo->prepare(
            "UPDATE house_polygons
             SET area_sqm   = :area,
                 center_lat = :clat,
                 center_lng = :clng,
                 geom       = ST_SetSRID(ST_GeomFromGeoJSON(json_build_object('type','Polygon','coordinates',json_build_array(:coords::jsonb))::text), 4326),
                 updated_at = CURRENT_TIMESTAMP
             WHERE house_id = :id"
        );

        foreach ($rows as $row) {
            $coords = json_decode($row['coordinates'], true);
            if (!$coords) { $skipped++; continue; }

            // Unwrap outer ring
            $ring = (isset($coords[0]) && is_array($coords[0]) && is_array($coords[0][0]))
                ? $coords[0] : $coords;

            if (count($ring) < 3) { $skipped++; continue; }

            // Remove closing duplicate if present
            $first = $ring[0]; $last = $ring[count($ring) - 1];
            if ($first[0] == $last[0] && $first[1] == $last[1]) {
                $ring = array_slice($ring, 0, -1);
            }

            $n      = count($ring);
            $clng   = round(array_sum(array_column($ring, 0)) / $n, 8);
            $clat   = round(array_sum(array_column($ring, 1)) / $n, 8);
            $area   = computeApproxAreaSqm($ring);

            $upd->execute([
                ':area'   => $area,
                ':clat'   => $clat,
                ':clng'   => $clng,
                ':coords' => json_encode($ring),
                ':id'     => $row['house_id']
            ]);
            $updated++;
        }

        return [
            'success' => true,
            'message' => "Recalculated $updated houses. Skipped $skipped.",
            'updated' => $updated,
            'skipped' => $skipped
        ];

    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}
?>