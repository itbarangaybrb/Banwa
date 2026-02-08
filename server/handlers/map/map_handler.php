<?php
require_once __DIR__ . '/../../configs/database.php';

// ==================== MARKER FUNCTIONS ====================

function getUtilitiesMarkers()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    id,
                    first_name,
                    middle_name,
                    last_name,
                    suffix,
                    owner_contact_no,
                    owner_address,
                    request_date,
                    date_of_work,
                    nature_of_work,
                    provider,
                    address_of_utility,
                    latitude,
                    longitude,
                    status,
                    agreed,
                    supabase_user_id
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
                    id,
                    first_name,
                    middle_name,
                    last_name,
                    suffix,
                    contact_no_owner,
                    construction_address,
                    latitude,
                    longitude,
                    nature_of_work,
                    type_of_work,
                    nature_of_activity,
                    details_of_work,
                    start_date,
                    end_date,
                    number_of_working_days,
                    number_of_workers,
                    contractor_name,
                    contractor_contact_number,
                    application_method,
                    requirement_upload,
                    agreed,
                    updated_at
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
                    id,
                    business_name,
                    type_of_business,
                    nature_of_business,
                    nature_of_business_specify,
                    address_of_business,
                    telephone_no_business,
                    email_address,
                    first_name,
                    middle_name,
                    last_name,
                    telephone_no_owner,
                    address_owner,
                    type_of_structure,
                    type_of_structure_specify,
                    no_of_employees,
                    requirements,
                    requirement_upload,
                    application_date,
                    status,
                    approval_comments,
                    disapproval_reason,
                    latitude, 
                    longitude 
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
                    marker_id,
                    title,
                    description,
                    location,
                    marker_type,
                    created_by,
                    created_at,
                    latitude, 
                    longitude 
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

// ==================== FLOOD HAZARD AREA FUNCTIONS ====================

// Get all flood hazard areas with geometry
function getFloodHazardAreas()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hazard_id,
                    hazard_type,
                    hazard_name,
                    risk_level,
                    description,
                    ST_AsGeoJSON(geom) as geojson,
                    properties,
                    created_at,
                    updated_at
                FROM barangay_hazards 
                WHERE hazard_type = 'flood'
                AND geom IS NOT NULL
                ORDER BY 
                    CASE risk_level
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 3
                        WHEN 'very-low' THEN 4
                        ELSE 5
                    END,
                    hazard_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getFloodHazardAreas: " . $e->getMessage());
        return [];
    }
}

// Get flood hazard data for search (with centroid coordinates)
function getFloodHazardDataForSearch()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hazard_id,
                    hazard_name,
                    hazard_type,
                    risk_level,
                    description,
                    properties,
                    ST_X(ST_Centroid(geom)) as longitude,
                    ST_Y(ST_Centroid(geom)) as latitude
                FROM barangay_hazards 
                WHERE hazard_type = 'flood'
                AND geom IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getFloodHazardDataForSearch: " . $e->getMessage());
        return [];
    }
}

// Get single flood hazard by ID
function getFloodDetails($id)
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hazard_id,
                    hazard_type,
                    hazard_name,
                    risk_level,
                    description,
                    ST_AsGeoJSON(geom) as geojson,
                    properties,
                    created_at,
                    updated_at
                FROM barangay_hazards 
                WHERE hazard_id = :id 
                AND hazard_type = 'flood'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Parse properties JSON if it exists
        if ($result && !empty($result['properties'])) {
            $result['properties'] = json_decode($result['properties'], true);
        }
        
        return $result;
    } catch (PDOException $e) {
        error_log("Database error in getFloodDetails: " . $e->getMessage());
        return null;
    }
}

/**
 * Get houses that intersect (touch or overlap) flood hazard areas
 * SIMPLIFIED VERSION - Works with your data
 * 
 * @param string $riskLevel Filter by specific risk level (optional)
 * @return array Array of houses with their flood risk information
 */
