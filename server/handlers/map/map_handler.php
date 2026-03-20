<?php
// Silence HTML error output immediately
// Errors/warnings must NEVER be printed as HTML into the response body because
// that corrupts JSON.parse() on the client.  We log them instead.
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Buffer ALL output from the very first byte.  Even if something slips past
// the ini_set above (e.g. a notice from an included file), ob_clean() below
// will discard it before we echo JSON.
ob_start();

// Every response from this file is JSON.
header('Content-Type: application/json; charset=utf-8');

// Global safety net
// If an uncaught exception or fatal error escapes all try/catch blocks, this
// handler discards any partial HTML output and returns a clean JSON error so
// the client always gets parseable JSON — never a PHP crash page.
set_exception_handler(function (Throwable $e) {
    ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    error_log('map_handler uncaught exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    echo json_encode(['status' => 'error', 'message' => 'Unexpected server error. Check server logs.']);
    exit;
});

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        header('Content-Type: application/json; charset=utf-8');
        error_log('map_handler fatal: ' . $err['message'] . ' in ' . $err['file'] . ':' . $err['line']);
        echo json_encode(['status' => 'error', 'message' => 'Fatal server error. Check server logs.']);
        exit;
    }
});

// Geometry helper
// Builds the best available PostGIS geometry for a house_polygons row.
// Priority:
//   1. Dedicated `geom` column (geometry(Polygon,4326)) — fastest, uses spatial index
//   2. jsonb `coordinates` column — converted on the fly (slower, no index)
//   3. center_lat / center_lng point — least accurate, always available
//
// Use HOUSE_GEOM_SQL as the geometry expression inside any SQL query that
// reads from house_polygons (aliased as any table alias you choose).
// Replace the placeholder {alias} with the actual table alias used in the query.
//
// Run migration/add_geom_column.sql once to add the geom column and index.
define('HOUSE_GEOM_EXPR',
    "CASE
        WHEN {alias}.geom IS NOT NULL
             AND ST_IsValid({alias}.geom)
             AND ST_NPoints({alias}.geom) >= 3
            THEN {alias}.geom
        WHEN {alias}.coordinates IS NOT NULL
            THEN ST_Force2D(ST_SetSRID(
                     ST_GeomFromGeoJSON(
                         json_build_object(
                             'type', 'Polygon',
                             'coordinates',
                             CASE
                                 WHEN jsonb_typeof({alias}.coordinates->0->0) = 'array'
                                     THEN {alias}.coordinates
                                 ELSE json_build_array({alias}.coordinates)::jsonb
                             END
                         )::text
                     ), 4326))
        ELSE
            ST_SetSRID(ST_MakePoint({alias}.center_lng::float, {alias}.center_lat::float), 4326)
    END"
);

/**
 * Returns the geometry expression for a house_polygons alias.
 * e.g. house_geom_expr('hp') → the CASE expression with 'hp.' prefix
 */
function house_geom_expr(string $alias): string {
    return str_replace('{alias}', $alias, HOUSE_GEOM_EXPR);
}

/**
 * Returns the "has polygon" condition — true when the house has a real polygon
 * (either a stored geom column or jsonb coordinates), not just a centre point.
 */
function house_has_polygon(string $alias): string {
    return "({$alias}.geom IS NOT NULL OR {$alias}.coordinates IS NOT NULL)";
}

// Fault line WKT — single source of truth, used by all fault distance queries
define('FAULT_LINE_WKT',
    'LINESTRING(121.0765329 14.6175408,121.0765362 14.6177993,' .
    '121.0765517 14.6180432,121.0765671 14.6182482,' .
    '121.0765914 14.6185088,121.0766554 14.6188121,121.0767448 14.6190770)'
);

/**
 * Returns the PostGIS geography expression for the fault line.
 * Use inside SQL queries: fault_geog_expr()
 */
function fault_geog_expr(): string {
    return "ST_GeomFromText('" . FAULT_LINE_WKT . "', 4326)::geography";
}

// DB connection — provides the global $pdo variable used by all functions below
require_once __DIR__ . '/../../configs/database.php';

// See /docs/db-indexes.sql for recommended indexes

// UTILITY FUNCTIONS

// Fetches all utility applications that have coordinates (for map markers)
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

