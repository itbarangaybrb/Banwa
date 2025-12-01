<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = __DIR__;
$dataFile = $baseDir . '/data.json';

// Ensure data file exists
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}

$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

function read_data($file) {
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    if (!is_array($data)) $data = [];
    return $data;
}

function write_data($file, $data) {
    $tmp = tempnam(sys_get_temp_dir(), 'data');
    file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT));
    rename($tmp, $file);
}

if ($action === 'fetch') {
    $applications = read_data($dataFile);
    echo json_encode(['status' => 'success', 'data' => $applications]);
    exit;
}

if ($action === 'create') {
    // Map incoming fields to the schema expected by the front-end JS
    $requestDate = isset($_POST['requestDate']) ? trim($_POST['requestDate']) : date('Y-m-d');
    $dateOfWork = isset($_POST['dateOfWork']) ? trim($_POST['dateOfWork']) : '';
    $fullname = isset($_POST['fullname']) ? trim($_POST['fullname']) : '';
    $contactNo = isset($_POST['contactNo']) ? trim($_POST['contactNo']) : '';
    $address = isset($_POST['address']) ? trim($_POST['address']) : '';
    $provider = isset($_POST['provider']) ? trim($_POST['provider']) : '';
    $natureOfWork = isset($_POST['natureOfWork']) ? trim($_POST['natureOfWork']) : '';

    // split fullname into first/last (best effort)
    $first_name = $fullname;
    $middle_name = '';
    $last_name = '';
    if ($fullname !== '') {
        $parts = preg_split('/\s+/', $fullname);
        if (count($parts) === 1) {
            $first_name = $parts[0];
        } elseif (count($parts) === 2) {
            $first_name = $parts[0];
            $last_name = $parts[1];
        } else {
            $first_name = $parts[0];
            $last_name = array_pop($parts);
            $middle_name = implode(' ', array_slice($parts, 1, -0));
        }
    }

    // Build application object matching what utilities.js expects
    $applications = read_data($dataFile);
    $maxId = 0;
    foreach ($applications as $a) { if (isset($a['id']) && $a['id'] > $maxId) $maxId = $a['id']; }
    $newId = $maxId + 1;

    $app = [
        'id' => $newId,
        // use provider as business_name so UI shows it in the table
        'business_name' => $provider ?: ($fullname ?: 'Utilities Application'),
        'type_of_business' => $natureOfWork,
        'nature_of_business' => $natureOfWork,
        'address_of_business' => $address,
        'business_status' => '',
        'telephone_no_business' => $contactNo,
        'email_address' => isset($_POST['emailAddress']) ? trim($_POST['emailAddress']) : '',

        'first_name' => $first_name,
        'middle_name' => $middle_name,
        'last_name' => $last_name,
        'telephone_no_owner' => $contactNo,
        'address_owner' => $address,

        'type_of_structure' => '',
        'no_of_employees' => 0,

        'requirements' => [],
        'requirement_upload' => '',

        'application_date' => $requestDate,
        'status' => 'Pending',
        'payment_status' => 'Unpaid',
        'amount_due' => 0,
        'approval_comments' => '',
        'disapproval_reason' => ''
    ];

    // Optionally handle file upload (requirementUpload)
    if (!empty($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
        $uploadsDir = $baseDir . '/uploads';
        if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);
        $tmpName = $_FILES['requirementUpload']['tmp_name'];
        $origName = basename($_FILES['requirementUpload']['name']);
        $target = $uploadsDir . '/' . $newId . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $origName);
        if (move_uploaded_file($tmpName, $target)) {
            $app['requirement_upload'] = basename($target);
        }
    }

    $applications[] = $app;
    write_data($dataFile, $applications);

    echo json_encode(['status' => 'success', 'id' => $newId]);
    exit;
}

if ($action === 'update_status') {
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $newStatus = isset($_POST['newStatus']) ? trim($_POST['newStatus']) : '';
    $assessmentAmount = isset($_POST['assessmentAmount']) ? floatval($_POST['assessmentAmount']) : 0;
    $updateComments = isset($_POST['updateComments']) ? trim($_POST['updateComments']) : '';

    $applications = read_data($dataFile);
    $found = false;
    foreach ($applications as &$app) {
        if (isset($app['id']) && intval($app['id']) === $id) {
            $found = true;
            $app['status'] = $newStatus ?: $app['status'];
            if ($assessmentAmount > 0) {
                $app['amount_due'] = number_format($assessmentAmount, 2, '.', '');
                $app['payment_status'] = 'Unpaid';
            }
            // store comments appropriately
            if ($newStatus === 'Approved') {
                $app['approval_comments'] = $updateComments;
            } elseif ($newStatus === 'Disapproved') {
                $app['disapproval_reason'] = $updateComments;
            } else {
                // generic remarks
                $app['remarks'] = $updateComments;
            }
            break;
        }
    }
    unset($app);

    if (!$found) {
        echo json_encode(['status' => 'error', 'message' => 'Application not found']);
        exit;
    }

    write_data($dataFile, $applications);
    echo json_encode(['status' => 'success']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
exit;

?>
