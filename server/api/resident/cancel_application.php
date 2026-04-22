<?php
require_once __DIR__ . '/../../configs/database.php';

header('Content-Type: application/json');

$app_id = $_POST['application_id'] ?? null;
$app_type = $_POST['app_type'] ?? null;

if (!$app_id || !$app_type) {
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters.']);
    exit;
}

$tableMap = [
    'Business'         => 'business_applications',
    'Construction'     => 'construction_applications',
    'Utilities'        => 'utility_applications',
    'Incident Reports' => 'incident_reports',
];

$table = $tableMap[$app_type] ?? null;

if (!$table) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid application type.']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("UPDATE {$table} SET status = 'Cancelled', updated_at = NOW() WHERE id = ?");
    $stmt->execute([$app_id]);

    $pdo->commit();

    echo json_encode(['status' => 'success', 'message' => 'Application cancelled successfully.']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>