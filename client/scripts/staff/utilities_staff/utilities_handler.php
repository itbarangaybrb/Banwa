<?php
require_once __DIR__ . '/../../../../server/configs/database.php';

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

require_once __DIR__ . '/../../../../server/api/dss_rule_engine/utility_dss.php';

$action = $_REQUEST['action'] ?? null;
ob_clean();

try {
    switch ($action) {
        case 'create':
            handleCreateApplication($pdo);
            break;
        case 'fetch':
            handleFetchApplications($pdo);
            break;
        case 'update_status':
            handleUpdateStatus($pdo);
            break;
        case 'update':
            handleUpdateApplication($pdo);
            break;
        case 'chart_utilities_type':
            handleChartUtilityType($pdo);
            break;
        case 'evaluate_application':
            handleEvaluateApplication($pdo);
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
        case 'get_application_with_dss':
            handleGetApplicationWithDSS($pdo);
            break;
        case 'trigger_evaluation':
            handleTriggerEvaluation($pdo);
            break;
        case 'evaluate_all_pending':
            handleEvaluateAllPending($pdo);
            break;
        case 'get_application_details':
            handleGetApplicationDetails($pdo);
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
 * Handles creation of new utility applications with all required data
 * Also creates initial DSS evaluation record for the application
 * 
 * @param PDO $pdo Database connection object
 */
function handleCreateApplication($pdo)
{
    try {
        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;
        
        // Owner Information
        $firstName = get_input('firstName');
        $middleName = get_input('middleName');
        $lastName = get_input('lastName');
        $suffix = get_input('suffix') ?? '';
        $contactNoOwner = get_input('contactNoOwner');
        $addressOwner = get_input('addressOwner');
        
        // Application Details
        $requestDate = get_input('requestDate');
        $dateOfWork = get_input('dateOfWork');
        $natureOfWork = get_input('natureOfWork');
        $provider = get_input('provider');
        
        // Location Information
        $utilityLotNo = get_input('utilityLotNo');
        $utilityStreet = get_input('utilityStreet');
        $addressOfUtility = trim($utilityLotNo . ' ' . $utilityStreet);
        $latitude = get_input('latitude2');
        $longitude = get_input('longitude2');
        
        // Status and Agreements
        $status = 'Pending';
        $agreed = (int)(get_input('agreed') ?? 0);

        $sql = "INSERT INTO utility_applications (
            supabase_user_id, first_name, middle_name, last_name, suffix,
            owner_contact_no, owner_address, request_date, date_of_work,
            nature_of_work, provider, address_of_utility, latitude, longitude,
            status, agreed
        ) VALUES (
            :supabase_user_id, :first_name, :middle_name, :last_name, :suffix,
            :owner_contact_no, :owner_address, :request_date, :date_of_work,
            :nature_of_work, :provider, :address_of_utility, :latitude, :longitude,
            :status, :agreed
        ) RETURNING id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':supabase_user_id' => $supabaseUserId,
            ':first_name' => $firstName,
            ':middle_name' => $middleName,
            ':last_name' => $lastName,
            ':suffix' => $suffix,
            ':owner_contact_no' => $contactNoOwner,
            ':owner_address' => $addressOwner,
            ':request_date' => $requestDate,
            ':date_of_work' => $dateOfWork,
            ':nature_of_work' => $natureOfWork,
            ':provider' => $provider,
            ':address_of_utility' => $addressOfUtility,
            ':latitude' => $latitude,
            ':longitude' => $longitude,
            ':status' => $status,
            ':agreed' => $agreed
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $applicationId = $result['id'];
        createInitialDSSEvaluation($pdo, $applicationId);

        echo json_encode(["status" => "success", "id" => $applicationId, "message" => "Utility Application Created!"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "General Error: " . $e->getMessage()]);
    }
}

/**
 * Creates an initial DSS evaluation record for a newly created utility application
 * This ensures all applications have a DSS evaluation record even before evaluation
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the newly created application
 */
function createInitialDSSEvaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :app_id");
        $stmt->execute([':app_id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) return;

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);

        $sql = "INSERT INTO utility_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, :status, :details, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':app_id' => $applicationId,
            ':status' => $evaluationResult['status'],
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE utility_applications 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $evaluationResult['status'],
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("Failed to create DSS evaluation: " . $e->getMessage());

        $sql = "INSERT INTO utility_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, 'Evaluation Error', '{}', NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':app_id' => $applicationId]);
    }
}

