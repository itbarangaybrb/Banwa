<?php
require_once __DIR__ . '/../../configs/database.php';

// ==================== UTILITY FUNCTIONS ====================

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

// ==================== FLOOD HAZARD FUNCTIONS ====================

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
        $hazards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process hazards to extract coordinates from GeoJSON
        foreach ($hazards as &$hazard) {
            if ($hazard['geometry']) {
                $geojson = json_decode($hazard['geometry'], true);
                if ($geojson && isset($geojson['coordinates'])) {
                    // GeoJSON Polygon format: [[[lng, lat], [lng, lat], ...]]
                    // Leaflet needs: [[lat, lng], [lat, lng], ...]
                    $coords = $geojson['coordinates'][0]; // Get outer ring
                    $hazard['coordinates'] = array_map(function($coord) {
                        return [$coord[1], $coord[0]]; // Swap from [lng, lat] to [lat, lng]
                    }, $coords);
                }
            }
        }
        
        return $hazards;
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
                            LEAST(
                                ROUND(
                                    (ST_Area(ST_Intersection(hg.geom::geography, bh.geom)) / 
                                     NULLIF(ST_Area(hg.geom::geography), 0) * 100)::numeric,
                                    1
                                ),
                                100.0
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

// ==================== NEW FAULT LINE ASSESSMENT FUNCTIONS ====================

/**
 * Get fault line risk assessment for all structures
 */
function getFaultLineAssessment() {
    global $pdo;
    
    try {
        // Fault line coordinates (hardcoded for now - can be moved to database later)
        $faultLineCoords = [
            [14.6175408, 121.0765329],
            [14.6177993, 121.0765362],
            [14.6180432, 121.0765517],
            [14.6182482, 121.0765671],
            [14.6185088, 121.0765914],
            [14.6188121, 121.0766554],
            [14.6190770, 121.0767448]
        ];
        
        // Get all house polygons
        $sql = "SELECT house_id, address, street_name, house_number, 
                       center_lat, center_lng, area_sqm
                FROM house_polygons
                WHERE center_lat IS NOT NULL AND center_lng IS NOT NULL";
        $stmt = $pdo->query($sql);
        $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $structures_at_risk = [];
        $critical_count = 0;
        $high_risk_count = 0;
        $medium_risk_count = 0;
        
        foreach ($houses as $house) {
            $minDistance = PHP_FLOAT_MAX;
            
            // Calculate minimum distance to fault line
            for ($i = 0; $i < count($faultLineCoords) - 1; $i++) {
                $distance = calculateDistanceToLineSegment(
                    $house['center_lat'], 
                    $house['center_lng'],
                    $faultLineCoords[$i][0], 
                    $faultLineCoords[$i][1],
                    $faultLineCoords[$i + 1][0], 
                    $faultLineCoords[$i + 1][1]
                );
                $minDistance = min($minDistance, $distance);
            }
            
            // Categorize risk level
            $risk_level = null;
            $requirements = [];
            
            if ($minDistance < 50) {
                $risk_level = 'critical';
                $critical_count++;
                $requirements = [
                    'CRITICAL ZONE: Construction allowed with enhanced seismic standards',
                    'Mandatory structural engineer certification required',
                    'Special seismic design and geological survey mandatory',
                    'Reinforced foundation with deep pile requirements',
                    'Use earthquake-resistant materials and construction methods',
                    'Building insurance and regular structural inspections required'
                ];
            } elseif ($minDistance < 100) {
                $risk_level = 'high';
                $high_risk_count++;
                $requirements = [
                    'Seismic design standards mandatory',
                    'Structural engineer certification required',
                    'Regular safety inspections needed',
                    'Enhanced foundation required'
                ];
            } elseif ($minDistance < 200) {
                $risk_level = 'medium';
                $medium_risk_count++;
                $requirements = [
                    'Enhanced foundation design recommended',
                    'Earthquake preparedness plan required',
                    'Standard building codes with seismic provisions'
                ];
            }
            
            if ($risk_level) {
                $structures_at_risk[] = [
                    'house_id' => $house['house_id'],
                    'address' => $house['address'],
                    'street_name' => $house['street_name'],
                    'house_number' => $house['house_number'],
                    'latitude' => $house['center_lat'],
                    'longitude' => $house['center_lng'],
                    'distance_meters' => round($minDistance),
                    'risk_level' => $risk_level,
                    'requirements' => $requirements
                ];
            }
        }
        
        // Sort by risk level (critical first) then by distance
        usort($structures_at_risk, function($a, $b) {
            $riskOrder = ['critical' => 0, 'high' => 1, 'medium' => 2];
            $aOrder = $riskOrder[$a['risk_level']] ?? 999;
            $bOrder = $riskOrder[$b['risk_level']] ?? 999;
            
            if ($aOrder === $bOrder) {
                return $a['distance_meters'] - $b['distance_meters'];
            }
            return $aOrder - $bOrder;
        });
        
        return [
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total_at_risk' => count($structures_at_risk),
                    'critical' => $critical_count,
                    'high_risk' => $high_risk_count,
                    'medium_risk' => $medium_risk_count
                ],
                'structures' => $structures_at_risk
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Error in getFaultLineAssessment: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to assess fault line risk: ' . $e->getMessage()
        ];
    }
}

