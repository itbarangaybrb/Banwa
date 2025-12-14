<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

session_start();
error_log("get_business_application.php: Script started");
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';
require_once __DIR__ . '/check_session.php'; // Ensures user is logged in

$applicationId = $_GET['id'] ?? null;
$supabase_user_id = $_SESSION['supabase_user_id'];

if (!$applicationId) {
    http_response_code(400);
    echo json_encode(['error' => 'Application ID is required.']);
    exit;
}

try {
    // Fetch application and verify ownership
    $stmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = ? AND supabase_user_id = ?");
    $stmt->execute([$applicationId, $supabase_user_id]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found or you do not have permission to view it.']);
        exit;
    }

    // Decode JSON fields for easier use on the frontend
    if ($application['business_status']) {
        $application['business_status'] = json_decode($application['business_status'], true);
    }
    if ($application['requirements']) {
        $application['requirements'] = json_decode($application['requirements'], true);
    }

    error_log("get_business_application.php: Successfully fetched application data");
    echo json_encode([
        'success' => true,
        'data' => $application
    ]);

} catch (Exception $e) {
    error_log("get_business_application.php: Error fetching application data: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'A server error occurred: ' . $e->getMessage()]);
}
