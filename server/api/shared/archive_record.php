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
if (!$input || !isset($input['table_name'], $input['record_id'])) {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

$table    = $input['table_name'];
$recordId = $input['record_id'];

$selectMap = [
    'Users'                     => 'SELECT * FROM users WHERE user_id = ?',
    'Utility Applications'      => 'SELECT * FROM utility_applications WHERE id = ?',
    'Business Applications'     => 'SELECT * FROM business_applications WHERE id = ?',
    'Construction Applications' => 'SELECT * FROM construction_applications WHERE id = ?',
    'Incident Reports'          => 'SELECT * FROM incident_reports WHERE id = ?',
];

$archiveMap = [
    'Users'                     => 'UPDATE users SET is_archived = TRUE WHERE user_id = ?',
    'Utility Applications'      => 'UPDATE utility_applications SET is_archived = TRUE WHERE id = ?',
    'Business Applications'     => 'UPDATE business_applications SET is_archived = TRUE WHERE id = ?',
    'Construction Applications' => 'UPDATE construction_applications SET is_archived = TRUE WHERE id = ?',
    'Incident Reports'          => 'UPDATE incident_reports SET is_archived = TRUE WHERE id = ?',
];

if (!isset($selectMap[$table])) {
    echo json_encode(["success" => false, "message" => "Unsupported table"]);
    exit;
}

// Helper: build full name from name-part fields
function buildFullName(array $record): string {
    return trim(
        ($record['first_name']  ?? '') . ' ' .
        ($record['middle_name'] ?? '') . ' ' .
        ($record['last_name']   ?? '') . ' ' .
        ($record['suffix']      ?? '')
    );
}

try {
    $stmt = $pdo->prepare($selectMap[$table]);
    $stmt->execute([$recordId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        echo json_encode(["success" => false, "message" => "Record not found"]);
        exit;
    }

    if ($table === 'Users') {
        $isRestricted = in_array((int)$userRoleId, [4, 5, 6, 7, 8]);
        if ($isRestricted && $record['supabase_user_id'] !== $supabaseUserId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Forbidden"]);
            exit;
        }

        $archiveFullName = $record['full_name'] ?? null;
        $archiveEmail    = $record['email']     ?? null;
    } else {
        $archiveFullName = buildFullName($record);
        $archiveEmail    = '';
    }

    // Insert archive record
    $stmt = $pdo->prepare("
        INSERT INTO archives 
            (table_name, record_id, supabase_user_id, full_name, email, role_id, archived_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$table, $recordId, $supabaseUserId, $archiveFullName, $archiveEmail, $userRoleId]);

    // Mark record as archived
    $stmt = $pdo->prepare($archiveMap[$table]);
    $stmt->execute([$recordId]);

    writeAuditLog($pdo, 'ARCHIVE', $table, $recordId, $record, null, 'ARCHIVE');

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}