/**
 * Fetches utility applications with role-based access control
 * Staff users can see all applications, regular users only see their own
 * Includes DSS evaluation details and summary information
 * 
 * @param PDO $pdo Database connection object
 */
function handleFetchApplications($pdo)
{
    try {
        $sql = "SELECT ua.* 
                FROM utility_applications ua
                ORDER BY ua.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => "success", "data" => $applications]);
        
    } catch (PDOException $e) {
        error_log("Fetch Error in handleFetchApplications: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Fetch Error: " . $e->getMessage()]);
    }
}

/**
 * Returns a summary object for a given DSS status with icon, message, and color
 * Used for frontend display of evaluation status
 * 
 * @param string $dssStatus The DSS status to get summary for
 * @return array Summary object with icon, message, and color
 */
function getEvaluationSummary($dssStatus)
{
    $summaries = [
        'Pre-Approved' => [
            'icon' => '✅',
            'message' => 'Application meets all requirements for pre-approval',
            'color' => 'green'
        ],
        'Additional Requirements Needed' => [
            'icon' => '⚠️',
            'message' => 'Some requirements need attention before approval',
            'color' => 'orange'
        ],
        'Rejected' => [
            'icon' => '❌',
            'message' => 'Application does not meet basic requirements',
            'color' => 'red'
        ],
        'Pending Evaluation' => [
            'icon' => '⏳',
            'message' => 'Awaiting DSS evaluation',
            'color' => 'blue'
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
 * Provides score, probability, and rule pass/fail counts for frontend display
 * 
 * @param array $evaluationDetails DSS evaluation details array
 * @return array Summary statistics including score, probability, and counts
 */
function getDSSSummary($evaluationDetails)
{
    if (!$evaluationDetails || !is_array($evaluationDetails)) {
        return [
            'score' => 0,
            'max_score' => 5,
            'probability' => 0,
            'passed_count' => 0,
            'failed_count' => 0,
            'passed_rules' => [],
            'failed_rules' => []
        ];
    }

    return [
        'score' => $evaluationDetails['score'] ?? 0,
        'max_score' => $evaluationDetails['max_score'] ?? 5,
        'probability' => $evaluationDetails['approval_probability'] ?? 0,
        'passed_count' => count($evaluationDetails['passed_rules'] ?? []),
        'failed_count' => count($evaluationDetails['failed_rules'] ?? []),
        'passed_rules' => $evaluationDetails['passed_rules'] ?? [],
        'failed_rules' => $evaluationDetails['failed_rules'] ?? [],
        'recommendations' => $evaluationDetails['recommendations'] ?? []
    ];
}

/**
 * Handles status updates for utility applications with special logic for payment and disapproval
 * Preserves DSS status while updating application status
 * Logs all status changes for audit trail
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
        $getStmt = $pdo->prepare("SELECT dss_status FROM utility_applications WHERE id = :id");
        $getStmt->execute([':id' => $id]);
        $currentApp = $getStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentApp['dss_status'] ?? null;

        $sql = "UPDATE utility_applications SET status = :status, approval_comments = :comments ";
        $params = [':status' => $newStatus, ':comments' => $comments, ':id' => $id];

        if ($newStatus === 'Disapproved') {
            $sql .= ", disapproval_reason = :comments ";
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
 * Logs status changes to utility_status_history table for audit trail
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application being updated
 * @param string $newStatus The new status being set
 * @param string $comments Optional comments about the status change
 */
function logStatusUpdate($pdo, $applicationId, $newStatus, $comments)
{
    try {
        $sql = "INSERT INTO utility_status_history 
                (application_id, status, comments, changed_at) 
                VALUES (:app_id, :status, :comments, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':app_id' => $applicationId,
            ':status' => $newStatus,
            ':comments' => $comments
        ]);
    } catch (Exception $e) {
        error_log("Failed to log status update: " . $e->getMessage());
    }
}

/**
 * Handles updates to existing utility applications with complete field validation
 * Triggers DSS re-evaluation after successful update
 * 
 * @param PDO $pdo Database connection object
 */
function handleUpdateApplication($pdo)
{
    try {
        $applicationId = get_input('application_id');
        if (!$applicationId) {
            throw new Exception("Application ID is required for update.");
        }

        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;
        
        // Owner Information
        $firstName = get_input('firstName');
        $middleName = get_input('middleName');
        $lastName = get_input('lastName');
        $suffix = get_input('suffix') ?? '';
        $contactNoOwner = get_input('contactNoOwner');
        $addressOwner = get_input('addressOwner');
        
        // Application Details
        $requestDate = get_input('requestDate');
        $dateOfWork = get_input('dateOfWork');
        $natureOfWork = get_input('natureOfWork');
        $provider = get_input('provider');
        
        // Location Information
        $utilityLotNo = get_input('utilityLotNo');
        $utilityStreet = get_input('utilityStreet');
        $addressOfUtility = trim($utilityLotNo . ' ' . $utilityStreet);
        $latitude = get_input('latitude2');
        $longitude = get_input('longitude2');

        $getDSSStmt = $pdo->prepare("SELECT dss_status FROM utility_applications WHERE id = :id");
        $getDSSStmt->execute([':id' => $applicationId]);
        $currentDSS = $getDSSStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentDSS['dss_status'] ?? 'Pending Evaluation';

        $params = [
            ':first_name' => $firstName,
            ':middle_name' => $middleName,
            ':last_name' => $lastName,
            ':suffix' => $suffix,
            ':owner_contact_no' => $contactNoOwner,
            ':owner_address' => $addressOwner,
            ':request_date' => $requestDate,
            ':date_of_work' => $dateOfWork,
            ':nature_of_work' => $natureOfWork,
            ':provider' => $provider,
            ':address_of_utility' => $addressOfUtility,
            ':latitude' => $latitude,
            ':longitude' => $longitude,
            ':dss_status' => $currentDSSStatus,
            ':id' => $applicationId
        ];

        $sql = "UPDATE utility_applications SET
            first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            suffix = :suffix,
            owner_contact_no = :owner_contact_no,
            owner_address = :owner_address,
            request_date = :request_date,
            date_of_work = :date_of_work,
            nature_of_work = :nature_of_work,
            provider = :provider,
            address_of_utility = :address_of_utility,
            latitude = :latitude,
            longitude = :longitude,
            dss_status = :dss_status,
            updated_at = NOW(),
            status = 'Complied' ";

        if ($supabaseUserId) {
            $sql .= " WHERE id = :id AND supabase_user_id = :supabase_user_id";
            $params[':supabase_user_id'] = $supabaseUserId;
        } else {
            $sql .= " WHERE id = :id";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            triggerDSSevaluation($pdo, $applicationId);
            echo json_encode(["status" => "success", "message" => "Application updated successfully! DSS re-evaluation triggered."]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Application not found or not authorized to update."]);
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
 * Triggers DSS re-evaluation for an application after updates
 * Fetches application data, runs through DSS rule engine, and updates evaluation records
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application to re-evaluate
 */
function triggerDSSevaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) return;

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM utility_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $evalStmt = $pdo->prepare("
                UPDATE utility_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE application_id = :app_id
            ");

            $evalStmt->execute([
                ':app_id' => $applicationId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO utility_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, :status, :details, NOW())
            ");

            $evalStmt->execute([
                ':app_id' => $applicationId,
                ':status' => $statusValue,
                ':details' => json_encode($evaluationResult['evaluation_details'])
            ]);
        }

        $updateAppStmt = $pdo->prepare("
            UPDATE utility_applications 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateAppStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("DSS Re-evaluation failed: " . $e->getMessage());

        try {
            $errorStmt = $pdo->prepare("
                UPDATE utility_applications 
                SET dss_status = 'Evaluation Error'
                WHERE id = :id
            ");
            $errorStmt->execute([':id' => $applicationId]);
        } catch (Exception $ex) {
            error_log("Failed to update error status: " . $ex->getMessage());
        }
    }
}

/**
 * Generates chart data for utility analytics including application trends by date,
 * provider distribution, and DSS status breakdown
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartUtilityType($pdo)
{
    $sql1 = "
        SELECT request_date, COUNT(*) AS total
        FROM utility_applications
        GROUP BY request_date
        ORDER BY request_date ASC
    ";

    $stmt1 = $pdo->query($sql1);
    $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $sql2 = "
        SELECT provider, COUNT(*) AS total
        FROM utility_applications
        GROUP BY provider
        ORDER BY provider ASC
    ";

    $stmt2 = $pdo->query($sql2);
    $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $sql3 = "
        SELECT COALESCE(ue.dss_status, 'Pending Evaluation') as dss_status, COUNT(*) as total
        FROM utility_applications ua
        LEFT JOIN utility_evaluations ue ON ua.id = ue.application_id
        GROUP BY COALESCE(ue.dss_status, 'Pending Evaluation')
        ORDER BY total DESC
    ";

    $stmt3 = $pdo->query($sql3);
    $dataByDSS = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data_by_date" => $dataByDate,
        "data_by_type" => $dataByType,
        "data_by_dss" => $dataByDSS
    ]);
}

/**
 * Evaluates a utility application using the DSS rule engine
 * Returns evaluation results and updates database records
 * 
 * @param PDO $pdo Database connection object
 */
function handleEvaluateApplication($pdo)
{
    try {
        $applicationId = $_POST['application_id'] ?? null;

        if (!$applicationId) {
            echo json_encode(["status" => "error", "message" => "Application ID required"]);
            return;
        }

        $stmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM utility_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);

        if ($checkStmt->fetch()) {
            $evalStmt = $pdo->prepare("
                UPDATE utility_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE application_id = :app_id
            ");
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO utility_evaluations 
                (application_id, dss_status, evaluation_details, evaluated_at) 
                VALUES (:app_id, :status, :details, NOW())
            ");
        }

        $evalStmt->execute([
            ':app_id' => $applicationId,
            ':status' => $statusValue,
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE utility_applications 
            SET dss_status = :dss_status
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);

        echo json_encode([
            "status" => "success",
            "dss_result" => $evaluationResult,
            "message" => "Application evaluated successfully"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("DSS Evaluation Error: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Evaluation Error: " . $e->getMessage()]);
    }
}

/**
 * Logs DSS evaluation results to a file for analytics and auditing purposes
 * 
 * @param int $applicationId ID of the evaluated application
 * @param array $evaluationResult Complete evaluation result from DSS engine
 */
function logEvaluation($applicationId, $evaluationResult)
{
    try {
        $logFile = __DIR__ . '/dss_evaluations.log';
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'application_id' => $applicationId,
            'dss_status' => $evaluationResult['status'],
            'score' => $evaluationResult['evaluation_details']['score'] ?? 0,
            'max_score' => $evaluationResult['evaluation_details']['max_score'] ?? 0,
            'probability' => $evaluationResult['evaluation_details']['approval_probability'] ?? 0,
            'passed_rules' => count($evaluationResult['evaluation_details']['passed_rules'] ?? []),
            'failed_rules' => count($evaluationResult['evaluation_details']['failed_rules'] ?? [])
        ];

        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND);
    } catch (Exception $e) {
        error_log("Failed to log evaluation: " . $e->getMessage());
    }
}

/**
 * Retrieves DSS evaluation details for a specific application with permission checking
 * Staff can view any evaluation, users can only view their own applications
 * Returns empty evaluation structure if no evaluation exists
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetEvaluation($pdo)
{
    try {
        $applicationId = $_GET['application_id'] ?? null;

        if (!$applicationId) {
            echo json_encode(["status" => "error", "message" => "Application ID required"]);
            return;
        }

        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;
        $isStaff = $_SESSION['is_staff'] ?? false;

        if (!$isStaff && $supabaseUserId) {
            $checkStmt = $pdo->prepare("SELECT id FROM utility_applications WHERE id = :id AND supabase_user_id = :user_id");
            $checkStmt->execute([':id' => $applicationId, ':user_id' => $supabaseUserId]);
            if (!$checkStmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "Unauthorized to view this evaluation"]);
                return;
            }
        }

        $stmt = $pdo->prepare("
            SELECT e.*, ua.first_name, ua.last_name, ua.provider, ua.nature_of_work,
                   ua.status as app_status, ua.dss_status as app_dss_status
            FROM utility_evaluations e
            JOIN utility_applications ua ON e.application_id = ua.id
            WHERE e.application_id = :id
        ");
        $stmt->execute([':id' => $applicationId]);
        $evaluation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$evaluation) {
            $evaluation = [
                'application_id' => $applicationId,
                'dss_status' => 'Pending Evaluation',
                'evaluation_details' => [
                    'passed_rules' => [],
                    'failed_rules' => [],
                    'recommendations' => [],
                    'score' => 0,
                    'max_score' => 5,
                    'approval_probability' => 0
                ],
                'evaluated_at' => null,
                'app_status' => 'Pending',
                'app_dss_status' => 'Pending Evaluation'
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
 * Retrieves complete application details including DSS evaluation and status history
 * Restricted to staff users only for comprehensive application management
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetApplicationWithDSS($pdo)
{
    try {
        $applicationId = $_GET['application_id'] ?? null;

        if (!$applicationId) {
            echo json_encode(["status" => "error", "message" => "Application ID required"]);
            return;
        }

        $isStaff = $_SESSION['is_staff'] ?? false;
        if (!$isStaff) {
            echo json_encode(["status" => "error", "message" => "Unauthorized"]);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT ua.*, 
                   ue.dss_status, 
                   ue.evaluation_details,
                   ue.evaluated_at as dss_evaluated_at,
                   (SELECT json_agg(json_build_object('status', status, 'comments', comments, 'changed_at', changed_at))
                    FROM utility_status_history 
                    WHERE application_id = ua.id 
                    ORDER BY changed_at DESC) as status_history
            FROM utility_applications ua
            LEFT JOIN utility_evaluations ue ON ua.id = ue.application_id
            WHERE ua.id = :id
        ");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        if (isset($application['evaluation_details']) && $application['evaluation_details']) {
            $application['evaluation_details'] = json_decode($application['evaluation_details'], true);
        }
        if (isset($application['status_history']) && $application['status_history']) {
            $application['status_history'] = json_decode($application['status_history'], true);
        }

        if (isset($application['evaluation_details'])) {
            $application['dss_summary'] = getDSSSummary($application['evaluation_details']);
        }

        echo json_encode([
            "status" => "success",
            "application" => $application
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Retrieves DSS evaluation statistics including overall counts, success rates, and trends
 * Provides analytics data for dashboard display and system monitoring
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetEvaluationStats($pdo)
{
    try {
        $statsStmt = $pdo->query("
            SELECT 
                COUNT(*) as total_applications,
                SUM(CASE WHEN dss_status = 'Pre-Approved' THEN 1 ELSE 0 END) as pre_approved,
                SUM(CASE WHEN dss_status = 'Additional Requirements Needed' THEN 1 ELSE 0 END) as needs_requirements,
                SUM(CASE WHEN dss_status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
                AVG(CASE WHEN evaluation_details::json->>'score' IS NOT NULL 
                    THEN (evaluation_details::json->>'score')::numeric 
                    ELSE 0 END) as avg_score,
                AVG(CASE WHEN evaluation_details::json->>'approval_probability' IS NOT NULL 
                    THEN (evaluation_details::json->>'approval_probability')::numeric 
                    ELSE 0 END) as avg_probability
            FROM utility_applications ua
            LEFT JOIN utility_evaluations ue ON ua.id = ue.application_id
        ");
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        $trendsStmt = $pdo->query("
            SELECT 
                DATE(evaluated_at) as evaluation_date,
                COUNT(*) as total_evaluations,
                SUM(CASE WHEN dss_status = 'Pre-Approved' THEN 1 ELSE 0 END) as pre_approved_count
            FROM utility_evaluations 
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
 * Returns information about all DSS rules used in the evaluation system
 * Provides rule descriptions and priorities for documentation and display purposes
 * 
 * @return array List of DSS rules with metadata
 */
function handleGetRules()
{
    try {
        $rules = [
            [
                'id' => 'R1',
                'name' => 'Complete Requirements Rule',
                'description' => 'Checks if all required documents are submitted based on utility type',
                'priority' => 10
            ],
            [
                'id' => 'R2',
                'name' => 'Valid Utility Location Rule',
                'description' => 'Verifies utility location is within barangay boundaries',
                'priority' => 9
            ],
            [
                'id' => 'R3',
                'name' => 'Provider Compliance Rule',
                'description' => 'Ensures utility provider is authorized',
                'priority' => 8
            ],
            [
                'id' => 'R4',
                'name' => 'Work Safety Rule',
                'description' => 'Checks if proposed work meets safety standards',
                'priority' => 7
            ],
            [
                'id' => 'R5',
                'name' => 'Valid Contact Information Rule',
                'description' => 'Validates phone number and owner information',
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
 * Manually triggers DSS evaluation for a specific application
 * 
 * @param PDO $pdo Database connection object
 */
function handleTriggerEvaluation($pdo)
{
    try {
        $applicationId = $_POST['application_id'] ?? null;

        if (!$applicationId) {
            echo json_encode(["status" => "error", "message" => "Application ID required"]);
            return;
        }

        triggerDSSevaluation($pdo, $applicationId);

        echo json_encode(["status" => "success", "message" => "DSS evaluation triggered"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Evaluates all pending applications (for staff use)
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

        $sql = "SELECT ua.id FROM utility_applications ua
                LEFT JOIN utility_evaluations ue ON ua.id = ue.application_id
                WHERE ue.id IS NULL OR ue.dss_status = 'Pending Evaluation' OR ue.dss_status = 'Evaluation Error'";

        $stmt = $pdo->query($sql);
        $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [
            'total' => count($applications),
            'successful' => 0,
            'failed' => 0,
            'details' => []
        ];

        foreach ($applications as $app) {
            try {
                triggerDSSevaluation($pdo, $app['id']);
                $results['successful']++;
                $results['details'][] = "Application {$app['id']}: Evaluation successful";
            } catch (Exception $e) {
                error_log("Failed to evaluate application {$app['id']}: " . $e->getMessage());
                $results['failed']++;
                $results['details'][] = "Application {$app['id']}: Failed - " . $e->getMessage();
            }
        }

        echo json_encode([
            "status" => "success",
            "results" => $results,
            "message" => "Evaluated {$results['successful']} of {$results['total']} applications"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Gets detailed application information for frontend display
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetApplicationDetails($pdo)
{
    try {
        $applicationId = $_GET['application_id'] ?? null;

        if (!$applicationId) {
            echo json_encode(["status" => "error", "message" => "Application ID required"]);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT ua.*, 
                   ue.dss_status, 
                   ue.evaluation_details,
                   ue.evaluated_at as dss_evaluated_at
            FROM utility_applications ua
            LEFT JOIN utility_evaluations ue ON ua.id = ue.application_id
            WHERE ua.id = :id
        ");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        if (isset($application['evaluation_details']) && $application['evaluation_details']) {
            $application['evaluation_details'] = json_decode($application['evaluation_details'], true);
        }

        $application['evaluation_summary'] = getEvaluationSummary($application['dss_status'] ?? 'Pending Evaluation');
        $application['dss_summary'] = getDSSSummary($application['evaluation_details'] ?? []);

        echo json_encode([
            "status" => "success",
            "application" => $application
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Ensures required database tables exist for DSS functionality
 * Creates utility_evaluations, utility_status_history tables if missing
 * Also adds dss_status column to utility_applications if not present
 * 
 * @param PDO $pdo Database connection object
 * @return bool True if tables exist or were created successfully
 */
function ensureEvaluationTableExists($pdo)
{
    try {
        $checkStmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'utility_evaluations')");
        $exists = $checkStmt->fetchColumn();

        if (!$exists) {
            $createSQL = "
                CREATE TABLE utility_evaluations (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER UNIQUE NOT NULL,
                    dss_status VARCHAR(50) NOT NULL DEFAULT 'Pending Evaluation',
                    evaluation_details JSONB,
                    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES utility_applications(id) ON DELETE CASCADE
                );
                
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'utility_applications' 
                                  AND column_name = 'dss_status') THEN
                        ALTER TABLE utility_applications ADD COLUMN dss_status VARCHAR(50) DEFAULT 'Pending Evaluation';
                    END IF;
                END $$;
                
                CREATE TABLE IF NOT EXISTS utility_status_history (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    comments TEXT,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES utility_applications(id) ON DELETE CASCADE
                );
                
                CREATE INDEX IF NOT EXISTS idx_utility_evaluations_app_id ON utility_evaluations(application_id);
                CREATE INDEX IF NOT EXISTS idx_utility_status_history_app_id ON utility_status_history(application_id);
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