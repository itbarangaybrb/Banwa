<?php
require_once __DIR__ . '/../../configs/database.php';

// ==================== MARKER FUNCTIONS ====================

function getUtilitiesMarkers()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    id, first_name, middle_name, last_name, suffix, owner_contact_no,
                    owner_address, request_date, date_of_work, nature_of_work, provider,
                    address_of_utility, latitude, longitude, status, agreed, supabase_user_id
                FROM utility_applications 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getUtilitiesMarkers: " . $e->getMessage());
        return [];
    }
}

function getConstructionMarkers()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    id, first_name, middle_name, last_name, suffix, contact_no_owner,
                    construction_address, latitude, longitude, nature_of_work, type_of_work,
                    nature_of_activity, details_of_work, start_date, end_date,
                    number_of_working_days, number_of_workers, contractor_name,
                    contractor_contact_number, application_method, requirement_upload,
                    agreed, updated_at
                FROM construction_applications 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getConstructionMarkers: " . $e->getMessage());
        return [];
    }
}

function getBusinessMarkers()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    id, business_name, type_of_business, nature_of_business,
                    nature_of_business_specify, address_of_business, telephone_no_business,
                    email_address, first_name, middle_name, last_name, telephone_no_owner,
                    address_owner, type_of_structure, type_of_structure_specify,
                    no_of_employees, requirements, requirement_upload,
                    application_date, status, approval_comments, disapproval_reason,
                    latitude, longitude 
                FROM business_applications 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getBusinessMarkers: " . $e->getMessage());
        return [];
    }
}

function getHouseholdMarkers()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    marker_id, title, description, location, marker_type,
                    created_by, created_at, latitude, longitude 
                FROM marker 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getHouseholdMarkers: " . $e->getMessage());
        return [];
    }
}

function getUtilitiesById($id)
{
    global $pdo;
    try {
        $sql = "SELECT * FROM utility_applications WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getUtilitiesById: " . $e->getMessage());
        return null;
    }
}

function getConstructionById($id)
{
    global $pdo;
    try {
        $sql = "SELECT * FROM construction_applications WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getConstructionById: " . $e->getMessage());
        return null;
    }
}

function getBusinessById($id)
{
    global $pdo;
    try {
        $sql = "SELECT * FROM business_applications WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getBusinessById: " . $e->getMessage());
        return null;
    }
}

function getHouseholdById($id)
{
    global $pdo;
    try {
        $sql = "SELECT * FROM marker WHERE marker_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getHouseholdById: " . $e->getMessage());
        return null;
    }
}

// ==================== FLOOD HAZARD FUNCTIONS ====================

function getFloodHazardAreas()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hazard_id, hazard_type, hazard_name, risk_level, description,
                    ST_AsGeoJSON(geom) as geojson, properties, created_at, updated_at
                FROM barangay_hazards 
                WHERE hazard_type = 'flood' AND geom IS NOT NULL
                ORDER BY 
                    CASE risk_level
                        WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'very-low' THEN 4 ELSE 5
                    END, hazard_name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getFloodHazardAreas: " . $e->getMessage());
        return [];
    }
}

function getFloodHazardDataForSearch()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hazard_id, hazard_name, hazard_type, risk_level, description, properties,
                    ST_X(ST_Centroid(geom)) as longitude,
                    ST_Y(ST_Centroid(geom)) as latitude
                FROM barangay_hazards 
                WHERE hazard_type = 'flood' AND geom IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getFloodHazardDataForSearch: " . $e->getMessage());
        return [];
    }
}

function getFloodDetails($id)
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hazard_id, hazard_type, hazard_name, risk_level, description,
                    ST_AsGeoJSON(geom) as geojson, properties, created_at, updated_at
                FROM barangay_hazards 
                WHERE hazard_id = :id AND hazard_type = 'flood'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && !empty($result['properties'])) {
            $result['properties'] = json_decode($result['properties'], true);
        }
        
        return $result;
    } catch (PDOException $e) {
        error_log("Database error in getFloodDetails: " . $e->getMessage());
        return null;
    }
}

