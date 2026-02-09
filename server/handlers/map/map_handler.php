<?php
require_once __DIR__ . '/../../configs/database.php';

function getUtilitiesMarkers()
{
    global $pdo;
    try {
        $sql = "SELECT id, first_name, middle_name, last_name, suffix, owner_contact_no,
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
        $sql = "SELECT id, first_name, middle_name, last_name, suffix, contact_no_owner,
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
        $sql = "SELECT id, business_name, type_of_business, nature_of_business,
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

function getGenericMarkers()
{
    global $pdo;
    try {
        $sql = "SELECT marker_id as id, title, description, location, marker_type,
                       created_by, created_at, latitude, longitude 
                FROM marker 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getGenericMarkers: " . $e->getMessage());
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
        error_log("Database error: " . $e->getMessage());
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
        error_log("Database error: " . $e->getMessage());
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
        error_log("Database error: " . $e->getMessage());
        return null;
    }
}

function getGenericById($id)
{
    global $pdo;
    try {
        $sql = "SELECT * FROM marker WHERE marker_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return null;
    }
}

function getAllFloodHazards()
{
    global $pdo;
    try {
        $sql = "SELECT hazard_id, hazard_name, hazard_type, risk_level, description,
                       properties, ST_AsGeoJSON(geom) as geometry
                FROM barangay_hazards
                WHERE hazard_type = 'flood'
                ORDER BY CASE LOWER(risk_level)
                    WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4
                END, hazard_name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return [];
    }
}

function getFloodDetails($id)
{
    global $pdo;
    try {
        $sql = "SELECT hazard_id, hazard_type, hazard_name, risk_level, description,
                       ST_AsGeoJSON(geom) as geometry, properties
                FROM barangay_hazards 
                WHERE hazard_id = :id AND hazard_type = 'flood'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return null;
    }
}

function getHousesInFloodAreas($riskLevel = null)
{
    global $pdo;
    try {
        $sql = "WITH house_geoms AS (
                    SELECT 
                        house_id, address, street_name, house_number,
                        center_lat, center_lng, area_sqm, coordinates,
                        CASE 
                            WHEN coordinates IS NOT NULL THEN
                                ST_SetSRID(
                                    ST_GeomFromGeoJSON(
                                        json_build_object(
                                            'type', 'Polygon',
                                            'coordinates', json_build_array(coordinates)
                                        )::text
                                    ),
                                    4326
                                )
                            ELSE
                                ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
                        END as geom
                    FROM house_polygons
                    WHERE (coordinates IS NOT NULL OR (center_lat IS NOT NULL AND center_lng IS NOT NULL))
                )
                SELECT 
                    hg.house_id, hg.address, hg.street_name, hg.house_number,
                    hg.center_lat, hg.center_lng, hg.area_sqm, hg.coordinates,
                    bh.hazard_id, bh.hazard_name, bh.risk_level,
                    bh.description as hazard_description, bh.properties,
                    CASE 
                        WHEN hg.coordinates IS NOT NULL THEN
                            ROUND(
                                (ST_Area(ST_Intersection(hg.geom::geography, bh.geom)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) * 100)::numeric,
                                1
                            )
                        ELSE 100
                    END as flood_coverage_percent,
                    CASE 
                        WHEN hg.coordinates IS NULL THEN 'Affected'
                        WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom)) / 
                             NULLIF(ST_Area(hg.geom::geography), 0) >= 0.75 THEN 'Fully Affected'
                        WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom)) / 
                             NULLIF(ST_Area(hg.geom::geography), 0) >= 0.25 THEN 'Partially Affected'
                        ELSE 'Minimally Affected'
                    END as impact_level
                FROM house_geoms hg
                JOIN barangay_hazards bh ON ST_Intersects(hg.geom, bh.geom)
                WHERE bh.hazard_type = 'flood'
                " . ($riskLevel ? "AND LOWER(bh.risk_level) = LOWER(:risk_level)" : "") . "
                ORDER BY bh.risk_level, hg.address";
        
        $stmt = $pdo->prepare($sql);
        if ($riskLevel) {
            $stmt->execute([':risk_level' => $riskLevel]);
        } else {
            $stmt->execute();
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return [];
    }
}