function getHousesInFloodAreas($riskLevel = null)
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hp.house_id,
                    hp.address,
                    hp.street_name,
                    hp.house_number,
                    hp.center_lat,
                    hp.center_lng,
                    hp.area_sqm,
                    hp.coordinates,
                    bh.hazard_id,
                    bh.hazard_name,
                    bh.risk_level,
                    bh.description as hazard_description,
                    bh.properties,
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
        
        // Add risk level filter if provided
        if ($riskLevel !== null) {
            $sql .= " AND LOWER(bh.risk_level) = LOWER(:risk_level)";
        }
        
        $sql .= " ORDER BY 
                    CASE LOWER(bh.risk_level)
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 3
                        WHEN 'very-low' THEN 4
                        ELSE 5
                    END,
                    hp.address";
        
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

/**
 * Get summary of houses in flood areas grouped by risk level
 * SIMPLIFIED VERSION
 * 
 * @return array Summary with counts and details by risk level
 */
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
                WHERE bh.hazard_type = 'flood'
                  AND hp.center_lat IS NOT NULL
                GROUP BY bh.risk_level
                ORDER BY 
                    CASE LOWER(bh.risk_level)
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 3
                        WHEN 'very-low' THEN 4
                        ELSE 5
                    END";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate totals
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

/**
 * Get warning message based on flood risk level AND impact level
 * 
 * @param string $riskLevel The flood risk level
 * @param string $impactLevel The impact level (Fully, Partially, Minimally)
 * @return array Warning information with title, message, and recommendations
 */
function getFloodWarning($riskLevel, $impactLevel = 'Fully Affected')
{
    $riskLevel = strtolower($riskLevel);
    $impactLevel = strtolower($impactLevel);
    
    $baseWarnings = [
        'high' => [
            'title' => '🚨 High Flood Risk Area',
            'severity' => 'danger',
            'base_message' => 'This area is at HIGH RISK of flooding.',
        ],
        'medium' => [
            'title' => '⚠️ Medium Flood Risk Area',
            'severity' => 'warning',
            'base_message' => 'This area has MODERATE RISK of flooding.',
        ],
        'low' => [
            'title' => 'ℹ️ Low Flood Risk Area',
            'severity' => 'info',
            'base_message' => 'This area has LOW RISK of flooding.',
        ],
        'very-low' => [
            'title' => '✓ Very Low Flood Risk Area',
            'severity' => 'success',
            'base_message' => 'This area has VERY LOW RISK of flooding.',
        ]
    ];
    
    $impactMessages = [
        'fully affected' => 'The entire house is within the flood zone.',
        'partially affected' => 'Part of the house is within the flood zone.',
        'minimally affected' => 'A small portion of the house touches the flood zone.'
    ];
    
    $impactRecommendations = [
        'fully affected' => [
            'Immediate evacuation may be required during heavy rainfall',
            'Prepare emergency evacuation plans immediately',
            'Keep emergency supplies ready (food, water, medicine)',
            'Identify nearest evacuation centers'
        ],
        'partially affected' => [
            'Monitor weather updates closely',
            'Prepare evacuation plan for affected areas of the house',
            'Move valuable items away from flood-prone sections',
            'Consider flood barriers or sandbags'
        ],
        'minimally affected' => [
            'Stay alert during heavy rainfall',
            'Monitor the affected area of your property',
            'Ensure good drainage around affected sections',
            'Keep emergency contacts handy'
        ]
    ];
    
    $warning = $baseWarnings[$riskLevel] ?? $baseWarnings['low'];
    
    $warning['message'] = $warning['base_message'] . ' ' . ($impactMessages[$impactLevel] ?? '');
    $warning['recommendations'] = array_merge(
        $impactRecommendations[$impactLevel] ?? $impactRecommendations['fully affected'],
        [
            'Monitor weather updates and barangay advisories',
            'Secure important documents in waterproof containers',
            'Report any drainage problems to barangay officials'
        ]
    );
    
    unset($warning['base_message']);
    
    return $warning;
}

/**
 * Alternative method: Check if a point (house center) is in flood area
 * Faster than polygon intersection, good for quick checks
 * 
 * @param float $lat Latitude of house center
 * @param float $lng Longitude of house center
 * @return array|null Flood hazard info if in flood area, null otherwise
 */