function getHousesInFloodAreas($riskLevel = null)
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hp.house_id, hp.address, hp.street_name, hp.house_number,
                    hp.center_lat, hp.center_lng, hp.area_sqm, hp.coordinates,
                    bh.hazard_id, bh.hazard_name, bh.risk_level,
                    bh.description as hazard_description, bh.properties,
                    'Affected' as impact_level,
                    100 as flood_coverage_percent
                FROM house_polygons hp
                INNER JOIN barangay_hazards bh 
                    ON ST_Contains(
                        bh.geom::geometry,
                        ST_SetSRID(ST_MakePoint(hp.center_lng, hp.center_lat), 4326)
                    )
                WHERE bh.hazard_type = 'flood'
                  AND hp.center_lat IS NOT NULL";
        
        if ($riskLevel !== null) {
            $sql .= " AND LOWER(bh.risk_level) = LOWER(:risk_level)";
        }
        
        $sql .= " ORDER BY 
                    CASE LOWER(bh.risk_level)
                        WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'very-low' THEN 4 ELSE 5
                    END, hp.address";
        
        $stmt = $pdo->prepare($sql);
        
        if ($riskLevel !== null) {
            $stmt->execute([':risk_level' => $riskLevel]);
        } else {
            $stmt->execute();
        }
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getHousesInFloodAreas: " . $e->getMessage());
        return [];
    }
}

function getFloodAffectedHousesSummary()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    bh.risk_level,
                    COUNT(hp.house_id) as house_count,
                    COUNT(hp.house_id) as fully_affected,
                    0 as partially_affected,
                    0 as minimally_affected,
                    json_agg(
                        json_build_object(
                            'house_id', hp.house_id,
                            'address', hp.address,
                            'center_lat', hp.center_lat,
                            'center_lng', hp.center_lng,
                            'flood_coverage', 100
                        )
                        ORDER BY hp.address
                    ) as houses
                FROM house_polygons hp
                INNER JOIN barangay_hazards bh 
                    ON ST_Contains(
                        bh.geom::geometry,
                        ST_SetSRID(ST_MakePoint(hp.center_lng, hp.center_lat), 4326)
                    )
                WHERE bh.hazard_type = 'flood' AND hp.center_lat IS NOT NULL
                GROUP BY bh.risk_level
                ORDER BY 
                    CASE LOWER(bh.risk_level)
                        WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'very-low' THEN 4 ELSE 5
                    END";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $total = 0;
        $total_fully = 0;
        foreach ($results as $row) {
            $total += $row['house_count'];
            $total_fully += $row['fully_affected'];
        }
        
        return [
            'total' => $total,
            'fully_affected' => $total_fully,
            'partially_affected' => 0,
            'minimally_affected' => 0,
            'by_risk_level' => $results
        ];
    } catch (PDOException $e) {
        error_log("Database error in getFloodAffectedHousesSummary: " . $e->getMessage());
        return [
            'total' => 0,
            'fully_affected' => 0,
            'partially_affected' => 0,
            'minimally_affected' => 0,
            'by_risk_level' => []
        ];
    }
}

