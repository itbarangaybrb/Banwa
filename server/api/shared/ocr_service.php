<?php

/**
 * Shared OCR service used by resident and staff endpoints.
 * Provides a reusable analyze_files($files, $requiredDocs) function.
 */

function get_mime_type_shared($filename)
{
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $map = [
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'pdf'  => 'application/pdf',
    ];
    return $map[$ext] ?? 'application/octet-stream';
}

function analyze_files($files, $requiredDocs = [])
{
    // $OCR_API_KEY = 'K81052119188957';
    $OCR_API_KEY = 'K82731431388957';

    $KEYWORDS = [
        'SEC' => ['securities and exchange commission', 'sec registration', 'certificate of registration', 'articles of incorporation'],
        'DTI' => ['department of trade and industry', 'dti registration', 'business name registration'],
        'TCT' => ['transfer certificate of title', 'tct no.', "owner's duplicate copy"],
        'Lease Contract' => ['contract of lease', 'lease agreement', 'lessor', 'lessee'],
        'Previous Business Clearance' => ['Business Clearance', "mayor's permit", 'barangay business clearance', 'business clearance']
    ];

    $results = [];
    $allDetectedTypes = [];

    if (empty($files) || !isset($files['name'])) {
        return ['error' => 'No files provided'];
    }

    $count = is_array($files['name']) ? count($files['name']) : 0;
    if ($count === 0) {
        return ['error' => 'No files provided'];
    }

    for ($i = 0; $i < $count; $i++) {
        $filename = $files['name'][$i];
        $tmpPath = $files['tmp_name'][$i];
        $error = $files['error'][$i];

        if ($error !== UPLOAD_ERR_OK) {
            $results[] = [
                'filename' => $filename,
                'text' => '',
                'detected' => [],
                'error' => 'Upload error code: ' . $error
            ];
            continue;
        }

        $mime = get_mime_type_shared($filename);

        if (class_exists('CURLFile')) {
            $fileField = new CURLFile($tmpPath, $mime, $filename);
        } else {
            $fileField = '@' . $tmpPath . ';filename=' . $filename . ';type=' . $mime;
        }

        $postFields = [
            'apikey' => $OCR_API_KEY,
            'language' => 'eng',
            'file' => $fileField,
            'OCREngine' => '2',
            'isTable' => 'false',
            'detectOrientation' => 'true',
            'scale' => 'true',
            'isOverlayRequired' => 'false'
        ];

        $ch = curl_init('https://api.ocr.space/parse/image');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postFields,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => ['Expect:']
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);

        // Retry with relaxed SSL if Windows lacks CA bundle and we get SSL errors
        if ($response === false && stripos($curlError, 'SSL certificate') !== false) {
            // Log that we're retrying with disabled verification
            $logDir = __DIR__ . '/../../logs/';
            if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
            @file_put_contents($logDir . 'ocr_debug.log', date('c') . " - SSL error for {$filename}, retrying with SSL verify disabled.\n", FILE_APPEND);

            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
        }

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
            // debug log
            $logDir = __DIR__ . '/../../logs/';
            if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
            @file_put_contents($logDir . 'ocr_debug.log', date('c') . " - ERROR for {$filename}: " . var_export($data, true) . "\n", FILE_APPEND);
            continue;
        }

        $extractedText = '';
        foreach ($data['ParsedResults'] ?? [] as $parsed) {
            $extractedText .= $parsed['ParsedText'] . "\n";
        }
        $extractedText = trim($extractedText);

        // If no text was extracted, write debug information to log for later inspection
        if ($extractedText === '') {
            $logDir = __DIR__ . '/../../logs/';
            if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
            @file_put_contents($logDir . 'ocr_debug.log', date('c') . " - NO_TEXT for {$filename}: HTTP {$httpCode} RESPONSE: " . substr($response, 0, 2000) . "\n", FILE_APPEND);
        }

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

    return [
        'results' => $results,
        'missing' => array_values($missing),
        'allVerified' => count($missing) === 0
    ];
}
