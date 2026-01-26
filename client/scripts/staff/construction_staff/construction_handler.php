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

// Include DSS for construction applications
require_once __DIR__ . '/../../../../server/api/dss_rule_engine/construction_dss.php';

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
        case 'chart_construction_type':
            handleChartConstructionType($pdo);
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
        case 'get_requirements':
            handleGetRequirements($pdo);
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
 * Gets current date in YYYY-MM-DD format
 * @return string Current date
 */
function getCurrentDateString() {
    return date('Y-m-d');
}

/**
 * Handles creation of new construction applications with all required data and file uploads
 * Also creates initial DSS evaluation record for the application
 * 
 * @param PDO $pdo Database connection object
 */
function handleCreateApplication($pdo)
{
    try {
        $supabaseUserId = $_POST['supabase_user_id'] ?? $_SESSION['supabase_user_id'] ?? null;
        
        if (!$supabaseUserId) {
            throw new Exception("User authentication required. Please log in again.");
        }
        
        // Owner Info
        $firstName = get_input('firstName');
        $middleName = get_input('middleName');
        $lastName = get_input('lastName');
        $suffix = get_input('suffix') ?? '';
        $contactNoOwner = get_input('contactNoOwner');
        $lotNo = get_input('lotNo');
        $street = get_input('street');
        $ownerAddress = trim($lotNo . ' ' . $street);

        // Construction Info
        $typeOfWork = get_input('typeOfWork');
        $natureOfActivity = get_input('natureOfActivity');
        $detailsOfWork = get_input('detailsOfWork');
        $startDate = get_input('startDate');
        $endDate = get_input('endDate');
        $numberOfWorkingDays = get_input('numberOfWorkingDays');
        $numberOfWorkers = get_input('numberOfWorkers');
        $contractorName = get_input('contractorName');
        $contractorContactNumber = get_input('contractorContactNumber');
        $applicationMethod = get_input('applicationMethod');
        
        // Construction Location
        $constructionLotNo = get_input('constructionLotNo');
        $constructionStreet = get_input('constructionStreet');
        $constructionAddress = trim($constructionLotNo . ' ' . $constructionStreet);
        $latitude = get_input('latitude2');
        $longitude = get_input('longitude2');

        // Agreement - IMPORTANT: Changed from 'agreeCheckBox' to 'agreed' to match frontend
        $agreeCheckBox = (int)(get_input('agreed') ?? 0);

        // Application Date - use POST value or current date
        $applicationDate = get_input('applicationDate') ?? getCurrentDateString();

        // File upload - Single file upload only, no requirements array
        $requirementUpload = null;
        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/construction/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
                // Add .htaccess for security
                file_put_contents($uploadDir . '.htaccess', "Deny from all\n");
            }
            
            $originalName = basename($_FILES['requirementUpload']['name']);
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $fileName = time() . '_' . uniqid() . '.' . $extension;
            
            if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $uploadDir . $fileName)) {
                $requirementUpload = $fileName;
            } else {
                throw new Exception("Failed to upload file. Please try again.");
            }
        }

        // Validate required fields
        $requiredFields = [
            'firstName' => $firstName,
            'lastName' => $lastName,
            'contactNoOwner' => $contactNoOwner,
            'typeOfWork' => $typeOfWork,
            'natureOfActivity' => $natureOfActivity,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'constructionAddress' => $constructionAddress
        ];

        foreach ($requiredFields as $field => $value) {
            if (empty($value)) {
                throw new Exception("Missing required field: " . $field);
            }
        }

        // MODIFIED: Removed requirements field from SQL
        $sql = "INSERT INTO construction_applications (
            supabase_user_id, first_name, middle_name, last_name, suffix,
            contact_no_owner, owner_address, type_of_work, nature_of_activity, 
            details_of_work, start_date, end_date, number_of_working_days, 
            number_of_workers, contractor_name, contractor_contact_number, 
            application_method, construction_address, latitude, longitude, 
            requirement_upload, agreed, application_date, 
            status, created_at, updated_at
        ) VALUES (
            :supabase_user_id, :first_name, :middle_name, :last_name, :suffix,
            :contact_no_owner, :owner_address, :type_of_work, :nature_of_activity, 
            :details_of_work, :start_date, :end_date, :number_of_working_days, 
            :number_of_workers, :contractor_name, :contractor_contact_number, 
            :application_method, :construction_address, :latitude, :longitude, 
            :requirement_upload, :agreed, :application_date, 
            'Pending', NOW(), NOW()
        ) RETURNING id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':supabase_user_id' => $supabaseUserId,
            ':first_name' => $firstName,
            ':middle_name' => $middleName,
            ':last_name' => $lastName,
            ':suffix' => $suffix,
            ':contact_no_owner' => $contactNoOwner,
            ':owner_address' => $ownerAddress,
            ':type_of_work' => $typeOfWork,
            ':nature_of_activity' => $natureOfActivity,
            ':details_of_work' => $detailsOfWork,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
            ':number_of_working_days' => $numberOfWorkingDays,
            ':number_of_workers' => $numberOfWorkers,
            ':contractor_name' => $contractorName,
            ':contractor_contact_number' => $contractorContactNumber,
            ':application_method' => $applicationMethod,
            ':construction_address' => $constructionAddress,
            ':latitude' => $latitude,
            ':longitude' => $longitude,
            ':requirement_upload' => $requirementUpload,
            ':agreed' => $agreeCheckBox,
            ':application_date' => $applicationDate
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $applicationId = $result['id'];
        
        // Create initial DSS evaluation
        createInitialDSSEvaluation($pdo, $applicationId);

        echo json_encode(["status" => "success", "id" => $applicationId, "message" => "Application Created!"]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("SQL Error in handleCreateApplication: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("General Error in handleCreateApplication: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Creates an initial DSS evaluation record for a newly created construction application
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the newly created application
 */
function createInitialDSSEvaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :app_id");
        $stmt->execute([':app_id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            error_log("Application not found for DSS evaluation: " . $applicationId);
            return;
        }

        $dss = new ConstructionDSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);

        // Check if evaluation already exists
        $checkStmt = $pdo->prepare("SELECT id FROM construction_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);
        
        if ($checkStmt->fetch()) {
            $sql = "UPDATE construction_evaluations 
                    SET dss_status = :status, 
                        evaluation_details = :details, 
                        evaluated_at = NOW()
                    WHERE application_id = :app_id";
        } else {
            $sql = "INSERT INTO construction_evaluations 
                    (application_id, dss_status, evaluation_details, evaluated_at) 
                    VALUES (:app_id, :status, :details, NOW())";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':app_id' => $applicationId,
            ':status' => $evaluationResult['status'],
            ':details' => json_encode($evaluationResult['evaluation_details'])
        ]);

        // Update application with DSS status
        $updateStmt = $pdo->prepare("
            UPDATE construction_applications 
            SET dss_status = :dss_status,
                updated_at = NOW()
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':dss_status' => $evaluationResult['status'],
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
        
    } catch (Exception $e) {
        error_log("Failed to create DSS evaluation for application {$applicationId}: " . $e->getMessage());

        // Create error record
        try {
            $errorSql = "INSERT INTO construction_evaluations 
                        (application_id, dss_status, evaluation_details, evaluated_at, error_message) 
                        VALUES (:app_id, 'Evaluation Error', '{}', NOW(), :error)";
            $errorStmt = $pdo->prepare($errorSql);
            $errorStmt->execute([
                ':app_id' => $applicationId,
                ':error' => $e->getMessage()
            ]);
        } catch (Exception $ex) {
            error_log("Failed to create error evaluation record: " . $ex->getMessage());
        }
    }
}

/**
 * Fetches construction applications with role-based access control
 * 
 * @param PDO $pdo Database connection object
 */
function handleFetchApplications($pdo)
{
    try {
        $sql = "SELECT ca.* 
                FROM construction_applications ca
                ORDER BY ca.created_at DESC";
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
 * Returns a summary object for a given DSS status
 * 
 * @param string $dssStatus The DSS status to get summary for
 * @return array Summary object with icon, message, and color
 */
function getEvaluationSummary($dssStatus)
{
    $summaries = [
        'Pre-Approved' => [
            'icon' => '✅',
            'message' => 'Construction permit meets all requirements for pre-approval',
            'color' => 'green',
            'bg_color' => '#d4edda',
            'text_color' => '#155724'
        ],
        'Additional Requirements Needed' => [
            'icon' => '⚠️',
            'message' => 'Some safety or documentation requirements need attention',
            'color' => 'orange',
            'bg_color' => '#fff3cd',
            'text_color' => '#856404'
        ],
        'Rejected' => [
            'icon' => '❌',
            'message' => 'Construction permit application does not meet basic requirements',
            'color' => 'red',
            'bg_color' => '#f8d7da',
            'text_color' => '#721c24'
        ],
        'Pending Evaluation' => [
            'icon' => '⏳',
            'message' => 'Awaiting DSS evaluation',
            'color' => 'blue',
            'bg_color' => '#d1ecf1',
            'text_color' => '#0c5460'
        ],
        'Evaluation Error' => [
            'icon' => '❓',
            'message' => 'Evaluation encountered an error',
            'color' => 'gray',
            'bg_color' => '#e2e3e5',
            'text_color' => '#383d41'
        ]
    ];

    return $summaries[$dssStatus] ?? [
        'icon' => '❓',
        'message' => 'Evaluation status unknown',
        'color' => 'gray',
        'bg_color' => '#e2e3e5',
        'text_color' => '#383d41'
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
            'max_score' => 7,
            'probability' => 0,
            'passed_count' => 0,
            'failed_count' => 0,
            'passed_rules' => [],
            'failed_rules' => [],
            'recommendations' => []
        ];
    }

    $passedRules = $evaluationDetails['passed_rules'] ?? [];
    $failedRules = $evaluationDetails['failed_rules'] ?? [];
    $score = $evaluationDetails['score'] ?? 0;
    $maxScore = $evaluationDetails['max_score'] ?? 7;
    $probability = $evaluationDetails['approval_probability'] ?? 0;

    return [
        'score' => $score,
        'max_score' => $maxScore,
        'probability' => $probability,
        'passed_count' => count($passedRules),
        'failed_count' => count($failedRules),
        'passed_rules' => $passedRules,
        'failed_rules' => $failedRules,
        'recommendations' => $evaluationDetails['recommendations'] ?? [],
        'failed_critical' => $evaluationDetails['failed_critical'] ?? [],
        'passed_critical' => $evaluationDetails['passed_critical'] ?? []
    ];
}

/**
 * Handles status updates for construction applications
 * 
 * @param PDO $pdo Database connection object
 */
function handleUpdateStatus($pdo)
{
    $id = $_POST['id'] ?? null;
    $newStatus = $_POST['newStatus'] ?? null;
    $comments = $_POST['updateComments'] ?? '';
    $amount = $_POST['assessmentAmount'] ?? 0;

    if (!$id || !$newStatus) {
        echo json_encode(["status" => "error", "message" => "Missing ID or Status"]);
        return;
    }

    try {
        $getStmt = $pdo->prepare("SELECT dss_status FROM construction_applications WHERE id = :id");
        $getStmt->execute([':id' => $id]);
        $currentApp = $getStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentApp['dss_status'] ?? null;

        $sql = "UPDATE construction_applications SET status = :status, approval_comments = :comments ";
        $params = [':status' => $newStatus, ':comments' => $comments, ':id' => $id];

        if ($newStatus === 'For Payment') {
            $sql .= ", amount_due = :amount, payment_status = 'Unpaid' ";
            $params[':amount'] = $amount;
        }

        if ($newStatus === 'Disapproved') {
            $sql .= ", disapproval_reason = :comments ";
        }

        if ($currentDSSStatus) {
            $sql .= ", dss_status = :dss_status ";
            $params[':dss_status'] = $currentDSSStatus;
        }

        $sql .= ", updated_at = NOW() WHERE id = :id";

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
        error_log("Error in handleUpdateStatus: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Logs status changes for audit trail
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application
 * @param string $newStatus The new status
 * @param string $comments Optional comments
 */
function logStatusUpdate($pdo, $applicationId, $newStatus, $comments)
{
    try {
        $sql = "INSERT INTO construction_status_history 
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
 * Handles updates to existing construction applications
 * Triggers DSS re-evaluation after update
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
        
        // Owner Info
        $firstName = get_input('firstName');
        $middleName = get_input('middleName');
        $lastName = get_input('lastName');
        $suffix = get_input('suffix') ?? '';
        $contactNoOwner = get_input('contactNoOwner');
        $lotNo = get_input('lotNo');
        $street = get_input('street');
        $ownerAddress = trim($lotNo . ' ' . $street);

        // Construction Info
        $typeOfWork = get_input('typeOfWork');
        $natureOfActivity = get_input('natureOfActivity');
        $detailsOfWork = get_input('detailsOfWork');
        $startDate = get_input('startDate');
        $endDate = get_input('endDate');
        $numberOfWorkingDays = get_input('numberOfWorkingDays');
        $numberOfWorkers = get_input('numberOfWorkers');
        $contractorName = get_input('contractorName');
        $contractorContactNumber = get_input('contractorContactNumber');
        $applicationMethod = get_input('applicationMethod');
        
        // Construction Location
        $constructionLotNo = get_input('constructionLotNo');
        $constructionStreet = get_input('constructionStreet');
        $constructionAddress = trim($constructionLotNo . ' ' . $constructionStreet);
        $latitude = get_input('latitude2');
        $longitude = get_input('longitude2');

        // Agreement
        $agreeCheckBox = (int)(get_input('agreed') ?? 0);

        $getDSSStmt = $pdo->prepare("SELECT dss_status FROM construction_applications WHERE id = :id");
        $getDSSStmt->execute([':id' => $applicationId]);
        $currentDSS = $getDSSStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentDSS['dss_status'] ?? 'Pending Evaluation';

        $params = [
            ':first_name' => $firstName,
            ':middle_name' => $middleName,
            ':last_name' => $lastName,
            ':suffix' => $suffix,
            ':contact_no_owner' => $contactNoOwner,
            ':owner_address' => $ownerAddress,
            ':type_of_work' => $typeOfWork,
            ':nature_of_activity' => $natureOfActivity,
            ':details_of_work' => $detailsOfWork,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
            ':number_of_working_days' => $numberOfWorkingDays,
            ':number_of_workers' => $numberOfWorkers,
            ':contractor_name' => $contractorName,
            ':contractor_contact_number' => $contractorContactNumber,
            ':application_method' => $applicationMethod,
            ':construction_address' => $constructionAddress,
            ':latitude' => $latitude,
            ':longitude' => $longitude,
            ':agreed' => $agreeCheckBox,
            ':dss_status' => $currentDSSStatus,
            ':id' => $applicationId
        ];

        // MODIFIED: Removed requirements field from SQL
        $sql = "UPDATE construction_applications SET
            first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            suffix = :suffix,
            contact_no_owner = :contact_no_owner,
            owner_address = :owner_address,
            type_of_work = :type_of_work,
            nature_of_activity = :nature_of_activity,
            details_of_work = :details_of_work,
            start_date = :start_date,
            end_date = :end_date,
            number_of_working_days = :number_of_working_days,
            number_of_workers = :number_of_workers,
            contractor_name = :contractor_name,
            contractor_contact_number = :contractor_contact_number,
            application_method = :application_method,
            construction_address = :construction_address,
            latitude = :latitude,
            longitude = :longitude,
            agreed = :agreed,
            dss_status = :dss_status,
            updated_at = NOW(),
            status = 'Complied' ";

        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/construction/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
                file_put_contents($uploadDir . '.htaccess', "Deny from all\n");
            }
            $originalName = basename($_FILES['requirementUpload']['name']);
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $fileName = time() . '_' . uniqid() . '.' . $extension;
            
            if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $uploadDir . $fileName)) {
                $sql .= ", requirement_upload = :requirement_upload ";
                $params[':requirement_upload'] = $fileName;
            } else {
                throw new Exception("Failed to move uploaded file.");
            }
        }

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
        error_log("SQL Error in handleUpdateApplication: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("General Error in handleUpdateApplication: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "General Error: " . $e->getMessage()]);
    }
}