// Fetches all construction applications that have coordinates
function getConstructionMarkers(){
    global $pdo;
    try {
        $sql = "SELECT id, first_name, middle_name, last_name, suffix, contact_no_owner,
                       construction_address, latitude, longitude, nature_of_work, type_of_work,
                       nature_of_activity, details_of_work, start_date, end_date,
                       number_of_working_days, number_of_workers, contractor_name,
                       contractor_contact_number, application_method, requirement_upload,
                       agreed, status, updated_at
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

// Fetches all business applications that have coordinates
function getBusinessMarkers(){
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

// Fetches all incident reports that have coordinates (for map markers)
function getIncidentMarkers(){
    global $pdo;
    try {
        $sql = "SELECT id, rp_full_name, rp_address, rp_contact, rp_relationship,
                       vic_full_name, vic_address, vic_contact, vic_gender, vic_occupation, vic_citizenship, vic_dob,
                       sus_full_name, sus_address, sus_contact, sus_gender, sus_description,
                       incident_type, incident_timestamp, date_reported, description,
                       status, dss_status, approval_comments, disapproval_comments,
                       update_comments, resolution_details,
                       latitude, longitude
                FROM incident_reports
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY incident_timestamp DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getIncidentMarkers: " . $e->getMessage());
        return [];
    }
}

// Fetches ALL incident reports (including non-geotagged) for the summary report
function getAllIncidents(){
    global $pdo;
    try {
        $sql = "SELECT id, rp_full_name, rp_address, rp_contact, rp_relationship,
                       vic_full_name, vic_address, vic_contact, vic_gender,
                       sus_full_name,
                       incident_type, incident_timestamp, date_reported, description,
                       status, dss_status, latitude, longitude
                FROM incident_reports
                ORDER BY incident_timestamp DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error in getAllIncidents: " . $e->getMessage());
        return [];
    }
}

// Returns distinct incident types for dynamic sub-filter buttons
function getIncidentTypes(){
    global $pdo;
    try {
        $sql = "SELECT DISTINCT incident_type FROM incident_reports
                WHERE incident_type IS NOT NULL AND incident_type <> ''
                ORDER BY incident_type";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'incident_type');
    } catch (PDOException $e) {
        error_log("Database error in getIncidentTypes: " . $e->getMessage());
        return [];
    }
}

// Fetches a single incident report by ID for the detail modal
function getIncidentById($id){
    global $pdo;
    try {
        $sql = "SELECT * FROM incident_reports WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return null;
    }
}

// Fetches generic custom markers from the marker table
function getGenericMarkers(){
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

// Fetches a single utility application by ID for the detail modal
function getUtilitiesById($id){
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

// Fetches a single construction application by ID
function getConstructionById($id){
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

// Fetches a single business application by ID
function getBusinessById($id){
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

// Fetches a single generic marker by marker_id
function getGenericById($id){
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

// FLOOD HAZARD FUNCTIONS

// Returns all flood hazard polygons ordered by risk level (high → low).
// Converts PostGIS GeoJSON geometry to Leaflet-friendly [lat, lng] arrays.
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

// Fetches a single flood hazard by ID for the detail modal
function getFloodDetails($id){
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

// Uses PostGIS ST_Intersects to find houses overlapping flood zones.
// Calculates coverage percentage and impact level per house.
function getHousesInFloodAreas($riskLevel = null){
    global $pdo;
    try {
        // One row per house — worst impact/highest risk wins when a house overlaps multiple zones
        $sql = "WITH house_geoms AS (
                    SELECT 
                        house_id, address, street_name, house_number,
                        center_lat, center_lng, area_sqm, coordinates,
                        CASE
                            WHEN geom IS NOT NULL
                                THEN geom
                            WHEN coordinates IS NOT NULL
                                THEN ST_Force2D(ST_SetSRID(
                                         ST_GeomFromGeoJSON(
                                             json_build_object(
                                                 'type', 'Polygon',
                                                 'coordinates', json_build_array(coordinates)
                                             )::text
                                         ), 4326))
                            ELSE
                                ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
                        END as geom
                    FROM house_polygons
                    WHERE (geom IS NOT NULL OR coordinates IS NOT NULL OR (center_lat IS NOT NULL AND center_lng IS NOT NULL))
                ),
                raw_impacts AS (
                    SELECT 
                        hg.house_id, hg.address, hg.street_name, hg.house_number,
                        hg.center_lat, hg.center_lng, hg.area_sqm, hg.coordinates,
                        bh.hazard_id, bh.hazard_name, bh.risk_level,
                        bh.description as hazard_description, bh.properties,
                        CASE 
                            WHEN (hg.geom IS NOT NULL OR hg.coordinates IS NOT NULL) THEN
                                LEAST(
                                    ROUND(
                                        (ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                         NULLIF(ST_Area(hg.geom::geography), 0) * 100)::numeric,
                                        1
                                    ),
                                    100.0
                                )
                            ELSE 100
                        END as flood_coverage_percent,
                        CASE 
                            WHEN (hg.geom IS NULL AND hg.coordinates IS NULL) THEN 'Affected'
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.75 THEN 'Fully Affected'
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.25 THEN 'Partially Affected'
                            ELSE 'Minimally Affected'
                        END as impact_level,
                        CASE LOWER(bh.risk_level) WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END as risk_rank,
                        CASE 
                            WHEN (hg.geom IS NULL AND hg.coordinates IS NULL) THEN 4
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.75 THEN 3
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.25 THEN 2
                            ELSE 1
                        END as impact_rank
                    FROM house_geoms hg
                    JOIN barangay_hazards bh ON ST_Intersects(hg.geom::geography, bh.geom::geography)
                    WHERE bh.hazard_type = 'flood'
                ),
                -- Keep only the worst row per house (highest risk then highest impact)
                ranked AS (
                    SELECT *, ROW_NUMBER() OVER (
                        PARTITION BY house_id
                        ORDER BY risk_rank DESC, impact_rank DESC, flood_coverage_percent DESC
                    ) as rn
                    FROM raw_impacts
                )
                SELECT 
                    house_id, address, street_name, house_number,
                    center_lat, center_lng, area_sqm, coordinates,
                    hazard_id, hazard_name, risk_level,
                    hazard_description, properties,
                    flood_coverage_percent, impact_level
                FROM ranked
                WHERE rn = 1
                " . ($riskLevel ? "AND LOWER(risk_level) = LOWER(:risk_level)" : "") . "
                ORDER BY risk_rank ASC, impact_rank ASC, address";
        
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

// Aggregates flood impact stats — one row per house (worst impact wins)
function getFloodAffectedHousesSummary(){
    global $pdo;
    try {
        $sql = "WITH house_geoms AS (
                    SELECT 
                        house_id, address, coordinates, center_lat, center_lng,
                        CASE
                            WHEN geom IS NOT NULL
                                THEN geom
                            WHEN coordinates IS NOT NULL
                                THEN ST_Force2D(ST_SetSRID(
                                         ST_GeomFromGeoJSON(
                                             json_build_object(
                                                 'type', 'Polygon',
                                                 'coordinates', json_build_array(coordinates)
                                             )::text
                                         ), 4326))
                            ELSE
                                ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
                        END as geom
                    FROM house_polygons
                    WHERE (geom IS NOT NULL OR coordinates IS NOT NULL OR (center_lat IS NOT NULL AND center_lng IS NOT NULL))
                ),
                raw_impacts AS (
                    SELECT 
                        hg.house_id,
                        bh.risk_level,
                        CASE 
                            WHEN (hg.geom IS NULL AND hg.coordinates IS NULL) THEN 'Affected'
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.75 THEN 'Fully Affected'
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.25 THEN 'Partially Affected'
                            ELSE 'Minimally Affected'
                        END as impact_level,
                        CASE LOWER(bh.risk_level) WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END as risk_rank,
                        CASE 
                            WHEN (hg.geom IS NULL AND hg.coordinates IS NULL) THEN 4
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.75 THEN 3
                            WHEN ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) / 
                                 NULLIF(ST_Area(hg.geom::geography), 0) >= 0.25 THEN 2
                            ELSE 1
                        END as impact_rank
                    FROM house_geoms hg
                    JOIN barangay_hazards bh ON ST_Intersects(hg.geom::geography, bh.geom::geography)
                    WHERE bh.hazard_type = 'flood'
                ),
                -- One row per house: keep the worst risk + worst impact
                deduped AS (
                    SELECT DISTINCT ON (house_id)
                        house_id, risk_level, impact_level
                    FROM raw_impacts
                    ORDER BY house_id, risk_rank DESC, impact_rank DESC
                )
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN impact_level = 'Fully Affected'    THEN 1 END) as fully_affected,
                    COUNT(CASE WHEN impact_level = 'Partially Affected' THEN 1 END) as partially_affected,
                    COUNT(CASE WHEN impact_level = 'Minimally Affected' THEN 1 END) as minimally_affected,
                    COUNT(CASE WHEN impact_level = 'Affected'           THEN 1 END) as affected_no_polygon,
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'risk_level', risk_level,
                            'count', (SELECT COUNT(*) FROM deduped d2 WHERE d2.risk_level = deduped.risk_level)
                        )
                    ) as by_risk_level
                FROM deduped";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'total'             => (int)($result['total'] ?? 0),
            'fully_affected'    => (int)($result['fully_affected'] ?? 0),
            'partially_affected'=> (int)($result['partially_affected'] ?? 0),
            'minimally_affected'=> (int)($result['minimally_affected'] ?? 0),
            'affected_no_polygon'=> (int)($result['affected_no_polygon'] ?? 0),
            'by_risk_level'     => json_decode($result['by_risk_level'] ?? '[]', true)
        ];
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return [
            'total' => 0, 'fully_affected' => 0,
            'partially_affected' => 0, 'minimally_affected' => 0,
            'affected_no_polygon' => 0, 'by_risk_level' => []
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
// Checks if a business is in a flood zone and returns approve/deny/conditions status
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
// Same logic as business evaluation but for construction applications
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

// Runs sdss_evaluateBusiness() for every business and compiles an aggregate report
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

// Runs sdss_evaluateConstruction() for every construction site and compiles a report
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

// HOUSE POLYGON FUNCTIONS

// Fetches all house polygons with their vertex coordinates and metadata
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

// Fetches a single house polygon by house_id for the detail modal

// Returns all applications linked to a house by address prefix match
function getHouseApplications($houseId) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("SELECT address, street_name, house_number FROM house_polygons WHERE house_id = :id");
        $stmt->execute([':id' => $houseId]);
        $house = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$house) return ['businesses' => [], 'constructions' => [], 'utilities' => [], 'incidents' => []];

        $fullAddress = trim($house['address'] ?? '');
        $street      = trim($house['street_name'] ?? '');

        if (strlen($fullAddress) < 3 && strlen($street) < 4) {
            return ['businesses' => [], 'constructions' => [], 'utilities' => [], 'incidents' => []];
        }

        // Prefix match so "3 Milkyway Dr%" won't match "19 Milkyway Dr"
        $useExact = strlen($fullAddress) >= 3;
        $pattern  = $useExact ? ($fullAddress . '%') : ('%' . $street . '%');

        $buildWhere = function(array $columns) use ($pattern, &$params) {
            $clauses = [];
            foreach ($columns as $col) {
                $key = ':p_' . preg_replace('/[^a-z_]/i', '_', $col);
                $params[$key] = $pattern;
                $clauses[] = "$col LIKE $key";
            }
            return '(' . implode(' OR ', $clauses) . ')';
        };

        $params = [];
        $where = $buildWhere(['address_of_business']);
        $stmt = $pdo->prepare("SELECT id, business_name, type_of_business, status, address_of_business
                               FROM business_applications WHERE $where ORDER BY business_name");
        $stmt->execute($params);
        $businesses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $params = [];
        $where = $buildWhere(['construction_address']);
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, type_of_work, nature_of_work, agreed, construction_address
                               FROM construction_applications WHERE $where ORDER BY id DESC");
        $stmt->execute($params);
        $constructions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $params = [];
        $where = $buildWhere(['address_of_utility']);
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, nature_of_work, provider, agreed, address_of_utility
                               FROM utility_applications WHERE $where ORDER BY id DESC");
        $stmt->execute($params);
        $utilities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $params = [];
        $where = $buildWhere(['vic_address', 'rp_address']);
        $stmt = $pdo->prepare("SELECT id, incident_type, vic_full_name, vic_address, status, incident_timestamp
                               FROM incident_reports WHERE $where ORDER BY incident_timestamp DESC");
        $stmt->execute($params);
        $incidents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'businesses'    => $businesses,
            'constructions' => $constructions,
            'utilities'     => $utilities,
            'incidents'     => $incidents
        ];
    } catch (PDOException $e) {
        error_log("getHouseApplications error: " . $e->getMessage());
        return ['businesses' => [], 'constructions' => [], 'utilities' => [], 'incidents' => []];
    }
}

function getHouseById($houseId){
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

// NEW FAULT LINE ASSESSMENT FUNCTIONS

/**
 * Calculates distance from every house to the fault line and categorises risk:
 * critical (<50m), high (50–100m), medium (100–200m), low (200–500m)
 */
function getFaultLineAssessment() {
    global $pdo;
    set_time_limit(60);
    try {
        $faultGeog = fault_geog_expr();

        // Returns all houses — no distance cap so nothing is excluded
        $houseGeom = house_geom_expr('hp');
        $rows = $pdo->query("
            SELECT hp.house_id, hp.address, hp.street_name, hp.house_number,
                   hp.center_lat, hp.center_lng,
                   ROUND(ST_Distance(
                       ({$houseGeom})::geography,
                       {$faultGeog}
                   ))::int AS dist_m
            FROM   house_polygons hp
            WHERE  (hp.center_lat IS NOT NULL AND hp.center_lng IS NOT NULL)
               OR  hp.geom IS NOT NULL
               OR  hp.coordinates IS NOT NULL
            ORDER  BY dist_m ASC
        ")->fetchAll(PDO::FETCH_ASSOC);

        $structures_at_risk = [];
        $critical_count = $high_risk_count = $medium_risk_count = $low_risk_count = 0;

        foreach ($rows as $row) {
            $d = (int)$row['dist_m'];
            if ($d < 50) {
                $risk = 'critical'; $critical_count++;
                $req  = [
                    'CRITICAL ZONE: Construction allowed with enhanced seismic standards',
                    'Mandatory structural engineer certification required',
                    'Special seismic design and geological survey mandatory',
                    'Reinforced foundation with deep pile requirements',
                    'Use earthquake-resistant materials and construction methods',
                    'Building insurance and regular structural inspections required'
                ];
            } elseif ($d < 100) {
                $risk = 'high'; $high_risk_count++;
                $req  = [
                    'Seismic design standards mandatory',
                    'Structural engineer certification required',
                    'Regular safety inspections needed',
                    'Enhanced foundation required'
                ];
            } elseif ($d < 200) {
                $risk = 'medium'; $medium_risk_count++;
                $req  = [
                    'Enhanced foundation design recommended',
                    'Earthquake preparedness plan required',
                    'Standard building codes with seismic provisions'
                ];
            } else {
                $risk = 'low'; $low_risk_count++;
                $req  = [
                    'Follow standard building codes',
                    'Basic earthquake preparedness awareness recommended',
                    'Maintain emergency contacts and evacuation plan'
                ];
            }
            $structures_at_risk[] = [
                'house_id'        => $row['house_id'],
                'address'         => $row['address'],
                'street_name'     => $row['street_name'],
                'house_number'    => $row['house_number'],
                'latitude'        => $row['center_lat'],
                'longitude'       => $row['center_lng'],
                'distance_meters' => $d,
                'risk_level'      => $risk,
                'requirements'    => $req,
            ];
        }

        // Sort: critical → high → medium → low, then by distance
        usort($structures_at_risk, function($a, $b) {
            $ord = ['critical'=>0,'high'=>1,'medium'=>2,'low'=>3];
            $ao  = $ord[$a['risk_level']] ?? 9;
            $bo  = $ord[$b['risk_level']] ?? 9;
            return $ao !== $bo ? $ao - $bo : $a['distance_meters'] - $b['distance_meters'];
        });

        return ['status'=>'success','data'=>[
            'summary'    => ['total_at_risk'=>count($structures_at_risk),'critical'=>$critical_count,'high_risk'=>$high_risk_count,'medium_risk'=>$medium_risk_count,'low_risk'=>$low_risk_count],
            'structures' => $structures_at_risk
        ]];
    } catch (Exception $e) {
        error_log("Error in getFaultLineAssessment: " . $e->getMessage());
        return ['status'=>'error','message'=>'Failed to assess fault line risk: '.$e->getMessage()];
    }
}
/**
 * Returns the shortest distance (metres) from a point to a line segment
 * using cross-track/along-track geometry.
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
 * Returns the initial bearing (degrees) from point 1 to point 2
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
 * Returns the great-circle distance (metres) between two lat/lng points using the Haversine formula
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

// NEW BUSINESS SDSS REPORT FUNCTIONS

/**
 * Evaluates all businesses with coordinates against SDSS rules and returns a full report
 */
function getBusinessSDSSReport() {
    global $pdo;
    set_time_limit(60);
    try {
        $faultGeog = fault_geog_expr();

        // Batch query 1: businesses + their worst flood zone in one JOIN
        $floodRows = $pdo->query("
            SELECT ba.id,
                   LOWER(bh.risk_level) AS risk_level
            FROM   business_applications ba
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(ba.longitude::float, ba.latitude::float), 4326),
                       bh.geom
                   )
            WHERE  ba.latitude IS NOT NULL AND ba.longitude IS NOT NULL
            ORDER  BY ba.id,
                      CASE LOWER(bh.risk_level) WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
        ")->fetchAll(PDO::FETCH_ASSOC);

        // Keep only worst (first due to ORDER BY) flood result per business id
        $floodMap = [];
        foreach ($floodRows as $r) {
            if (!isset($floodMap[$r['id']])) $floodMap[$r['id']] = $r['risk_level'];
        }

        // Batch query 2: fault distance for every business in one PostGIS call
        $faultRows = $pdo->query("
            SELECT id,
                   ROUND(ST_Distance(
                       ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography,
                       {$faultGeog}
                   ))::int AS dist_m
            FROM   business_applications
            WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
        ")->fetchAll(PDO::FETCH_ASSOC);
        $faultMap = array_column($faultRows, 'dist_m', 'id');

        // Fetch all businesses
        $businesses = $pdo->query("
            SELECT id, business_name, type_of_business, nature_of_business,
                   address_of_business, no_of_employees, latitude, longitude,
                   first_name, middle_name, last_name
            FROM   business_applications
            WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
        ")->fetchAll(PDO::FETCH_ASSOC);

        $warnings = [];
        foreach ($businesses as $biz) {
            $id          = $biz['id'];
            $floodLevel  = $floodMap[$id]  ?? null;
            $faultDist   = $faultMap[$id]  ?? PHP_INT_MAX;
            $result      = applyBusinessSDSSRules($biz, $floodLevel, (int)$faultDist);
            if ($result) $warnings[] = $result;
        }

        return ['status'=>'success','data'=>[
            'summary' => ['total'=>count($businesses),'with_warnings'=>count($warnings),'compliant'=>count($businesses)-count($warnings)],
            'warnings'=> $warnings
        ]];
    } catch (Exception $e) {
        error_log("Error in getBusinessSDSSReport: " . $e->getMessage());
        return ['status'=>'error','message'=>'Failed to generate business SDSS report: '.$e->getMessage()];
    }
}

/**
 * Apply business SDSS rules using pre-fetched flood level and fault distance.
 * No DB calls — all hazard data is passed in, pre-loaded in batch.
 */
function applyBusinessSDSSRules($business, $floodLevel, $faultDist) {
    $businessData = ['business' => $business, 'warnings' => []];
    $maxSeverity  = null;

    // Rule 1: Flood zone
    if ($floodLevel === 'high') {
        $businessData['warnings'][] = ['type'=>'Flood Hazard Violation','description'=>'Business located in HIGH flood risk zone','severity'=>'CRITICAL','actions'=>['Install flood barriers and elevation systems immediately','Develop and implement emergency evacuation plan','Store inventory and equipment above flood level','Obtain flood insurance coverage','Install early warning systems']];
        $maxSeverity = 'CRITICAL';
    } elseif ($floodLevel === 'medium') {
        $businessData['warnings'][] = ['type'=>'Flood Risk Warning','description'=>'Business located in MEDIUM flood risk zone','severity'=>'HIGH','actions'=>['Prepare flood mitigation measures','Monitor weather alerts during rainy season','Prepare sandbags and drainage systems','Keep emergency supplies ready']];
        $maxSeverity = $maxSeverity ?? 'HIGH';
    }

    // Rule 2: Fault line proximity
    if ($faultDist < 50) {
        $businessData['warnings'][] = ['type'=>'Fault Line Critical Zone Warning','description'=>"Business within {$faultDist}m of fault line (CRITICAL ZONE - Special Requirements)",'severity'=>'CRITICAL','actions'=>['CRITICAL ZONE: Business operations allowed ONLY with enhanced safety measures','Mandatory structural assessment and seismic compliance certification','Seismic retrofitting of building required','Emergency evacuation plan and earthquake drills mandatory','Special permits and engineering certification needed','Building insurance covering earthquake damage required','Regular safety inspections and structural monitoring']];
        $maxSeverity = 'CRITICAL';
    } elseif ($faultDist < 100) {
        $businessData['warnings'][] = ['type'=>'Fault Line High Risk','description'=>"Business within {$faultDist}m of fault line",'severity'=>'HIGH','actions'=>['Seismic design standards mandatory','Structural engineer certification required','Regular safety inspections needed','Enhanced foundation requirements']];
        $maxSeverity = $maxSeverity ?? 'HIGH';
    }

    // Rule 3: High occupancy
    $employees = intval($business['no_of_employees'] ?? 0);
    if ($employees > 50) {
        $businessData['warnings'][] = ['type'=>'High Occupancy Warning','description'=>"High employee count ({$employees} employees)",'severity'=>'MEDIUM','actions'=>['Ensure adequate space per employee','Verify fire safety equipment capacity','Conduct regular safety drills','Ensure proper ventilation and emergency exits']];
        $maxSeverity = $maxSeverity ?? 'MEDIUM';
    }

    if (empty($businessData['warnings'])) return null;
    $businessData['severity'] = $maxSeverity;
    return $businessData;
}


// NEW CONSTRUCTION SDSS REPORT FUNCTIONS

/**
 * Get SDSS report for all construction sites
 */
function getConstructionSDSSReport() {
    global $pdo;
    set_time_limit(60);
    try {
        $faultGeog = fault_geog_expr();

        // Batch query 1: worst flood zone per construction site
        $floodRows = $pdo->query("
            SELECT ca.id, LOWER(bh.risk_level) AS risk_level
            FROM   construction_applications ca
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(ca.longitude::float, ca.latitude::float), 4326),
                       bh.geom
                   )
            WHERE  ca.latitude IS NOT NULL AND ca.longitude IS NOT NULL
            ORDER  BY ca.id,
                      CASE LOWER(bh.risk_level) WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
        ")->fetchAll(PDO::FETCH_ASSOC);
        $floodMap = [];
        foreach ($floodRows as $r) {
            if (!isset($floodMap[$r['id']])) $floodMap[$r['id']] = $r['risk_level'];
        }

        // Batch query 2: fault distance for every construction site
        $faultRows = $pdo->query("
            SELECT id,
                   ROUND(ST_Distance(
                       ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography,
                       {$faultGeog}
                   ))::int AS dist_m
            FROM   construction_applications
            WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
        ")->fetchAll(PDO::FETCH_ASSOC);
        $faultMap = array_column($faultRows, 'dist_m', 'id');

        // Fetch all construction applications
        $constructions = $pdo->query("
            SELECT id, first_name, middle_name, last_name, construction_address,
                   type_of_work, nature_of_work, nature_of_activity,
                   number_of_workers, number_of_working_days, latitude, longitude
            FROM   construction_applications
            WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
        ")->fetchAll(PDO::FETCH_ASSOC);

        $warnings = [];
        foreach ($constructions as $con) {
            $id        = $con['id'];
            $floodLvl  = $floodMap[$id] ?? null;
            $faultDist = $faultMap[$id] ?? PHP_INT_MAX;
            $result    = applyConstructionSDSSRules($con, $floodLvl, (int)$faultDist);
            if ($result) $warnings[] = $result;
        }

        return ['status'=>'success','data'=>[
            'summary' => ['total'=>count($constructions),'with_warnings'=>count($warnings),'compliant'=>count($constructions)-count($warnings)],
            'warnings'=> $warnings
        ]];
    } catch (Exception $e) {
        error_log("Error in getConstructionSDSSReport: " . $e->getMessage());
        return ['status'=>'error','message'=>'Failed to generate construction SDSS report: '.$e->getMessage()];
    }
}

/**
 * Apply construction SDSS rules using pre-fetched flood level and fault distance.
 * No DB calls — all hazard data is passed in, pre-loaded in batch.
 */
function applyConstructionSDSSRules($construction, $floodLevel, $faultDist) {
    $typeOfWork  = strtolower($construction['type_of_work'] ?? '');
    $projectType = 'minor';
    if (strpos($typeOfWork, 'major')      !== false) $projectType = 'major';
    elseif (strpos($typeOfWork, 'repair') !== false) $projectType = 'repair';
    elseif (strpos($typeOfWork, 'demolition') !== false) $projectType = 'demolition';

    $natureOfActivity   = strtolower($construction['nature_of_activity'] ?? '');
    $minWorkersRequired = getMinimumWorkersForConstruction($projectType, $natureOfActivity);

    $constructionData = ['construction' => $construction, 'warnings' => []];
    $maxSeverity      = null;

    // Rule 1: Flood zone
    if ($floodLevel === 'high') {
        $constructionData['warnings'][] = ['type'=>'Flood Zone Construction Violation','description'=>'Construction in HIGH flood risk zone','severity'=>'CRITICAL','actions'=>['Flood-resistant construction methods MANDATORY','Elevated foundation required (minimum 1.5m above ground)','Waterproof materials required for basement/ground floor','Install flood barriers and drainage systems','Obtain special flood zone Construction Clearance']];
        $maxSeverity = 'CRITICAL';
    }

    // Rule 2: Fault line setback
    if ($faultDist < 50) {
        $constructionData['warnings'][] = ['type'=>'Fault Line Critical Zone Warning','description'=>"Construction within {$faultDist}m of fault line (CRITICAL ZONE - Special Requirements)",'severity'=>'CRITICAL','actions'=>['CRITICAL ZONE: Construction allowed ONLY with enhanced seismic standards','Mandatory structural engineer certification and seismic design approval','Reinforced foundation with deep pile requirements','Use of earthquake-resistant materials and construction methods','Building Insurance and geological survey required','Regular structural integrity inspections mandatory','Emergency preparedness and evacuation plan required']];
        $maxSeverity = 'CRITICAL';
    } elseif ($faultDist < 100) {
        $constructionData['warnings'][] = ['type'=>'Seismic Requirements','description'=>"Construction within {$faultDist}m of fault line",'severity'=>'HIGH','actions'=>['Seismic design standards MANDATORY','Structural engineer certification required','Enhanced foundation and reinforcement','Regular structural inspections during construction']];
        $maxSeverity = $maxSeverity ?? 'HIGH';
    }

    // Rule 3: Worker adequacy
    $workers = intval($construction['number_of_workers'] ?? 0);
    if ($workers < $minWorkersRequired['minimum']) {
        $activityLabel = $natureOfActivity ?: 'general';
        $constructionData['warnings'][] = ['type'=>'Inadequate Workforce','description'=>ucfirst($projectType)." construction with '".ucfirst($activityLabel)."' activity requires a minimum of {$minWorkersRequired['minimum']} workers (currently declared: {$workers}). Reason: {$minWorkersRequired['reason']}",'severity'=>$minWorkersRequired['severity'],'reason'=>$minWorkersRequired['reason'],'actions'=>["Increase workforce to minimum {$minWorkersRequired['minimum']} workers",'Ensure proper supervision and safety coverage','Verify all workers have safety training','Implement buddy system for safety',$minWorkersRequired['additional_requirement']]];
        $maxSeverity = $maxSeverity ?? $minWorkersRequired['severity'];
    }

    if (empty($constructionData['warnings'])) return null;
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

// SDSS RULES SUMMARY FUNCTION

/**
 * Get summary of all SDSS rules and count of houses affected by each rule
 */
function getSDSSRulesSummary() {
    global $pdo;

    // Give this heavy function enough time and memory to complete all batch queries.
    set_time_limit(120);
    ini_set('memory_limit', '256M');

    try {

        // Shared fault-line WKT (same coordinates as getDistanceToFaultLine)
        // Using PostGIS geography type so ST_Distance returns metres directly.
        $faultGeog = fault_geog_expr();

        // Helper: build a PostGIS geography point from two SQL column references.
        $pt = function(string $latCol, string $lngCol): string {
            return "ST_SetSRID(ST_MakePoint({$lngCol}::float, {$latCol}::float), 4326)::geography";
        };

        // Safe-query helper: returns fetchAll rows or [] on any DB error.
        // This prevents one failing table from killing the entire response.
        $q = function(string $sql, array $params = []) use ($pdo): array {
            try {
                $s = $pdo->prepare($sql);
                $s->execute($params);
                return $s->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                error_log('getSDSSRulesSummary query error: ' . $e->getMessage());
                return [];
            }
        };

        //  HOUSES — flood zone counts
        //  Single batch JOIN replaces the old loop that fired one query per house
        $houseFloodRows = $q("
            SELECT LOWER(bh.risk_level) AS risk_level,
                   COUNT(DISTINCT hp.house_id) AS cnt
            FROM   house_polygons hp
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(hp.center_lng::float, hp.center_lat::float), 4326),
                       bh.geom
                   )
            WHERE  hp.center_lat IS NOT NULL AND hp.center_lng IS NOT NULL
            GROUP  BY LOWER(bh.risk_level)
        ");
        $houseFloodCounts = ['high' => 0, 'medium' => 0, 'low' => 0];
        foreach ($houseFloodRows as $r) {
            $houseFloodCounts[$r['risk_level']] = (int)$r['cnt'];
        }

        // HOUSES — fault distance bands using polygon geometry where available
        $houseFaultRows = $q("
            SELECT
                SUM(CASE WHEN fd <=   5                   THEN 1 ELSE 0 END) AS le5,
                SUM(CASE WHEN fd >   5 AND fd <  50       THEN 1 ELSE 0 END) AS r5_50,
                SUM(CASE WHEN fd >=  50 AND fd < 100      THEN 1 ELSE 0 END) AS r50_100,
                SUM(CASE WHEN fd >= 100 AND fd < 200      THEN 1 ELSE 0 END) AS r100_200,
                SUM(CASE WHEN fd >= 200                   THEN 1 ELSE 0 END) AS r200_plus
            FROM (
                SELECT ST_Distance(
                    (CASE
                        WHEN geom IS NOT NULL AND ST_IsValid(geom) AND ST_NPoints(geom) >= 3
                            THEN geom
                        WHEN coordinates IS NOT NULL
                            THEN ST_Force2D(ST_SetSRID(
                                     ST_GeomFromGeoJSON(
                                         json_build_object(
                                             'type', 'Polygon',
                                             'coordinates',
                                             CASE WHEN jsonb_typeof(coordinates->0->0) = 'array'
                                                  THEN coordinates
                                                  ELSE json_build_array(coordinates)::jsonb
                                             END
                                         )::text
                                     ), 4326))
                        ELSE
                            ST_SetSRID(ST_MakePoint(center_lng::float, center_lat::float), 4326)
                    END)::geography,
                    {$faultGeog}
                ) AS fd
                FROM   house_polygons
                WHERE  (center_lat IS NOT NULL AND center_lng IS NOT NULL)
                    OR geom IS NOT NULL
                    OR coordinates IS NOT NULL
            ) sub
        ");
        $hf = $houseFaultRows[0] ?? [];

        // Total house count — all houses with any geometry
        $houseCntRow = $q("SELECT COUNT(*) AS cnt FROM house_polygons
                           WHERE (center_lat IS NOT NULL AND center_lng IS NOT NULL)
                              OR geom IS NOT NULL OR coordinates IS NOT NULL");
        $totalHouses = (int)($houseCntRow[0]['cnt'] ?? 0);

        //  CONSTRUCTION — batch flood + fault queries
        $conFloodRow = $q("
            SELECT COUNT(DISTINCT ca.id) AS cnt
            FROM   construction_applications ca
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(ca.longitude::float, ca.latitude::float), 4326),
                       bh.geom
                   )
            WHERE  ca.latitude IS NOT NULL AND ca.longitude IS NOT NULL
        ");
        $conFloodZone = (int)($conFloodRow[0]['cnt'] ?? 0);

        $conFaultRow = $q("
            SELECT
                SUM(CASE WHEN fd <=  5             THEN 1 ELSE 0 END) AS no_build,
                SUM(CASE WHEN fd >   5 AND fd < 50 THEN 1 ELSE 0 END) AS critical
            FROM (
                SELECT ST_Distance({$pt('latitude','longitude')}, {$faultGeog}) AS fd
                FROM   construction_applications
                WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
            ) sub
        ");
        $cf             = $conFaultRow[0] ?? [];
        $conNoBuildZone = (int)($cf['no_build'] ?? 0);
        $conFaultZone   = (int)($cf['critical'] ?? 0);

        // Construction dual-hazard (in flood zone AND fault < 50 m) — single query
        $conDualRow = $q("
            SELECT COUNT(DISTINCT ca.id) AS cnt
            FROM   construction_applications ca
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(ca.longitude::float, ca.latitude::float), 4326),
                       bh.geom
                   )
            WHERE  ca.latitude IS NOT NULL AND ca.longitude IS NOT NULL
            AND    ST_Distance({$pt('ca.latitude','ca.longitude')}, {$faultGeog}) < 50
        ");
        $conBothHazards = (int)($conDualRow[0]['cnt'] ?? 0);

        // Construction proximity clustering — O(n²) in PHP, small dataset (~38 rows)
        $conAllForProx = $q("SELECT id, latitude::float AS lat, longitude::float AS lng
                              FROM   construction_applications
                              WHERE  latitude IS NOT NULL AND longitude IS NOT NULL");
        $conNearOtherCon = 0;
        $R = 6371000;
        foreach ($conAllForProx as $c) {
            foreach ($conAllForProx as $o) {
                if ($c['id'] === $o['id']) continue;
                $dLat = deg2rad($o['lat'] - $c['lat']);
                $dLng = deg2rad($o['lng'] - $c['lng']);
                $a = sin($dLat/2)**2 + cos(deg2rad($c['lat']))*cos(deg2rad($o['lat']))*sin($dLng/2)**2;
                if ($R * 2 * atan2(sqrt($a), sqrt(1-$a)) < 500) { $conNearOtherCon++; break; }
            }
        }

        //  BUSINESSES — batch flood + fault queries
        $bizFloodRow = $q("
            SELECT COUNT(DISTINCT ba.id) AS cnt
            FROM   business_applications ba
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(ba.longitude::float, ba.latitude::float), 4326),
                       bh.geom
                   )
            WHERE  ba.latitude IS NOT NULL AND ba.longitude IS NOT NULL
        ");
        $bizFloodZone = (int)($bizFloodRow[0]['cnt'] ?? 0);

        $bizFaultRow = $q("
            SELECT
                SUM(CASE WHEN fd <=  5             THEN 1 ELSE 0 END) AS no_build,
                SUM(CASE WHEN fd >   5 AND fd < 50 THEN 1 ELSE 0 END) AS critical
            FROM (
                SELECT ST_Distance({$pt('latitude','longitude')}, {$faultGeog}) AS fd
                FROM   business_applications
                WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
            ) sub
        ");
        $bf             = $bizFaultRow[0] ?? [];
        $bizNoBuildZone = (int)($bf['no_build'] ?? 0);
        $bizFaultZone   = (int)($bf['critical'] ?? 0);

        // Business dual-hazard
        $bizDualRow = $q("
            SELECT COUNT(DISTINCT ba.id) AS cnt
            FROM   business_applications ba
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(ba.longitude::float, ba.latitude::float), 4326),
                       bh.geom
                   )
            WHERE  ba.latitude IS NOT NULL AND ba.longitude IS NOT NULL
            AND    ST_Distance({$pt('ba.latitude','ba.longitude')}, {$faultGeog}) < 50
        ");
        $bizBothHazards = (int)($bizDualRow[0]['cnt'] ?? 0);

        // Business clustering — O(n²) in PHP, ~105 rows
        $bizAllForCluster = $q("SELECT id, latitude::float AS lat, longitude::float AS lng
                                 FROM   business_applications
                                 WHERE  latitude IS NOT NULL AND longitude IS NOT NULL");
        $bizClusterDensity = 0;
        foreach ($bizAllForCluster as $b) {
            $nearby = 0;
            foreach ($bizAllForCluster as $o) {
                if ($b['id'] === $o['id']) continue;
                $dLat = deg2rad($o['lat'] - $b['lat']);
                $dLng = deg2rad($o['lng'] - $b['lng']);
                $a = sin($dLat/2)**2 + cos(deg2rad($b['lat']))*cos(deg2rad($o['lat']))*sin($dLng/2)**2;
                if ($R * 2 * atan2(sqrt($a), sqrt(1-$a)) < 200) $nearby++;
            }
            if ($nearby >= 5) $bizClusterDensity++;
        }

        //  INCIDENTS — batch flood queries
        $incFloodRow = $q("
            SELECT
                COUNT(DISTINCT CASE WHEN LOWER(ir.status) NOT IN ('resolved','closed')
                                    THEN ir.id END) AS open_flood,
                COUNT(DISTINCT CASE WHEN LOWER(bh.risk_level) = 'high'
                                    THEN ir.id END) AS high_risk
            FROM   incident_reports ir
            JOIN   barangay_hazards bh
                   ON bh.hazard_type = 'flood'
                   AND ST_Intersects(
                       ST_SetSRID(ST_MakePoint(ir.longitude::float, ir.latitude::float), 4326),
                       bh.geom
                   )
            WHERE  ir.latitude IS NOT NULL AND ir.longitude IS NOT NULL
        ");
        $incF            = $incFloodRow[0] ?? [];
        $incOpenFlood    = (int)($incF['open_flood'] ?? 0);
        $incHighRiskArea = (int)($incF['high_risk']  ?? 0);

        // Incident clustering — O(n²), only recent 30-day window
        $thirtyDaysAgo    = date('Y-m-d H:i:s', time() - 30 * 24 * 60 * 60);
        $incidentsCluster = $q(
            "SELECT id, latitude::float AS lat, longitude::float AS lng
             FROM   incident_reports
             WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
             AND    incident_timestamp >= :ago",
            [':ago' => $thirtyDaysAgo]
        );
        $incClusterCount = 0;
        foreach ($incidentsCluster as $inc) {
            foreach ($incidentsCluster as $o) {
                if ($inc['id'] === $o['id']) continue;
                $dLat = deg2rad($o['lat'] - $inc['lat']);
                $dLng = deg2rad($o['lng'] - $inc['lng']);
                $a = sin($dLat/2)**2 + cos(deg2rad($inc['lat']))*cos(deg2rad($o['lat']))*sin($dLng/2)**2;
                if ($R * 2 * atan2(sqrt($a), sqrt(1-$a)) < 500) { $incClusterCount++; break; }
            }
        }

        //  BUILD RULES ARRAY
        $rules = [
            // Flood Hazard
            'FLOOD_HIGH_RISK'   => ['name'=>'High Flood Risk Zone',   'description'=>'Houses in high flood risk areas requiring immediate mitigation.',                    'severity'=>'CRITICAL','count'=>$houseFloodCounts['high'],   'category'=>'Flood Hazard'],
            'FLOOD_MEDIUM_RISK' => ['name'=>'Medium Flood Risk Zone', 'description'=>'Houses in moderate flood zones requiring preparedness measures.',                    'severity'=>'HIGH',    'count'=>$houseFloodCounts['medium'], 'category'=>'Flood Hazard'],
            'FLOOD_LOW_RISK'    => ['name'=>'Low Flood Risk Zone',    'description'=>'Houses in low flood risk areas with standard precautions.',                          'severity'=>'MEDIUM',  'count'=>$houseFloodCounts['low'],    'category'=>'Flood Hazard'],
            // Seismic Hazard
            'FAULT_EXISTING_STRUCTURE_CRITICAL' => [
                'name'           => 'Existing Structure — Critical Risk (≤5m from Fault)',
                'description'    => 'Existing house within 5m of fault trace — HIGH RISK. Relocation recommended by PHIVOLCS. Cannot be expanded or renovated without seismic certification.',
                'severity'       => 'CRITICAL',
                'count'          => (int)($hf['le5']      ?? 0),
                'category'       => 'Seismic Hazard',
                'recommendation' => 'RELOCATION RECOMMENDED',
            ],
            'FAULT_NO_BUILD_ZONE' => [
                'name'           => 'No Build Zone — Fault Trace (≤5m) — New Construction Prohibited',
                'description'    => 'New construction or permits within 5m of fault trace — PERMIT DENIED. Classified as Fault Rupture Zone by PHIVOLCS.',
                'severity'       => 'CRITICAL',
                'count'          => (int)($hf['le5']      ?? 0),
                'category'       => 'Seismic Hazard',
                'recommendation' => 'PERMIT DENIED',
            ],
            'FAULT_CRITICAL'    => ['name'=>'Fault Line Critical Zone (5–50m)',  'description'=>'Houses within 5–50m of fault line — enhanced seismic standards mandatory.',              'severity'=>'CRITICAL','count'=>(int)($hf['r5_50']    ?? 0),'category'=>'Seismic Hazard'],
            'FAULT_HIGH_RISK'   => ['name'=>'Fault Line High Risk (50–100m)',    'description'=>'Houses requiring seismic design standards and structural certification.',                 'severity'=>'HIGH',    'count'=>(int)($hf['r50_100']  ?? 0),'category'=>'Seismic Hazard'],
            'FAULT_MEDIUM_RISK' => ['name'=>'Fault Line Medium Risk (100–200m)', 'description'=>'Houses requiring enhanced foundation and earthquake preparedness.',                       'severity'=>'MEDIUM',  'count'=>(int)($hf['r100_200'] ?? 0),'category'=>'Seismic Hazard'],
            'FAULT_LOW_RISK'    => ['name'=>'Fault Line Low Risk (>200m)',          'description'=>'Houses beyond 200m — standard seismic building codes apply.',                             'severity'=>'LOW',     'count'=>(int)($hf['r200_plus'] ?? 0),'category'=>'Seismic Hazard'],
            // Construction Safety
            'CON_NO_BUILD_ZONE'              => ['name'=>'No Build Zone — Fault Trace (≤5m)',                     'description'=>'Construction permit applications within 5m of fault trace — PERMIT DENIED per PHIVOLCS Fault Rupture Zone.',                                                       'severity'=>'CRITICAL','count'=>$conNoBuildZone,    'category'=>'Construction Safety'],
            'CON_FLOOD_ZONE'                 => ['name'=>'Construction in Flood Zone',                            'description'=>'Active construction sites in any flood hazard area — flood-resistant construction methods required.',                                                               'severity'=>'HIGH',    'count'=>$conFloodZone,      'category'=>'Construction Safety'],
            'CON_FAULT_ZONE'                 => ['name'=>'Construction in Fault Critical Zone (5–50m)',           'description'=>'Construction sites within 5–50m of the fault line — mandatory seismic design and structural engineer certification.',                                              'severity'=>'CRITICAL','count'=>$conFaultZone,      'category'=>'Construction Safety'],
            'CON_DUAL_HAZARD'                => ['name'=>'Dual Hazard Zone — Flood & Fault Line',                 'description'=>'Construction sites inside a flood hazard area AND within 50m of the fault line — mandatory geological and structural review before work begins.',                  'severity'=>'CRITICAL','count'=>$conBothHazards,    'category'=>'Construction Safety'],
            'CON_NEAR_EXISTING_CONSTRUCTION' => ['name'=>'Construction Near Existing Construction (<500m)',       'description'=>'New construction within 500m of other active sites — requires coordinated planning, traffic management, and dust/noise mitigation.',                               'severity'=>'MEDIUM',  'count'=>$conNearOtherCon,   'category'=>'Construction Safety'],
            // Business Rules
            'BIZ_NO_BUILD_ZONE'        => ['name'=>'No Build Zone — Fault Trace (≤5m)',               'description'=>'New business permit applications within 5m of fault trace — PERMIT DENIED per PHIVOLCS Fault Rupture Zone.',                                             'severity'=>'CRITICAL','count'=>$bizNoBuildZone,   'category'=>'Business Rules'],
            'BIZ_FLOOD_ZONE'           => ['name'=>'Business in Flood Zone',                          'description'=>'Registered businesses in any flood hazard area — emergency plan and flood mitigation measures required.',                                               'severity'=>'HIGH',    'count'=>$bizFloodZone,     'category'=>'Business Rules'],
            'BIZ_FAULT_ZONE'           => ['name'=>'Business in Fault Critical Zone (5–50m)',         'description'=>'Businesses within 5–50m of the fault line — must meet enhanced seismic standards and have an earthquake evacuation plan.',                              'severity'=>'CRITICAL','count'=>$bizFaultZone,     'category'=>'Business Rules'],
            'BIZ_DUAL_HAZARD'          => ['name'=>'Dual Hazard Zone — Flood & Fault Line',           'description'=>'Businesses inside a flood hazard area AND within 50m of the fault line — require disaster resilience plan, elevated structure, and earthquake-resistant design.','severity'=>'CRITICAL','count'=>$bizBothHazards,   'category'=>'Business Rules'],
            'BUSINESS_CLUSTER_DENSITY' => ['name'=>'Business Cluster Density (5+ within 200m)',       'description'=>'Businesses with 5+ others within 200m — over-commercialised area may require coordinated parking or traffic management.',                               'severity'=>'MEDIUM',  'count'=>$bizClusterDensity,'category'=>'Business Rules'],
            // Incident Rules
            'INC_OPEN_IN_FLOOD'       => ['name'=>'Unresolved Incident in Flood Zone',               'description'=>'Active/open incident reports inside a flood hazard area — priority follow-up needed as flooding may escalate or obstruct response.',      'severity'=>'HIGH',    'count'=>$incOpenFlood,    'category'=>'Incident Rules'],
            'INC_HIGH_RISK_AREA'      => ['name'=>'Incident in High Flood Risk Zone',                'description'=>'Incident reports (any status) in a HIGH flood risk zone — structural damage, evacuation delays, and recurrence risk are elevated.',      'severity'=>'CRITICAL','count'=>$incHighRiskArea, 'category'=>'Incident Rules'],
            'INCIDENT_CLUSTER_RADIUS' => ['name'=>'Incident Cluster Radius (500m in past 30 days)', 'description'=>'Incidents within 500m of another in the past 30 days — indicates an emerging hotspot. Requires barangay investigation and intervention.','severity'=>'HIGH',    'count'=>$incClusterCount, 'category'=>'Incident Rules'],
        ];

        $totalAffected = array_sum(array_column($rules, 'count'));

        return [
            'status' => 'success',
            'data'   => [
                'summary' => [
                    'total_houses'          => $totalHouses,
                    'total_rule_violations' => $totalAffected,
                    'rules_evaluated'       => count($rules),
                ],
                'rules' => $rules,
            ],
        ];

    } catch (Exception $e) {
        error_log("Error in getSDSSRulesSummary: " . $e->getMessage());
        return [
            'status'  => 'error',
            'message' => 'Failed to generate SDSS rules summary: ' . $e->getMessage()
        ];
    }
}


// RULE AFFECTED DATA

// Fetches the specific records (houses, businesses, or construction) that violate a given SDSS rule key
function getRuleAffectedData($ruleKey) {
    global $pdo;
    try {
        $records = [];
        $label = '';

        // Flood / Fault house rules
        if (in_array($ruleKey, ['FLOOD_HIGH_RISK','FLOOD_MEDIUM_RISK','FLOOD_LOW_RISK','FAULT_EXISTING_STRUCTURE_CRITICAL','FAULT_NO_BUILD_ZONE','FAULT_CRITICAL','FAULT_HIGH_RISK','FAULT_MEDIUM_RISK','FAULT_LOW_RISK'])) {
            $houseGeomExpr = house_geom_expr('hp');
            $faultGeogLocal = fault_geog_expr();
            $sql = "SELECT hp.house_id, hp.address, hp.street_name, hp.house_number,
                           hp.center_lat, hp.center_lng,
                           ROUND(ST_Distance(({$houseGeomExpr})::geography, {$faultGeogLocal}))::int AS fault_dist_m
                    FROM   house_polygons hp
                    WHERE  (hp.center_lat IS NOT NULL AND hp.center_lng IS NOT NULL)
                        OR hp.geom IS NOT NULL
                        OR hp.coordinates IS NOT NULL";
            $houses = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

            foreach ($houses as $h) {
                $match = false;
                if (strpos($ruleKey, 'FLOOD') === 0) {
                    $risk = checkPointInFloodZone($h['center_lat'], $h['center_lng']);
                    $expected = strtolower(str_replace(['FLOOD_','_RISK'], '', $ruleKey));
                    $match = $risk && strtolower($risk['risk_level']) === $expected;
                    if ($match) $h['detail'] = ucfirst($expected) . ' flood risk zone';
                } else {
                    $dist = round((float)$h['fault_dist_m'], 1);
                    $match = ($ruleKey === 'FAULT_EXISTING_STRUCTURE_CRITICAL' && $dist <= 5) ||
                             ($ruleKey === 'FAULT_NO_BUILD_ZONE' && $dist <= 5) ||
                             ($ruleKey === 'FAULT_CRITICAL' && $dist > 5 && $dist < 50) ||
                             ($ruleKey === 'FAULT_HIGH_RISK' && $dist >= 50 && $dist < 100) ||
                             ($ruleKey === 'FAULT_MEDIUM_RISK' && $dist >= 100 && $dist < 200) ||
                             ($ruleKey === 'FAULT_LOW_RISK'    && $dist >= 200);
                    if ($match) {
                        if ($ruleKey === 'FAULT_EXISTING_STRUCTURE_CRITICAL') {
                            $h['detail'] = "EXISTING STRUCTURE - CRITICAL RISK: {$dist}m from fault trace — Relocation recommended by PHIVOLCS";
                        } elseif ($ruleKey === 'FAULT_NO_BUILD_ZONE') {
                            $h['detail'] = "NO BUILD ZONE: {$dist}m from fault trace — New construction prohibited, permit denied";
                        } else {
                            $h['detail'] = "{$dist}m from fault line";
                        }
                    }
                }
                if ($match) {
                    $records[] = [
                        'type'    => 'household',
                        'id'      => $h['house_id'],
                        'name'    => $h['house_number'] ? 'House #' . $h['house_number'] : ($h['address'] ?: 'Unnamed House'),
                        'address' => $h['address'] ?: $h['street_name'] ?: 'No address',
                        'lat'     => $h['center_lat'],
                        'lng'     => $h['center_lng'],
                        'detail'  => $h['detail'] ?? ''
                    ];
                }
            }
            $label = 'Household';
        }

        // Construction rules
        elseif (strpos($ruleKey, 'CON_') === 0) {
            $sql = "SELECT id, first_name, last_name, construction_address, nature_of_work, type_of_work,
                           number_of_workers, number_of_working_days, contractor_name, end_date, latitude, longitude
                    FROM construction_applications WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
            $cons = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

            foreach ($cons as $c) {
                $match = false; $detail = '';
                if ($ruleKey === 'CON_NO_BUILD_ZONE') {
                    $dist = round(getDistanceToFaultLine($c['latitude'], $c['longitude']), 1);
                    if ($dist <= 5) { 
                        $match = true; 
                        $detail = "PERMIT DENIED: {$dist}m from fault trace — No Build Zone, new construction prohibited"; 
                    }
                } elseif ($ruleKey === 'CON_FLOOD_ZONE') {
                    $risk = checkPointInFloodZone($c['latitude'], $c['longitude']);
                    if ($risk) { $match = true; $detail = ucfirst($risk['risk_level']) . ' flood zone'; }
                } elseif ($ruleKey === 'CON_FAULT_ZONE') {
                    $dist = round(getDistanceToFaultLine($c['latitude'], $c['longitude']), 1);
                    if ($dist > 5 && $dist < 50) { $match = true; $detail = "{$dist}m from fault line"; }
                } elseif ($ruleKey === 'CON_DUAL_HAZARD') {
                    $risk = checkPointInFloodZone($c['latitude'], $c['longitude']);
                    $dist = round(getDistanceToFaultLine($c['latitude'], $c['longitude']), 1);
                    if ($risk && $dist > 5 && $dist < 50) {
                        $match = true; $detail = ucfirst($risk['risk_level']) . " flood zone & {$dist}m from fault";
                    }
                } elseif ($ruleKey === 'CON_NEAR_EXISTING_CONSTRUCTION') {
                    // Check if this construction is within 500m of another construction
                    $otherConsSql = "SELECT latitude, longitude FROM construction_applications 
                                     WHERE id != :conId AND latitude IS NOT NULL AND longitude IS NOT NULL";
                    $otherConsStmt = $pdo->prepare($otherConsSql);
                    $otherConsStmt->execute([':conId' => $c['id']]);
                    $otherCons = $otherConsStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    foreach ($otherCons as $other) {
                        $lat1 = $c['latitude'];
                        $lng1 = $c['longitude'];
                        $lat2 = $other['latitude'];
                        $lng2 = $other['longitude'];
                        
                        $R = 6371000;
                        $dLat = deg2rad($lat2 - $lat1);
                        $dLng = deg2rad($lng2 - $lng1);
                        $a = sin($dLat / 2) * sin($dLat / 2) +
                             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
                             sin($dLng / 2) * sin($dLng / 2);
                        $c_dist = 2 * atan2(sqrt($a), sqrt(1 - $a));
                        $distance = $R * $c_dist;
                        
                        if ($distance < 500) {
                            $match = true;
                            $detail = round($distance) . "m from another construction site";
                            break;
                        }
                    }
                }
                if ($match) $records[] = [
                    'type'    => 'construction',
                    'id'      => $c['id'],
                    'name'    => trim(($c['first_name'] ?? '') . ' ' . ($c['last_name'] ?? '')) ?: 'Unnamed',
                    'address' => $c['construction_address'] ?: 'No address',
                    'lat'     => $c['latitude'],
                    'lng'     => $c['longitude'],
                    'detail'  => $detail
                ];
            }
            $label = 'Construction';
        }

        // Business rules
        elseif (strpos($ruleKey, 'BIZ_') === 0 || $ruleKey === 'BUSINESS_CLUSTER_DENSITY') {
            $sql = "SELECT id, business_name, address_of_business, type_of_business, nature_of_business,
                           no_of_employees, type_of_structure, latitude, longitude
                    FROM business_applications WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
            $bizs = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

            foreach ($bizs as $b) {
                $match = false; $detail = '';
                if ($ruleKey === 'BIZ_NO_BUILD_ZONE') {
                    $dist = round(getDistanceToFaultLine($b['latitude'], $b['longitude']), 1);
                    if ($dist <= 5) { 
                        $match = true; 
                        $detail = "PERMIT DENIED: {$dist}m from fault trace — No Build Zone, new business prohibited"; 
                    }
                } elseif ($ruleKey === 'BIZ_FLOOD_ZONE') {
                    $risk = checkPointInFloodZone($b['latitude'], $b['longitude']);
                    if ($risk) { $match = true; $detail = ucfirst($risk['risk_level']) . ' flood zone'; }
                } elseif ($ruleKey === 'BIZ_FAULT_ZONE') {
                    $dist = round(getDistanceToFaultLine($b['latitude'], $b['longitude']), 1);
                    if ($dist > 5 && $dist < 50) { $match = true; $detail = "{$dist}m from fault line"; }
                } elseif ($ruleKey === 'BIZ_DUAL_HAZARD') {
                    $risk = checkPointInFloodZone($b['latitude'], $b['longitude']);
                    $dist = round(getDistanceToFaultLine($b['latitude'], $b['longitude']), 1);
                    if ($risk && $dist > 5 && $dist < 50) {
                        $match = true; $detail = ucfirst($risk['risk_level']) . " flood zone & {$dist}m from fault";
                    }
                } elseif ($ruleKey === 'BUSINESS_CLUSTER_DENSITY') {
                    // Check if this business has 5+ other businesses within 200m
                    $otherBizSql = "SELECT latitude, longitude FROM business_applications 
                                    WHERE id != :bizId AND latitude IS NOT NULL AND longitude IS NOT NULL";
                    $otherBizStmt = $pdo->prepare($otherBizSql);
                    $otherBizStmt->execute([':bizId' => $b['id']]);
                    $otherBizs = $otherBizStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    $nearbyCount = 0;
                    foreach ($otherBizs as $other) {
                        $lat1 = $b['latitude'];
                        $lng1 = $b['longitude'];
                        $lat2 = $other['latitude'];
                        $lng2 = $other['longitude'];
                        
                        $R = 6371000;
                        $dLat = deg2rad($lat2 - $lat1);
                        $dLng = deg2rad($lng2 - $lng1);
                        $a = sin($dLat / 2) * sin($dLat / 2) +
                             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
                             sin($dLng / 2) * sin($dLng / 2);
                        $c_dist = 2 * atan2(sqrt($a), sqrt(1 - $a));
                        $distance = $R * $c_dist;
                        
                        if ($distance < 200) {
                            $nearbyCount++;
                        }
                    }
                    
                    if ($nearbyCount >= 5) {
                        $match = true;
                        $detail = $nearbyCount . " businesses within 200m — high commercial density area";
                    }
                }
                if ($match) $records[] = [
                    'type'    => 'business',
                    'id'      => $b['id'],
                    'name'    => $b['business_name'] ?: 'Unnamed Business',
                    'address' => $b['address_of_business'] ?: 'No address',
                    'lat'     => $b['latitude'],
                    'lng'     => $b['longitude'],
                    'detail'  => $detail
                ];
            }
            $label = 'Business';
        }

        // Incident rules
        elseif (strpos($ruleKey, 'INC_') === 0) {
            $sql = "SELECT id, incident_type, status, vic_address, vic_full_name, latitude, longitude,
                           incident_timestamp
                    FROM incident_reports WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
            $incs = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

            // Pre-compute street counts for hotspot rule
            $streetCounts = [];
            foreach ($incs as $inc) {
                $s = strtolower(trim($inc['vic_address'] ?? ''));
                if ($s) $streetCounts[$s] = ($streetCounts[$s] ?? 0) + 1;
            }
            $hotspotStreets = array_keys(array_filter($streetCounts, fn($c) => $c >= 3));

            foreach ($incs as $inc) {
                $match = false; $detail = '';
                $status = strtolower($inc['status'] ?? '');
                $isOpen = ($status !== 'resolved' && $status !== 'closed');

                if ($ruleKey === 'INC_OPEN_IN_FLOOD') {
                    if ($isOpen) {
                        $risk = checkPointInFloodZone($inc['latitude'], $inc['longitude']);
                        if ($risk) { $match = true; $detail = 'Open · ' . ucfirst($risk['risk_level']) . ' flood zone'; }
                    }
                } elseif ($ruleKey === 'INC_HIGH_RISK_AREA') {
                    $risk = checkPointInFloodZone($inc['latitude'], $inc['longitude']);
                    if ($risk && strtolower($risk['risk_level']) === 'high') {
                        $match = true; $detail = 'High flood risk zone · ' . ucfirst($status ?: 'Unknown status');
                    }
                } elseif ($ruleKey === 'INCIDENT_CLUSTER_RADIUS') {
                    // Check if this incident is within 500m of another incident in past 30 days
                    $thirtyDaysAgo = date('Y-m-d H:i:s', time() - (30 * 24 * 60 * 60));
                    $otherIncSql = "SELECT latitude, longitude, incident_timestamp FROM incident_reports 
                                    WHERE id != :incId AND latitude IS NOT NULL AND longitude IS NOT NULL 
                                    AND incident_timestamp >= :thirtyDaysAgo";
                    $otherIncStmt = $pdo->prepare($otherIncSql);
                    $otherIncStmt->execute([':incId' => $inc['id'], ':thirtyDaysAgo' => $thirtyDaysAgo]);
                    $otherIncs = $otherIncStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    foreach ($otherIncs as $other) {
                        $lat1 = $inc['latitude'];
                        $lng1 = $inc['longitude'];
                        $lat2 = $other['latitude'];
                        $lng2 = $other['longitude'];
                        
                        $R = 6371000;
                        $dLat = deg2rad($lat2 - $lat1);
                        $dLng = deg2rad($lng2 - $lng1);
                        $a = sin($dLat / 2) * sin($dLat / 2) +
                             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
                             sin($dLng / 2) * sin($dLng / 2);
                        $c_dist = 2 * atan2(sqrt($a), sqrt(1 - $a));
                        $distance = $R * $c_dist;
                        
                        if ($distance < 500) {
                            $match = true;
                            $detail = round($distance) . "m from recent incident — possible hotspot pattern";
                            break;
                        }
                    }
                }
                if ($match) $records[] = [
                    'type'    => 'incident',
                    'id'      => $inc['id'],
                    'name'    => $inc['incident_type'] ?: 'Incident Report',
                    'address' => $inc['vic_address'] ?: 'No address',
                    'lat'     => $inc['latitude'],
                    'lng'     => $inc['longitude'],
                    'detail'  => $detail
                ];
            }
            $label = 'Incident';
        }

        return ['success' => true, 'records' => $records, 'label' => $label];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// POST REQUEST HANDLER
// All API calls come in as POST with an 'action' field.
// Each block handles one action, returns JSON, and exits immediately.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // Discard any PHP notices / warnings buffered above so they never
    // appear before the JSON payload and corrupt JSON.parse() on the client.
    ob_clean();
    header('Content-Type: application/json; charset=utf-8');

    // MARKER FUNCTIONS
    
    if ($_POST['action'] === 'get_incident_markers') {
        echo json_encode(['success' => true, 'markers' => getIncidentMarkers()]);
        exit;
    }

    if ($_POST['action'] === 'get_all_incidents') {
        echo json_encode(['success' => true, 'incidents' => getAllIncidents()]);
        exit;
    }

    if ($_POST['action'] === 'get_incident_types') {
        echo json_encode(['success' => true, 'types' => getIncidentTypes()]);
        exit;
    }

    if ($_POST['action'] === 'get_incident_details') {
        $data = getIncidentById($_POST['id'] ?? 0);
        echo json_encode($data ? ['success' => true, 'data' => $data] : ['success' => false]);
        exit;
    }

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

    // DETAIL FUNCTIONS
    
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

    // FLOOD HAZARD FUNCTIONS
    
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
        // Already sorted low→high by the fixed getHousesInFloodAreas query
        echo json_encode(['success' => true, 'count' => count($houses), 'houses' => $houses]);
        exit;
    }

    if ($_POST['action'] === 'get_flood_houses_summary') {
        $summary = getFloodAffectedHousesSummary();
        // Sort by_risk_level low→high
        if (!empty($summary['by_risk_level'])) {
            $riskOrder = ['low' => 1, 'medium' => 2, 'high' => 3];
            usort($summary['by_risk_level'], function($a, $b) use ($riskOrder) {
                $ra = $riskOrder[strtolower($a['risk_level'] ?? 'low')] ?? 1;
                $rb = $riskOrder[strtolower($b['risk_level'] ?? 'low')] ?? 1;
                return $ra - $rb;
            });
        }
        echo json_encode(['success' => true, 'summary' => $summary]);
        exit;
    }

    // Flood summary — returns aggregate stats + per-house list sorted low→high
    if ($_POST['action'] === 'get_flood_summary') {
        $summary = getFloodAffectedHousesSummary();
        $houses  = getHousesInFloodAreas(); // already sorted low→high after fix
        
        // Sort by_risk_level low→high for the risk breakdown chips
        if (!empty($summary['by_risk_level'])) {
            $riskOrder = ['low' => 1, 'medium' => 2, 'high' => 3];
            usort($summary['by_risk_level'], function($a, $b) use ($riskOrder) {
                $ra = $riskOrder[strtolower($a['risk_level'] ?? 'low')] ?? 1;
                $rb = $riskOrder[strtolower($b['risk_level'] ?? 'low')] ?? 1;
                return $ra - $rb;
            });
        }

        echo json_encode([
            'status' => 'success',
            'data'   => [
                'summary' => $summary,
                'houses'  => $houses
            ]
        ]);
        exit;
    }

    // Per-house flood detail for the side-panel row click
    if ($_POST['action'] === 'get_flood_house_detail') {
        $houseId = $_POST['house_id'] ?? 0;
        if (!$houseId) {
            echo json_encode(['success' => false, 'message' => 'No house_id provided']);
            exit;
        }
        // Pull all flood intersections for this house (may overlap multiple zones)
        global $pdo;
        try {
            $sql = "WITH hg AS (
                        SELECT house_id, address, street_name, house_number,
                               center_lat, center_lng, area_sqm, coordinates,
                               CASE
                            WHEN geom IS NOT NULL
                                THEN geom
                            WHEN coordinates IS NOT NULL
                                THEN ST_Force2D(ST_SetSRID(
                                         ST_GeomFromGeoJSON(
                                             json_build_object(
                                                 'type', 'Polygon',
                                                 'coordinates', json_build_array(coordinates)
                                             )::text
                                         ), 4326))
                            ELSE
                                ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
                        END as geom
                        FROM house_polygons WHERE house_id = :id
                    )
                    SELECT hg.house_id, hg.address, hg.street_name, hg.house_number,
                           hg.center_lat, hg.center_lng, hg.area_sqm,
                           bh.hazard_id, bh.hazard_name, bh.risk_level, bh.description as hazard_description,
                           CASE
                               WHEN (hg.geom IS NOT NULL OR hg.coordinates IS NOT NULL) THEN
                                   LEAST(ROUND((ST_Area(ST_Intersection(hg.geom::geography, bh.geom::geography)) /
                                       NULLIF(ST_Area(hg.geom::geography),0)*100)::numeric,1),100.0)
                               ELSE 100
                           END as flood_coverage_percent,
                           CASE
                               WHEN (hg.geom IS NULL AND hg.coordinates IS NULL) THEN 'Affected'
                               WHEN ST_Area(ST_Intersection(hg.geom::geography,bh.geom))/
                                    NULLIF(ST_Area(hg.geom::geography),0) >= 0.75 THEN 'Fully Affected'
                               WHEN ST_Area(ST_Intersection(hg.geom::geography,bh.geom))/
                                    NULLIF(ST_Area(hg.geom::geography),0) >= 0.25 THEN 'Partially Affected'
                               ELSE 'Minimally Affected'
                           END as impact_level
                    FROM hg
                    JOIN barangay_hazards bh ON ST_Intersects(hg.geom::geography, bh.geom::geography)
                    WHERE bh.hazard_type = 'flood'
                    ORDER BY CASE LOWER(bh.risk_level) WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $houseId]);
            $zones = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Also get applications linked to this house
            $apps = getHouseApplications($houseId);

            if (empty($zones)) {
                echo json_encode(['success' => false, 'message' => 'No flood zone data found for this house']);
                exit;
            }

            $house = [
                'house_id'    => $zones[0]['house_id'],
                'address'     => $zones[0]['address'],
                'street_name' => $zones[0]['street_name'],
                'house_number'=> $zones[0]['house_number'],
                'center_lat'  => $zones[0]['center_lat'],
                'center_lng'  => $zones[0]['center_lng'],
                'area_sqm'    => $zones[0]['area_sqm'],
                'flood_zones' => $zones,
                'applications'=> $apps
            ];

            echo json_encode(['success' => true, 'house' => $house]);
        } catch (PDOException $e) {
            error_log("get_flood_house_detail error: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($_POST['action'] === 'get_flood_warning') {
        echo json_encode(['success' => true, 'warning' => getFloodWarning($_POST['risk_level'] ?? 'low', $_POST['impact_level'] ?? 'Fully Affected')]);
        exit;
    }

    // HOUSE POLYGON FUNCTIONS
    
    if ($_POST['action'] === 'get_houses') {
        $houses = getHousePolygons();
        echo json_encode(['success' => true, 'houses' => $houses, 'count' => count($houses)]);
        exit;
    }

    if ($_POST['action'] === 'get_house_applications') {
        $apps = getHouseApplications($_POST['id'] ?? 0);
        echo json_encode(['success' => true, 'applications' => $apps]);
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

    // SDSS FUNCTIONS
    
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

    // NEW FAULT LINE FUNCTIONS
    
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

    // NEW BUSINESS SDSS REPORT FUNCTIONS
    
    // Business SDSS report
    if ($_POST['action'] === 'get_business_sdss_report') {
        $result = getBusinessSDSSReport();
        echo json_encode($result);
        exit;
    }

    // NEW CONSTRUCTION SDSS REPORT FUNCTIONS
    
    // Construction SDSS report
    if ($_POST['action'] === 'get_construction_sdss_report') {
        $result = getConstructionSDSSReport();
        echo json_encode($result);
        exit;
    }

    // SDSS RULES SUMMARY

    // SDSS Rules Summary
    if ($_POST['action'] === 'get_sdss_rules_summary') {
        try {
            ob_clean(); // discard any buffered notices/warnings before JSON
            $result = getSDSSRulesSummary();
            // Fallback: if the function returned nothing, return a safe error
            if (!$result) {
                $result = ['status' => 'error', 'message' => 'No data returned from getSDSSRulesSummary'];
            }
            echo json_encode($result, JSON_UNESCAPED_UNICODE);
        } catch (Throwable $e) {
            error_log('get_sdss_rules_summary fatal: ' . $e->getMessage());
            ob_clean();
            echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($_POST['action'] === 'get_dss_evaluations') {
        // Use per-query try/catch so a missing table (e.g. construction_evaluations)
        // does not abort the entire response — it simply returns an empty array.
        $safeQuery = function($sql) use ($pdo) {
            try { return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC); }
            catch (PDOException $e) { return []; }
        };

        $parse = function($rows, $type, $nameField) {
            return array_map(function($r) use ($type, $nameField) {
                $details = json_decode($r['evaluation_details'] ?? '{}', true) ?: [];
                return [
                    'id'           => $r['id'],
                    'type'         => $type,
                    'name'         => $r[$nameField] ?? 'Unknown',
                    'address'      => $r['address'] ?? '',
                    'lat'          => isset($r['latitude'])  ? (float)$r['latitude']  : null,
                    'lng'          => isset($r['longitude']) ? (float)$r['longitude'] : null,
                    'dss_status'   => $r['dss_status'],
                    'score'        => $details['score'] ?? 0,
                    'max_score'    => $details['max_score'] ?? 0,
                    'probability'  => $details['approval_probability'] ?? 0,
                    'passed_rules' => $details['passed_rules'] ?? [],
                    'failed_rules' => $details['failed_rules'] ?? [],
                    'evaluated_at' => $r['evaluated_at'],
                ];
            }, $rows);
        };

        $con  = $safeQuery("
            SELECT ce.dss_status, ce.evaluation_details, ce.evaluated_at,
                   ca.id, ca.nature_of_work, ca.construction_address AS address, ca.latitude, ca.longitude
            FROM construction_evaluations ce
            JOIN construction_applications ca ON ca.id = ce.application_id
            ORDER BY ce.evaluated_at DESC
        ");

        $biz  = $safeQuery("
            SELECT be.dss_status, be.evaluation_details, be.evaluated_at,
                   ba.id, ba.business_name AS name, ba.address_of_business AS address, ba.latitude, ba.longitude
            FROM business_evaluations be
            JOIN business_applications ba ON ba.id = be.application_id
            ORDER BY be.evaluated_at DESC
        ");

        $util = $safeQuery("
            SELECT ue.dss_status, ue.evaluation_details, ue.evaluated_at,
                   ua.id, ua.nature_of_work, ua.address_of_utility AS address, ua.latitude, ua.longitude
            FROM utility_evaluations ue
            JOIN utility_applications ua ON ua.id = ue.application_id
            ORDER BY ue.evaluated_at DESC
        ");

        $inc  = $safeQuery("
            SELECT ie.dss_status, ie.evaluation_details, ie.evaluated_at,
                   ir.id, ir.incident_type AS name, ir.vic_address AS address, ir.latitude, ir.longitude
            FROM incident_report_evaluations ie
            JOIN incident_reports ir ON ir.id = ie.application_id
            ORDER BY ie.evaluated_at DESC
        ");

        $all = array_merge(
            $parse($con,  'construction', 'nature_of_work'),
            $parse($biz,  'business',     'name'),
            $parse($util, 'utility',      'nature_of_work'),
            $parse($inc,  'incident',     'name')
        );

        $summary = ['Pre-Approved' => 0, 'Rejected' => 0, 'Additional Requirements Needed' => 0, 'Other' => 0];
        foreach ($all as $a) {
            $s = $a['dss_status'];
            if (isset($summary[$s])) $summary[$s]++;
            else $summary['Other']++;
        }

        echo json_encode(['success' => true, 'evaluations' => $all, 'summary' => $summary]);
        exit;
    }

    // COMBINED FUNCTIONS
    
    
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
        
        // Get incidents
        $incidents = getIncidentMarkers();
        foreach ($incidents as $incident) {
            $incident['type'] = 'incident';
            $incident['name'] = $incident['incident_type'] ?? 'Incident';
            $incident['address'] = $incident['vic_address'] ?? $incident['rp_address'] ?? '';
            $allMarkers[] = $incident;
        }

        echo json_encode(['success' => true, 'markers' => $allMarkers]);
        exit;
    }

    // SDSS RULE AFFECTED DATA

    if ($_POST['action'] === 'get_rule_affected_data') {
        $ruleKey = $_POST['rule_key'] ?? '';
        $result = getRuleAffectedData($ruleKey);
        echo json_encode($result);
        exit;
    }

    // INIT COMBINED ENDPOINT
    // Single round-trip for all map startup data: boundaries + markers + houses + flood.
    // The JS Promise.all approach still works, but this cuts 4 HTTP requests to 1.
    if ($_POST['action'] === 'get_init_data') {
        $includeFlood = !empty($_POST['flood']) && $_POST['flood'] === '1';
        try {
            // Boundary (only the single active boundary, minimum fields)
            $boundaries = $pdo->query(
                "SELECT boundary_id, name, coordinates
                 FROM   barangay_boundaries
                 ORDER  BY created_at DESC LIMIT 1"
            )->fetchAll(PDO::FETCH_ASSOC);

            // Markers: only the fields the map pins actually need
            // Full detail data is fetched on-demand when a user clicks a pin.
            $businesses = $pdo->query(
                "SELECT id, business_name AS name, type_of_business, nature_of_business,
                        address_of_business AS address, no_of_employees,
                        first_name, middle_name, last_name, status, latitude, longitude
                 FROM   business_applications
                 WHERE  latitude IS NOT NULL AND longitude IS NOT NULL"
            )->fetchAll(PDO::FETCH_ASSOC);

            $constructions = $pdo->query(
                "SELECT id, first_name, middle_name, last_name,
                        construction_address AS address, latitude, longitude,
                        nature_of_work, type_of_work, nature_of_activity,
                        number_of_workers, number_of_working_days, start_date, end_date,
                        status, contractor_name
                 FROM   construction_applications
                 WHERE  latitude IS NOT NULL AND longitude IS NOT NULL"
            )->fetchAll(PDO::FETCH_ASSOC);

            $utilities = $pdo->query(
                "SELECT id, first_name, middle_name, last_name,
                        address_of_utility AS address, latitude, longitude,
                        nature_of_work, provider, status, date_of_work
                 FROM   utility_applications
                 WHERE  latitude IS NOT NULL AND longitude IS NOT NULL"
            )->fetchAll(PDO::FETCH_ASSOC);

            $incidents = $pdo->query(
                "SELECT id, incident_type, incident_timestamp, status, dss_status,
                        vic_full_name, vic_address AS address,
                        rp_full_name, rp_address,
                        latitude, longitude
                 FROM   incident_reports
                 WHERE  latitude IS NOT NULL AND longitude IS NOT NULL
                 ORDER  BY incident_timestamp DESC"
            )->fetchAll(PDO::FETCH_ASSOC);

            // Houses: only geometry + display fields (no created_at, area_sqm etc.)
            $houses = $pdo->query(
                "SELECT house_id, address, house_number, street_name,
                        coordinates, center_lat, center_lng
                 FROM   house_polygons
                 ORDER  BY street_name, house_number"
            )->fetchAll(PDO::FETCH_ASSOC);

            // Build markers array (houses are kept separate for polygon rendering)
            $markers = [];
            foreach ($houses as $h) {
                if (!$h['center_lat'] || !$h['center_lng']) continue;
                $markers[] = [
                    'type'      => 'household',
                    'house_id'  => $h['house_id'],
                    'name'      => $h['address'] ?: "House #{$h['house_id']}",
                    'address'   => $h['address'],
                    'latitude'  => $h['center_lat'],
                    'longitude' => $h['center_lng'],
                ];
            }
            foreach ($businesses as $b) {
                $b['type'] = 'business'; $markers[] = $b;
            }
            foreach ($constructions as $c) {
                $c['type'] = 'construction';
                $c['name'] = $c['nature_of_work'] ?? 'Construction Project';
                $markers[] = $c;
            }
            foreach ($utilities as $u) {
                $u['type'] = 'utility';
                $u['name'] = $u['nature_of_work'] ?? 'Utility Work';
                $markers[] = $u;
            }
            foreach ($incidents as $i) {
                $i['type'] = 'incident';
                $i['name'] = $i['incident_type'] ?? 'Incident';
                $markers[] = $i;
            }

            $flood = $includeFlood ? getAllFloodHazards() : [];

            // Encode + gzip compress the response
            $json = json_encode([
                'success'    => true,
                'boundaries' => $boundaries,
                'markers'    => $markers,
                'houses'     => $houses,
                'hazards'    => $flood,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);

            // Send gzip if the client supports it (cuts payload ~70-80%)
            if (isset($_SERVER['HTTP_ACCEPT_ENCODING']) &&
                strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== false) {
                $compressed = gzencode($json, 6);
                if ($compressed !== false) {
                    header('Content-Encoding: gzip');
                    header('Content-Length: ' . strlen($compressed));
                    echo $compressed;
                    exit;
                }
            }
            echo $json;
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    // BOUNDARY MANAGEMENT

    if ($_POST['action'] === 'get_boundaries') {
        try {
            $stmt = $pdo->query("SELECT * FROM barangay_boundaries ORDER BY created_at DESC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'boundaries' => $rows]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($_POST['action'] === 'save_boundary') {
        $name      = trim($_POST['name']        ?? '');
        $desc      = trim($_POST['description'] ?? '');
        $coordsRaw = $_POST['coordinates']      ?? '';
        if (!$name) {
            echo json_encode(['success' => false, 'message' => 'Name is required']);
            exit;
        }
        $coords = json_decode($coordsRaw, true);
        if (!$coords || count($coords) < 3) {
            echo json_encode(['success' => false, 'message' => 'At least 3 coordinate points required']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("
                INSERT INTO barangay_boundaries (name, description, coordinates)
                VALUES (:name, :desc, :coords)
                RETURNING boundary_id
            ");
            $stmt->execute([':name' => $name, ':desc' => $desc ?: null, ':coords' => $coordsRaw]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'boundary_id' => $row['boundary_id']]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($_POST['action'] === 'delete_boundary') {
        $id = intval($_POST['boundary_id'] ?? 0);
        if (!$id) { echo json_encode(['success' => false, 'message' => 'boundary_id required']); exit; }
        try {
            $stmt = $pdo->prepare("DELETE FROM barangay_boundaries WHERE boundary_id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode($stmt->rowCount()
                ? ['success' => true]
                : ['success' => false, 'message' => 'Boundary not found']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
    exit;
}

http_response_code(400);
ob_clean();
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>