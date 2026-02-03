<?php
// /Banwa/server/api/auth/ocr_process.php
// PRIMARY: OCR.space (high accuracy)
// FALLBACK: Tesseract with enhanced preprocessing (upscale + sharpen + adaptive threshold)
// FULLY TYPE-SAFE PARSING
// - Strict ID type validation using distinctive keywords
// - Prevents label/address/date leakage into names
// - Robust comma handling for Quezon City IDs
// - Prioritizes detected middle name for National ID

header('Content-Type: application/json');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

ob_start();

// === CONFIG ===
$TESSERACT_CMD = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
$OCR_API_KEY = 'K81052119188957';

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

function clean_value($str, $source) {
    $str = trim($str);
    $str = preg_replace('/\s+/', ' ', $str);

    if ($source === 'tesseract') {
        $noise = ['=', '-', '—', '"', '\'', '_', '|', '[', ']', '(', ')', '~', '^', '*', '#', '@', '!', '?', '\\', '/', '“', '”', 'igs', 'ZA', 'aun', 'n\\iyy', ' G ', ' -_', 'za', 'igs ', '3 '];
        $str = str_replace($noise, ' ', $str);
        $str = preg_replace('/[.,\d]*$/', '', $str);
        $str = preg_replace('/\s+[A-Za-z0-9]{1,2}(\s+|$)/', ' ', $str);
        $str = trim($str);
    }

    return $str;
}

function preprocess_for_tesseract($input_path, $id_type) {
    if (!extension_loaded('gd')) return $input_path;

    $info = getimagesize($input_path);
    if (!$info) return $input_path;

    $im = match ($info[2]) {
        IMAGETYPE_JPEG => imagecreatefromjpeg($input_path),
        IMAGETYPE_PNG => imagecreatefrompng($input_path),
        default => false
    };
    if (!$im) return $input_path;

    // Upscale 2x
    $w = imagesx($im) * 2;
    $h = imagesy($im) * 2;
    $resized = imagecreatetruecolor($w, $h);
    imagecopyresampled($resized, $im, 0, 0, 0, 0, $w, $h, imagesx($im), imagesy($im));
    imagedestroy($im);
    $im = $resized;

    imagefilter($im, IMG_FILTER_GRAYSCALE);
    imagefilter($im, IMG_FILTER_CONTRAST, -100);

    // Light sharpen
    imageconvolution($im, [[-1,-1,-1], [-1,16,-1], [-1,-1,-1]], 8, 0);

    // Adaptive threshold
    $threshold = ($id_type === 'National') ? 110 : 160;
    $width = imagesx($im);
    $height = imagesy($im);
    for ($x = 0; $x < $width; $x++) {
        for ($y = 0; $y < $height; $y++) {
            $gray = (imagecolorat($im, $x, $y) >> 16) & 0xFF;
            $color = ($gray > $threshold) ? 255 : 0;
            imagesetpixel($im, $x, $y, imagecolorallocate($im, $color, $color, $color));
        }
    }

    $out = sys_get_temp_dir() . '/proc_' . uniqid() . '.png';
    imagepng($im, $out);
    imagedestroy($im);
    return $out;
}