function getFloodWarning($riskLevel, $impactLevel = 'Fully Affected')
{
    $riskLevel = strtolower($riskLevel);
    
    $warnings = [
        'high' => [
            'title' => '🚨 High Flood Risk Area',
            'severity' => 'danger',
            'message' => 'This area is at HIGH RISK of flooding. Immediate evacuation may be required during heavy rainfall.',
            'recommendations' => [
                'Prepare emergency evacuation plans immediately',
                'Keep emergency supplies ready (food, water, medicine)',
                'Monitor weather updates and barangay advisories',
                'Identify nearest evacuation centers',
                'Secure important documents in waterproof containers'
            ]
        ],
        'medium' => [
            'title' => '⚠️ Medium Flood Risk Area',
            'severity' => 'warning',
            'message' => 'This area has MODERATE RISK of flooding. Flooding may occur during prolonged heavy rainfall.',
            'recommendations' => [
                'Prepare emergency supplies and evacuation plan',
                'Monitor weather forecasts regularly',
                'Clear drainage systems around your property',
                'Elevate valuable items and electrical appliances',
                'Know the location of nearest evacuation centers'
            ]
        ],
        'low' => [
            'title' => 'ℹ️ Low Flood Risk Area',
            'severity' => 'info',
            'message' => 'This area has LOW RISK of flooding. Minor flooding may occur during extreme weather conditions.',
            'recommendations' => [
                'Stay informed about weather conditions',
                'Maintain clear drainage systems',
                'Have basic emergency supplies ready',
                'Be aware of evacuation routes',
                'Report any drainage problems to barangay officials'
            ]
        ],
        'very-low' => [
            'title' => '✓ Very Low Flood Risk Area',
            'severity' => 'success',
            'message' => 'This area has VERY LOW RISK of flooding. However, remain vigilant during extreme weather.',
            'recommendations' => [
                'Maintain awareness of weather conditions',
                'Keep emergency contact numbers available',
                'Support community flood preparedness programs'
            ]
        ]
    ];
    
    return $warnings[$riskLevel] ?? $warnings['low'];
}

function checkHouseCenterInFlood($lat, $lng)
{
    global $pdo;
    try {
        $sql = "SELECT hazard_id, hazard_name, risk_level, description
                FROM barangay_hazards
                WHERE hazard_type = 'flood'
                  AND ST_Contains(geom::geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                LIMIT 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':lat' => $lat, ':lng' => $lng]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in checkHouseCenterInFlood: " . $e->getMessage());
        return null;
    }
}

function getAllHousesWithFloodStatus()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hp.house_id, hp.address, hp.street_name, hp.house_number,
                    hp.center_lat, hp.center_lng,
                    bh.hazard_id, bh.hazard_name, bh.risk_level,
                    CASE 
                        WHEN bh.hazard_id IS NOT NULL THEN 'In Flood Area'
                        ELSE 'Safe'
                    END as flood_status
                FROM house_polygons hp
                LEFT JOIN barangay_hazards bh 
                    ON bh.hazard_type = 'flood'
                    AND hp.center_lat IS NOT NULL
                    AND ST_Contains(
                        bh.geom::geometry,
                        ST_SetSRID(ST_MakePoint(hp.center_lng, hp.center_lat), 4326)
                    )
                ORDER BY 
                    CASE WHEN bh.hazard_id IS NOT NULL THEN 1 ELSE 2 END,
                    CASE LOWER(bh.risk_level)
                        WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'very-low' THEN 4 ELSE 5
                    END, hp.address";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getAllHousesWithFloodStatus: " . $e->getMessage());
        return [];
    }
}

// ==================== HOUSE POLYGON FUNCTIONS ====================

function getHousePolygons()
{
    global $pdo;
    try {
        $sql = "SELECT house_id, address, house_number, street_name, coordinates,
                       center_lat, center_lng, area_sqm, created_at, updated_at
                FROM house_polygons 
                ORDER BY address, house_number";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getHousePolygons: " . $e->getMessage());
        return [];
    }
}

function getHouseById($houseId)
{
    global $pdo;
    try {
        $sql = "SELECT * FROM house_polygons WHERE house_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $houseId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getHouseById: " . $e->getMessage());
        return null;
    }
}

function isPointInPolygon($point, $polygon)
{
    $x = $point['lng'];
    $y = $point['lat'];
    $inside = false;
    $n = count($polygon);

    for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
        $xi = $polygon[$i][0];
        $yi = $polygon[$i][1];
        $xj = $polygon[$j][0];
        $yj = $polygon[$j][1];

        $intersect = (($yi > $y) != ($yj > $y))
            && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);

        if ($intersect) $inside = !$inside;
    }

    return $inside;
}

function checkPointInHouse($lat, $lng)
{
    global $pdo;

    try {
        $sql = "SELECT house_id, address, street_name, coordinates 
                FROM house_polygons";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($houses as $house) {
            if (!empty($house['coordinates'])) {
                $polygon = json_decode($house['coordinates'], true);
                if ($polygon && isPointInPolygon(['lat' => $lat, 'lng' => $lng], $polygon)) {
                    return $house;
                }
            }
        }

        return null;
    } catch (Exception $e) {
        error_log("Error in checkPointInHouse: " . $e->getMessage());
        return null;
    }
}

