<?php
// /server/api/auth/ocr_process.php
// PRIMARY: OCR.space only (high accuracy, reliable line order)
// TESSERACT FALLBACK FULLY COMMENTED OUT
// FEATURES:
//   - OCR Confidence Scoring (rejects low confidence with reupload message)
//   - Blurry image detection
//   - ROBUST Quezon City ID parsing:
//     → Primary: Line after label containing "LAST NAME" / "FIRST NAME" / "M.I."
//     → Fallback: Any comma line with strict filters (no digits, @, emergency keywords)
//   - Address clean (no prefixes, no dates/civil status)
//   - Digital/preview ID support

header('Content-Type: application/json');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

ob_start();

// === CONFIG ===
$OCR_API_KEY = 'K82731431388957';
$BLUR_THRESHOLD = 150;
$CONFIDENCE_THRESHOLD = 70;

$debug = !empty($_POST['debug']);
$debug_info = [];

// === HELPER FUNCTIONS ===
function get_mime_type($filename) {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $map = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png'];
    return $map[$ext] ?? 'application/octet-stream';
}

function str_contains_array($haystack, $needles) {
    $haystack = strtoupper($haystack);
    foreach ($needles as $needle) {
        if (strpos($haystack, strtoupper($needle)) !== false) return true;
    }
    return false;
}

function clean_value($str) {
    $str = trim($str);
    $str = preg_replace('/\s+/', ' ', $str);
    $str = preg_replace('/[.,\d]*$/', '', $str);
    return trim($str);
}

function clean_address_line($line) {
    $line = preg_replace('/^Tirahan\/Address\s*/i', '', $line);
    $line = preg_replace('/^Address\s*[:\/]?\s*/i', '', $line);
    $line = preg_replace('/^Tirahan\s*[:\/]?\s*/i', '', $line);
    $line = preg_replace('/^Civil Status\s*/i', '', $line);
    $line = preg_replace('/^Marital Status\s*/i', '', $line);
    $line = preg_replace('/^Status\s*/i', '', $line);
    $line = trim($line);
    return $line;
}

function is_image_blurry($path, $threshold = 150) {
    if (!extension_loaded('gd')) return false;

    $info = getimagesize($path);
    if (!$info) return false;

    $im = match ($info[2]) {
        IMAGETYPE_JPEG => imagecreatefromjpeg($path),
        IMAGETYPE_PNG => imagecreatefrompng($path),
        default => false
    };
    if (!$im) return false;

    imagefilter($im, IMG_FILTER_GRAYSCALE);

    $matrix = [[-1,-1,-1], [-1,8,-1], [-1,-1,-1]];
    imageconvolution($im, $matrix, 1, 0);

    $width = imagesx($im);
    $height = imagesy($im);

    $pixels = [];
    for ($x = 0; $x < $width; $x += 10) {
        for ($y = 0; $y < $height; $y += 10) {
            $gray = imagecolorat($im, $x, $y) & 0xFF;
            $pixels[] = $gray;
        }
    }

    imagedestroy($im);

    if (empty($pixels)) return false;

    $mean = array_sum($pixels) / count($pixels);
    $variance = 0;
    foreach ($pixels as $p) {
        $variance += pow($p - $mean, 2);
    }
    $variance /= count($pixels);

    return $variance < $threshold;
}