/**
 * Calculate distance from a point to a line segment (in meters)
 */
function calculateDistanceToLineSegment($pointLat, $pointLng, $line1Lat, $line1Lng, $line2Lat, $line2Lng) {
    // Convert to radians
    $lat1 = deg2rad($pointLat);
    $lon1 = deg2rad($pointLng);
    $lat2 = deg2rad($line1Lat);
    $lon2 = deg2rad($line1Lng);
    $lat3 = deg2rad($line2Lat);
    $lon3 = deg2rad($line2Lng);
    
    // Earth radius in meters
    $R = 6371000;
    
    // Calculate distances
    $d12 = calculateHaversineDistance($line1Lat, $line1Lng, $line2Lat, $line2Lng);
    $d1p = calculateHaversineDistance($line1Lat, $line1Lng, $pointLat, $pointLng);
    $d2p = calculateHaversineDistance($line2Lat, $line2Lng, $pointLat, $pointLng);
    
    // If line segment has zero length
    if ($d12 < 0.001) {
        return $d1p;
    }
    
    // Calculate cross track distance (perpendicular distance from point to infinite line)
    $bearing12 = calculateBearing($line1Lat, $line1Lng, $line2Lat, $line2Lng);
    $bearing1p = calculateBearing($line1Lat, $line1Lng, $pointLat, $pointLng);
    
    $dxt = asin(sin($d1p / $R) * sin(deg2rad($bearing1p) - deg2rad($bearing12))) * $R;
    
    // Calculate along track distance
    $dat = acos(cos($d1p / $R) / cos($dxt / $R)) * $R;
    
    // Check if perpendicular point is on the segment
    if ($dat > $d12) {
        return $d2p; // Closer to end point
    } elseif ($dat < 0) {
        return $d1p; // Closer to start point
    } else {
        return abs($dxt); // Perpendicular distance
    }
}

/**
 * Calculate bearing between two points
 */
function calculateBearing($lat1, $lon1, $lat2, $lon2) {
    $lat1 = deg2rad($lat1);
    $lon1 = deg2rad($lon1);
    $lat2 = deg2rad($lat2);
    $lon2 = deg2rad($lon2);
    
    $dLon = $lon2 - $lon1;
    
    $y = sin($dLon) * cos($lat2);
    $x = cos($lat1) * sin($lat2) - sin($lat1) * cos($lat2) * cos($dLon);
    
    $bearing = atan2($y, $x);
    
    return rad2deg($bearing);
}

/**
 * Calculate Haversine distance between two points (in meters)
 */