function getFloodAffectedHousesSummary()
{
    global $pdo;
    try {
        $sql = "WITH house_geoms AS (
                    SELECT 
                        house_id, address, coordinates, center_lat, center_lng,
                        CASE 
                            WHEN coordinates IS NOT NULL THEN
                                ST_SetSRID(
                                    ST_GeomFromGeoJSON(
                                        json_build_object(
                                            'type', 'Polygon',
                                            'coordinates', json_build_array(coordinates)
                                        )::text
                                    ),
                                    4326
                                )
                            ELSE
                                ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
                        END as geom
                    FROM house_polygons
                    WHERE (coordinates IS NOT NULL OR (center_lat IS NOT NULL AND center_lng IS NOT NULL))
                ),
                flood_impacts AS (
                    SELECT 
                        hg.house_id,
                        bh.risk_level,
                        CASE 
                            WHEN hg.coordinates IS NULL THEN 'Affected'
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.75 THEN 'Fully Affected'
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.25 THEN 'Partially Affected'
                            ELSE 'Minimally Affected'
                        END as impact_level
                    FROM house_geoms hg
                    JOIN barangay_hazards bh ON ST_Intersects(hg.geom, bh.geom)
                    WHERE bh.hazard_type = 'flood'
                )
                SELECT 
                    COUNT(DISTINCT house_id) as total,
                    COUNT(DISTINCT CASE WHEN impact_level = 'Fully Affected' THEN house_id END) as fully_affected,
                    COUNT(DISTINCT CASE WHEN impact_level = 'Partially Affected' THEN house_id END) as partially_affected,
                    COUNT(DISTINCT CASE WHEN impact_level = 'Minimally Affected' THEN house_id END) as minimally_affected,
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'risk_level', risk_level,
                            'count', (SELECT COUNT(*) FROM flood_impacts fi2 WHERE fi2.risk_level = fi.risk_level)
                        )
                    ) as by_risk_level
                FROM flood_impacts fi";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'total' => (int)($result['total'] ?? 0),
            'fully_affected' => (int)($result['fully_affected'] ?? 0),
            'partially_affected' => (int)($result['partially_affected'] ?? 0),
            'minimally_affected' => (int)($result['minimally_affected'] ?? 0),
            'by_risk_level' => json_decode($result['by_risk_level'] ?? '[]', true)
        ];
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
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
    $warnings = [
        'high' => [
            'title' => '🚨 HIGH FLOOD RISK AREA',
            'severity' => 'critical',
            'message' => 'This area is in a HIGH RISK FLOOD ZONE.',
            'recommendations' => [
                'Immediate evacuation may be necessary during heavy rainfall',
                'Prepare an emergency kit with essentials',
                'Know your nearest evacuation center',
                'Monitor weather updates constantly',
                'Have emergency contacts readily available'
            ]
        ],
        'medium' => [
            'title' => '⚠️ Medium Flood Risk Area',
            'severity' => 'warning',
            'message' => 'This area has MODERATE RISK of flooding.',
            'recommendations' => [
                'Prepare emergency supplies',
                'Monitor weather forecasts regularly',
                'Clear drainage systems',
                'Know evacuation centers location'
            ]
        ],
        'low' => [
            'title' => 'ℹ️ Low Flood Risk Area',
            'severity' => 'info',
            'message' => 'This area has LOW RISK of flooding.',
            'recommendations' => [
                'Stay informed about weather conditions',
                'Maintain clear drainage systems',
                'Have basic emergency supplies ready'
            ]
        ],
        'very-low' => [
            'title' => '✓ Very Low Flood Risk',
            'severity' => 'success',
            'message' => 'This area has VERY LOW RISK of flooding.',
            'recommendations' => [
                'Maintain awareness of weather conditions',
                'Keep emergency contact numbers available'
            ]
        ]
    ];
    
    return $warnings[strtolower($riskLevel)] ?? $warnings['low'];
}

// IMPROVED: Check if a point is in flood zone with coverage percentage
function checkPointInFloodZone($lat, $lng)
{
    global $pdo;
    try {
        $sql = "SELECT 
                    bh.hazard_id,
                    bh.hazard_name,
                    bh.risk_level,
                    bh.description,
                    100.0 as coverage_percent
                FROM barangay_hazards bh
                WHERE bh.hazard_type = 'flood'
                AND ST_Intersects(
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                    bh.geom
                )
                ORDER BY CASE LOWER(bh.risk_level)
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 3
                    ELSE 4
                END
                LIMIT 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':lat' => $lat, ':lng' => $lng]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return null;
    }
}

