<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../configs/database.php';
require_once __DIR__ . '/../../api/shared/insert_audit_logs.php';
if (session_status() === PHP_SESSION_NONE) session_start();

$userRoleId     = $_SESSION['role_id'] ?? null;
$supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

if (!$userRoleId || !$supabaseUserId) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$allowedRoles = [2, 4, 5, 6, 7, 8];
if (!in_array((int)$userRoleId, $allowedRoles)) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Forbidden"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['archive_id'])) {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

$archiveId = $input['archive_id'];

try {
    $stmt = $pdo->prepare("SELECT * FROM archives WHERE archive_id = ?");
    $stmt->execute([$archiveId]);
    $archive = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$archive) {
        echo json_encode(["success" => false, "message" => "Archive not found"]);
        exit;
    }

    $isRestricted = in_array((int)$userRoleId, [4, 5, 6, 7, 8]);
    if ($isRestricted && $archive['supabase_user_id'] !== $supabaseUserId) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden"]);
        exit;
    }

    $table = $archive['table_name'];

    $tableMap = [
        'users'                    => 'UPDATE users SET is_archived = FALSE WHERE user_id = ?',
        'utility_applications'     => 'UPDATE utility_applications SET is_archived = FALSE WHERE id = ?',
        'business_applications'    => 'UPDATE business_applications SET is_archived = FALSE WHERE id = ?',
        'construction_applications'=> 'UPDATE construction_applications SET is_archived = FALSE WHERE id = ?',
        'incident_reports'         => 'UPDATE incident_reports SET is_archived = FALSE WHERE id = ?',
    ];

    if (!isset($tableMap[$table])) {
        echo json_encode(["success" => false, "message" => "Unsupported table"]);
        exit;
    }

    $stmt = $pdo->prepare($tableMap[$table]);
    $stmt->execute([$archive['record_id']]);

    // Mark archive row as restored
    $stmt = $pdo->prepare("UPDATE archives SET is_restored = TRUE, restored_at = NOW() WHERE archive_id = ?");
    $stmt->execute([$archiveId]);

    writeAuditLog($pdo, 'RESTORE', $table, $archive['record_id'], null, $archive, 'ARCHIVE');

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}