function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2) {
    $R = 6371000; // Earth radius in meters
    
    $lat1 = deg2rad($lat1);
    $lon1 = deg2rad($lon1);
    $lat2 = deg2rad($lat2);
    $lon2 = deg2rad($lon2);
    
    $dlat = $lat2 - $lat1;
    $dlon = $lon2 - $lon1;
    
    $a = sin($dlat / 2) * sin($dlat / 2) +
         cos($lat1) * cos($lat2) *
         sin($dlon / 2) * sin($dlon / 2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    return $R * $c;
}

// ==================== NEW BUSINESS SDSS REPORT FUNCTIONS ====================

/**
 * Get SDSS report for all businesses
 */
function getBusinessSDSSReport() {
    global $pdo;
    
    try {
        // Get all businesses with coordinates
        $sql = "SELECT id, business_name, type_of_business, nature_of_business,
                       address_of_business, no_of_employees, latitude, longitude,
                       first_name, middle_name, last_name
                FROM business_applications
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $pdo->query($sql);
        $businesses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $warnings = [];
        
        foreach ($businesses as $business) {
            $businessWarnings = evaluateBusinessSDSS($business, $pdo);
            if (!empty($businessWarnings)) {
                $warnings[] = $businessWarnings;
            }
        }
        
        return [
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total' => count($businesses),
                    'with_warnings' => count($warnings),
                    'compliant' => count($businesses) - count($warnings)
                ],
                'warnings' => $warnings
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Error in getBusinessSDSSReport: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to generate business SDSS report: ' . $e->getMessage()
        ];
    }
}

/**
 * Evaluate a single business against SDSS rules
 */
function evaluateBusinessSDSS($business, $pdo) {
    $lat = $business['latitude'];
    $lng = $business['longitude'];
    
    // Check flood risk
    $floodRisk = checkPointInFloodZone($lat, $lng);
    
    // Check fault line proximity
    $faultLineDistance = getDistanceToFaultLine($lat, $lng);
    
    // Collect warnings
    $businessData = [
        'business' => $business,
        'warnings' => []
    ];
    
    $maxSeverity = null;
    
    // Rule 1: Flood zone check
    if ($floodRisk && isset($floodRisk['risk_level'])) {
        $riskLevel = strtolower($floodRisk['risk_level']);
        
        if ($riskLevel === 'high') {
            $businessData['warnings'][] = [
                'type' => 'Flood Hazard Violation',
                'description' => 'Business located in HIGH flood risk zone',
                'severity' => 'CRITICAL',
                'actions' => [
                    'Install flood barriers and elevation systems immediately',
                    'Develop and implement emergency evacuation plan',
                    'Store inventory and equipment above flood level',
                    'Obtain flood insurance coverage',
                    'Install early warning systems'
                ]
            ];
            $maxSeverity = 'CRITICAL';
        } elseif ($riskLevel === 'medium') {
            $businessData['warnings'][] = [
                'type' => 'Flood Risk Warning',
                'description' => 'Business located in MEDIUM flood risk zone',
                'severity' => 'HIGH',
                'actions' => [
                    'Prepare flood mitigation measures',
                    'Monitor weather alerts during rainy season',
                    'Prepare sandbags and drainage systems',
                    'Keep emergency supplies ready'
                ]
            ];
            $maxSeverity = $maxSeverity ?? 'HIGH';
        }
    }
    
    // Rule 2: Fault line proximity check
    if ($faultLineDistance < 50) {
        $businessData['warnings'][] = [
            'type' => 'Fault Line Critical Zone Warning',
            'description' => "Business within {$faultLineDistance}m of fault line (CRITICAL ZONE - Special Requirements)",
            'severity' => 'CRITICAL',
            'actions' => [
                'CRITICAL ZONE: Business operations allowed ONLY with enhanced safety measures',
                'Mandatory structural assessment and seismic compliance certification',
                'Seismic retrofitting of building required',
                'Emergency evacuation plan and earthquake drills mandatory',
                'Special permits and engineering certification needed',
                'Building insurance covering earthquake damage required',
                'Regular safety inspections and structural monitoring'
            ]
        ];
        $maxSeverity = 'CRITICAL';
    } elseif ($faultLineDistance < 100) {
        $businessData['warnings'][] = [
            'type' => 'Fault Line High Risk',
            'description' => "Business within {$faultLineDistance}m of fault line",
            'severity' => 'HIGH',
            'actions' => [
                'Seismic design standards mandatory',
                'Structural engineer certification required',
                'Regular safety inspections needed',
                'Enhanced foundation requirements'
            ]
        ];
        $maxSeverity = $maxSeverity ?? 'HIGH';
    }
    
    // Rule 3: Employee capacity check
    $employees = intval($business['no_of_employees'] ?? 0);
    if ($employees > 50) {
        $businessData['warnings'][] = [
            'type' => 'High Occupancy Warning',
            'description' => "High employee count ({$employees} employees)",
            'severity' => 'MEDIUM',
            'actions' => [
                'Ensure adequate space per employee',
                'Verify fire safety equipment capacity',
                'Conduct regular safety drills',
                'Ensure proper ventilation and emergency exits'
            ]
        ];
        $maxSeverity = $maxSeverity ?? 'MEDIUM';
    }
    
    // Return only if there are warnings
    if (empty($businessData['warnings'])) {
        return null;
    }
    
    // Set the highest severity
    $businessData['severity'] = $maxSeverity;
    
    return $businessData;
}