// IMPROVED: SDSS evaluation for business with precise flood detection
function sdss_evaluateBusiness($businessId)
{
    $business = getBusinessById($businessId);
    
    if (!$business || !$business['latitude'] || !$business['longitude']) {
        return ['error' => 'Business not found or location not set'];
    }
    
    $rules = [];
    $critical_issues = 0;
    $warnings = 0;
    
    // Check flood zone
    $floodData = checkPointInFloodZone($business['latitude'], $business['longitude']);
    
    if ($floodData) {
        $severity = (strtolower($floodData['risk_level']) === 'high') ? 'critical' : 'warning';
        
        if ($severity === 'critical') {
            $critical_issues++;
        } else {
            $warnings++;
        }
        
        $rules[] = [
            'rule_code' => 'FLOOD_ZONE',
            'rule_name' => 'Flood Hazard Area Check',
            'severity' => $severity,
            'status' => 'TRIGGERED',
            'message' => "Business location is within {$floodData['hazard_name']} ({$floodData['risk_level']} risk)",
            'details' => [
                'hazard_name' => $floodData['hazard_name'],
                'risk_level' => $floodData['risk_level'],
                'coverage_percent' => $floodData['coverage_percent'],
                'description' => $floodData['description']
            ],
            'recommendation' => ($severity === 'critical') 
                ? 'DENY: High flood risk area. Recommend relocation or extensive flood mitigation measures.'
                : 'WARNING: Moderate flood risk. Require flood preparedness plan and elevated structures.'
        ];
    }
    
    $overall_status = 'APPROVE';
    if ($critical_issues > 0) {
        $overall_status = 'DENY';
    } elseif ($warnings > 0) {
        $overall_status = 'APPROVE_WITH_CONDITIONS';
    }
    
    return [
        'business_id' => $businessId,
        'business_name' => $business['business_name'],
        'address' => $business['address_of_business'],
        'evaluated_at' => date('Y-m-d H:i:s'),
        'rules' => $rules,
        'summary' => [
            'total_rules_checked' => 1,
            'rules_triggered' => count($rules),
            'critical_issues' => $critical_issues,
            'warnings' => $warnings,
            'overall_status' => $overall_status
        ]
    ];
}

// IMPROVED: SDSS evaluation for construction with precise flood detection
function sdss_evaluateConstruction($constructionId)
{
    $construction = getConstructionById($constructionId);
    
    if (!$construction || !$construction['latitude'] || !$construction['longitude']) {
        return ['error' => 'Construction not found or location not set'];
    }
    
    $rules = [];
    $critical_issues = 0;
    $warnings = 0;
    
    // Check flood zone
    $floodData = checkPointInFloodZone($construction['latitude'], $construction['longitude']);
    
    if ($floodData) {
        $severity = (strtolower($floodData['risk_level']) === 'high') ? 'critical' : 'warning';
        
        if ($severity === 'critical') {
            $critical_issues++;
        } else {
            $warnings++;
        }
        
        $rules[] = [
            'rule_code' => 'FLOOD_ZONE',
            'rule_name' => 'Flood Hazard Area Check',
            'severity' => $severity,
            'status' => 'TRIGGERED',
            'message' => "Construction site is within {$floodData['hazard_name']} ({$floodData['risk_level']} risk)",
            'details' => [
                'hazard_name' => $floodData['hazard_name'],
                'risk_level' => $floodData['risk_level'],
                'coverage_percent' => $floodData['coverage_percent'],
                'description' => $floodData['description']
            ],
            'recommendation' => ($severity === 'critical') 
                ? 'DENY: High flood risk area. Construction not recommended without extensive flood mitigation.'
                : 'WARNING: Moderate flood risk. Require elevated foundation and flood-resistant materials.'
        ];
    }
    
    $overall_status = 'APPROVE';
    if ($critical_issues > 0) {
        $overall_status = 'DENY';
    } elseif ($warnings > 0) {
        $overall_status = 'APPROVE_WITH_CONDITIONS';
    }
    
    return [
        'construction_id' => $constructionId,
        'address' => $construction['construction_address'],
        'nature_of_work' => $construction['nature_of_work'],
        'evaluated_at' => date('Y-m-d H:i:s'),
        'rules' => $rules,
        'summary' => [
            'total_rules_checked' => 1,
            'rules_triggered' => count($rules),
            'critical_issues' => $critical_issues,
            'warnings' => $warnings,
            'overall_status' => $overall_status
        ]
    ];
}

// NEW: Complete SDSS evaluation for ALL businesses
function sdss_evaluateAllBusinesses()
{
    $businesses = getBusinessMarkers();
    $results = [
        'total' => count($businesses),
        'affected' => [],
        'not_affected' => [],
        'summary' => [
            'total_affected' => 0,
            'high_risk' => 0,
            'medium_risk' => 0,
            'low_risk' => 0,
            'total_safe' => 0
        ]
    ];
    
    foreach ($businesses as $business) {
        $evaluation = sdss_evaluateBusiness($business['id']);
        
        $item = [
            'id' => $business['id'],
            'business_name' => $business['business_name'],
            'address' => $business['address_of_business'],
            'owner' => trim(($business['first_name'] ?? '') . ' ' . ($business['middle_name'] ?? '') . ' ' . ($business['last_name'] ?? '')),
            'latitude' => $business['latitude'],
            'longitude' => $business['longitude']
        ];
        
        if (!empty($evaluation['rules'])) {
            $floodRule = $evaluation['rules'][0];
            $item['flood_info'] = [
                'hazard_name' => $floodRule['details']['hazard_name'],
                'risk_level' => $floodRule['details']['risk_level'],
                'coverage_percent' => $floodRule['details']['coverage_percent'],
                'status' => $evaluation['summary']['overall_status']
            ];
            $results['affected'][] = $item;
            $results['summary']['total_affected']++;
            
            switch (strtolower($floodRule['details']['risk_level'])) {
                case 'high':
                    $results['summary']['high_risk']++;
                    break;
                case 'medium':
                    $results['summary']['medium_risk']++;
                    break;
                case 'low':
                    $results['summary']['low_risk']++;
                    break;
            }
        } else {
            $item['status'] = 'Safe - No flood risk detected';
            $results['not_affected'][] = $item;
            $results['summary']['total_safe']++;
        }
    }
    
    return $results;
}