function saveHousePolygon($data)
{
    global $pdo;

    try {
        if (empty($data['address'])) {
            return ['success' => false, 'message' => 'Address is required'];
        }

        if (empty($data['coordinates']) || !is_array($data['coordinates']) || count($data['coordinates']) < 3) {
            return ['success' => false, 'message' => 'At least 3 coordinate points are required'];
        }

        $address = trim($data['address']);
        $houseNumber = isset($data['house_number']) ? trim($data['house_number']) : '';
        $streetName = isset($data['street_name']) ? trim($data['street_name']) : '';
        $coordinates = json_encode($data['coordinates']);
        $centerLat = isset($data['center_lat']) ? floatval($data['center_lat']) : 0;
        $centerLng = isset($data['center_lng']) ? floatval($data['center_lng']) : 0;

        $area = 0;
        $coords = $data['coordinates'];
        $n = count($coords);
        if ($n >= 3) {
            for ($i = 0; $i < $n; $i++) {
                $j = ($i + 1) % $n;
                $area += $coords[$i][0] * $coords[$j][1];
                $area -= $coords[$j][0] * $coords[$i][1];
            }
            $area = abs($area) / 2;
            $area = round($area * 1000000, 2);
        }

        $houseId = isset($data['house_id']) ? intval($data['house_id']) : null;

        if ($houseId) {
            $sql = "UPDATE house_polygons SET 
                    address = :address, house_number = :house_number,
                    street_name = :street_name, coordinates = :coordinates,
                    center_lat = :center_lat, center_lng = :center_lng,
                    area_sqm = :area, updated_at = CURRENT_TIMESTAMP
                    WHERE house_id = :house_id RETURNING house_id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':house_id' => $houseId, ':address' => $address,
                ':house_number' => $houseNumber, ':street_name' => $streetName,
                ':coordinates' => $coordinates, ':center_lat' => $centerLat,
                ':center_lng' => $centerLng, ':area' => $area
            ]);
        } else {
            $sql = "INSERT INTO house_polygons 
                    (address, house_number, street_name, coordinates, center_lat, center_lng, area_sqm) 
                    VALUES (:address, :house_number, :street_name, :coordinates, :center_lat, :center_lng, :area) 
                    RETURNING house_id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':address' => $address, ':house_number' => $houseNumber,
                ':street_name' => $streetName, ':coordinates' => $coordinates,
                ':center_lat' => $centerLat, ':center_lng' => $centerLng, ':area' => $area
            ]);
        }

        $newHouseId = $stmt->fetchColumn();

        return [
            'success' => true,
            'message' => $houseId ? 'House updated successfully' : 'House saved successfully',
            'house_id' => $newHouseId
        ];
    } catch (Exception $e) {
        error_log("Error in saveHousePolygon: " . $e->getMessage());
        return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
    }
}

function deleteHousePolygon($houseId)
{
    global $pdo;

    try {
        if (tableHasColumn('marker', 'house_id')) {
            $sql = "UPDATE marker SET house_id = NULL WHERE house_id = :house_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':house_id' => $houseId]);
        }

        $sql = "DELETE FROM house_polygons WHERE house_id = :house_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':house_id' => $houseId]);

        return ['success' => true, 'message' => 'House deleted successfully'];
    } catch (Exception $e) {
        error_log("Error in deleteHousePolygon: " . $e->getMessage());
        return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
    }
}

