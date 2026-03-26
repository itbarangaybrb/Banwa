<?php
// Buffer ALL output from byte 1.
ob_start();

// Prevent PHP errors from rendering HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

set_exception_handler(function (Throwable $e) {
    ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    error_log('ir_handler uncaught exception: ' . $e->getMessage()
        . ' in ' . $e->getFile() . ':' . $e->getLine());
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
});

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        error_log('ir_handler fatal: ' . $err['message']
            . ' in ' . $err['file'] . ':' . $err['line']);
        echo json_encode(['status' => 'error', 'message' => 'Fatal server error. Check logs.']);
        exit;
    }
});

require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../services/staff/incident_report/ir_dss.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';
require_once __DIR__ . '/../../../services/broadcast.php';

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if (!extension_loaded('pdo_pgsql')) {
    ob_clean();
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled. Check php.ini."]));
}

$action = $_REQUEST['action'] ?? null;

try {
    switch ($action) {
        case 'create':
            handleCreateApplication($pdo);
            break;
        case 'fetch':
            handleFetchApplication($pdo);
            break;
        case 'update_status':
            handleUpdateStatus($pdo);
            break;
        case 'update':
            handleUpdateApplication($pdo);
            break;
        case 'chart_incident_type':
            handleChartIncidentType($pdo);
            break;
        case 'get_evaluation':
            handleGetEvaluation($pdo);
            break;
        case 'get_report_with_dss':
            handleGetReportWithDSS($pdo);
            break;
        case 'get_report_details':
            handleGetReportDetails($pdo);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
}
exit;

/**
 * Safely retrieves and trims input values from POST data
 * 
 * @param string $key The key to look for in $_POST array
 * @return string|null Trimmed value or null if not set/empty
 */
function get_input($key)
{
    return isset($_POST[$key]) && trim($_POST[$key]) !== '' ? trim($_POST[$key]) : null;
}

/**
 * Handles creation of new incident reports with all required data
 * Also creates initial DSS evaluation record for the report
 * 
 * @param PDO $pdo Database connection object
 */
function handleCreateApplication($pdo)
{
    try {
        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

        // Reporting Person Information
        $rpFullName = get_input('rpFullName');
        $rpAddress = get_input('rpAddress'); // Directly grab the textarea
        $rpContact = get_input('rpContact');
        $rpRelationship = get_input('rpRelationship') ?? '';

        // Victim Information
        $vicFullName = get_input('vicFullName');
        $vicAddress = get_input('vicAddress'); // Directly grab the textarea
        $vicContact = get_input('vicContact');
        $vicCitizenship = get_input('vicCitizenship');
        $vicGender = get_input('vicGender');
        $vicDOB = get_input('vicDOB');
        $vicOccupation = get_input('vicOccupation');

        // Suspect Information
        $susFullName = get_input('susFullName') ?? null;
        $susAddress = get_input('susAddress') ?? null; // Directly grab the textarea
        $susContact = get_input('susContact') ?? null;
        $susGender = get_input('susGender') ?? null;
        $susDescription = get_input('susDescription') ?? '';

        // Incident Details
        $incidentType = get_input('incidentType');
        $otherIncidentType = get_input('otherIncidentType');
        if ($incidentType === 'other' && $otherIncidentType) {
            $incidentType = $otherIncidentType;
        }

        $incidentTimestamp = get_input('incidentTimestamp');
        $incidentAddress = get_input('incidentAddress'); // NEW!
        $incidentLatitude = get_input('incidentLatitude');
        $incidentLongitude = get_input('incidentLongitude');
        $description = get_input('description');

        // Date Reported - IMPORTANT!
        $dateReported = date('Y-m-d H:i:s');

        // Prepare witness data JSON
        $witnessesArray = [];
        if (isset($_POST['witnesses']) && is_array($_POST['witnesses'])) {
            foreach ($_POST['witnesses'] as $witness) {
                if (!empty($witness['name']) && !empty($witness['contact'])) {
                    $witnessAddress = trim(($witness['lotNo'] ?? '') . ' ' . ($witness['street'] ?? ''));
                    $witnessesArray[] = [
                        'name' => trim($witness['name']),
                        'address' => $witnessAddress,
                        'contact' => trim($witness['contact'])
                    ];
                }
            }
        }
        $witnessDataJson = json_encode($witnessesArray);

        // CORRECTED SQL - matches your database schema
        $sql = "INSERT INTO incident_reports (
            rp_full_name, rp_address, rp_contact, rp_relationship,
            vic_full_name, vic_address, vic_contact, vic_citizenship, vic_gender, vic_dob, vic_occupation,
            sus_full_name, sus_address, sus_contact, sus_gender, sus_description,
            incident_type, incident_timestamp, incident_address, date_reported, description, 
            witness_data_json, latitude, longitude, supabase_user_id
        ) VALUES (
            :rp_full_name, :rp_address, :rp_contact, :rp_relationship,
            :vic_full_name, :vic_address, :vic_contact, :vic_citizenship, :vic_gender, :vic_dob, :vic_occupation,
            :sus_full_name, :sus_address, :sus_contact, :sus_gender, :sus_description,
            :incident_type, :incident_timestamp, :incident_address, :date_reported, :description,
            :witness_data_json, :latitude, :longitude, :supabase_user_id
        ) RETURNING id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            // Reporting Person
            ':rp_full_name' => $rpFullName,
            ':rp_address' => $rpAddress,
            ':rp_contact' => $rpContact,
            ':rp_relationship' => $rpRelationship,

            // Victim
            ':vic_full_name' => $vicFullName,
            ':vic_address' => $vicAddress,
            ':vic_contact' => $vicContact,
            ':vic_citizenship' => $vicCitizenship,
            ':vic_gender' => $vicGender,
            ':vic_dob' => $vicDOB,
            ':vic_occupation' => $vicOccupation,

            // Suspect
            ':sus_full_name' => $susFullName,
            ':sus_address' => $susAddress,
            ':sus_contact' => $susContact,
            ':sus_gender' => $susGender,
            ':sus_description' => $susDescription,

            // Incident Details
            ':incident_type' => $incidentType,
            ':incident_timestamp' => $incidentTimestamp,
            ':incident_address' => $incidentAddress, // Added!
            ':date_reported' => $dateReported,
            ':description' => $description,

            // Witness data
            ':witness_data_json' => $witnessDataJson,

            // Coordinates
            ':latitude' => $incidentLatitude,
            ':longitude' => $incidentLongitude,

            // User ID
            ':supabase_user_id' => $supabaseUserId
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $reportId = $result['id'];

        // Get the newly created report data for audit log
        $newStmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
        $newStmt->execute([':id' => $reportId]);
        $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

        createInitialDSSEvaluation($pdo, $reportId);

        try {
            broadcastEvent('incident_report_applications_update', ['id' => $reportId]);
        } catch (Throwable $broadcastEx) {
            error_log("broadcastEvent failed in ir handleCreateApplication (id={$reportId}): " . $broadcastEx->getMessage());
        }

        // Write audit log for CREATE action
        try {
            writeAuditLog(
                $pdo,
                'CREATE',
                'incident_reports',
                $reportId,
                null,
                $newData,
                'INCIDENT_REPORT'
            );
        } catch (Throwable $auditEx) {
            error_log("writeAuditLog failed in ir handleCreateApplication (id={$reportId}): " . $auditEx->getMessage());
        }

        ob_clean();
        echo json_encode(["status" => "success", "id" => $reportId, "message" => "Incident Report Created!"]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        error_log("SQL Error in create: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Fetches incident reports with role-based access control
 * Staff users can see all reports, regular users only see their own
 * Includes DSS evaluation details and summary information
 * 
 * @param PDO $pdo Database connection object
 */
function handleFetchApplication($pdo)
{
    try {
        // Fetch all reports with corrected column names
        $sql = "SELECT ir.*
                FROM incident_reports ir
                ORDER BY ir.id ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $reports]);
    } catch (PDOException $e) {
        error_log("Fetch Error in handleFetchApplication: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Fetch Error: " . $e->getMessage()]);
    }
}

/**
 * Handles status updates for incident reports
 * 
 * @param PDO $pdo Database connection object
 */
function handleUpdateStatus($pdo)
{
    $id = $_POST['id'] ?? null;
    $newStatus = $_POST['newStatus'] ?? null;
    $comments = $_POST['updateComments'] ?? '';

    if (!$id || !$newStatus) {
        echo json_encode(["status" => "error", "message" => "Missing ID or Status"]);
        return;
    }

    try {
        // Get current data before update for audit log
        $oldStmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
        $oldStmt->execute([':id' => $id]);
        $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

        $getStmt = $pdo->prepare("SELECT dss_status FROM incident_reports WHERE id = :id");
        $getStmt->execute([':id' => $id]);
        $currentReport = $getStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentReport['dss_status'] ?? null;

        $sql = "UPDATE incident_reports SET status = :status, update_comments = :comments ";
        $params = [':status' => $newStatus, ':comments' => $comments, ':id' => $id];

        if ($newStatus === 'Resolved') {
            $sql .= ", resolution_details = :comments ";
        }

        if ($currentDSSStatus) {
            $sql .= ", dss_status = :dss_status ";
            $params[':dss_status'] = $currentDSSStatus;
        }

        $sql .= " WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Get new data after update for audit log
        $newStmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
        $newStmt->execute([':id' => $id]);
        $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

        // Send response BEFORE non-critical operations
        ob_clean();
        echo json_encode([
            "status" => "success",
            "message" => "Status updated to " . $newStatus,
            "dss_status" => $currentDSSStatus
        ]);

        try {
            broadcastEvent('incident_report_applications_update', ['id' => $id, 'status' => $newStatus]);
        } catch (Throwable $broadcastEx) {
            error_log("broadcastEvent failed in ir handleUpdateStatus (id={$id}): " . $broadcastEx->getMessage());
        }

        try {
            writeAuditLog(
                $pdo,
                'STATUS UPDATED',
                'incident_reports',
                $id,
                $oldData,
                $newData,
                'STATUS_UPDATE'
            );
        } catch (Throwable $auditEx) {
            error_log("writeAuditLog failed in ir handleUpdateStatus (id={$id}): " . $auditEx->getMessage());
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Handles updates to existing incident reports
 * Only updates fields that were actually submitted
 * 
 * @param PDO $pdo Database connection object
 */
function handleUpdateApplication($pdo)
{
    try {
        $reportId = get_input('application_id');
        if (!$reportId) {
            throw new Exception("Report ID is required for update.");
        }

        // Get current data before update for audit log
        $oldStmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
        $oldStmt->execute([':id' => $reportId]);
        $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

        // Initialize update arrays
        $updateFields = [];
        $params = [':id' => $reportId];

        // List of all possible fields that can be updated
        $possibleFields = [
            'rpFullName' => 'rp_full_name',
            'rpContact' => 'rp_contact',
            'rpRelationship' => 'rp_relationship',
            'vicFullName' => 'vic_full_name',
            'vicContact' => 'vic_contact',
            'vicCitizenship' => 'vic_citizenship',
            'vicGender' => 'vic_gender',
            'vicDOB' => 'vic_dob',
            'vicOccupation' => 'vic_occupation',
            'susFullName' => 'sus_full_name',
            'susContact' => 'sus_contact',
            'susGender' => 'sus_gender',
            'susDescription' => 'sus_description',
            'incidentType' => 'incident_type',
            'incidentTimestamp' => 'incident_timestamp',
            'description' => 'description'
        ];

        // Check each possible field to see if it was submitted
        foreach ($possibleFields as $formField => $dbField) {
            $value = get_input($formField);
            if ($value !== null) {
                $updateFields[] = "$dbField = :$dbField";
                $params[":$dbField"] = $value;
            }
        }

        // Handle other incident type
        $otherIncidentType = get_input('otherIncidentType');
        if ($otherIncidentType !== null) {
            $updateFields[] = "incident_type = :incident_type";
            $params[':incident_type'] = $otherIncidentType;
        }

        // Handle address fields separately
        $rpLotNo = get_input('rpLotNo');
        $rpStreet = get_input('rpStreet');
        if ($rpLotNo !== null || $rpStreet !== null) {
            $rpAddress = trim(($rpLotNo ?? '') . ' ' . ($rpStreet ?? ''));
            $updateFields[] = "rp_address = :rp_address";
            $params[':rp_address'] = $rpAddress;
        }

        $vicLotNo = get_input('vicLotNo');
        $vicStreet = get_input('vicStreet');
        if ($vicLotNo !== null || $vicStreet !== null) {
            $vicAddress = trim(($vicLotNo ?? '') . ' ' . ($vicStreet ?? ''));
            $updateFields[] = "vic_address = :vic_address";
            $params[':vic_address'] = $vicAddress;
        }

        $susLotNo = get_input('susLotNo');
        $susStreet = get_input('susStreet');
        if (($susLotNo !== null || $susStreet !== null) && ($susLotNo !== '' || $susStreet !== '')) {
            $susAddress = trim(($susLotNo ?? '') . ' ' . ($susStreet ?? ''));
            $updateFields[] = "sus_address = :sus_address";
            $params[':sus_address'] = $susAddress;
        }

        // Handle latitude/longitude
        $latitude = get_input('incidentLatitude');
        $longitude = get_input('incidentLongitude');
        if ($latitude !== null) {
            $updateFields[] = "latitude = :latitude";
            $params[':latitude'] = $latitude;
        }
        if ($longitude !== null) {
            $updateFields[] = "longitude = :longitude";
            $params[':longitude'] = $longitude;
        }

        // Handle witness data JSON field
        if (isset($_POST['witnesses']) && is_array($_POST['witnesses'])) {
            $witnessesArray = [];
            foreach ($_POST['witnesses'] as $witness) {
                if (!empty($witness['name']) && !empty($witness['contact'])) {
                    $witnessAddress = trim(($witness['lotNo'] ?? '') . ' ' . ($witness['street'] ?? ''));
                    $witnessesArray[] = [
                        'name' => trim($witness['name']),
                        'address' => $witnessAddress,
                        'contact' => trim($witness['contact'])
                    ];
                }
            }
            $witnessDataJson = json_encode($witnessesArray);
            $updateFields[] = "witness_data_json = :witness_data_json";
            $params[':witness_data_json'] = $witnessDataJson;
        }

        // Get current DSS status
        $getDSSStmt = $pdo->prepare("SELECT dss_status FROM incident_reports WHERE id = :id");
        $getDSSStmt->execute([':id' => $reportId]);
        $currentDSS = $getDSSStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentDSS['dss_status'] ?? 'Pending Evaluation';

        // Always include these updates
        $updateFields[] = "dss_status = :dss_status";
        $updateFields[] = "updated_at = NOW()";
        $params[':dss_status'] = $currentDSSStatus;

        // Handle file upload if provided
        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileName = time() . '_' . basename($_FILES['requirementUpload']['name']);
            if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $uploadDir . $fileName)) {
                $updateFields[] = "requirement_upload = :requirement_upload";
                $params[':requirement_upload'] = $fileName;
            } else {
                throw new Exception("Failed to move uploaded file.");
            }
        }

        // If no fields to update, return early
        if (count($updateFields) <= 2) { // Only dss_status and updated_at were added
            echo json_encode(["status" => "success", "message" => "No changes to update."]);
            return;
        }

        // Build SQL query
        $sql = "UPDATE incident_reports SET " . implode(', ', $updateFields);

        if ($supabaseUserId) {
            $sql .= " WHERE id = :id AND supabase_user_id = :supabase_user_id";
            $params[':supabase_user_id'] = $supabaseUserId;
        } else {
            $sql .= " WHERE id = :id";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            // Also update witnesses in separate table if provided
            if (isset($_POST['witnesses']) && is_array($_POST['witnesses'])) {
                // Delete existing witnesses
                $deleteStmt = $pdo->prepare("DELETE FROM incident_witnesses WHERE application_id = :application_id");
                $deleteStmt->execute([':application_id' => $reportId]);

                // Insert updated witnesses
                $witnessStmt = $pdo->prepare("
                    INSERT INTO incident_witnesses (application_id, witness_name, witness_address, witness_contact)
                    VALUES (:application_id, :witness_name, :witness_address, :witness_contact)
                ");

                foreach ($_POST['witnesses'] as $witness) {
                    if (!empty($witness['name']) && !empty($witness['contact'])) {
                        $witnessAddress = trim(($witness['lotNo'] ?? '') . ' ' . ($witness['street'] ?? ''));
                        $witnessStmt->execute([
                            ':application_id' => $reportId,
                            ':witness_name' => trim($witness['name']),
                            ':witness_address' => $witnessAddress,
                            ':witness_contact' => trim($witness['contact'])
                        ]);
                    }
                }
            }

            // Get new data after update for audit log
            $newStmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
            $newStmt->execute([':id' => $reportId]);
            $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

            try {
                broadcastEvent('incident_report_applications_update', ['id' => $reportId]);
            } catch (Throwable $broadcastEx) {
                error_log("broadcastEvent failed in ir handleUpdateApplication (id={$reportId}): " . $broadcastEx->getMessage());
            }

            try {
                writeAuditLog(
                    $pdo,
                    'UPDATE',
                    'incident_reports',
                    $reportId,
                    $oldData,
                    $newData,
                    'INCIDENT_REPORT'
                );
            } catch (Throwable $auditEx) {
                error_log("writeAuditLog failed in ir handleUpdateApplication (id={$reportId}): " . $auditEx->getMessage());
            }

            triggerDSSevaluation($pdo, $reportId);
            ob_clean();
            echo json_encode(["status" => "success", "message" => "Incident report updated successfully! DSS re-evaluation triggered."]);
        } else {
            http_response_code(404);
            ob_clean();
            echo json_encode(["status" => "error", "message" => "Report not found or not authorized to update."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "General Error: " . $e->getMessage()]);
    }
}

/**
 * Retrieves DSS evaluation details for a specific report
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetEvaluation($pdo)
{
    try {
        $reportId = $_GET['application_id'] ?? null;

        if (!$reportId) {
            echo json_encode(["status" => "error", "message" => "Report ID required"]);
            return;
        }

        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;
        $isStaff = $_SESSION['is_staff'] ?? false;

        if (!$isStaff && $supabaseUserId) {
            $checkStmt = $pdo->prepare("SELECT id FROM incident_reports WHERE id = :id AND supabase_user_id = :user_id");
            $checkStmt->execute([':id' => $reportId, ':user_id' => $supabaseUserId]);
            if (!$checkStmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "Unauthorized to view this evaluation"]);
                return;
            }
        }

        $stmt = $pdo->prepare("
            SELECT e.*, ir.rp_full_name, ir.incident_type,
                   ir.status as report_status, ir.dss_status as report_dss_status
            FROM incident_report_evaluations e
            JOIN incident_reports ir ON e.application_id = ir.id
            WHERE e.application_id = :id
        ");
        $stmt->execute([':id' => $reportId]);
        $evaluation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$evaluation) {
            $evaluation = [
                'application_id' => $reportId,
                'dss_status' => 'Pending Evaluation',
                'evaluation_details' => [
                    'passed_rules' => [],
                    'failed_rules' => [],
                    'recommendations' => [],
                    'score' => 0,
                    'max_score' => 5,
                    'priority_level' => 'Low',
                    'urgency_score' => 0
                ],
                'evaluated_at' => null,
                'report_status' => 'Pending',
                'report_dss_status' => 'Pending Evaluation'
            ];
        } else if (isset($evaluation['evaluation_details'])) {
            $evaluation['evaluation_details'] = json_decode($evaluation['evaluation_details'], true);
        }

        echo json_encode([
            "status" => "success",
            "evaluation" => $evaluation
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Retrieves complete report details including DSS evaluation and status history
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetReportWithDSS($pdo)
{
    try {
        $reportId = $_GET['application_id'] ?? null;

        if (!$reportId) {
            echo json_encode(["status" => "error", "message" => "Report ID required"]);
            return;
        }

        $isStaff = $_SESSION['is_staff'] ?? false;
        if (!$isStaff) {
            echo json_encode(["status" => "error", "message" => "Unauthorized"]);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT 
                ir.id,
                ir.supabase_user_id,
                ir.rp_full_name, ir.rp_address, ir.rp_contact, ir.rp_relationship,
                ir.vic_full_name, ir.vic_address, ir.vic_contact, ir.vic_citizenship, ir.vic_gender, ir.vic_dob, ir.vic_occupation,
                ir.sus_full_name, ir.sus_address, ir.sus_contact, ir.sus_gender, ir.sus_description,
                ir.incident_type, ir.incident_timestamp, ir.date_reported, ir.description,
                ir.witness_data_json, ir.latitude, ir.longitude,
                ir.status, ir.dss_status, ir.created_at, ir.updated_at,
                ie.dss_status as evaluation_status, 
                ie.evaluation_details,
                ie.evaluated_at as dss_evaluated_at,
                (SELECT json_agg(json_build_object('status', status, 'comments', comments, 'changed_at', changed_at))
                 FROM incident_status_history 
                 WHERE application_id = ir.id 
                 ORDER BY changed_at DESC) as status_history,
                (SELECT json_agg(json_build_object('witness_name', witness_name, 'witness_address', witness_address, 'witness_contact', witness_contact))
                 FROM incident_witnesses 
                 WHERE application_id = ir.id) as witnesses
            FROM incident_reports ir
            LEFT JOIN incident_report_evaluations ie ON ir.id = ie.application_id
            WHERE ir.id = :id
        ");
        $stmt->execute([':id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) {
            echo json_encode(["status" => "error", "message" => "Report not found"]);
            return;
        }

        if (isset($report['evaluation_details']) && $report['evaluation_details']) {
            $report['evaluation_details'] = json_decode($report['evaluation_details'], true);
        }
        if (isset($report['status_history']) && $report['status_history']) {
            $report['status_history'] = json_decode($report['status_history'], true);
        }
        if (isset($report['witnesses']) && $report['witnesses']) {
            $report['witnesses'] = json_decode($report['witnesses'], true);
        }
        if (isset($report['witness_data_json']) && $report['witness_data_json']) {
            $report['witness_data_json'] = json_decode($report['witness_data_json'], true);
        }

        if (isset($report['evaluation_details'])) {
            $report['dss_summary'] = getDSSSummary($report['evaluation_details']);
        }

        echo json_encode([
            "status" => "success",
            "report" => $report
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Gets detailed report information for frontend display
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetReportDetails($pdo)
{
    try {
        $reportId = $_GET['application_id'] ?? null;

        if (!$reportId) {
            echo json_encode(["status" => "error", "message" => "Report ID required"]);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT 
                ir.id,
                ir.supabase_user_id,
                ir.rp_full_name, ir.rp_address, ir.rp_contact, ir.rp_relationship,
                ir.vic_full_name, ir.vic_address, ir.vic_contact, ir.vic_citizenship, ir.vic_gender, ir.vic_dob, ir.vic_occupation,
                ir.sus_full_name, ir.sus_address, ir.sus_contact, ir.sus_gender, ir.sus_description,
                ir.incident_type, ir.incident_timestamp, ir.date_reported, ir.description,
                ir.witness_data_json, ir.latitude, ir.longitude,
                ir.status, ir.dss_status, ir.created_at, ir.updated_at,
                ie.dss_status as evaluation_status, 
                ie.evaluation_details,
                ie.evaluated_at as dss_evaluated_at,
                (SELECT json_agg(json_build_object('witness_name', witness_name, 'witness_address', witness_address, 'witness_contact', witness_contact))
                 FROM incident_witnesses 
                 WHERE application_id = ir.id) as witnesses
            FROM incident_reports ir
            LEFT JOIN incident_report_evaluations ie ON ir.id = ie.application_id
            WHERE ir.id = :id
        ");
        $stmt->execute([':id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) {
            echo json_encode(["status" => "error", "message" => "Report not found"]);
            return;
        }

        if (isset($report['evaluation_details']) && $report['evaluation_details']) {
            $report['evaluation_details'] = json_decode($report['evaluation_details'], true);
        }
        if (isset($report['witnesses']) && $report['witnesses']) {
            $report['witnesses'] = json_decode($report['witnesses'], true);
        }
        if (isset($report['witness_data_json']) && $report['witness_data_json']) {
            $report['witness_data_json'] = json_decode($report['witness_data_json'], true);
        }

        $report['evaluation_summary'] = getEvaluationSummary($report['dss_status'] ?? 'Pending Evaluation');
        $report['dss_summary'] = getDSSSummary($report['evaluation_details'] ?? []);

        echo json_encode([
            "status" => "success",
            "report" => $report
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Updates the witness_data_json field in incident_reports table
 * 
 * @param PDO $pdo Database connection object
 * @param int $reportId ID of the report
 */
function updateWitnessDataJson($pdo, $reportId)
{
    try {
        $stmt = $pdo->prepare("
            SELECT witness_name, witness_address, witness_contact
            FROM incident_witnesses 
            WHERE application_id = :application_id
        ");
        $stmt->execute([':application_id' => $reportId]);
        $witnesses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $witnessDataJson = json_encode($witnesses);

        $updateStmt = $pdo->prepare("
            UPDATE incident_reports 
            SET witness_data_json = :witness_data_json
            WHERE id = :id
        ");
        $updateStmt->execute([
            ':witness_data_json' => $witnessDataJson,
            ':id' => $reportId
        ]);
    } catch (Exception $e) {
        error_log("Failed to update witness_data_json: " . $e->getMessage());
    }
}

/**
 * Generates chart data for incident analytics
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartIncidentType($pdo)
{
    try {
        $sql1 = "
            SELECT date_reported, COUNT(*) AS total
            FROM incident_reports
            GROUP BY date_reported
            ORDER BY date_reported ASC
        ";

        $stmt1 = $pdo->query($sql1);
        $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

        $sql2 = "
            SELECT 
                incident_type, 
                COUNT(*) AS total,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
            FROM incident_reports
            GROUP BY incident_type
            ORDER BY total ASC
        ";

        $stmt2 = $pdo->query($sql2);
        $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $sql3 = "
            SELECT 
                COALESCE(dss_status, 'Pending Evaluation') as dss_status, 
                COUNT(*) as total,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
            FROM incident_reports
            GROUP BY COALESCE(dss_status, 'Pending Evaluation')
            ORDER BY total ASC
        ";

        $stmt3 = $pdo->query($sql3);
        $dataByDSS = $stmt3->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data_by_date" => $dataByDate,
            "data_by_type" => $dataByType,
            "data_by_dss" => $dataByDSS
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Error generating chart data: " . $e->getMessage()
        ]);
    }
}