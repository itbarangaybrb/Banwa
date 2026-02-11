<?php
// hazard_handler.php

// Set JSON header
header('Content-Type: application/json');

// Start output buffering
ob_start();

try {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method. Only POST allowed.");
    }
    
    // Get POST data
    $postData = $_POST;
    
    // Check action parameter
    if (!isset($postData['action'])) {
        throw new Exception("No action specified.");
    }
    
    $action = $postData['action'];
    
    // Include database connection
    $databasePath = $_SERVER['DOCUMENT_ROOT'] . '/server/configs/database.php';
    if (!file_exists($databasePath)) {
        // Try relative path
        $databasePath = dirname(__FILE__) . '/../../../server/configs/database.php';
    }
    
    if (!file_exists($databasePath)) {
        throw new Exception("Database configuration file not found.");
    }
    
    include $databasePath;
    
    // Check if database connection was established
    if (!isset($pdo)) {
        throw new Exception("Database connection not established.");
    }
    
    // Process action
    switch ($action) {
        case 'get_all_hazards':
            $result = getAllHazards();
            break;
            
        case 'save_hazard':
            $result = saveHazard($postData);
            break;
            
        case 'delete_hazard':
            if (!isset($postData['hazard_id'])) {
                throw new Exception("No hazard_id specified for delete action.");
            }
            $result = deleteHazard($postData['hazard_id']);
            break;
            
        default:
            throw new Exception("Unknown action: $action");
    }
    
    // Clear output buffer
    ob_clean();
    
    // Return JSON response
    echo json_encode($result);
    
} catch (Exception $e) {
    // Clean any output
    ob_clean();
    
    // Return error response
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    
    echo json_encode($errorResponse);
}