function updateHouseDetails($data)
{
    global $pdo;

    try {
        if (empty($data['house_id'])) {
            return ['success' => false, 'message' => 'House ID is required'];
        }

        $houseId = intval($data['house_id']);
        $updates = [];
        $params = [':house_id' => $houseId];

        if (isset($data['address'])) {
            $updates[] = "address = :address";
            $params[':address'] = trim($data['address']);
        }

        if (isset($data['house_number'])) {
            $updates[] = "house_number = :house_number";
            $params[':house_number'] = trim($data['house_number']);
        }

        if (isset($data['street_name'])) {
            $updates[] = "street_name = :street_name";
            $params[':street_name'] = trim($data['street_name']);
        }

        if (empty($updates)) {
            return ['success' => false, 'message' => 'No fields to update'];
        }

        $updates[] = "updated_at = CURRENT_TIMESTAMP";

        $sql = "UPDATE house_polygons SET " . implode(', ', $updates) . " WHERE house_id = :house_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return ['success' => true, 'message' => 'House updated successfully'];
    } catch (Exception $e) {
        error_log("Error in updateHouseDetails: " . $e->getMessage());
        return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
    }
}

function tableHasColumn($tableName, $columnName)
{
    global $pdo;
    try {
        $sql = "SELECT column_name FROM information_schema.columns 
                WHERE table_name = :table_name AND column_name = :column_name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':table_name' => $tableName, ':column_name' => $columnName]);
        return $stmt->fetch() !== false;
    } catch (Exception $e) {
        return false;
    }
}

// ==================== SDSS FUNCTIONS (NEW) ====================

function sdss_checkSchoolProximity($lat, $lng, $businessType, $bufferMeters = 500)
{
    global $pdo;
    
    $restricted = ['liquor', 'bar', 'club', 'gambling', 'casino', 'videoke', 'ktv'];
    $isRestricted = false;
    foreach ($restricted as $type) {
        if (stripos($businessType, $type) !== false) {
            $isRestricted = true;
            break;
        }
    }
    
    if (!$isRestricted) {
        return ['compliant' => true];
    }
    
    try {
        $sql = "SELECT 
                    COUNT(*) as nearby_schools,
                    json_agg(
                        json_build_object(
                            'name', title,
                            'distance', ROUND(
                                ST_Distance(
                                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                                    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                                )::numeric, 2
                            )
                        )
                    ) as schools
                FROM marker
                WHERE LOWER(marker_type) = 'school'
                  AND ST_DWithin(
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                      :buffer
                  )";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':lat' => $lat, ':lng' => $lng, ':buffer' => $bufferMeters]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['nearby_schools'] > 0) {
            return [
                'compliant' => false,
                'rule' => 'School Buffer Zone',
                'severity' => 'CRITICAL',
                'message' => "⚠️ {$businessType} business within {$bufferMeters}m of {$result['nearby_schools']} school(s)",
                'recommendation' => 'This business type is prohibited near schools. Application should be DENIED or require relocation.',
                'action' => 'FLAG_FOR_DENIAL',
                'details' => json_decode($result['schools'], true)
            ];
        }
        
        return ['compliant' => true];
    } catch (PDOException $e) {
        error_log("SDSS School Check Error: " . $e->getMessage());
        return ['compliant' => null, 'error' => $e->getMessage()];
    }
}

function sdss_checkFloodRisk($lat, $lng)
{
    global $pdo;
    
    try {
        $sql = "SELECT hazard_name, risk_level, description
                FROM barangay_hazards
                WHERE hazard_type = 'flood'
                  AND ST_Contains(geom::geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                ORDER BY CASE LOWER(risk_level)
                    WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4
                END LIMIT 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':lat' => $lat, ':lng' => $lng]);
        $flood = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($flood) {
            $severity = strtolower($flood['risk_level']) === 'high' ? 'CRITICAL' : 
                       (strtolower($flood['risk_level']) === 'medium' ? 'WARNING' : 'INFO');
            
            return [
                'compliant' => strtolower($flood['risk_level']) !== 'high',
                'rule' => 'Flood Zone Assessment',
                'severity' => $severity,
                'message' => "🌊 Location is in {$flood['risk_level']} flood risk area",
                'recommendation' => strtolower($flood['risk_level']) === 'high' ? 
                    'REQUIRE: Flood mitigation plan, elevated foundation, engineering certification' :
                    'RECOMMEND: Elevation requirements, drainage system, flood insurance',
                'action' => strtolower($flood['risk_level']) === 'high' ? 'REQUIRE_MITIGATION' : 'ADD_CONDITIONS',
                'flood_info' => $flood
            ];
        }
        
        return ['compliant' => true];
    } catch (PDOException $e) {
        error_log("SDSS Flood Check Error: " . $e->getMessage());
        return ['compliant' => null, 'error' => $e->getMessage()];
    }
}