function checkHouseCenterInFlood($lat, $lng)
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hazard_id,
                    hazard_name,
                    risk_level,
                    description
                FROM barangay_hazards
                WHERE hazard_type = 'flood'
                  AND ST_Contains(
                      geom::geometry,
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                  )
                LIMIT 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':lat' => $lat,
            ':lng' => $lng
        ]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in checkHouseCenterInFlood: " . $e->getMessage());
        return null;
    }
}

/**
 * Get all houses with their flood status (in or out of flood areas)
 * Useful for reports and statistics
 * 
 * @return array All houses with flood status
 */
function getAllHousesWithFloodStatus()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    hp.house_id,
                    hp.address,
                    hp.street_name,
                    hp.house_number,
                    hp.center_lat,
                    hp.center_lng,
                    bh.hazard_id,
                    bh.hazard_name,
                    bh.risk_level,
                    CASE 
                        WHEN bh.hazard_id IS NOT NULL THEN 'In Flood Area'
                        ELSE 'Safe'
                    END as flood_status
                FROM house_polygons hp
                LEFT JOIN barangay_hazards bh 
                    ON bh.hazard_type = 'flood'
                    AND hp.coordinates IS NOT NULL
                    AND ST_Within(
                        ST_SetSRID(
                            ST_GeomFromGeoJSON(
                                json_build_object(
                                    'type', 'Polygon',
                                    'coordinates', json_build_array(hp.coordinates)  -- FIXED: Added json_build_array()
                                )::text
                            ), 
                            4326
                        ),
                        bh.geom::geometry
                    )
                ORDER BY 
                    CASE 
                        WHEN bh.hazard_id IS NOT NULL THEN 1 
                        ELSE 2 
                    END,
                    CASE LOWER(bh.risk_level)
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 3
                        WHEN 'very-low' THEN 4
                        ELSE 5
                    END,
                    hp.address";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getAllHousesWithFloodStatus: " . $e->getMessage());
        return [];
    }
}

// ==================== HOUSE POLYGON FUNCTIONS ====================