// ==================== NEW CONSTRUCTION SDSS REPORT FUNCTIONS ====================

/**
 * Get SDSS report for all construction sites
 */
function getConstructionSDSSReport() {
    global $pdo;
    
    try {
        // Get all construction with coordinates
        $sql = "SELECT id, first_name, middle_name, last_name, construction_address,
                       type_of_work, nature_of_work, number_of_workers, 
                       number_of_working_days, latitude, longitude
                FROM construction_applications
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
        $stmt = $pdo->query($sql);
        $constructions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $warnings = [];
        
        foreach ($constructions as $construction) {
            $constructionWarnings = evaluateConstructionSDSS($construction, $pdo);
            if (!empty($constructionWarnings)) {
                $warnings[] = $constructionWarnings;
            }
        }
        
        return [
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total' => count($constructions),
                    'with_warnings' => count($warnings),
                    'compliant' => count($constructions) - count($warnings)
                ],
                'warnings' => $warnings
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Error in getConstructionSDSSReport: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to generate construction SDSS report: ' . $e->getMessage()
        ];
    }
}

/**
 * Evaluate a single construction site against SDSS rules
 */

function evaluateConstructionSDSS($construction, $pdo) {
    $lat = $construction['latitude'];
    $lng = $construction['longitude'];
    
    // Check flood risk
    $floodRisk = checkPointInFloodZone($lat, $lng);
    
    // Check fault line proximity
    $faultLineDistance = getDistanceToFaultLine($lat, $lng);
    
    // Determine project type
    $typeOfWork = strtolower($construction['type_of_work'] ?? '');
    $projectType = 'minor';
    if (strpos($typeOfWork, 'major') !== false) $projectType = 'major';
    elseif (strpos($typeOfWork, 'repair') !== false) $projectType = 'repair';
    elseif (strpos($typeOfWork, 'demolition') !== false) $projectType = 'demolition';
    
    // UPDATED: Get nature of activity
    $natureOfActivity = strtolower($construction['nature_of_activity'] ?? '');
    
    // UPDATED: Get minimum workers based on BOTH type_of_work AND nature_of_activity
    $minWorkersRequired = getMinimumWorkersForConstruction($projectType, $natureOfActivity);
    
    $constructionData = [
        'construction' => $construction,
        'warnings' => []
    ];
    
    $maxSeverity = null;
    
    // Rule 1: Flood zone construction
    if ($floodRisk && isset($floodRisk['risk_level'])) {
        $riskLevel = strtolower($floodRisk['risk_level']);
        
        if ($riskLevel === 'high') {
            $constructionData['warnings'][] = [
                'type' => 'Flood Zone Construction Violation',
                'description' => 'Construction in HIGH flood risk zone',
                'severity' => 'CRITICAL',
                'actions' => [
                    'Flood-resistant construction methods MANDATORY',
                    'Elevated foundation required (minimum 1.5m above ground)',
                    'Waterproof materials required for basement/ground floor',
                    'Install flood barriers and drainage systems',
                    'Obtain special flood zone construction permit'
                ]
            ];
            $maxSeverity = 'CRITICAL';
        }
    }
    
    // Rule 2: Fault line setback
    if ($faultLineDistance < 50) {
        $constructionData['warnings'][] = [
            'type' => 'Fault Line Critical Zone Warning',
            'description' => "Construction within {$faultLineDistance}m of fault line (CRITICAL ZONE - Special Requirements)",
            'severity' => 'CRITICAL',
            'actions' => [
                'CRITICAL ZONE: Construction allowed ONLY with enhanced seismic standards',
                'Mandatory structural engineer certification and seismic design approval',
                'Reinforced foundation with deep pile requirements',
                'Use of earthquake-resistant materials and construction methods',
                'Building Insurance and geological survey required',
                'Regular structural integrity inspections mandatory',
                'Emergency preparedness and evacuation plan required'
            ]
        ];
        $maxSeverity = 'CRITICAL';
    } elseif ($faultLineDistance < 100) {
        $constructionData['warnings'][] = [
            'type' => 'Seismic Requirements',
            'description' => "Construction within {$faultLineDistance}m of fault line",
            'severity' => 'HIGH',
            'actions' => [
                'Seismic design standards MANDATORY',
                'Structural engineer certification required',
                'Enhanced foundation and reinforcement',
                'Regular structural inspections during construction'
            ]
        ];
        $maxSeverity = $maxSeverity ?? 'HIGH';
    }
    
    // Rule 3: Worker adequacy (UPDATED to consider nature_of_activity)
    $workers = intval($construction['number_of_workers'] ?? 0);
    
    if ($workers < $minWorkersRequired['minimum']) {
        $constructionData['warnings'][] = [
            'type' => 'Inadequate Workforce',
            'description' => "{$projectType} construction with '{$natureOfActivity}' activity requires minimum {$minWorkersRequired['minimum']} workers (current: {$workers})",
            'severity' => $minWorkersRequired['severity'],
            'reason' => $minWorkersRequired['reason'],
            'actions' => [
                "Increase workforce to minimum {$minWorkersRequired['minimum']} workers",
                'Ensure proper supervision and safety coverage',
                'Verify all workers have safety training',
                'Implement buddy system for safety',
                $minWorkersRequired['additional_requirement']
            ]
        ];
        $maxSeverity = $maxSeverity ?? $minWorkersRequired['severity'];
    }
    
    // Return only if there are warnings
    if (empty($constructionData['warnings'])) {
        return null;
    }
    
    $constructionData['severity'] = $maxSeverity;
    
    return $constructionData;
}