function sdss_checkBusinessDensity($lat, $lng, $businessType, $radiusMeters = 200, $maxAllowed = 3)
{
    global $pdo;
    
    try {
        $sql = "SELECT 
                    COUNT(*) as nearby_count,
                    json_agg(
                        json_build_object(
                            'name', business_name,
                            'address', address_of_business,
                            'distance', ROUND(
                                ST_Distance(
                                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                                    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                                )::numeric, 2
                            )
                        )
                    ) as businesses
                FROM business_applications
                WHERE status = 'Approved'
                  AND LOWER(nature_of_business) = LOWER(:business_type)
                  AND latitude IS NOT NULL
                  AND ST_DWithin(
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                      :radius
                  )";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':lat' => $lat,
            ':lng' => $lng,
            ':business_type' => $businessType,
            ':radius' => $radiusMeters
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['nearby_count'] >= $maxAllowed) {
            return [
                'compliant' => false,
                'rule' => 'Business Density Control',
                'severity' => 'WARNING',
                'message' => "⚠️ Found {$result['nearby_count']} similar businesses within {$radiusMeters}m",
                'recommendation' => 'Area may be over-saturated. Inform applicant about high competition risk.',
                'action' => 'WARN_APPLICANT',
                'details' => json_decode($result['businesses'], true)
            ];
        }
        
        return ['compliant' => true];
    } catch (PDOException $e) {
        error_log("SDSS Density Check Error: " . $e->getMessage());
        return ['compliant' => null, 'error' => $e->getMessage()];
    }
}

function sdss_checkResidentialProximity($lat, $lng, $businessNature, $bufferMeters = 100)
{
    global $pdo;
    
    $noisyTypes = ['factory', 'manufacturing', 'industrial', 'videoke', 'ktv', 'bar', 'club', 'disco'];
    $isNoisy = false;
    foreach ($noisyTypes as $type) {
        if (stripos($businessNature, $type) !== false) {
            $isNoisy = true;
            break;
        }
    }
    
    if (!$isNoisy) {
        return ['compliant' => true];
    }
    
    try {
        $sql = "SELECT COUNT(*) as nearby_houses
                FROM house_polygons
                WHERE center_lat IS NOT NULL
                  AND ST_DWithin(
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
                      :buffer
                  )";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':lat' => $lat, ':lng' => $lng, ':buffer' => $bufferMeters]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['nearby_houses'] > 0) {
            return [
                'compliant' => false,
                'rule' => 'Residential Protection',
                'severity' => 'WARNING',
                'message' => "⚠️ Noisy business within {$bufferMeters}m of {$result['nearby_houses']} residence(s)",
                'recommendation' => 'REQUIRE: Soundproofing, operating hours restriction (no loud music after 10 PM), noise control measures',
                'action' => 'ADD_CONDITIONS',
                'nearby_houses' => $result['nearby_houses']
            ];
        }
        
        return ['compliant' => true];
    } catch (PDOException $e) {
        error_log("SDSS Residential Check Error: " . $e->getMessage());
        return ['compliant' => null, 'error' => $e->getMessage()];
    }
}