// === PARSING FUNCTION ===
function parse_id_data($raw_lines, $id_type, &$type_match) {
    $data = ['firstName' => '', 'lastName' => '', 'middleName' => '', 'address' => ''];

    $lines = [];
    foreach ($raw_lines as $line) {
        $clean = clean_value($line);
        if ($clean === '') continue;
        if (stripos($clean, 'PREVIEW ONLY') !== false || stripos($clean, 'PREVIEW') !== false) continue;
        $lines[] = $clean;
    }

    $full_text_upper = strtoupper(implode(' ', $lines));

    // Initialize the reference variable
    $type_match = false;
    if ($id_type === 'National') {
        if (str_contains_array($full_text_upper, ['PAMBANSANG PAGKAKAKILANLAN', 'PHILIPPINE IDENTIFICATION', 'PHILSYS', 'PAGKAKAKILANLAN', 'PAMBANSANG', 'PHILIPPINE IDENTIFICATION CARD'])) {
            $type_match = true;
        }
    } elseif ($id_type === 'Quezon') {
        $has_quezon = strpos($full_text_upper, 'QUEZON') !== false;
        $has_citizen = strpos($full_text_upper, 'CITIZEN') !== false || strpos($full_text_upper, 'CARD') !== false;
        $has_slogan = strpos($full_text_upper, 'KASAMA') !== false && strpos($full_text_upper, 'PAG-UNLAD') !== false;
        if ($has_quezon && ($has_citizen || $has_slogan)) {
            $type_match = true;
        }
    }

    if (!$type_match) {
        return $data;
    }

    // EXCLUSIONS
    $name_labels = ['FIRST', 'LAST', 'MIDDLE', 'GIVEN', 'PANGALAN', 'APELYIDO', 'NAME', 'M.I.', 'MGA', 'GITNANG', 'SURNAME'];
    $date_labels = ['BIRTH', 'KAPANGANAKAN', 'PETSA', 'DATE OF BIRTH'];
    $civil_status_keywords = ['CIVIL STATUS', 'MARITAL STATUS', 'STATUS', 'SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'];
    $month_keywords = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    $non_name_keywords = ['EMERGENCY', 'CONTACT', 'CASE', 'SIGNATURE', 'HOLDER', 'RESIDENT', 'BLOOD', 'TYPE', 'SEX', 'DATE', 'VALID', 'UNTIL', 'ISSUED', 'PHILIPPINES'];
    $address_keywords = ['QUEZON', 'CITY', 'COMMONWEALTH', 'STEVE', 'ST', 'POOK', 'PALARIS', 'UP CAMPUS', 'CAMPUS', 'NCR', 'DISTRICT', 'SITIO', 'PAJO', 'BLOCK', 'LOT', 'BLK', 'B2', 'BAESA', 'TIRAHAN', 'ADDRESS'];

    // NATIONAL ID (unchanged - working well)
    if ($id_type === 'National') {
        $last = $given = $middle = '';

        for ($i = 0; $i < count($lines) - 1; $i++) {
            $label_line = strtoupper($lines[$i]);
            $value = $lines[$i + 1];
            $value_upper = strtoupper($value);

            if (str_contains_array($value_upper, array_merge($name_labels, $date_labels, $address_keywords, $civil_status_keywords, $month_keywords, $non_name_keywords))) continue;

            if (str_contains_array($label_line, ['GITNANG APELYIDO', 'GITNANG', 'MIDDLE NAME'])) {
                $middle = ucwords(strtolower($value));
            } elseif (str_contains_array($label_line, ['APELYIDO', 'LAST NAME', 'SURNAME', 'LOST NAME'])) {
                $last = ucwords(strtolower($value));
            } elseif (str_contains_array($label_line, ['MGA PANGALAN', 'GIVEN NAMES', 'GIVEN NAME', 'PANGALAN'])) {
                $given = $value;
            }
        }

        $data['lastName'] = $last;
        $data['middleName'] = $middle;

        if ($given) {
            $parts = preg_split('/\s+/', $given);
            $parts = array_filter($parts, fn($p) => strlen($p) > 2 && preg_match('/[A-Za-z]/', $p));
            if (!empty($parts)) {
                $data['firstName'] = ucwords(strtolower(array_shift($parts)));
                if (!$middle && !empty($parts)) {
                    $data['middleName'] = ucwords(strtolower(implode(' ', $parts)));
                }
            }
        }
    }

    // QUEZON CITY ID - UNIFIED & OPTIMIZED METHOD
        elseif ($id_type === 'Quezon') {
            $found_name = false;

            $common_suffixes = ['JR', 'JR.', 'SR', 'SR.', 'II', 'III', 'IV', 'V'];

            foreach ($lines as $index => $line) {
                $upper_line = strtoupper($line);
                
                // 1. Stricter Exclusions: Skip lines that are obviously dates, addresses, or metadata
                if (str_contains_array($upper_line, array_merge($date_labels, $address_keywords, $civil_status_keywords, $non_name_keywords))) continue;
                
                // 2. Reject lines with numbers or symbols (names shouldn't have them)
                if (preg_match('/\d|@|\(|\)|:/', $line)) continue; 

                // 3. QCitizen Format Target: LASTNAME, FIRSTNAME [SUFFIX] MI.
                if (strpos($line, ',') !== false) {
                    $parts = explode(',', $line, 2);
                    $last_name_part = trim($parts[0]);
                    $rest_of_name = trim($parts[1]);

                    // Basic length validation to avoid matching stray punctuation
                    if (strlen($last_name_part) > 1 && strlen($rest_of_name) > 1) {
                        $data['lastName'] = ucwords(strtolower($last_name_part));
                        
                        // Tokenize the rest of the name to carefully extract First Name, MI, and Suffix
                        $name_tokens = preg_split('/\s+/', $rest_of_name);
                        $name_tokens = array_filter($name_tokens);
                        
                        $middle_name = '';
                        $suffix = '';

                        // Work backwards from the end of the name string
                        while (!empty($name_tokens)) {
                            $token = array_pop($name_tokens); 
                            $token_upper = strtoupper($token);

                            if (in_array($token_upper, $common_suffixes)) {
                                // Catch suffixes like JR or III
                                $suffix = $token;
                            } elseif (strlen($token) <= 2 || strpos($token, '.') !== false) {
                                // Catch middle initials (e.g., "P." or just "P")
                                // If there are multiple initials (e.g., "A. B."), we prepend to build the full MI
                                $clean_token = str_replace('.', '', $token);
                                $middle_name = $middle_name === '' ? $clean_token : $clean_token . ' ' . $middle_name;
                            } else {
                                // If it's not a suffix or MI, it belongs to the first name.
                                // Put it back in the array and break the loop.
                                $name_tokens[] = $token;
                                break;
                            }
                        }

                        // Reassemble the first name
                        $data['firstName'] = ucwords(strtolower(implode(' ', $name_tokens)));
                        
                        // Append suffix to the first name if it exists
                        if ($suffix) {
                            $data['firstName'] .= ' ' . ucwords(strtolower($suffix)); 
                        }
                        
                        $data['middleName'] = ucwords(strtolower($middle_name));
                        $found_name = true;
                        break; // Stop after finding the first highly confident name string
                    }
                }
            }
        

        // FALLBACK: Any suitable comma line
        if (!$found_name) {
            foreach ($lines as $line) {
                $upper = strtoupper($line);

                if (str_contains_array($upper, array_merge($name_labels, $date_labels, $address_keywords, $civil_status_keywords, $month_keywords, $non_name_keywords))) continue;
                if (preg_match('/\d|@|\(|\)|EMERGENCY|CONTACT|SIGNATURE|RESIDENT|BLOOD|SEX|DATE|VALID|ISSUED/', $upper)) continue;

                if (strpos($line, ',') !== false) {
                    [$last_part, $rest] = explode(',', $line, 2);
                    $last_part = trim($last_part);
                    $rest = trim($rest);

                    if (strlen($last_part) > 2 && strlen($rest) > 2) {
                        $data['lastName'] = ucwords(strtolower($last_part));

                        $name_parts = preg_split('/\s+/', $rest);
                        $name_parts = array_filter($name_parts, fn($p) => strlen($p) > 1 && preg_match('/[A-Za-z]/', $p));

                        if (!empty($name_parts)) {
                            $data['firstName'] = ucwords(strtolower(array_shift($name_parts)));
                            if (!empty($name_parts)) {
                                $data['middleName'] = ucwords(strtolower(implode(' ', $name_parts)));
                            }
                        }
                        break; // Take first valid
                    }
                }
            }
        }
    }

    // ADDRESS COLLECTION
    $addr_parts = [];
    foreach ($lines as $line) {
        $upper = strtoupper($line);

        if (str_contains_array($upper, array_merge($date_labels, $civil_status_keywords, $month_keywords, $non_name_keywords))) continue;
        if (preg_match('/\d{4}\/\d{2}\/\d{2}|\d{2}\/\d{2}\/\d{4}/', $line)) continue;

        if (str_contains_array($upper, $address_keywords) && !str_contains_array($upper, array_merge($name_labels))) {
            $cleaned = clean_address_line($line);
            if ($cleaned !== '') {
                $addr_parts[] = $cleaned;
            }
        }
    }
    $data['address'] = !empty($addr_parts) ? implode(' ', $addr_parts) : '';

    foreach (['firstName', 'middleName', 'lastName'] as $key) {
        $data[$key] = trim(preg_replace('/[.,]$/', '', $data[$key]));
    }

    return $data;
}