// === PARSING ===
function parse_id_data($raw_lines, $id_type, $source) {
    $data = ['firstName' => '', 'lastName' => '', 'middleName' => '', 'address' => ''];

    $lines = [];
    foreach ($raw_lines as $line) {
        $clean = clean_value($line, $source);
        if ($clean === '') continue;
        $lines[] = $clean;
    }

    $full_text_upper = strtoupper(implode(' ', $lines));

    // ID TYPE VALIDATION
    $type_match = false;
    if ($id_type === 'National') {
        if (str_contains_array($full_text_upper, ['PAMBANSANG PAGKAKAKILANLAN', 'PHILIPPINE IDENTIFICATION', 'PHILSYS', 'PAGKAKAKILANLAN'])) {
            $type_match = true;
        }
    } elseif ($id_type === 'Quezon') {
        if (str_contains_array($full_text_upper, ['QUEZON CITY', 'CITIZEN CARD', 'KASAMA KASA PAG-UNLAD'])) {
            $type_match = true;
        }
    }

    if (!$type_match) {
        return $data; // Wrong ID type uploaded
    }

    $name_labels = ['FIRST', 'LAST', 'MIDDLE', 'GIVEN', 'PANGALAN', 'APELYIDO', 'NAME', 'M.I.', 'MGA', 'GITNANG', 'SURNAME'];
    $date_labels = ['BIRTH', 'KAPANGANAKAN', 'PETSA', 'DATE'];
    $address_keywords = ['QUEZON', 'CITY', 'COMMONWEALTH', 'STEVE', 'ST', 'POOK', 'PALARIS', 'UP CAMPUS', 'CAMPUS', 'NCR', 'DISTRICT', 'SITIO', 'PAJO', 'BLOCK', 'LOT', 'BLK', 'B2', 'TIRAHAN', 'ADDRESS'];

    if ($id_type === 'National') {
        $last = $given = $middle = '';

        for ($i = 0; $i < count($lines) - 1; $i++) {
            $label_line = strtoupper($lines[$i]);
            $value = $lines[$i + 1];

            if (str_contains_array(strtoupper($value), array_merge($name_labels, $date_labels, $address_keywords))) continue;

            if (str_contains_array($label_line, ['APELYIDO', 'LAST NAME', 'SURNAME'])) {
                $last = ucwords(strtolower($value));
            } elseif (str_contains_array($label_line, ['MIDDLE NAME', 'GITNANG'])) {
                $middle = ucwords(strtolower($value));
            } elseif (str_contains_array($label_line, ['GIVEN NAMES', 'MGA PANGALAN', 'PANGALAN'])) {
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
    } elseif ($id_type === 'Quezon') {
        foreach ($lines as $line) {
            $upper = strtoupper($line);
            if (str_contains_array($upper, array_merge($name_labels, $date_labels, $address_keywords))) continue;

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
                    break;
                }
            }
        }
    }

    // Address
    $addr_parts = [];
    foreach ($lines as $line) {
        $upper = strtoupper($line);
        if (str_contains_array($upper, $address_keywords) && !str_contains_array($upper, array_merge($name_labels, $date_labels))) {
            $addr_parts[] = $line;
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
$raw_text = null;
$source = 'unknown';

// === OCR.SPACE (PRIMARY) ===
$debug_info['ocrspace_attempted'] = true;

$mime = get_mime_type($file['name']);
$file_field = class_exists('CURLFile')
    ? new CURLFile($tmp_path, $mime, $file['name'])
    : '@' . $tmp_path . ';filename=' . $file['name'] . ';type=' . $mime;

$post_fields = [
    'apikey' => $OCR_API_KEY,
    'language' => 'eng',
    'isOverlayRequired' => 'false',
    'OCREngine' => '2',
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
    CURLOPT_CAINFO => __DIR__ . '/cacert.pem',
    CURLOPT_FOLLOWLOCATION => true
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($response !== false && $http_code === 200) {
    $result = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE && !empty($result['ParsedResults']) && $result['OCRExitCode'] == 1) {
        $raw_text = $result['ParsedResults'][0]['ParsedText'];
        $source = 'ocr.space';
    }
}

$debug_info['ocrspace_error'] = $curl_error ?: ($http_code !== 200 ? "HTTP $http_code" : null);

// === TESSERACT FALLBACK ===
if ($raw_text === null || trim($raw_text) === '') {
    $debug_info['tesseract_fallback'] = true;

    $processed_path = preprocess_for_tesseract($tmp_path, $id_type);
    $use_path = $processed_path !== $tmp_path ? $processed_path : $tmp_path;

    $exe = escapeshellarg($TESSERACT_CMD);
    $input = escapeshellarg($use_path);

    foreach ([4, 6, 3] as $psm) {
        $cmd = "$exe $input stdout -l eng --psm $psm";
        $output = shell_exec($cmd . ' 2>&1');
        if ($output !== null && trim($output) !== '' && stripos($output, 'error') === false) {
            if (!$raw_text || strlen(trim($output)) > strlen($raw_text)) {
                $raw_text = $output;
                $source = 'tesseract';
            }
        }
    }

    if ($processed_path !== $tmp_path && file_exists($processed_path)) {
        @unlink($processed_path);
    }
}

if ($raw_text === null || trim($raw_text) === '') {
    ob_end_clean();
    echo json_encode([
        "success" => false,
        "error" => "Both OCR methods failed",
        "debug_info" => $debug ? $debug_info : null
    ]);
    exit;
}

// === PARSE ===
$raw_lines = array_filter(array_map('trim', explode("\n", $raw_text)));
$extracted_data = parse_id_data($raw_lines, $id_type, $source);

$response = [
    "success" => true,
    "data" => $extracted_data,
    "raw" => $raw_text,
    "source" => $source
];

if ($debug) {
    $response["debug_info"] = $debug_info;
}

ob_end_clean();
echo json_encode($response);