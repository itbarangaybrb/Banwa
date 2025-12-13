<?php
require_once __DIR__ . '/../../../../server/configs/database.php';

ini_set('display_errors', 0);
error_reporting(0);

$businessAddress = trim($_POST['businessAddress'] ?? '');

if ($businessAddress === '') {
    echo json_encode([
        'success' => false,
        'message' => 'No business address provided'
    ]);
    exit;
}

try {
    // Query DB for matching address
    $stmt = $pdo->prepare("SELECT center_lat, center_lng, address FROM house_polygons WHERE address = :address LIMIT 1");
    $stmt->execute([':address' => $businessAddress]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode([
            'success' => true,
            'center_lat' => $row['center_lat'],
            'center_lng' => $row['center_lng'],
            'address' => $row['address']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => "No matching coordinates found for $businessAddress"
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