// === MAIN ===
$file = $_FILES['file'] ?? $_FILES['idFile'] ?? null;
$id_type = $_POST['idType'] ?? null;

if (!$file || $file['error'] !== UPLOAD_ERR_OK || !$id_type) {
    ob_end_clean();
    echo json_encode(["success" => false, "error" => "Invalid upload or ID type"]);
    exit;
}

$tmp_path = $file['tmp_name'];

// BLURRY DETECTION
if (is_image_blurry($tmp_path, $BLUR_THRESHOLD)) {
    ob_end_clean();
    echo json_encode([
        "success" => false,
        "error" => "The uploaded image appears blurry. Please upload a clearer, well-lit photo of the ID."
    ]);
    exit;
}

$raw_text = null;
$source = 'ocr.space';
$avg_confidence = 0;

// OCR.SPACE
$debug_info['ocrspace_attempted'] = true;

$mime = get_mime_type($file['name']);
$file_field = class_exists('CURLFile')
    ? new CURLFile($tmp_path, $mime, $file['name'])
    : '@' . $tmp_path . ';filename=' . $file['name'] . ';type=' . $mime;

$post_fields = [
    'apikey' => $OCR_API_KEY,
    'language' => 'eng',
    'isOverlayRequired' => 'true',
    'OCREngine' => '2',             // Upgraded to Engine 2 for structured documents
    'scale' => 'true',              // Upscales the image internally for better text recognition
    'detectOrientation' => 'true',  // Auto-rotates if the user uploads sideways
    'file' => $file_field
];

