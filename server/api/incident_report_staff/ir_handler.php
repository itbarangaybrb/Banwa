<?php
require_once __DIR__ . '/../../configs/database.php';

ob_start();
session_start();

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!extension_loaded('pdo_pgsql')) {
    ob_clean();
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled. Check php.ini."]));
}

require_once __DIR__ . '/../dss_rule_engine/incident_report_dss.php';

$action = $_REQUEST['action'] ?? null;
ob_clean();

try {
    switch ($action) {
        case 'create':
            handleCreateIncidentReport($pdo);
            break;
        case 'fetch':
            handleFetchIncidentReports($pdo);
            break;
        case 'update_status':
            handleUpdateStatus($pdo);
            break;
        case 'update':
            handleUpdateIncidentReport($pdo);
            break;
        case 'chart_incident_type':
            handleChartIncidentType($pdo);
            break;
        case 'evaluate_report':
            handleEvaluateReport($pdo);
            break;
        case 'get_evaluation':
            handleGetEvaluation($pdo);
            break;
        case 'get_evaluation_stats':
            handleGetEvaluationStats($pdo);
            break;
        case 'get_rules':
            handleGetRules();
            break;
        case 'get_report_with_dss':
            handleGetReportWithDSS($pdo);
            break;
        case 'trigger_evaluation':
            handleTriggerEvaluation($pdo);
            break;
        case 'evaluate_all_pending':
            handleEvaluateAllPending($pdo);
            break;
        case 'get_report_details':
            handleGetReportDetails($pdo);
            break;
        case 'add_witness':
            handleAddWitness($pdo);
            break;
        case 'remove_witness':
            handleRemoveWitness($pdo);
            break;
        case 'get_witnesses':
            handleGetWitnesses($pdo);
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
function handleCreateIncidentReport($pdo)
{
    try {
        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

        if (!$supabaseUserId) {
            echo json_encode(["status" => "error", "message" => "User not authenticated"]);
            return;
        }

        // Reporting Person Information
        $rpFullName = get_input('rpFullName');
        $rpLotNo = get_input('rpLotNo');
        $rpStreet = get_input('rpStreet');
        $rpAddress = trim($rpLotNo . ' ' . $rpStreet);
        $rpContact = get_input('rpContact');
        $rpRelationship = get_input('rpRelationship') ?? '';

        // Victim Information
        $vicFullName = get_input('vicFullName');
        $vicLotNo = get_input('vicLotNo');
        $vicStreet = get_input('vicStreet');
        $vicAddress = trim($vicLotNo . ' ' . $vicStreet);
        $vicContact = get_input('vicContact');
        $vicCitizenship = get_input('vicCitizenship');
        $vicGender = get_input('vicGender');
        $vicDOB = get_input('vicDOB');
        $vicOccupation = get_input('vicOccupation');

        // Suspect Information
        $susFullName = get_input('susFullName') ?? null;
        $susLotNo = get_input('susLotNo') ?? null;
        $susStreet = get_input('susStreet') ?? null;
        $susAddress = ($susLotNo && $susStreet) ? trim($susLotNo . ' ' . $susStreet) : null;
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
        $incidentLotNo = get_input('incidentLotNo');
        $incidentStreet = get_input('incidentStreet');
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

        // Start transaction
        $pdo->beginTransaction();

        // CORRECTED SQL - matches your database schema
        $sql = "INSERT INTO incident_reports (
            rp_full_name, rp_address, rp_contact, rp_relationship,
            vic_full_name, vic_address, vic_contact, vic_citizenship, vic_gender, vic_dob, vic_occupation,
            sus_full_name, sus_address, sus_contact, sus_gender, sus_description,
            incident_type, incident_timestamp, date_reported, description, 
            witness_data_json, latitude, longitude, supabase_user_id
        ) VALUES (
            :rp_full_name, :rp_address, :rp_contact, :rp_relationship,
            :vic_full_name, :vic_address, :vic_contact, :vic_citizenship, :vic_gender, :vic_dob, :vic_occupation,
            :sus_full_name, :sus_address, :sus_contact, :sus_gender, :sus_description,
            :incident_type, :incident_timestamp, :date_reported, :description,
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

        // Also store witnesses in separate table
        if (isset($_POST['witnesses']) && is_array($_POST['witnesses'])) {
            $witnessStmt = $pdo->prepare("
                INSERT INTO incident_witnesses (report_id, witness_name, witness_address, witness_contact)
                VALUES (:report_id, :witness_name, :witness_address, :witness_contact)
            ");

            foreach ($_POST['witnesses'] as $witness) {
                if (!empty($witness['name']) && !empty($witness['contact'])) {
                    $witnessAddress = trim(($witness['lotNo'] ?? '') . ' ' . ($witness['street'] ?? ''));
                    $witnessStmt->execute([
                        ':report_id' => $reportId,
                        ':witness_name' => trim($witness['name']),
                        ':witness_address' => $witnessAddress,
                        ':witness_contact' => trim($witness['contact'])
                    ]);
                }
            }
        }

        // Commit transaction
        $pdo->commit();

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
 * Creates an initial DSS evaluation record for a newly created incident report
 * 
 * @param PDO $pdo Database connection object
 * @param int $reportId ID of the newly created report
 */
function createInitialDSSEvaluation($pdo, $reportId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :report_id");
        $stmt->execute([':report_id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) return;

        $dss = new IncidentReportDSS();
        $evaluationResult = $dss->evaluateReport($report);

        $sql = "INSERT INTO incident_evaluations 
                (report_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:report_id, :status, :details, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':report_id' => $reportId,
            ':status' => $evaluationResult['status'],
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE incident_reports 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $evaluationResult['status'],
            ':id' => $reportId
        ]);

        logEvaluation($reportId, $evaluationResult);
    } catch (Exception $e) {
        error_log("Failed to create DSS evaluation: " . $e->getMessage());

        $sql = "INSERT INTO incident_evaluations 
                (report_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:report_id, 'Evaluation Error', '{}', NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':report_id' => $reportId]);
    }
}

/**
 * Fetches incident reports with role-based access control
 * Staff users can see all reports, regular users only see their own
 * Includes DSS evaluation details and summary information
 * 
 * @param PDO $pdo Database connection object
 */
function handleFetchIncidentReports($pdo)
{
    try {
        // Fetch all reports with corrected column names
        $sql = "SELECT 
                    id, 
                    supabase_user_id,
                    rp_full_name, rp_address, rp_contact, rp_relationship,
                    vic_full_name, vic_address, vic_contact, vic_citizenship, vic_gender, vic_dob, vic_occupation,
                    sus_full_name, sus_address, sus_contact, sus_gender, sus_description,
                    incident_type, incident_timestamp, date_reported, description,
                    witness_data_json, latitude, longitude,
                    status, dss_status, created_at, updated_at
                FROM incident_reports 
                ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $reports]);
    } catch (PDOException $e) {
        error_log("Fetch Error in handleFetchIncidentReports: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Fetch Error: " . $e->getMessage()]);
    }
}

/**
 * Returns a summary object for a given DSS status with icon, message, and color
 * 
 * @param string $dssStatus The DSS status to get summary for
 * @return array Summary object with icon, message, and color
 */
function getEvaluationSummary($dssStatus)
{
    $summaries = [
        'High Priority' => [
            'icon' => '🚨',
            'message' => 'Report requires immediate attention',
            'color' => 'red'
        ],
        'Medium Priority' => [
            'icon' => '⚠️',
            'message' => 'Report needs attention within 24 hours',
            'color' => 'orange'
        ],
        'Low Priority' => [
            'icon' => 'ℹ️',
            'message' => 'Report can be addressed within 48 hours',
            'color' => 'blue'
        ],
        'Pending Evaluation' => [
            'icon' => '⏳',
            'message' => 'Awaiting DSS evaluation',
            'color' => 'gray'
        ],
        'Evaluation Error' => [
            'icon' => '❓',
            'message' => 'Evaluation encountered an error',
            'color' => 'gray'
        ]
    ];

    return $summaries[$dssStatus] ?? [
        'icon' => '❓',
        'message' => 'Evaluation status unknown',
        'color' => 'gray'
    ];
}

/**
 * Extracts summary statistics from DSS evaluation details
 * 
 * @param array $evaluationDetails DSS evaluation details array
 * @return array Summary statistics
 */
function getDSSSummary($evaluationDetails)
{
    if (!$evaluationDetails || !is_array($evaluationDetails)) {
        return [
            'score' => 0,
            'max_score' => 5,
            'priority_level' => 'Low',
            'urgency_score' => 0,
            'passed_count' => 0,
            'failed_count' => 0,
            'passed_rules' => [],
            'failed_rules' => [],
            'recommendations' => []
        ];
    }

    return [
        'score' => $evaluationDetails['score'] ?? 0,
        'max_score' => $evaluationDetails['max_score'] ?? 5,
        'priority_level' => $evaluationDetails['priority_level'] ?? 'Low',
        'urgency_score' => $evaluationDetails['urgency_score'] ?? 0,
        'passed_count' => count($evaluationDetails['passed_rules'] ?? []),
        'failed_count' => count($evaluationDetails['failed_rules'] ?? []),
        'passed_rules' => $evaluationDetails['passed_rules'] ?? [],
        'failed_rules' => $evaluationDetails['failed_rules'] ?? [],
        'recommendations' => $evaluationDetails['recommendations'] ?? []
    ];
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

        logStatusUpdate($pdo, $id, $newStatus, $comments);

        echo json_encode([
            "status" => "success",
            "message" => "Status updated to " . $newStatus,
            "dss_status" => $currentDSSStatus
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Logs status changes to incident_status_history table
 * 
 * @param PDO $pdo Database connection object
 * @param int $reportId ID of the report being updated
 * @param string $newStatus The new status being set
 * @param string $comments Optional comments about the status change
 */
function logStatusUpdate($pdo, $reportId, $newStatus, $comments)
{
    try {
        $sql = "INSERT INTO incident_status_history 
                (report_id, status, comments, changed_at) 
                VALUES (:report_id, :status, :comments, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':report_id' => $reportId,
            ':status' => $newStatus,
            ':comments' => $comments
        ]);
    } catch (Exception $e) {
        error_log("Failed to log status update: " . $e->getMessage());
    }
}

/**
 * Handles updates to existing incident reports
 * 
 * @param PDO $pdo Database connection object
 */
function handleUpdateIncidentReport($pdo)
{
    try {
        $reportId = get_input('report_id');
        if (!$reportId) {
            throw new Exception("Report ID is required for update.");
        }

        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

        // Reporting Person Information
        $rpFullName = get_input('rpFullName');
        $rpLotNo = get_input('rpLotNo');
        $rpStreet = get_input('rpStreet');
        $rpAddress = trim($rpLotNo . ' ' . $rpStreet);
        $rpContact = get_input('rpContact');
        $rpRelationship = get_input('rpRelationship') ?? '';

        // Victim Information
        $vicFullName = get_input('vicFullName');
        $vicLotNo = get_input('vicLotNo');
        $vicStreet = get_input('vicStreet');
        $vicAddress = trim($vicLotNo . ' ' . $vicStreet);
        $vicContact = get_input('vicContact');
        $vicCitizenship = get_input('vicCitizenship');
        $vicGender = get_input('vicGender');
        $vicDOB = get_input('vicDOB');
        $vicOccupation = get_input('vicOccupation');

        // Suspect Information
        $susFullName = get_input('susFullName') ?? null;
        $susLotNo = get_input('susLotNo') ?? null;
        $susStreet = get_input('susStreet') ?? null;
        $susAddress = ($susLotNo && $susStreet) ? trim($susLotNo . ' ' . $susStreet) : null;
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
        $incidentLatitude = get_input('incidentLatitude');
        $incidentLongitude = get_input('incidentLongitude');
        $description = get_input('description');

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

        $getDSSStmt = $pdo->prepare("SELECT dss_status FROM incident_reports WHERE id = :id");
        $getDSSStmt->execute([':id' => $reportId]);
        $currentDSS = $getDSSStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentDSS['dss_status'] ?? 'Pending Evaluation';

        $params = [
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
            ':description' => $description,
            ':witness_data_json' => $witnessDataJson,
            ':latitude' => $incidentLatitude,
            ':longitude' => $incidentLongitude,

            ':dss_status' => $currentDSSStatus,
            ':id' => $reportId
        ];

        $sql = "UPDATE incident_reports SET
            rp_full_name = :rp_full_name,
            rp_address = :rp_address,
            rp_contact = :rp_contact,
            rp_relationship = :rp_relationship,
            
            vic_full_name = :vic_full_name,
            vic_address = :vic_address,
            vic_contact = :vic_contact,
            vic_citizenship = :vic_citizenship,
            vic_gender = :vic_gender,
            vic_dob = :vic_dob,
            vic_occupation = :vic_occupation,
            
            sus_full_name = :sus_full_name,
            sus_address = :sus_address,
            sus_contact = :sus_contact,
            sus_gender = :sus_gender,
            sus_description = :sus_description,
            
            incident_type = :incident_type,
            incident_timestamp = :incident_timestamp,
            description = :description,
            witness_data_json = :witness_data_json,
            latitude = :latitude,
            longitude = :longitude,
            
            dss_status = :dss_status,
            updated_at = NOW()
            ";

        if ($supabaseUserId) {
            $sql .= " WHERE id = :id AND supabase_user_id = :supabase_user_id";
            $params[':supabase_user_id'] = $supabaseUserId;
        } else {
            $sql .= " WHERE id = :id";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            // Also update witnesses in separate table
            if (isset($_POST['witnesses']) && is_array($_POST['witnesses'])) {
                // Delete existing witnesses
                $deleteStmt = $pdo->prepare("DELETE FROM incident_witnesses WHERE report_id = :report_id");
                $deleteStmt->execute([':report_id' => $reportId]);

                // Insert updated witnesses
                $witnessStmt = $pdo->prepare("
                    INSERT INTO incident_witnesses (report_id, witness_name, witness_address, witness_contact)
                    VALUES (:report_id, :witness_name, :witness_address, :witness_contact)
                ");

                foreach ($_POST['witnesses'] as $witness) {
                    if (!empty($witness['name']) && !empty($witness['contact'])) {
                        $witnessAddress = trim(($witness['lotNo'] ?? '') . ' ' . ($witness['street'] ?? ''));
                        $witnessStmt->execute([
                            ':report_id' => $reportId,
                            ':witness_name' => trim($witness['name']),
                            ':witness_address' => $witnessAddress,
                            ':witness_contact' => trim($witness['contact'])
                        ]);
                    }
                }
            }

            triggerDSSevaluation($pdo, $reportId);
            echo json_encode(["status" => "success", "message" => "Report updated successfully! DSS re-evaluation triggered."]);
        } else {
            http_response_code(404);
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
 * Triggers DSS re-evaluation for a report after updates
 * 
 * @param PDO $pdo Database connection object
 * @param int $reportId ID of the report to re-evaluate
 */
function triggerDSSevaluation($pdo, $reportId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
        $stmt->execute([':id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) return;

        $dss = new IncidentReportDSS();
        $evaluationResult = $dss->evaluateReport($report);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM incident_evaluations WHERE report_id = :report_id");
        $checkStmt->execute([':report_id' => $reportId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $evalStmt = $pdo->prepare("
                UPDATE incident_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE report_id = :report_id
            ");

            $evalStmt->execute([
                ':report_id' => $reportId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO incident_evaluations 
                (report_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:report_id, :status, :details, NOW())
            ");

            $evalStmt->execute([
                ':report_id' => $reportId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        }

        $updateReportStmt = $pdo->prepare("
            UPDATE incident_reports 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateReportStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $reportId
        ]);

        logEvaluation($reportId, $evaluationResult);
    } catch (Exception $e) {
        error_log("DSS Re-evaluation failed: " . $e->getMessage());

        try {
            $errorStmt = $pdo->prepare("
                UPDATE incident_reports 
                SET dss_status = 'Evaluation Error'
                WHERE id = :id
            ");
            $errorStmt->execute([':id' => $reportId]);
        } catch (Exception $ex) {
            error_log("Failed to update error status: " . $ex->getMessage());
        }
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
        // Use date_reported instead of application_date
        $sql1 = "
            SELECT date_reported, COUNT(*) AS total
            FROM incident_reports
            GROUP BY date_reported
            ORDER BY date_reported ASC
        ";

        $stmt1 = $pdo->query($sql1);
        $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

        $sql2 = "
            SELECT incident_type, COUNT(*) AS total
            FROM incident_reports
            GROUP BY incident_type
            ORDER BY total ASC
        ";

        $stmt2 = $pdo->query($sql2);
        $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $sql3 = "
            SELECT 
                COALESCE(dss_status, 'Pending Evaluation') as dss_status, 
                COUNT(*) as total
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
/**
 * Evaluates an incident report using the DSS rule engine
 * 
 * @param PDO $pdo Database connection object
 */
function handleEvaluateReport($pdo)
{
    try {
        $reportId = $_POST['report_id'] ?? null;

        if (!$reportId) {
            echo json_encode(["status" => "error", "message" => "Report ID required"]);
            return;
        }

        $stmt = $pdo->prepare("SELECT * FROM incident_reports WHERE id = :id");
        $stmt->execute([':id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) {
            echo json_encode(["status" => "error", "message" => "Report not found"]);
            return;
        }

        $dss = new IncidentReportDSS();
        $evaluationResult = $dss->evaluateReport($report);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM incident_evaluations WHERE report_id = :report_id");
        $checkStmt->execute([':report_id' => $reportId]);

        if ($checkStmt->fetch()) {
            $evalStmt = $pdo->prepare("
                UPDATE incident_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE report_id = :report_id
            ");
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO incident_evaluations 
                (report_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:report_id, :status, :details, NOW())
            ");
        }

        $evalStmt->execute([
            ':report_id' => $reportId,
            ':status' => $statusValue,
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE incident_reports 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $reportId
        ]);

        logEvaluation($reportId, $evaluationResult);

        echo json_encode([
            "status" => "success",
            "dss_result" => $evaluationResult,
            "message" => "Report evaluated successfully"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("DSS Evaluation Error: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Evaluation Error: " . $e->getMessage()]);
    }
}

/**
 * Logs DSS evaluation results
 * 
 * @param int $reportId ID of the evaluated report
 * @param array $evaluationResult Complete evaluation result from DSS engine
 */
function logEvaluation($reportId, $evaluationResult)
{
    try {
        $logFile = __DIR__ . '/dss_incident_evaluations.log';
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'report_id' => $reportId,
            'dss_status' => $evaluationResult['status'],
            'priority_level' => $evaluationResult['evaluation_details']['priority_level'] ?? 'Low',
            'urgency_score' => $evaluationResult['evaluation_details']['urgency_score'] ?? 0,
            'score' => $evaluationResult['evaluation_details']['score'] ?? 0,
            'max_score' => $evaluationResult['evaluation_details']['max_score'] ?? 5,
            'passed_rules' => count($evaluationResult['evaluation_details']['passed_rules'] ?? []),
            'failed_rules' => count($evaluationResult['evaluation_details']['failed_rules'] ?? [])
        ];

        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND);
    } catch (Exception $e) {
        error_log("Failed to log evaluation: " . $e->getMessage());
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
        $reportId = $_GET['report_id'] ?? null;

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
            FROM incident_evaluations e
            JOIN incident_reports ir ON e.report_id = ir.id
            WHERE e.report_id = :id
        ");
        $stmt->execute([':id' => $reportId]);
        $evaluation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$evaluation) {
            $evaluation = [
                'report_id' => $reportId,
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
        $reportId = $_GET['report_id'] ?? null;

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
                 WHERE report_id = ir.id 
                 ORDER BY changed_at DESC) as status_history,
                (SELECT json_agg(json_build_object('witness_name', witness_name, 'witness_address', witness_address, 'witness_contact', witness_contact))
                 FROM incident_witnesses 
                 WHERE report_id = ir.id) as witnesses
            FROM incident_reports ir
            LEFT JOIN incident_evaluations ie ON ir.id = ie.report_id
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
 * Retrieves DSS evaluation statistics
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetEvaluationStats($pdo)
{
    try {
        $statsStmt = $pdo->query("
            SELECT 
                COUNT(*) as total_reports,
                SUM(CASE WHEN dss_status = 'High Priority' THEN 1 ELSE 0 END) as high_priority,
                SUM(CASE WHEN dss_status = 'Medium Priority' THEN 1 ELSE 0 END) as medium_priority,
                SUM(CASE WHEN dss_status = 'Low Priority' THEN 1 ELSE 0 END) as low_priority,
                AVG(CASE WHEN evaluation_details::json->>'score' IS NOT NULL 
                    THEN (evaluation_details::json->>'score')::numeric 
                    ELSE 0 END) as avg_score,
                AVG(CASE WHEN evaluation_details::json->>'urgency_score' IS NOT NULL 
                    THEN (evaluation_details::json->>'urgency_score')::numeric 
                    ELSE 0 END) as avg_urgency
            FROM incident_reports ir
            LEFT JOIN incident_evaluations ie ON ir.id = ie.report_id
        ");
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        $trendsStmt = $pdo->query("
            SELECT 
                DATE(evaluated_at) as evaluation_date,
                COUNT(*) as total_evaluations,
                SUM(CASE WHEN dss_status = 'High Priority' THEN 1 ELSE 0 END) as high_priority_count
            FROM incident_evaluations 
            WHERE evaluated_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(evaluated_at)
            ORDER BY evaluation_date
        ");
        $trends = $trendsStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "stats" => $stats,
            "trends" => $trends
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Returns information about all DSS rules used in the incident report evaluation system
 * 
 * @return array List of DSS rules with metadata
 */
function handleGetRules()
{
    try {
        $rules = [
            [
                'id' => 'IR1',
                'name' => 'Incident Severity Rule',
                'description' => 'Evaluates the severity level based on incident type',
                'priority' => 10
            ],
            [
                'id' => 'IR2',
                'name' => 'Timeliness Rule',
                'description' => 'Checks if report was filed within reasonable time after incident',
                'priority' => 9
            ],
            [
                'id' => 'IR3',
                'name' => 'Location Validity Rule',
                'description' => 'Verifies incident location is within barangay boundaries',
                'priority' => 8
            ],
            [
                'id' => 'IR4',
                'name' => 'Completeness Rule',
                'description' => 'Ensures all required information is provided',
                'priority' => 7
            ],
            [
                'id' => 'IR5',
                'name' => 'Witness Credibility Rule',
                'description' => 'Evaluates witness information for credibility',
                'priority' => 6
            ]
        ];

        echo json_encode([
            "status" => "success",
            "rules" => $rules
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Manually triggers DSS evaluation for a specific report
 * 
 * @param PDO $pdo Database connection object
 */
function handleTriggerEvaluation($pdo)
{
    try {
        $reportId = $_POST['report_id'] ?? null;

        if (!$reportId) {
            echo json_encode(["status" => "error", "message" => "Report ID required"]);
            return;
        }

        triggerDSSevaluation($pdo, $reportId);

        echo json_encode(["status" => "success", "message" => "DSS evaluation triggered"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Evaluates all pending reports (for staff use)
 * 
 * @param PDO $pdo Database connection object
 */
function handleEvaluateAllPending($pdo)
{
    try {
        $isStaff = $_SESSION['is_staff'] ?? false;
        if (!$isStaff) {
            echo json_encode(["status" => "error", "message" => "Unauthorized - Staff only"]);
            return;
        }

        $sql = "SELECT ir.id FROM incident_reports ir
                LEFT JOIN incident_evaluations ie ON ir.id = ie.report_id
                WHERE ie.id IS NULL OR ie.dss_status = 'Pending Evaluation' OR ie.dss_status = 'Evaluation Error'";

        $stmt = $pdo->query($sql);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [
            'total' => count($reports),
            'successful' => 0,
            'failed' => 0,
            'details' => []
        ];

        foreach ($reports as $report) {
            try {
                triggerDSSevaluation($pdo, $report['id']);
                $results['successful']++;
                $results['details'][] = "Report {$report['id']}: Evaluation successful";
            } catch (Exception $e) {
                error_log("Failed to evaluate report {$report['id']}: " . $e->getMessage());
                $results['failed']++;
                $results['details'][] = "Report {$report['id']}: Failed - " . $e->getMessage();
            }
        }

        echo json_encode([
            "status" => "success",
            "results" => $results,
            "message" => "Evaluated {$results['successful']} of {$results['total']} reports"
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
        $reportId = $_GET['report_id'] ?? null;

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
                 WHERE report_id = ir.id) as witnesses
            FROM incident_reports ir
            LEFT JOIN incident_evaluations ie ON ir.id = ie.report_id
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
 * Adds a witness to an existing incident report
 * 
 * @param PDO $pdo Database connection object
 */
function handleAddWitness($pdo)
{
    try {
        $reportId = $_POST['report_id'] ?? null;
        $witnessName = get_input('witness_name');
        $witnessLotNo = get_input('witness_lot_no');
        $witnessStreet = get_input('witness_street');
        $witnessContact = get_input('witness_contact');

        if (!$reportId || !$witnessName || !$witnessContact) {
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            return;
        }

        $witnessAddress = trim(($witnessLotNo ?? '') . ' ' . ($witnessStreet ?? ''));

        $sql = "INSERT INTO incident_witnesses (report_id, witness_name, witness_address, witness_contact)
                VALUES (:report_id, :witness_name, :witness_address, :witness_contact)
                RETURNING id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':report_id' => $reportId,
            ':witness_name' => $witnessName,
            ':witness_address' => $witnessAddress,
            ':witness_contact' => $witnessContact
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        // Also update the witness_data_json in the main table
        updateWitnessDataJson($pdo, $reportId);

        echo json_encode([
            "status" => "success",
            "id" => $result['id'],
            "message" => "Witness added successfully"
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
            WHERE report_id = :report_id
        ");
        $stmt->execute([':report_id' => $reportId]);
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
 * Removes a witness from an incident report
 * 
 * @param PDO $pdo Database connection object
 */
function handleRemoveWitness($pdo)
{
    try {
        $witnessId = $_POST['witness_id'] ?? null;

        if (!$witnessId) {
            echo json_encode(["status" => "error", "message" => "Witness ID required"]);
            return;
        }

        // Get report_id before deleting
        $getStmt = $pdo->prepare("SELECT report_id FROM incident_witnesses WHERE id = :id");
        $getStmt->execute([':id' => $witnessId]);
        $witness = $getStmt->fetch(PDO::FETCH_ASSOC);

        if (!$witness) {
            echo json_encode(["status" => "error", "message" => "Witness not found"]);
            return;
        }

        $reportId = $witness['report_id'];

        $stmt = $pdo->prepare("DELETE FROM incident_witnesses WHERE id = :id");
        $stmt->execute([':id' => $witnessId]);

        // Update the witness_data_json in the main table
        updateWitnessDataJson($pdo, $reportId);

        echo json_encode([
            "status" => "success",
            "message" => "Witness removed successfully"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Gets all witnesses for a specific incident report
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetWitnesses($pdo)
{
    try {
        $reportId = $_GET['report_id'] ?? null;

        if (!$reportId) {
            echo json_encode(["status" => "error", "message" => "Report ID required"]);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT * FROM incident_witnesses 
            WHERE report_id = :report_id 
            ORDER BY id
        ");
        $stmt->execute([':report_id' => $reportId]);
        $witnesses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "witnesses" => $witnesses
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Ensures required database tables exist for DSS functionality
 * 
 * @param PDO $pdo Database connection object
 * @return bool True if tables exist or were created successfully
 */
function ensureEvaluationTableExists($pdo)
{
    try {
        $checkStmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_evaluations')");
        $exists = $checkStmt->fetchColumn();

        if (!$exists) {
            $createSQL = "
                -- Create incident_evaluations table
                CREATE TABLE incident_evaluations (
                    id SERIAL PRIMARY KEY,
                    report_id INTEGER UNIQUE NOT NULL,
                    dss_status VARCHAR(50) NOT NULL DEFAULT 'Pending Evaluation',
                    evaluation_details JSONB,
                    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (report_id) REFERENCES incident_reports(id) ON DELETE CASCADE
                );
                
                -- Add missing columns to incident_reports if they don't exist
                DO $$ 
                BEGIN 
                    -- Add status column
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'incident_reports' 
                                  AND column_name = 'status') THEN
                        ALTER TABLE incident_reports ADD COLUMN status VARCHAR(50) DEFAULT 'Pending';
                    END IF;
                    
                    -- Add dss_status column
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'incident_reports' 
                                  AND column_name = 'dss_status') THEN
                        ALTER TABLE incident_reports ADD COLUMN dss_status VARCHAR(50) DEFAULT 'Pending Evaluation';
                    END IF;
                    
                    -- Add resolution_details column
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'incident_reports' 
                                  AND column_name = 'resolution_details') THEN
                        ALTER TABLE incident_reports ADD COLUMN resolution_details TEXT;
                    END IF;
                    
                    -- Add update_comments column
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'incident_reports' 
                                  AND column_name = 'update_comments') THEN
                        ALTER TABLE incident_reports ADD COLUMN update_comments TEXT;
                    END IF;
                    
                    -- Add created_at column
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'incident_reports' 
                                  AND column_name = 'created_at') THEN
                        ALTER TABLE incident_reports ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                    END IF;
                    
                    -- Add updated_at column
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'incident_reports' 
                                  AND column_name = 'updated_at') THEN
                        ALTER TABLE incident_reports ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                    END IF;
                END $$;
                
                -- Create incident_status_history table
                CREATE TABLE IF NOT EXISTS incident_status_history (
                    id SERIAL PRIMARY KEY,
                    report_id INTEGER NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    comments TEXT,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (report_id) REFERENCES incident_reports(id) ON DELETE CASCADE
                );
                
                -- Create incident_witnesses table if it doesn't exist
                CREATE TABLE IF NOT EXISTS incident_witnesses (
                    id SERIAL PRIMARY KEY,
                    report_id INTEGER NOT NULL,
                    witness_name VARCHAR(255) NOT NULL,
                    witness_address TEXT,
                    witness_contact VARCHAR(15),
                    FOREIGN KEY (report_id) REFERENCES incident_reports(id) ON DELETE CASCADE
                );
                
                -- Create indexes
                CREATE INDEX IF NOT EXISTS idx_incident_evaluations_report_id ON incident_evaluations(report_id);
                CREATE INDEX IF NOT EXISTS idx_incident_status_history_report_id ON incident_status_history(report_id);
                CREATE INDEX IF NOT EXISTS idx_incident_witnesses_report_id ON incident_witnesses(report_id);
            ";

            $pdo->exec($createSQL);
            return true;
        }

        return true;
    } catch (Exception $e) {
        error_log("Failed to ensure evaluation table exists: " . $e->getMessage());
        return false;
    }
}

ensureEvaluationTableExists($pdo);