function sdss_evaluateBusiness($businessId)
{
    global $pdo;
    
    try {
        $sql = "SELECT * FROM business_applications WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $businessId]);
        $business = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$business || !$business['latitude'] || !$business['longitude']) {
            return ['error' => 'Business not found or location not set'];
        }
        
        $evaluation = [
            'business_id' => $businessId,
            'business_name' => $business['business_name'],
            'business_type' => $business['nature_of_business'],
            'evaluated_at' => date('Y-m-d H:i:s'),
            'rules' => []
        ];
        
        $checks = [
            sdss_checkSchoolProximity($business['latitude'], $business['longitude'], 
                $business['nature_of_business'] . ' ' . ($business['nature_of_business_specify'] ?? '')),
            sdss_checkBusinessDensity($business['latitude'], $business['longitude'], $business['nature_of_business']),
            sdss_checkResidentialProximity($business['latitude'], $business['longitude'], $business['nature_of_business'])
        ];
        
        foreach ($checks as $check) {
            if ($check['compliant'] === false) {
                $evaluation['rules'][] = $check;
            }
        }
        
        $critical = count(array_filter($evaluation['rules'], fn($r) => $r['severity'] === 'CRITICAL'));
        $warnings = count(array_filter($evaluation['rules'], fn($r) => $r['severity'] === 'WARNING'));
        
        $evaluation['summary'] = [
            'total_rules_checked' => 3,
            'rules_triggered' => count($evaluation['rules']),
            'critical_issues' => $critical,
            'warnings' => $warnings,
            'overall_status' => $critical > 0 ? 'DENY_OR_RELOCATE' : 
                               ($warnings > 0 ? 'APPROVE_WITH_CONDITIONS' : 'APPROVE')
        ];
        
        return $evaluation;
    } catch (PDOException $e) {
        error_log("SDSS Evaluation Error: " . $e->getMessage());
        return ['error' => $e->getMessage()];
    }
}

function sdss_evaluateConstruction($constructionId)
{
    global $pdo;
    
    try {
        $sql = "SELECT * FROM construction_applications WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $constructionId]);
        $construction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$construction || !$construction['latitude'] || !$construction['longitude']) {
            return ['error' => 'Construction not found or location not set'];
        }
        
        $evaluation = [
            'construction_id' => $constructionId,
            'address' => $construction['construction_address'],
            'evaluated_at' => date('Y-m-d H:i:s'),
            'rules' => []
        ];
        
        $floodCheck = sdss_checkFloodRisk($construction['latitude'], $construction['longitude']);
        if ($floodCheck['compliant'] === false || isset($floodCheck['flood_info'])) {
            $evaluation['rules'][] = $floodCheck;
        }
        
        $critical = count(array_filter($evaluation['rules'], fn($r) => $r['severity'] === 'CRITICAL'));
        
        $evaluation['summary'] = [
            'total_rules_checked' => 1,
            'rules_triggered' => count($evaluation['rules']),
            'critical_issues' => $critical,
            'overall_status' => $critical > 0 ? 'REQUIRE_MITIGATION' : 'APPROVE'
        ];
        
        return $evaluation;
    } catch (PDOException $e) {
        error_log("SDSS Construction Evaluation Error: " . $e->getMessage());
        return ['error' => $e->getMessage()];
    }
}