/**
 * NEW FUNCTION: Get minimum workers based on type of work AND nature of activity
 */
function getMinimumWorkersForConstruction($projectType, $natureOfActivity) {
    $baseMinimum = [
        'major' => 10,
        'minor' => 3,
        'repair' => 2,
        'demolition' => 5
    ];
    
    $minimum = $baseMinimum[$projectType] ?? 3;
    $severity = 'MEDIUM';
    $reason = "Standard requirement for {$projectType} construction";
    $additionalRequirement = "Follow standard construction safety protocols";
    
    // Adjust based on nature of activity
    if (strpos($natureOfActivity, 'excavation') !== false) {
        $minimum = max($minimum, 4);
        $severity = 'HIGH';
        $reason = "Excavation work requires additional workers for cave-in safety monitoring";
        $additionalRequirement = "Assign dedicated safety spotter for excavation work";
        
    } elseif (strpos($natureOfActivity, 'structural') !== false || 
              strpos($natureOfActivity, 'foundation') !== false) {
        $minimum = max($minimum, 5);
        $severity = 'HIGH';
        $reason = "Structural work requires adequate crew for load bearing and stability";
        $additionalRequirement = "Ensure structural engineer on-site supervision";
        
    } elseif (strpos($natureOfActivity, 'roofing') !== false || 
              strpos($natureOfActivity, 'height') !== false) {
        $minimum = max($minimum, 3);
        $severity = 'HIGH';
        $reason = "Work at height requires safety spotters and emergency response team";
        $additionalRequirement = "Implement fall protection systems and assign safety monitor";
        
    } elseif (strpos($natureOfActivity, 'demolition') !== false) {
        $minimum = max($minimum, 6);
        $severity = 'CRITICAL';
        $reason = "Demolition work is high-risk and requires adequate crew for safe controlled collapse";
        $additionalRequirement = "Establish safety perimeter and assign evacuation coordinator";
        
    } elseif (strpos($natureOfActivity, 'electrical') !== false || 
              strpos($natureOfActivity, 'plumbing') !== false ||
              strpos($natureOfActivity, 'mechanical') !== false) {
        $minimum = max($minimum, 2);
        $severity = 'MEDIUM';
        $reason = "Specialized work requires licensed professionals with assistant";
        $additionalRequirement = "Verify workers have appropriate licenses and certifications";
        
    } elseif (strpos($natureOfActivity, 'painting') !== false || 
              strpos($natureOfActivity, 'finishing') !== false) {
        $minimum = max($minimum - 1, 2);
        $severity = 'MEDIUM';
        $reason = "Finishing work standard crew size";
        $additionalRequirement = "Ensure adequate ventilation for paint/chemical fumes";
        
    } elseif (strpos($natureOfActivity, 'installation') !== false) {
        $minimum = max($minimum, 2);
        $severity = 'MEDIUM';
        $reason = "Installation requires minimum team for equipment handling";
        $additionalRequirement = "Follow manufacturer installation guidelines";
    }
    
    // For major projects, always require minimum 10 workers
    if ($projectType === 'major') {
        $minimum = max($minimum, 10);
    }
    
    return [
        'minimum' => $minimum,
        'severity' => $severity,
        'reason' => $reason,
        'additional_requirement' => $additionalRequirement
    ];
}