/**
 * Triggers DSS re-evaluation for a construction application
 * 
 * @param PDO $pdo Database connection object
 * @param int $applicationId ID of the application to re-evaluate
 */
function triggerDSSevaluation($pdo, $applicationId)
{
    try {
        $stmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            error_log("Application not found for DSS re-evaluation: " . $applicationId);
            return;
        }

        $dss = new ConstructionDSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM construction_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $evalStmt = $pdo->prepare("
                UPDATE construction_evaluations 
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
                INSERT INTO construction_evaluations 
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
            UPDATE construction_applications 
            SET dss_status = :dss_status,
                updated_at = NOW()
            WHERE id = :id
        ");

        $updateAppStmt->execute([
            ':dss_status' => $statusValue,
            ':id' => $applicationId
        ]);

        logEvaluation($applicationId, $evaluationResult);
    } catch (Exception $e) {
        error_log("DSS Re-evaluation failed for application {$applicationId}: " . $e->getMessage());

        try {
            $errorStmt = $pdo->prepare("
                UPDATE construction_applications 
                SET dss_status = 'Evaluation Error',
                    updated_at = NOW()
                WHERE id = :id
            ");
            $errorStmt->execute([':id' => $applicationId]);
        } catch (Exception $ex) {
            error_log("Failed to update error status: " . $ex->getMessage());
        }
    }
}

/**
 * Generates chart data for construction analytics
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartConstructionType($pdo)
{
    try {
        $sql1 = "
            SELECT application_date, COUNT(*) AS total
            FROM construction_applications
            GROUP BY application_date
            ORDER BY application_date ASC
        ";

        $stmt1 = $pdo->query($sql1);
        $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

        $sql2 = "
            SELECT nature_of_activity, COUNT(*) AS total
            FROM construction_applications
            GROUP BY nature_of_activity
            ORDER BY nature_of_activity ASC
        ";

        $stmt2 = $pdo->query($sql2);
        $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $sql3 = "
            SELECT COALESCE(ce.dss_status, 'Pending Evaluation') as dss_status, COUNT(*) as total
            FROM construction_applications ca
            LEFT JOIN construction_evaluations ce ON ca.id = ce.application_id
            GROUP BY COALESCE(ce.dss_status, 'Pending Evaluation')
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
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Error in handleChartConstructionType: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Error generating chart data"]);
    }
}

/**
 * Evaluates a construction application using the DSS rule engine
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

        $stmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        $dss = new ConstructionDSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM construction_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);

        if ($checkStmt->fetch()) {
            $evalStmt = $pdo->prepare("
                UPDATE construction_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE application_id = :app_id
            ");
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO construction_evaluations 
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
            UPDATE construction_applications 
            SET dss_status = :dss_status,
                updated_at = NOW()
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
 * Logs DSS evaluation results to a file
 * 
 * @param int $applicationId ID of the evaluated application
 * @param array $evaluationResult Complete evaluation result
 */
function logEvaluation($applicationId, $evaluationResult)
{
    try {
        $logFile = __DIR__ . '/construction_dss_evaluations.log';
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

        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        error_log("Failed to log evaluation: " . $e->getMessage());
    }
}

/**
 * Retrieves DSS evaluation details for a specific construction application
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
            $checkStmt = $pdo->prepare("SELECT id FROM construction_applications WHERE id = :id AND supabase_user_id = :user_id");
            $checkStmt->execute([':id' => $applicationId, ':user_id' => $supabaseUserId]);
            if (!$checkStmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "Unauthorized to view this evaluation"]);
                return;
            }
        }

        $stmt = $pdo->prepare("
            SELECT e.*, a.first_name, a.last_name, a.nature_of_activity,
                   a.status as app_status, a.dss_status as app_dss_status
            FROM construction_evaluations e
            JOIN construction_applications a ON e.application_id = a.id
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
                    'max_score' => 7,
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
        error_log("Error in handleGetEvaluation: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Retrieves complete application details including DSS evaluation
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
            SELECT ca.*, 
                   ce.dss_status, 
                   ce.evaluation_details,
                   ce.evaluated_at as dss_evaluated_at,
                   (SELECT json_agg(json_build_object('status', status, 'comments', comments, 'changed_at', changed_at))
                    FROM construction_status_history 
                    WHERE application_id = ca.id 
                    ORDER BY changed_at DESC) as status_history
            FROM construction_applications ca
            LEFT JOIN construction_evaluations ce ON ca.id = ce.application_id
            WHERE ca.id = :id
        ");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        // MODIFIED: Removed requirements decoding since we're not using it anymore
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
        error_log("Error in handleGetApplicationWithDSS: " . $e->getMessage());
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
            FROM construction_applications ca
            LEFT JOIN construction_evaluations ce ON ca.id = ce.application_id
        ");
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        $trendsStmt = $pdo->query("
            SELECT 
                DATE(evaluated_at) as evaluation_date,
                COUNT(*) as total_evaluations,
                SUM(CASE WHEN dss_status = 'Pre-Approved' THEN 1 ELSE 0 END) as pre_approved_count
            FROM construction_evaluations 
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
        error_log("Error in handleGetEvaluationStats: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Returns information about all DSS rules for construction
 * 
 * @return array List of DSS rules
 */
function handleGetRules()
{
    try {
        $rules = [
            [
                'id' => 'CR1',
                'name' => 'Complete Requirements Rule',
                'description' => 'Checks if all required construction documents are submitted',
                'priority' => 10
            ],
            [
                'id' => 'CR2',
                'name' => 'Valid Construction Location Rule',
                'description' => 'Verifies construction site is within barangay boundaries',
                'priority' => 9
            ],
            [
                'id' => 'CR3',
                'name' => 'Safety Compliance Rule',
                'description' => 'Ensures construction type meets safety standards',
                'priority' => 8
            ],
            [
                'id' => 'CR4',
                'name' => 'Contractor Qualification Rule',
                'description' => 'Validates contractor information and qualifications',
                'priority' => 7
            ],
            [
                'id' => 'CR5',
                'name' => 'Schedule Validation Rule',
                'description' => 'Checks if construction schedule is reasonable and safe',
                'priority' => 6
            ],
            [
                'id' => 'CR6',
                'name' => 'Owner Agreement Rule',
                'description' => 'Verifies owner agreement and valid contact information',
                'priority' => 5
            ],
            [
                'id' => 'CR7',
                'name' => 'Environmental Impact Rule',
                'description' => 'Assesses environmental impact and required documentation',
                'priority' => 4
            ]
        ];

        echo json_encode([
            "status" => "success",
            "rules" => $rules
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Error in handleGetRules: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Manually triggers DSS evaluation for a specific construction application
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
        error_log("Error in handleTriggerEvaluation: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Evaluates all pending construction applications (for staff use)
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

        $sql = "SELECT ca.id FROM construction_applications ca
                LEFT JOIN construction_evaluations ce ON ca.id = ce.application_id
                WHERE ce.id IS NULL OR ce.dss_status = 'Pending Evaluation' OR ce.dss_status = 'Evaluation Error'";

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
        error_log("Error in handleEvaluateAllPending: " . $e->getMessage());
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
            SELECT ca.*, 
                   ce.dss_status, 
                   ce.evaluation_details,
                   ce.evaluated_at as dss_evaluated_at
            FROM construction_applications ca
            LEFT JOIN construction_evaluations ce ON ca.id = ce.application_id
            WHERE ca.id = :id
        ");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        // MODIFIED: Removed requirements decoding
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
        error_log("Error in handleGetApplicationDetails: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

/**
 * Gets construction requirements based on application type
 * 
 * @param PDO $pdo Database connection object
 */
function handleGetRequirements($pdo)
{
    try {
        $typeOfWork = $_GET['type_of_work'] ?? null;
        
        $requirements = [
            'New Construction' => [
                'Building Plan',
                'Contractor License',
                'Barangay Clearance',
                'Structural Design',
                'Environmental Certificate'
            ],
            'Renovation' => [
                'Building Plan',
                'Contractor License',
                'Barangay Clearance',
                'Structural Assessment'
            ],
            'Demolition' => [
                'Demolition Plan',
                'Contractor License',
                'Barangay Clearance',
                'Safety Plan',
                'Waste Disposal Plan'
            ],
            'Excavation' => [
                'Excavation Plan',
                'Contractor License',
                'Barangay Clearance',
                'Safety Plan',
                'Soil Report'
            ]
        ];

        if ($typeOfWork && isset($requirements[$typeOfWork])) {
            echo json_encode([
                "status" => "success",
                "requirements" => $requirements[$typeOfWork]
            ]);
        } else {
            echo json_encode([
                "status" => "success",
                "requirements" => [
                    'Building Plan',
                    'Contractor License',
                    'Barangay Clearance'
                ]
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Error in handleGetRequirements: " . $e->getMessage());
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
        $checkStmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'construction_evaluations')");
        $exists = $checkStmt->fetchColumn();

        if (!$exists) {
            $createSQL = "
                CREATE TABLE construction_evaluations (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER UNIQUE NOT NULL,
                    dss_status VARCHAR(50) NOT NULL DEFAULT 'Pending Evaluation',
                    evaluation_details JSONB,
                    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    error_message TEXT,
                    FOREIGN KEY (application_id) REFERENCES construction_applications(id) ON DELETE CASCADE
                );
                
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'construction_applications' 
                                  AND column_name = 'dss_status') THEN
                        ALTER TABLE construction_applications ADD COLUMN dss_status VARCHAR(50) DEFAULT 'Pending Evaluation';
                    END IF;
                END $$;
                
                CREATE TABLE IF NOT EXISTS construction_status_history (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    comments TEXT,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES construction_applications(id) ON DELETE CASCADE
                );
                
                CREATE INDEX IF NOT EXISTS idx_construction_evaluations_app_id ON construction_evaluations(application_id);
                CREATE INDEX IF NOT EXISTS idx_construction_status_history_app_id ON construction_status_history(application_id);
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

// Ensure DSS tables exist
ensureEvaluationTableExists($pdo);