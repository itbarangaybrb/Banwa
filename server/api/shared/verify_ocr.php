<?php
header('Content-Type: application/json; charset=utf-8');

// Load DB connection (uses $pdo)
require_once __DIR__ . '/../../configs/database.php';

// Read JSON input
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
    exit;
}

$supabase_user_id = $input['supabase_user_id'] ?? null;
$email = $input['email'] ?? null;
$ocrMeta = $input['ocrMeta'] ?? null;
$ocrData = $input['ocrData'] ?? null;
$thresholds = $input['thresholds'] ?? [];

// Debug flag: if true, allow local testing without API key
$debug = !empty($input['debug']);

// API key protection: require VERIFY_OCR_KEY env var when not debugging
$requiredKey = getenv('VERIFY_OCR_KEY') ?: null;
if (!$debug && $requiredKey) {
    // Accept header X-VERIFY-KEY or body.api_key
    $provided = $_SERVER['HTTP_X_VERIFY_KEY'] ?? ($input['api_key'] ?? null);
    if (!$provided || !hash_equals($requiredKey, $provided)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid API key']);
        exit;
    }
}

if (!$supabase_user_id && !$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Provide supabase_user_id or email']);
    exit;
}

// Default thresholds (tunable via request 'thresholds')
$MIN_BLUR = isset($thresholds['min_blur']) ? floatval($thresholds['min_blur']) : 100.0;
$MIN_KEYWORD_HITS = isset($thresholds['min_keyword_hits']) ? intval($thresholds['min_keyword_hits']) : 1;
$MIN_FIELDS_COUNT = isset($thresholds['min_fields_count']) ? intval($thresholds['min_fields_count']) : 2;

$reasons = [];

$debug = !empty($input['debug']);

// initialize metrics
$blur = null;
$keyword_hits = 0;
$fields_count = 0;

if (!$ocrMeta || !is_array($ocrMeta)) {
    $reasons[] = 'no_ocr_meta';
} else {
    $blur = isset($ocrMeta['blur_score']) ? floatval($ocrMeta['blur_score']) : null;
    $keyword_hits = isset($ocrMeta['keyword_hits']) ? intval($ocrMeta['keyword_hits']) : 0;
    $fields_count = isset($ocrMeta['fields_count']) ? intval($ocrMeta['fields_count']) : 0;

    if ($blur === null) {
        $reasons[] = 'no_blur_score';
    } elseif ($blur < $MIN_BLUR) {
        $reasons[] = 'blur_score_too_low';
    }

    if ($keyword_hits < $MIN_KEYWORD_HITS) {
        $reasons[] = 'insufficient_keyword_hits';
    }

    if ($fields_count < $MIN_FIELDS_COUNT) {
        $reasons[] = 'insufficient_extracted_fields';
    }
}

$verified = (count($reasons) === 0);

