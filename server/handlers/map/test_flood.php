<?php
// test_flood.php
require_once __DIR__ . '/../../configs/database.php';

header('Content-Type: application/json');

try {
    // Test the query directly
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
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Decode properties JSON for readability
    foreach ($results as &$result) {
        if (!empty($result['properties'])) {
            $result['properties'] = json_decode($result['properties'], true);
        }
    }
    
    echo json_encode([
        'success' => true,
        'count' => count($results),
        'hazards' => $results,
        'query' => $sql
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'query' => $sql ?? 'No query'
    ], JSON_PRETTY_PRINT);
}
?>