$ch = curl_init('https://api.ocr.space/parse/image');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $post_fields,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_CAINFO => __DIR__ . '/../../cacert.pem',   // ← uses your cacert.pem
    CURLOPT_FOLLOWLOCATION => true
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);

// === RETRY LOGIC (safety net - never fails even on weird hosting) ===
if ($response === false && stripos($curl_error, 'SSL certificate') !== false) {
    $logDir = __DIR__ . '/../../logs/';
    if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
    @file_put_contents($logDir . 'ocr_debug.log', 
        date('c') . " - SSL error for {$file['name']}, retrying with SSL verify disabled.\n", 
        FILE_APPEND);

    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
}

curl_close($ch);

if ($response !== false && $http_code === 200) {
    $result = json_decode($response, true);
    
    // Check if the API itself returned an error message
    if (!empty($result['ErrorMessage'])) {
        ob_end_clean();
        echo json_encode([
            "success" => false,
            "error" => "OCR API Error: " . $result['ErrorMessage'][0]
        ]);
        exit;
    }

    if (json_last_error() === JSON_ERROR_NONE && !empty($result['ParsedResults']) && $result['OCRExitCode'] == 1) {
        $raw_text = $result['ParsedResults'][0]['ParsedText'];

        // Confidence
        $confidences = [];
        if (isset($result['ParsedResults'][0]['TextOverlay']['Lines'])) {
            foreach ($result['ParsedResults'][0]['TextOverlay']['Lines'] as $line) {
                if (isset($line['Words'])) {
                    foreach ($line['Words'] as $word) {
                        if (isset($word['WordConfidence'])) {
                            $confidences[] = (int)$word['WordConfidence'];
                        }
                    }
                }
            }
        }

        if (!empty($confidences)) {
            $avg_confidence = array_sum($confidences) / count($confidences);
            if ($avg_confidence < $CONFIDENCE_THRESHOLD) {
                ob_end_clean();
                echo json_encode([
                    "success" => false,
                    "error" => "Low OCR confidence (" . round($avg_confidence, 1) . "%). Please upload a clearer image."
                ]);
                exit;
            }
        }
    }
}

// Add the actual API response to your debug info
$debug_info['raw_api_response'] = json_decode($response, true); 
$debug_info['ocrspace_error'] = $curl_error ?: ($http_code !== 200 ? "HTTP $http_code" : null);

if ($raw_text === null || trim($raw_text) === '') {
    ob_end_clean();
    echo json_encode([
        "success" => false,
        // Shows the actual error (e.g., "Could not resolve host" or "Connection timed out")
        "error" => "OCR Error: " . ($curl_error ?: "HTTP $http_code - No text found"),
        "debug_info" => $debug ? $debug_info : null
    ]);
    exit;
}

// PARSE
$raw_lines = array_filter(array_map('trim', explode("\n", $raw_text)));
$type_match = false;
$extracted_data = parse_id_data($raw_lines, $id_type, $type_match);

// HARD STOP: If the ID type doesn't match the text, return an error immediately.
if (!$type_match) {
    ob_end_clean();
    echo json_encode([
        "success" => false,
        "error" => "ID Mismatch: The uploaded image does not appear to be a valid {$id_type} ID."
    ]);
    exit;
}

$response = [
    "success" => true,
    "data" => $extracted_data,
    "raw" => $raw_text,
    "source" => $source,
    "meta" => [
        "detected_type" => $id_type,
        "fields_count" => count(array_filter($extracted_data)),
        "hits_map" => [
            $id_type => $type_match ? 1 : 0 // Now dynamically reflects reality
        ]
    ]
];

if ($avg_confidence > 0) {
    $response['ocr_confidence'] = round($avg_confidence, 2);
}

if ($debug) {
    $response["debug_info"] = $debug_info;
}

ob_end_clean();
echo json_encode($response);