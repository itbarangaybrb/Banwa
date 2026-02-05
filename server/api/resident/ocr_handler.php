<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';
require_once __DIR__ . '/../../../server/api/shared/ocr_service.php';

header('Content-Type: application/json');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// Expect files under 'documents[]' and requirements[] in POST
if (empty($_FILES['documents']) || empty($_POST['requirements'])) {
    echo json_encode(['error' => 'Missing files or requirements']);
    exit;
}

$requiredDocs = $_POST['requirements'] ?? [];
$files = $_FILES['documents'];

$result = analyze_files($files, $requiredDocs);

if (isset($result['error'])) {
    echo json_encode(['error' => $result['error']]);
    exit;
}

echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);