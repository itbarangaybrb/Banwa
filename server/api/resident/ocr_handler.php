<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

header('Content-Type: application/json');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE); // Suppress deprecation warnings

// === CONFIGURATION ===
$OCR_API_KEY = 'K81052119188957';

$KEYWORDS = [
    'SEC' => ['securities and exchange commission', 'sec registration', 'certificate of registration', 'articles of incorporation'],
    'DTI' => ['department of trade and industry', 'dti registration', 'business name registration'],
    'TCT' => ['transfer certificate of title', 'tct no.', 'owner\'s duplicate copy'],
    'Lease Contract' => ['contract of lease', 'lease agreement', 'lessor', 'lessee'],
    'Previous Business Permit' => ['business permit', 'mayor\'s permit', 'barangay business clearance', 'business clearance']
];

function get_mime_type($filename) {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $map = [
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'pdf'  => 'application/pdf',
    ];
    return $map[$ext] ?? 'application/octet-stream';
}

// === INPUT VALIDATION ===
if (empty($_FILES['documents']) || empty($_POST['requirements'])) {
    echo json_encode(['error' => 'Missing files or requirements']);
    exit;
}

$requiredDocs = $_POST['requirements'] ?? [];
$results = [];
$allDetectedTypes = [];

$files = $_FILES['documents'];

foreach ($files['error'] as $i => $error) {
    if ($error !== UPLOAD_ERR_OK) {
        $results[] = [
            'filename' => $files['name'][$i],
            'text' => '',
            'detected' => [],
            'error' => 'Upload error code: ' . $error
        ];
        continue;
    }

    $tmpPath = $files['tmp_name'][$i];
    $filename = $files['name'][$i];
    $mime = get_mime_type($filename);

    if (class_exists('CURLFile')) {
        $fileField = new CURLFile($tmpPath, $mime, $filename);
    } else {
        $fileField = '@' . $tmpPath . ';filename=' . $filename . ';type=' . $mime;
    }

    $postFields = [
        'apikey' => $OCR_API_KEY,
        'language' => 'eng',
        'file' => $fileField,
        'OCREngine' => 2,
        'isTable' => false
    ];

    $ch = curl_init('https://api.ocr.space/parse/image');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 120, // Longer timeout for PDFs
        CURLOPT_CONNECTTIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true, // Keep true for security
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => ['Expect:']
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch); // Capture detailed error
    // No curl_close() needed

    if ($response === false || $httpCode === 0) {
        $results[] = [
            'filename' => $filename,
            'text' => '',
            'detected' => [],
            'error' => 'cURL failed: ' . ($curlError ?: 'Unknown error (HTTP ' . $httpCode . ')')
        ];
        continue;
    }

    if ($httpCode !== 200) {
        $results[] = [
            'filename' => $filename,
            'text' => '',
            'detected' => [],
            'error' => 'OCR API request failed (HTTP ' . $httpCode . ')'
        ];
        continue;
    }

    $data = json_decode($response, true);

    if (!empty($data['IsErroredOnProcessing'])) {
        $results[] = [
            'filename' => $filename,
            'text' => '',
            'detected' => [],
            'error' => $data['ErrorMessage'][0] ?? 'OCR processing error'
        ];
        continue;
    }

    $extractedText = '';
    foreach ($data['ParsedResults'] ?? [] as $parsed) {
        $extractedText .= $parsed['ParsedText'] . "\n";
    }
    $extractedText = trim($extractedText);

    $detected = [];
    foreach ($KEYWORDS as $type => $words) {
        foreach ($words as $word) {
            if (stripos($extractedText, $word) !== false) {
                $detected[] = $type;
                break;
            }
        }
    }
    $detected = array_unique($detected);

    $results[] = [
        'filename' => $filename,
        'text' => $extractedText,
        'detected' => $detected
    ];

    $allDetectedTypes = array_merge($allDetectedTypes, $detected);
}

$allDetectedTypes = array_unique($allDetectedTypes);
$missing = array_diff($requiredDocs, $allDetectedTypes);

echo json_encode([
    'results' => $results,
    'missing' => array_values($missing),
    'allVerified' => count($missing) === 0
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);