/**
 * Get distance from point to fault line
 */
function getDistanceToFaultLine($lat, $lng) {
    $faultLineCoords = [
        [14.6175408, 121.0765329],
        [14.6177993, 121.0765362],
        [14.6180432, 121.0765517],
        [14.6182482, 121.0765671],
        [14.6185088, 121.0765914],
        [14.6188121, 121.0766554],
        [14.6190770, 121.0767448]
    ];
    
    $minDistance = PHP_FLOAT_MAX;
    
    for ($i = 0; $i < count($faultLineCoords) - 1; $i++) {
        $distance = calculateDistanceToLineSegment(
            $lat, 
            $lng,
            $faultLineCoords[$i][0], 
            $faultLineCoords[$i][1],
            $faultLineCoords[$i + 1][0], 
            $faultLineCoords[$i + 1][1]
        );
        $minDistance = min($minDistance, $distance);
    }
    
    return round($minDistance);
}

// ==================== SDSS RULES SUMMARY FUNCTION ====================

/**
 * Get summary of all SDSS rules and count of houses affected by each rule
 */
function getSDSSRulesSummary() {
    global $pdo;
    
    try {
        // Get all houses
        $sql = "SELECT house_id, address, street_name, house_number, 
                       center_lat, center_lng
                FROM house_polygons
                WHERE center_lat IS NOT NULL AND center_lng IS NOT NULL";
        $stmt = $pdo->query($sql);
        $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Initialize rule counters
        $rules = [
            'FLOOD_HIGH_RISK' => [
                'name' => 'High Flood Risk Zone',
                'description' => 'Houses located in high flood risk areas requiring immediate mitigation',
                'severity' => 'CRITICAL',
                'count' => 0,
                'category' => 'Flood Hazard'
            ],
            'FLOOD_MEDIUM_RISK' => [
                'name' => 'Medium Flood Risk Zone',
                'description' => 'Houses in moderate flood zones requiring preparedness measures',
                'severity' => 'HIGH',
                'count' => 0,
                'category' => 'Flood Hazard'
            ],
            'FLOOD_LOW_RISK' => [
                'name' => 'Low Flood Risk Zone',
                'description' => 'Houses in low flood risk areas with standard precautions',
                'severity' => 'MEDIUM',
                'count' => 0,
                'category' => 'Flood Hazard'
            ],
            'FAULT_CRITICAL' => [
                'name' => 'Fault Line Critical Zone (<50m)',
                'description' => 'Houses within 50m of fault line - enhanced seismic standards mandatory',
                'severity' => 'CRITICAL',
                'count' => 0,
                'category' => 'Seismic Hazard'
            ],
            'FAULT_HIGH_RISK' => [
                'name' => 'Fault Line High Risk (50-100m)',
                'description' => 'Houses requiring seismic design standards and structural certification',
                'severity' => 'HIGH',
                'count' => 0,
                'category' => 'Seismic Hazard'
            ],
            'FAULT_MEDIUM_RISK' => [
                'name' => 'Fault Line Medium Risk (100-200m)',
                'description' => 'Houses requiring enhanced foundation and earthquake preparedness',
                'severity' => 'MEDIUM',
                'count' => 0,
                'category' => 'Seismic Hazard'
            ]
        ];
        
        // Count houses for each rule
        foreach ($houses as $house) {
            $lat = $house['center_lat'];
            $lng = $house['center_lng'];
            
            // Check flood zones
            $floodRisk = checkPointInFloodZone($lat, $lng);
            if ($floodRisk) {
                $riskLevel = strtoupper($floodRisk['risk_level']);
                $ruleKey = "FLOOD_{$riskLevel}_RISK";
                if (isset($rules[$ruleKey])) {
                    $rules[$ruleKey]['count']++;
                }
            }
            
            // Check fault line proximity
            $faultDistance = getDistanceToFaultLine($lat, $lng);
            if ($faultDistance < 50) {
                $rules['FAULT_CRITICAL']['count']++;
            } elseif ($faultDistance < 100) {
                $rules['FAULT_HIGH_RISK']['count']++;
            } elseif ($faultDistance < 200) {
                $rules['FAULT_MEDIUM_RISK']['count']++;
            }
        }
        
        // Calculate totals
        $totalHouses = count($houses);
        $totalAffected = 0;
        foreach ($rules as $rule) {
            $totalAffected += $rule['count'];
        }
        
        // Note: A house can be affected by multiple rules (e.g., both flood and fault line)
        // So totalAffected can be > totalHouses
        
        return [
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total_houses' => $totalHouses,
                    'total_rule_violations' => $totalAffected,
                    'rules_evaluated' => count($rules)
                ],
                'rules' => $rules
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Error in getSDSSRulesSummary: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to generate SDSS rules summary: ' . $e->getMessage()
        ];
    }
}