// Get all flood hazards
function getAllHazards() {
    global $pdo;
    
    try {
        // First check if table exists
        $checkTable = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'barangay_hazards')");
        $tableExists = $checkTable->fetchColumn();
        
        if (!$tableExists) {
            // Create table if it doesn't exist
            $createTableSQL = "
                CREATE TABLE IF NOT EXISTS barangay_hazards (
                    hazard_id SERIAL PRIMARY KEY,
                    hazard_type VARCHAR(50) DEFAULT 'flood',
                    hazard_name VARCHAR(255) NOT NULL,
                    description TEXT,
                    risk_level VARCHAR(20) DEFAULT 'low',
                    geom GEOGRAPHY(POLYGON, 4326),
                    properties JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX idx_barangay_hazards_geom ON barangay_hazards USING GIST(geom);
                CREATE INDEX idx_barangay_hazards_type ON barangay_hazards(hazard_type);
                CREATE INDEX idx_barangay_hazards_risk ON barangay_hazards(risk_level);
            ";
            
            $pdo->exec($createTableSQL);
            
            return [
                'success' => true,
                'count' => 0,
                'hazards' => []
            ];
        }
        
        // Use PostGIS function to convert geometry to GeoJSON
        $sql = "SELECT 
                    hazard_id,
                    hazard_name,
                    description,
                    risk_level,
                    ST_AsGeoJSON(geom::geometry) as geojson,
                    properties,
                    created_at,
                    updated_at
                FROM barangay_hazards 
                WHERE hazard_type = 'flood'
                ORDER BY risk_level DESC, hazard_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        $hazards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($hazards as &$hazard) {
            if (isset($hazard['properties'])) {
                $hazard['properties'] = json_decode($hazard['properties'], true);
            }
        }
        
        return [
            'success' => true,
            'count' => count($hazards),
            'hazards' => $hazards
        ];
        
    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}

// Save hazard (insert or update)
function saveHazard($data) {
    global $pdo;
    
    try {
        $hazardId = !empty($data['hazard_id']) ? intval($data['hazard_id']) : null;
        
        // Validate required fields
        if (empty($data['hazard_name'])) {
            throw new Exception("Hazard name is required.");
        }
        
        if (empty($data['risk_level'])) {
            throw new Exception("Risk level is required.");
        }
        
        // Parse coordinates
        if (empty($data['coordinates'])) {
            throw new Exception("No coordinates provided.");
        }
        
        $coordinates = json_decode($data['coordinates'], true);
        if (!$coordinates) {
            throw new Exception("Invalid coordinates format.");
        }
        
        // Ensure we have a valid polygon
        if (!is_array($coordinates) || !is_array($coordinates[0]) || count($coordinates[0]) < 4) {
            throw new Exception("Invalid polygon coordinates.");
        }
        
        // Create WKT (Well-Known Text) for PostGIS
        $wktPoints = [];
        foreach ($coordinates[0] as $coord) {
            if (count($coord) !== 2) {
                throw new Exception("Invalid coordinate pair.");
            }
            $wktPoints[] = $coord[0] . ' ' . $coord[1];
        }
        
        // Ensure polygon is closed (first and last points are the same)
        if ($wktPoints[0] !== $wktPoints[count($wktPoints) - 1]) {
            $wktPoints[] = $wktPoints[0];
        }
        
        $wkt = "POLYGON((" . implode(', ', $wktPoints) . "))";
        
        // Prepare properties JSON
        $properties = json_encode([
            'source' => 'Barangay Blue Ridge B',
            'created_via' => 'flood_editor',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_by' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown'
        ]);
        
        if ($hazardId) {
            // Update existing hazard
            $sql = "UPDATE barangay_hazards SET 
                    hazard_name = :hazard_name,
                    description = :description,
                    risk_level = :risk_level,
                    geom = ST_GeomFromText(:wkt, 4326)::geography,
                    properties = :properties::jsonb,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE hazard_id = :hazard_id
                    RETURNING hazard_id";
                    
            $params = [
                ':hazard_name' => $data['hazard_name'],
                ':description' => $data['description'] ?? null,
                ':risk_level' => $data['risk_level'],
                ':wkt' => $wkt,
                ':properties' => $properties,
                ':hazard_id' => $hazardId
            ];
        } else {
            // Insert new hazard
            $sql = "INSERT INTO barangay_hazards 
                    (hazard_type, hazard_name, description, risk_level, geom, properties)
                    VALUES ('flood', :hazard_name, :description, :risk_level, 
                            ST_GeomFromText(:wkt, 4326)::geography, :properties::jsonb)
                    RETURNING hazard_id";
                    
            $params = [
                ':hazard_name' => $data['hazard_name'],
                ':description' => $data['description'] ?? null,
                ':risk_level' => $data['risk_level'],
                ':wkt' => $wkt,
                ':properties' => $properties
            ];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $newHazardId = $result['hazard_id'] ?? $hazardId;
        
        return [
            'success' => true,
            'message' => $hazardId ? 'Hazard updated successfully' : 'Hazard created successfully',
            'hazard_id' => $newHazardId
        ];
        
    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}

// Delete hazard
function deleteHazard($hazardId) {
    global $pdo;
    
    try {
        $hazardId = intval($hazardId);
        if ($hazardId <= 0) {
            throw new Exception("Invalid hazard ID.");
        }
        
        $sql = "DELETE FROM barangay_hazards WHERE hazard_id = :hazard_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':hazard_id' => $hazardId]);
        
        $deletedCount = $stmt->rowCount();
        
        if ($deletedCount === 0) {
            throw new Exception("Hazard not found.");
        }
        
        return [
            'success' => true,
            'message' => 'Hazard deleted successfully'
        ];
        
    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}

// Get single hazard by ID
function getHazardById($hazardId) {
    global $pdo;
    
    try {
        $hazardId = intval($hazardId);
        
        $sql = "SELECT 
                    hazard_id,
                    hazard_name,
                    description,
                    risk_level,
                    ST_AsGeoJSON(geom::geometry) as geojson,
                    created_at,
                    updated_at
                FROM barangay_hazards 
                WHERE hazard_id = :hazard_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':hazard_id' => $hazardId]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
        
    } catch (PDOException $e) {
        return null;
    }
}
?>