// Get all house polygons
function getHousePolygons()
{
    global $pdo;
    try {
        $sql = "SELECT 
                    house_id,
                    address,
                    house_number,
                    street_name,
                    coordinates,
                    center_lat,
                    center_lng,
                    area_sqm,
                    created_at,
                    updated_at
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

// Get single house by ID
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

// Check if point is inside polygon
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

// Check which house contains a point
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

// Save house polygon (simplified for testing)
function saveHousePolygon($data)
{
    global $pdo;

    try {
        // Validate required fields
        if (empty($data['address'])) {
            return ['success' => false, 'message' => 'Address is required'];
        }

        if (empty($data['coordinates']) || !is_array($data['coordinates']) || count($data['coordinates']) < 3) {
            return ['success' => false, 'message' => 'At least 3 coordinate points are required'];
        }

        // Prepare data
        $address = trim($data['address']);
        $houseNumber = isset($data['house_number']) ? trim($data['house_number']) : '';
        $streetName = isset($data['street_name']) ? trim($data['street_name']) : '';
        $coordinates = json_encode($data['coordinates']);
        $centerLat = isset($data['center_lat']) ? floatval($data['center_lat']) : 0;
        $centerLng = isset($data['center_lng']) ? floatval($data['center_lng']) : 0;

        // For area calculation - simplified
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
            $area = round($area * 1000000, 2); // Simple conversion
        }

        // Check if updating or inserting
        $houseId = isset($data['house_id']) ? intval($data['house_id']) : null;

        if ($houseId) {
            // Update existing
            $sql = "UPDATE house_polygons SET 
                    address = :address,
                    house_number = :house_number,
                    street_name = :street_name,
                    coordinates = :coordinates,
                    center_lat = :center_lat,
                    center_lng = :center_lng,
                    area_sqm = :area,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE house_id = :house_id
                    RETURNING house_id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':house_id' => $houseId,
                ':address' => $address,
                ':house_number' => $houseNumber,
                ':street_name' => $streetName,
                ':coordinates' => $coordinates,
                ':center_lat' => $centerLat,
                ':center_lng' => $centerLng,
                ':area' => $area
            ]);
        } else {
            // Insert new
            $sql = "INSERT INTO house_polygons 
                    (address, house_number, street_name, coordinates, center_lat, center_lng, area_sqm) 
                    VALUES (:address, :house_number, :street_name, :coordinates, :center_lat, :center_lng, :area) 
                    RETURNING house_id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':address' => $address,
                ':house_number' => $houseNumber,
                ':street_name' => $streetName,
                ':coordinates' => $coordinates,
                ':center_lat' => $centerLat,
                ':center_lng' => $centerLng,
                ':area' => $area
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

// Delete house polygon
function deleteHousePolygon($houseId)
{
    global $pdo;

    try {
        // Remove house_id from markers first (if your marker table has house_id)
        if (tableHasColumn('marker', 'house_id')) {
            $sql = "UPDATE marker SET house_id = NULL WHERE house_id = :house_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':house_id' => $houseId]);
        }

        // Then delete the house
        $sql = "DELETE FROM house_polygons WHERE house_id = :house_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':house_id' => $houseId]);

        return ['success' => true, 'message' => 'House deleted successfully'];
    } catch (Exception $e) {
        error_log("Error in deleteHousePolygon: " . $e->getMessage());
        return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
    }
}

// Update house details
function updateHouseDetails($data)
{
    global $pdo;

    try {
        if (empty($data['house_id'])) {
            return ['success' => false, 'message' => 'House ID is required'];
        }

        $houseId = intval($data['house_id']);

        // Build dynamic update query
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

// Helper function to check if table has column
function tableHasColumn($tableName, $columnName)
{
    global $pdo;
    try {
        $sql = "SELECT column_name FROM information_schema.columns 
                WHERE table_name = :table_name AND column_name = :column_name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':table_name' => $tableName,
            ':column_name' => $columnName
        ]);
        return $stmt->fetch() !== false;
    } catch (Exception $e) {
        return false;
    }
}

// ==================== AJAX REQUEST HANDLER ====================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');

    // Existing marker actions
    if ($_POST['action'] === 'get_markers') {
        $constructions = getConstructionMarkers();
        $utilities = getUtilitiesMarkers();
        $businesses = getBusinessMarkers();
        $households = getHouseholdMarkers();

        echo json_encode([
            'success' => true,
            'constructions' => $constructions,
            'utilities' => $utilities,
            'businesses' => $businesses,
            'households' => $households
        ]);
        exit;
    }

    if ($_POST['action'] === 'get_utilities_details') {
        $id = $_POST['id'] ?? 0;
        $data = getUtilitiesById($id);

        if ($data) {
            echo json_encode([
                'success' => true,
                'data' => $data,
                'type' => 'utilities'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Utilities record not found'
            ]);
        }
        exit;
    }

    if ($_POST['action'] === 'get_construction_details') {
        $id = $_POST['id'] ?? 0;
        $data = getConstructionById($id);

        if ($data) {
            echo json_encode([
                'success' => true,
                'data' => $data,
                'type' => 'construction'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Construction record not found'
            ]);
        }
        exit;
    }

    if ($_POST['action'] === 'get_business_details') {
        $id = $_POST['id'] ?? 0;
        $data = getBusinessById($id);

        if ($data) {
            echo json_encode([
                'success' => true,
                'data' => $data,
                'type' => 'business'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Business record not found'
            ]);
        }
        exit;
    }

    if ($_POST['action'] === 'get_household_details') {
        $id = $_POST['id'] ?? 0;
        $data = getHouseholdById($id);

        if ($data) {
            echo json_encode([
                'success' => true,
                'data' => $data,
                'type' => 'household'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Household record not found'
            ]);
        }
        exit;
    }

    // FLOOD HAZARD AREA actions
    if ($_POST['action'] === 'get_flood_hazards') {
        $hazards = getFloodHazardAreas();
        echo json_encode([
            'success' => true,
            'hazards' => $hazards
        ]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_data_for_search') {
        $hazards = getFloodHazardDataForSearch();
        echo json_encode([
            'success' => true,
            'hazards' => $hazards
        ]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_details') {
        $id = $_POST['id'] ?? 0;
        $data = getFloodDetails($id);
        
        if ($data) {
            echo json_encode([
                'success' => true,
                'data' => $data
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Flood hazard not found'
            ]);
        }
        exit;
    }

    // HOUSE POLYGON actions
    if ($_POST['action'] === 'get_houses') {
        $houses = getHousePolygons();
        echo json_encode([
            'success' => true,
            'count' => count($houses),
            'houses' => $houses
        ]);
        exit;
    }

    if ($_POST['action'] === 'get_house_details') {
        $id = $_POST['id'] ?? 0;
        $data = getHouseById($id);

        if ($data) {
            echo json_encode([
                'success' => true,
                'data' => $data
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'House not found'
            ]);
        }
        exit;
    }

    if ($_POST['action'] === 'save_house') {
        // Get input data
        $input = $_POST;

        // If coordinates is JSON string, decode it
        if (isset($input['coordinates']) && is_string($input['coordinates'])) {
            $input['coordinates'] = json_decode($input['coordinates'], true);
        }

        $result = saveHousePolygon($input);
        echo json_encode($result);
        exit;
    }

    if ($_POST['action'] === 'delete_house') {
        $houseId = $_POST['house_id'] ?? 0;
        $result = deleteHousePolygon($houseId);
        echo json_encode($result);
        exit;
    }

    if ($_POST['action'] === 'update_house') {
        $result = updateHouseDetails($_POST);
        echo json_encode($result);
        exit;
    }

    if ($_POST['action'] === 'check_location') {
        $lat = $_POST['lat'] ?? 0;
        $lng = $_POST['lng'] ?? 0;
        $house = checkPointInHouse($lat, $lng);

        echo json_encode([
            'success' => true,
            'is_inside' => $house !== null,
            'house' => $house
        ]);
        exit;
    }

    // Get houses in flood areas
    if ($_POST['action'] === 'get_houses_in_flood') {
        $riskLevel = $_POST['risk_level'] ?? null;
        $houses = getHousesInFloodAreas($riskLevel);
        
        echo json_encode([
            'success' => true,
            'count' => count($houses),
            'houses' => $houses
        ]);
        exit;
    }

    // Get flood affected houses summary
    if ($_POST['action'] === 'get_flood_houses_summary') {
        $summary = getFloodAffectedHousesSummary();
        
        echo json_encode([
            'success' => true,
            'summary' => $summary
        ]);
        exit;
    }

    // Get flood warning information
    if ($_POST['action'] === 'get_flood_warning') {
        $riskLevel = $_POST['risk_level'] ?? 'low';
        $warning = getFloodWarning($riskLevel);
        
        echo json_encode([
            'success' => true,
            'warning' => $warning
        ]);
        exit;
    }

    // Check if house center is in flood area (FAST method)
    if ($_POST['action'] === 'check_house_in_flood') {
        $lat = $_POST['lat'] ?? 0;
        $lng = $_POST['lng'] ?? 0;
        $floodInfo = checkHouseCenterInFlood($lat, $lng);
        
        echo json_encode([
            'success' => true,
            'in_flood' => $floodInfo !== null,
            'flood_info' => $floodInfo
        ]);
        exit;
    }

    // Get all houses with flood status
    if ($_POST['action'] === 'get_all_houses_flood_status') {
        $houses = getAllHousesWithFloodStatus();
        
        echo json_encode([
            'success' => true,
            'count' => count($houses),
            'houses' => $houses
        ]);
        exit;
    }

    // Unknown action
    echo json_encode([
        'success' => false,
        'message' => 'Unknown action'
    ]);
    exit;
}

http_response_code(400);
echo json_encode([
    'success' => false,
    'message' => 'Invalid request method'
]);
?>