// ==================== POST REQUEST HANDLER ====================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');

    // ==================== MARKER FUNCTIONS ====================
    
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

    // ==================== DETAIL FUNCTIONS ====================
    
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

    // ==================== FLOOD HAZARD FUNCTIONS ====================
    
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

    // NEW: Flood summary for the fixed assessment
    if ($_POST['action'] === 'get_flood_summary') {
        $summary = getFloodAffectedHousesSummary();
        $houses = getHousesInFloodAreas();
        
        echo json_encode([
            'status' => 'success',
            'data' => [
                'summary' => $summary,
                'houses' => $houses
            ]
        ]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_warning') {
        echo json_encode(['success' => true, 'warning' => getFloodWarning($_POST['risk_level'] ?? 'low', $_POST['impact_level'] ?? 'Fully Affected')]);
        exit;
    }

    // ==================== HOUSE POLYGON FUNCTIONS ====================
    
    if ($_POST['action'] === 'get_houses') {
        echo json_encode(['success' => true, 'houses' => getHousePolygons()]);
        exit;
    }

    if ($_POST['action'] === 'get_house_details') {
        $data = getHouseById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

    if ($_POST['action'] === 'get_house_polygons') {
        $houses = getHousePolygons();
        echo json_encode(['success' => true, 'houses' => $houses]);
        exit;
    }

    // ==================== SDSS FUNCTIONS ====================
    
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

    if ($_POST['action'] === 'sdss_get_all_businesses_report' || $_POST['action'] === 'sdss_evaluate_all_businesses') {
        $report = sdss_evaluateAllBusinesses();
        echo json_encode(['success' => true, 'report' => $report, 'results' => $report['affected'] ?? []]);
        exit;
    }

    if ($_POST['action'] === 'sdss_get_all_construction_report' || $_POST['action'] === 'sdss_evaluate_all_construction') {
        $report = sdss_evaluateAllConstruction();
        echo json_encode(['success' => true, 'report' => $report, 'results' => $report['affected'] ?? []]);
        exit;
    }

    // ==================== NEW FAULT LINE FUNCTIONS ====================
    
    // Fault line assessment
    if ($_POST['action'] === 'get_fault_line_assessment') {
        $result = getFaultLineAssessment();
        echo json_encode($result);
        exit;
    }
    
    // Get fault line (if you have this data)
    if ($_POST['action'] === 'get_fault_line') {
        // Example fault line coordinates - replace with actual data from database
        $faultLine = [
            'coordinates' => [
                [14.6175408, 121.0765329],
                [14.6177993, 121.0765362],
                [14.6180432, 121.0765517],
                [14.6182482, 121.0765671],
                [14.6185088, 121.0765914],
                [14.6188121, 121.0766554],
                [14.6190770, 121.0767448]
            ]
        ];
        echo json_encode(['success' => true, 'fault_line' => $faultLine]);
        exit;
    }

    // ==================== NEW BUSINESS SDSS REPORT FUNCTIONS ====================
    
    // Business SDSS report
    if ($_POST['action'] === 'get_business_sdss_report') {
        $result = getBusinessSDSSReport();
        echo json_encode($result);
        exit;
    }

    // ==================== NEW CONSTRUCTION SDSS REPORT FUNCTIONS ====================
    
    // Construction SDSS report
    if ($_POST['action'] === 'get_construction_sdss_report') {
        $result = getConstructionSDSSReport();
        echo json_encode($result);
        exit;
    }

    // ==================== SDSS RULES SUMMARY ====================
    
    // SDSS Rules Summary
    if ($_POST['action'] === 'get_sdss_rules_summary') {
        $result = getSDSSRulesSummary();
        echo json_encode($result);
        exit;
    }

    // ==================== COMBINED FUNCTIONS ====================
    
    
    // Get all markers (combined) - FIXED TO RETURN COMPLETE DATA
    if ($_POST['action'] === 'get_all_markers') {
        $allMarkers = [];
        
        // Get households (house polygons as markers)
        $houses = getHousePolygons();
        foreach ($houses as $house) {
            if ($house['center_lat'] && $house['center_lng']) {
                $house['type'] = 'household';
                $house['name'] = $house['address'] ?: "House #{$house['house_id']}";
                $house['latitude'] = $house['center_lat'];
                $house['longitude'] = $house['center_lng'];
                $allMarkers[] = $house;
            }
        }
        
        // Get businesses - RETURN ALL FIELDS
        $businesses = getBusinessMarkers();
        foreach ($businesses as $business) {
            $business['type'] = 'business';
            $business['name'] = $business['business_name'];
            $business['address'] = $business['address_of_business'];
            $allMarkers[] = $business;
        }
        
        // Get construction - RETURN ALL FIELDS
        $constructions = getConstructionMarkers();
        foreach ($constructions as $construction) {
            $construction['type'] = 'construction';
            $construction['name'] = $construction['nature_of_work'] ?? 'Construction Project';
            $construction['address'] = $construction['construction_address'];
            $allMarkers[] = $construction;
        }
        
        // Get utilities - RETURN ALL FIELDS
        $utilities = getUtilitiesMarkers();
        foreach ($utilities as $utility) {
            $utility['type'] = 'utility';
            $utility['name'] = $utility['nature_of_work'] ?? 'Utility Work';
            $utility['address'] = $utility['address_of_utility'];
            $allMarkers[] = $utility;
        }
        
        echo json_encode(['success' => true, 'markers' => $allMarkers]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>