try {
    // Ensure the verification table exists (safe to run repeatedly)
    $createSql = "CREATE TABLE IF NOT EXISTS ocr_verifications (
        id serial PRIMARY KEY,
        supabase_user_id uuid NULL,
        email varchar(255) NULL,
        meta jsonb NULL,
        data jsonb NULL,
        verified boolean NOT NULL,
        reasons jsonb NULL,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
    );";
    $pdo->exec($createSql);

    // Ensure 'ocr_verified' column exists on users and resident (safe to run)
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS ocr_verified boolean DEFAULT false");
    } catch (Exception $e) {
        // ignore
    }
    try {
        $pdo->exec("ALTER TABLE resident ADD COLUMN IF NOT EXISTS ocr_verified boolean DEFAULT false");
    } catch (Exception $e) {
        // ignore
    }

    $insertSql = 'INSERT INTO ocr_verifications (supabase_user_id, email, meta, data, verified, reasons) VALUES (:uid, :email, :meta, :data, :verified, :reasons) RETURNING id';
    $stmt = $pdo->prepare($insertSql);
    $stmt->execute([
        ':uid' => $supabase_user_id,
        ':email' => $email,
        ':meta' => $ocrMeta ? json_encode($ocrMeta) : null,
        ':data' => $ocrData ? json_encode($ocrData) : null,
        ':verified' => $verified,
        ':reasons' => json_encode($reasons)
    ]);
    $insertedId = $stmt->fetchColumn();

    // If verified, apply extracted fields to users/resident tables
    $updated_users = 0;
    $updated_resident = 0;
    if ($verified && is_array($ocrData)) {
        // Normalize fields from ocrData
        $fn = isset($ocrData['firstName']) ? trim($ocrData['firstName']) : null;
        $mn = isset($ocrData['middleName']) ? trim($ocrData['middleName']) : null;
        $ln = isset($ocrData['lastName']) ? trim($ocrData['lastName']) : null;
        $sx = isset($ocrData['suffix']) ? trim($ocrData['suffix']) : null;
        $addr = isset($ocrData['address']) ? trim($ocrData['address']) : null;
        $contact = isset($ocrData['contactNo']) ? trim($ocrData['contactNo']) : null;

        // Update users table: match by supabase_user_id if provided, otherwise by email
        if ($supabase_user_id || $email) {
            $setParts = [];
            $params = [];
            if ($fn) { $setParts[] = "first_name = CASE WHEN first_name IS NULL OR TRIM(first_name) = '' THEN :fn ELSE first_name END"; $params[':fn'] = $fn; }
            if ($mn) { $setParts[] = "middle_name = CASE WHEN middle_name IS NULL OR TRIM(middle_name) = '' THEN :mn ELSE middle_name END"; $params[':mn'] = $mn; }
            if ($ln) { $setParts[] = "last_name = CASE WHEN last_name IS NULL OR TRIM(last_name) = '' THEN :ln ELSE last_name END"; $params[':ln'] = $ln; }
            if ($sx) { $setParts[] = "suffix = CASE WHEN suffix IS NULL OR TRIM(suffix) = '' THEN :sx ELSE suffix END"; $params[':sx'] = $sx; }
            // always set ocr_verified = true when verified
            $setParts[] = "ocr_verified = TRUE";

            if (!empty($setParts)) {
                $sql = 'UPDATE users SET ' . implode(', ', $setParts) . ' WHERE ';
                if ($supabase_user_id) {
                    $sql .= 'supabase_user_id = :uid';
                    $params[':uid'] = $supabase_user_id;
                } else {
                    $sql .= 'email = :email';
                    $params[':email'] = $email;
                }
                $upd = $pdo->prepare($sql);
                $upd->execute($params);
                $updated_users = $upd->rowCount();
            }
        }

        // Update resident table when supabase_user_id present
        if ($supabase_user_id) {
            $setParts = [];
            $params = [':uid' => $supabase_user_id];
            if ($fn) { $setParts[] = "first_name = CASE WHEN first_name IS NULL OR TRIM(first_name) = '' THEN :rfn ELSE first_name END"; $params[':rfn'] = $fn; }
            if ($mn) { $setParts[] = "middle_name = CASE WHEN middle_name IS NULL OR TRIM(middle_name) = '' THEN :rmn ELSE middle_name END"; $params[':rmn'] = $mn; }
            if ($ln) { $setParts[] = "last_name = CASE WHEN last_name IS NULL OR TRIM(last_name) = '' THEN :rln ELSE last_name END"; $params[':rln'] = $ln; }
            if ($sx) { $setParts[] = "suffix = CASE WHEN suffix IS NULL OR TRIM(suffix) = '' THEN :rsx ELSE suffix END"; $params[':rsx'] = $sx; }
            if ($addr) { $setParts[] = "address = CASE WHEN address IS NULL OR TRIM(address) = '' THEN :raddr ELSE address END"; $params[':raddr'] = $addr; }
            if ($contact) { $setParts[] = "contact_no = CASE WHEN contact_no IS NULL OR TRIM(contact_no) = '' THEN :rcontact ELSE contact_no END"; $params[':rcontact'] = $contact; }
            // set resident.ocr_verified = true
            $setParts[] = "ocr_verified = TRUE";

            if (!empty($setParts)) {
                $sql = 'UPDATE resident SET ' . implode(', ', $setParts) . ' WHERE supabase_user_id = :uid';
                $upd = $pdo->prepare($sql);
                $upd->execute($params);
                $updated_resident = $upd->rowCount();
            }
        }

        // Append update counts to audit_log
        try {
            $audit = $pdo->prepare('INSERT INTO audit_log (user_id, action, table_name, details) VALUES (:uid, :action, :table_name, :details)');
            $details = json_encode(['updated_users' => $updated_users, 'updated_resident' => $updated_resident]);
            // user_id left null - we don't have internal numeric user id here
            $audit->execute([':uid' => null, ':action' => 'ocr_verification_applied', ':table_name' => 'users,resident', ':details' => $details]);
        } catch (Exception $e) {
            // non-fatal
            error_log('audit_log insert failed: ' . $e->getMessage());
            if ($debug) $auditErr = $e->getMessage();
        }
    }

    // Build response
    $response = [
        'success' => true,
        'verified' => $verified,
        'reasons' => $reasons,
        'id' => $insertedId,
        'updated_users' => $updated_users,
        'updated_resident' => $updated_resident
    ];

    if ($debug) {
        $response['debug_info'] = [
            'thresholds' => ['min_blur' => $MIN_BLUR, 'min_keyword_hits' => $MIN_KEYWORD_HITS, 'min_fields_count' => $MIN_FIELDS_COUNT],
            'blur' => $blur,
            'keyword_hits' => $keyword_hits,
            'fields_count' => $fields_count,
            'audit_error' => $auditErr ?? null
        ];
    }

    echo json_encode($response);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB error: ' . $e->getMessage()]);
    exit;
}

?>