// NEW: Complete SDSS evaluation for ALL construction applications
function sdss_evaluateAllConstruction()
{
    $constructions = getConstructionMarkers();
    $results = [
        'total' => count($constructions),
        'affected' => [],
        'not_affected' => [],
        'summary' => [
            'total_affected' => 0,
            'high_risk' => 0,
            'medium_risk' => 0,
            'low_risk' => 0,
            'total_safe' => 0
        ]
    ];
    
    foreach ($constructions as $construction) {
        $evaluation = sdss_evaluateConstruction($construction['id']);
        
        $item = [
            'id' => $construction['id'],
            'address' => $construction['construction_address'],
            'owner' => trim(($construction['first_name'] ?? '') . ' ' . ($construction['middle_name'] ?? '') . ' ' . ($construction['last_name'] ?? '')),
            'nature_of_work' => $construction['nature_of_work'],
            'latitude' => $construction['latitude'],
            'longitude' => $construction['longitude']
        ];
        
        if (!empty($evaluation['rules'])) {
            $floodRule = $evaluation['rules'][0];
            $item['flood_info'] = [
                'hazard_name' => $floodRule['details']['hazard_name'],
                'risk_level' => $floodRule['details']['risk_level'],
                'coverage_percent' => $floodRule['details']['coverage_percent'],
                'status' => $evaluation['summary']['overall_status']
            ];
            $results['affected'][] = $item;
            $results['summary']['total_affected']++;
            
            switch (strtolower($floodRule['details']['risk_level'])) {
                case 'high':
                    $results['summary']['high_risk']++;
                    break;
                case 'medium':
                    $results['summary']['medium_risk']++;
                    break;
                case 'low':
                    $results['summary']['low_risk']++;
                    break;
            }
        } else {
            $item['status'] = 'Safe - No flood risk detected';
            $results['not_affected'][] = $item;
            $results['summary']['total_safe']++;
        }
    }
    
    return $results;
}

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
        error_log("Database error: " . $e->getMessage());
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
        error_log("Database error: " . $e->getMessage());
        return null;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');

    if ($_POST['action'] === 'get_utilities_markers') {
        echo json_encode(['success' => true, 'markers' => getUtilitiesMarkers()]);
        exit;
    }

    if ($_POST['action'] === 'get_construction_markers') {
        echo json_encode(['success' => true, 'markers' => getConstructionMarkers()]);
        exit;
    }

    if ($_POST['action'] === 'get_business_markers') {
        echo json_encode(['success' => true, 'markers' => getBusinessMarkers()]);
        exit;
    }

    if ($_POST['action'] === 'get_generic_markers') {
        echo json_encode(['success' => true, 'markers' => getGenericMarkers()]);
        exit;
    }

    if ($_POST['action'] === 'get_utilities_details') {
        $data = getUtilitiesById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

    if ($_POST['action'] === 'get_construction_details') {
        $data = getConstructionById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

    if ($_POST['action'] === 'get_business_details') {
        $data = getBusinessById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

    if ($_POST['action'] === 'get_generic_details') {
        $data = getGenericById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_hazards') {
        echo json_encode(['success' => true, 'hazards' => getAllFloodHazards()]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_details') {
        $data = getFloodDetails($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

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

    if ($_POST['action'] === 'get_houses') {
        echo json_encode(['success' => true, 'houses' => getHousePolygons()]);
        exit;
    }

    if ($_POST['action'] === 'get_house_details') {
        $data = getHouseById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

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

    // NEW: Get complete SDSS report for all businesses
    if ($_POST['action'] === 'sdss_get_all_businesses_report') {
        $report = sdss_evaluateAllBusinesses();
        echo json_encode(['success' => true, 'report' => $report]);
        exit;
    }

    // NEW: Get complete SDSS report for all construction
    if ($_POST['action'] === 'sdss_get_all_construction_report') {
        $report = sdss_evaluateAllConstruction();
        echo json_encode(['success' => true, 'report' => $report]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>