// ==================== AJAX HANDLERS ====================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');

    // Combined markers endpoint
    if ($_POST['action'] === 'get_markers') {
        echo json_encode([
            'success' => true,
            'constructions' => getConstructionMarkers(),
            'utilities' => getUtilitiesMarkers(),
            'businesses' => getBusinessMarkers(),
            'households' => getHouseholdMarkers()
        ]);
        exit;
    }

    // Individual detail endpoints
    if ($_POST['action'] === 'get_utilities_details') {
        $data = getUtilitiesById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data, 'type' => 'utilities'] : ['success' => false, 'message' => 'Not found']);
        exit;
    }

    if ($_POST['action'] === 'get_construction_details') {
        $data = getConstructionById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data, 'type' => 'construction'] : ['success' => false, 'message' => 'Not found']);
        exit;
    }

    if ($_POST['action'] === 'get_business_details') {
        $data = getBusinessById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data, 'type' => 'business'] : ['success' => false, 'message' => 'Not found']);
        exit;
    }

    if ($_POST['action'] === 'get_household_details') {
        $data = getHouseholdById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data, 'type' => 'household'] : ['success' => false, 'message' => 'Not found']);
        exit;
    }

    // Flood hazard endpoints
    if ($_POST['action'] === 'get_flood_hazards') {
        echo json_encode(['success' => true, 'hazards' => getFloodHazardAreas()]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_data_for_search') {
        echo json_encode(['success' => true, 'hazards' => getFloodHazardDataForSearch()]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_details') {
        $data = getFloodDetails($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false, 'message' => 'Not found']);
        exit;
    }

    // House polygon endpoints
    if ($_POST['action'] === 'get_houses') {
        $houses = getHousePolygons();
        echo json_encode(['success' => true, 'count' => count($houses), 'houses' => $houses]);
        exit;
    }

    if ($_POST['action'] === 'get_house_details') {
        $data = getHouseById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false, 'message' => 'Not found']);
        exit;
    }

    if ($_POST['action'] === 'save_house') {
        $input = $_POST;
        if (isset($input['coordinates']) && is_string($input['coordinates'])) {
            $input['coordinates'] = json_decode($input['coordinates'], true);
        }
        echo json_encode(saveHousePolygon($input));
        exit;
    }

    if ($_POST['action'] === 'delete_house') {
        echo json_encode(deleteHousePolygon($_POST['house_id'] ?? 0));
        exit;
    }

    if ($_POST['action'] === 'update_house') {
        echo json_encode(updateHouseDetails($_POST));
        exit;
    }

    if ($_POST['action'] === 'check_location') {
        $house = checkPointInHouse($_POST['lat'] ?? 0, $_POST['lng'] ?? 0);
        echo json_encode(['success' => true, 'is_inside' => $house !== null, 'house' => $house]);
        exit;
    }

    // Flood analysis endpoints
    if ($_POST['action'] === 'get_houses_in_flood') {
        $houses = getHousesInFloodAreas($_POST['risk_level'] ?? null);
        echo json_encode(['success' => true, 'count' => count($houses), 'houses' => $houses]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_houses_summary') {
        echo json_encode(['success' => true, 'summary' => getFloodAffectedHousesSummary()]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_warning') {
        echo json_encode(['success' => true, 'warning' => getFloodWarning($_POST['risk_level'] ?? 'low', $_POST['impact_level'] ?? 'Fully Affected')]);
        exit;
    }

    if ($_POST['action'] === 'check_house_in_flood') {
        $floodInfo = checkHouseCenterInFlood($_POST['lat'] ?? 0, $_POST['lng'] ?? 0);
        echo json_encode(['success' => true, 'in_flood' => $floodInfo !== null, 'flood_info' => $floodInfo]);
        exit;
    }

    if ($_POST['action'] === 'get_all_houses_flood_status') {
        $houses = getAllHousesWithFloodStatus();
        echo json_encode(['success' => true, 'count' => count($houses), 'houses' => $houses]);
        exit;
    }

    // SDSS endpoints (NEW)
    if ($_POST['action'] === 'sdss_evaluate_business') {
        $evaluation = sdss_evaluateBusiness($_POST['business_id'] ?? 0);
        echo json_encode(['success' => !isset($evaluation['error']), 'evaluation' => $evaluation]);
        exit;
    }

    if ($_POST['action'] === 'sdss_evaluate_construction') {
        $evaluation = sdss_evaluateConstruction($_POST['construction_id'] ?? 0);
        echo json_encode(['success' => !isset($evaluation['error']), 'evaluation' => $evaluation]);
        exit;
    }

    if ($_POST['action'] === 'sdss_check_location') {
        $lat = $_POST['lat'] ?? 0;
        $lng = $_POST['lng'] ?? 0;
        $type = $_POST['type'] ?? 'business';
        $businessNature = $_POST['business_nature'] ?? '';
        
        $checks = [];
        if ($type === 'business') {
            $checks['school_proximity'] = sdss_checkSchoolProximity($lat, $lng, $businessNature);
            $checks['residential_proximity'] = sdss_checkResidentialProximity($lat, $lng, $businessNature);
            $checks['density'] = sdss_checkBusinessDensity($lat, $lng, $businessNature);
        } else if ($type === 'construction') {
            $checks['flood_risk'] = sdss_checkFloodRisk($lat, $lng);
        }
        
        echo json_encode(['success' => true, 'checks' => $checks]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>