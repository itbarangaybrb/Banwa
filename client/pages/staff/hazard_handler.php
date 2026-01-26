<?php
// hazard_handler.php
include __DIR__ . '../../../../server/configs/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    
    switch ($action) {
        case 'get_all_hazards':
            echo json_encode(getAllHazards());
            break;
            
        case 'save_hazard':
            echo json_encode(saveHazard($_POST));
            break;
            
        case 'delete_hazard':
            echo json_encode(deleteHazard($_POST['hazard_id']));
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Unknown action']);
    }
    exit;
}

// Get all flood hazards
function getAllHazards() {
    global $pdo;
    
    try {
        // Use PostGIS function to convert geometry to GeoJSON
        $sql = "SELECT 
                    hazard_id,
                    hazard_name,
                    description,
                    risk_level,
                    ST_AsGeoJSON(geom) as geojson,
                    properties,
                    created_at,
                    updated_at
                FROM barangay_hazards 
                WHERE hazard_type = 'flood'
                ORDER BY risk_level DESC, hazard_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        $hazards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'count' => count($hazards),
            'hazards' => $hazards
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Save hazard (insert or update)
function saveHazard($data) {
    global $pdo;
    
    try {
        $hazardId = !empty($data['hazard_id']) ? intval($data['hazard_id']) : null;
        
        // Parse coordinates and create PostGIS geometry
        $coordinates = json_decode($data['coordinates'], true);
        $geojson = json_decode($data['geojson'], true);
        
        // Ensure polygon is closed (first and last points are the same)
        if ($coordinates[0] !== $coordinates[count($coordinates) - 1]) {
            $coordinates[] = $coordinates[0];
        }
        
        // Create WKT (Well-Known Text) for PostGIS
        $wktCoords = implode(', ', array_map(function($coord) {
            return $coord[0] . ' ' . $coord[1];
        }, $coordinates));
        
        $wkt = "POLYGON(($wktCoords))";
        
        if ($hazardId) {
            // Update existing hazard
            $sql = "UPDATE barangay_hazards SET 
                    hazard_name = :hazard_name,
                    description = :description,
                    risk_level = :risk_level,
                    geom = ST_GeomFromText(:wkt, 4326)::geography,
                    properties = :properties,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE hazard_id = :hazard_id
                    RETURNING hazard_id";
        } else {
            // Insert new hazard
            $sql = "INSERT INTO barangay_hazards 
                    (hazard_type, hazard_name, description, risk_level, geom, properties)
                    VALUES ('flood', :hazard_name, :description, :risk_level, 
                            ST_GeomFromText(:wkt, 4326)::geography, :properties)
                    RETURNING hazard_id";
        }
        
        $stmt = $pdo->prepare($sql);
        
        $params = [
            ':hazard_name' => $data['hazard_name'],
            ':description' => $data['description'] ?? null,
            ':risk_level' => $data['risk_level'],
            ':wkt' => $wkt,
            ':properties' => json_encode([
                'source' => 'Barangay Blue Ridge B',
                'created_via' => 'flood_editor',
                'created_at' => date('Y-m-d H:i:s')
            ])
        ];
        
        if ($hazardId) {
            $params[':hazard_id'] = $hazardId;
        }
        
        $stmt->execute($params);
        
        if (!$hazardId) {
            $hazardId = $stmt->fetchColumn();
        }
        
        return [
            'success' => true,
            'message' => $hazardId ? 'Hazard updated successfully' : 'Hazard created successfully',
            'hazard_id' => $hazardId
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
    }
}

// Delete hazard
function deleteHazard($hazardId) {
    global $pdo;
    
    try {
        $sql = "DELETE FROM barangay_hazards WHERE hazard_id = :hazard_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':hazard_id' => $hazardId]);
        
        return [
            'success' => true,
            'message' => 'Hazard deleted successfully'
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Get single hazard by ID
function getHazardById($hazardId) {
    global $pdo;
    
    try {
        $sql = "SELECT 
                    hazard_id,
                    hazard_name,
                    description,
                    risk_level,
                    ST_AsGeoJSON(geom) as geojson,
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