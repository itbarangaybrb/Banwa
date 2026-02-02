<?php
require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../services/staff/business/business_analytics.php';
require_once __DIR__ . '/../../../services/staff/business/business_applications.php';
require_once __DIR__ . '/../../../services/staff/business/business_dss.php';

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

require_once __DIR__ . '/../../../api/dss_rule_engine/business_dss.php';

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
        case 'chart_business_type':
            handleChartBusinessType($pdo);
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
 * Handles creation of new business applications with all required data and file uploads
 * Also creates initial DSS evaluation record for the application
 * 
 * @param PDO $pdo Database connection object
 */
function handleCreateApplication($pdo)
{
    try {
        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;
        $businessName = get_input('businessName');
        $typeOfBusiness = get_input('typeOfBusiness');
        $natureOfBusiness = get_input('natureOfBusiness');
        $natureOfBusinessSpecify = get_input('natureOfBusinessSpecify');
        $businessLotNo = get_input('businessLotNo');
        $businessStreet = get_input('businessStreet');
        $addressOfBusiness = trim($businessLotNo . ' ' . $businessStreet);
        $contactNoBusiness = get_input('contactNoBusiness');
        $emailAddress = get_input('emailAddress');

        $firstName = get_input('firstName');
        $middleName = get_input('middleName');
        $lastName = get_input('lastName');
        $suffix = get_input('suffix') ?? '';
        $contactNoOwner = get_input('contactNoOwner');
        $lotNo = get_input('lotNo');
        $street = get_input('street');
        $addressOwner = trim($lotNo . ' ' . $street);

        $typeOfStructure = get_input('typeOfStructureSelect');
        $typeOfStructureSpecify = get_input('typeOfStructureSpecify');
        $noOfEmployees = get_input('noOfEmployees');
        $applicationDate = get_input('applicationDate');
        $latitude = get_input('latitude2');
        $longitude = get_input('longitude2');
        $natureOfApplication = get_input('natureOfApplication');

        $rawStatus = $_POST['businessStatus'] ?? [];
        if (!is_array($rawStatus)) {
            $rawStatus = [$rawStatus];
        }
        $businessStatus = json_encode($rawStatus);

        $requirements = isset($_POST['requirements']) ? $_POST['requirements'] : [];
        if (!is_array($requirements)) {
            $requirements = [$requirements];
        }
        $requirements = json_encode($requirements);

        $requirementUpload = null;
        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $fileName = time() . '_' . basename($_FILES['requirementUpload']['name']);
            if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $uploadDir . $fileName)) {
                $requirementUpload = $fileName;
            }
        }

        $sql = "INSERT INTO business_applications (
            supabase_user_id, business_name, type_of_business, nature_of_business, 
            nature_of_business_specify, address_of_business, latitude, longitude, 
            business_status, telephone_no_business, email_address, first_name, 
            middle_name, last_name, suffix, telephone_no_owner, address_owner,
            type_of_structure, type_of_structure_specify, no_of_employees,
            requirements, requirement_upload, application_date, nature_of_application, status
        ) VALUES (
            :supabase_user_id, :business_name, :type_of_business, :nature_of_business, 
            :nature_of_business_specify, :address_of_business, :latitude, :longitude, 
            :business_status::json, :telephone_no_business, :email_address, :first_name, 
            :middle_name, :last_name, :suffix, :telephone_no_owner, :address_owner,
            :type_of_structure, :type_of_structure_specify, :no_of_employees,
            :requirements::json, :requirement_upload, :application_date, :nature_of_application, 'Pending'
        ) RETURNING id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':supabase_user_id' => $supabaseUserId,
            ':business_name' => $businessName,
            ':type_of_business' => $typeOfBusiness,
            ':nature_of_business' => $natureOfBusiness,
            ':nature_of_business_specify' => $natureOfBusinessSpecify,
            ':address_of_business' => $addressOfBusiness,
            ':latitude' => $latitude,
            ':longitude' => $longitude,
            ':business_status' => $businessStatus,
            ':telephone_no_business' => $contactNoBusiness,
            ':email_address' => $emailAddress,
            ':first_name' => $firstName,
            ':middle_name' => $middleName,
            ':last_name' => $lastName,
            ':suffix' => $suffix,
            ':telephone_no_owner' => $contactNoOwner,
            ':address_owner' => $addressOwner,
            ':type_of_structure' => $typeOfStructure,
            ':type_of_structure_specify' => $typeOfStructureSpecify,
            ':no_of_employees' => $noOfEmployees ?: 0,
            ':requirements' => $requirements,
            ':requirement_upload' => $requirementUpload,
            ':application_date' => $applicationDate,
            ':nature_of_application' => $natureOfApplication
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $applicationId = $result['id'];
        createInitialDSSEvaluation($pdo, $applicationId);

        echo json_encode(["status" => "success", "id" => $applicationId, "message" => "Application Created!"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "General Error: " . $e->getMessage()]);
    }
}

/**
 * Fetches business applications with role-based access control
 * Staff users can see all applications, regular users only see their own
 * Includes DSS evaluation details and summary information
 * 
 * @param PDO $pdo Database connection object
 */
function handleFetchApplications($pdo)
{
    try {
        $sql = "SELECT ba.* 
                FROM business_applications ba
                ORDER BY ba.created_at DESC";
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
 * Handles status updates for business applications with special logic for payment and disapproval
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
    $amount = $_POST['assessmentAmount'] ?? 0;

    if (!$id || !$newStatus) {
        echo json_encode(["status" => "error", "message" => "Missing ID or Status"]);
        return;
    }

    try {
        $getStmt = $pdo->prepare("SELECT dss_status FROM business_applications WHERE id = :id");
        $getStmt->execute([':id' => $id]);
        $currentApp = $getStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentApp['dss_status'] ?? null;

        $sql = "UPDATE business_applications SET status = :status, approval_comments = :comments ";
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
 * Handles updates to existing business applications
 * Only updates fields that were actually submitted
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
        
        // Initialize update arrays
        $updateFields = [];
        $params = [':id' => $applicationId];
        
        // List of all possible fields that can be updated
        $possibleFields = [
            'businessName' => 'business_name',
            'typeOfBusiness' => 'type_of_business',
            'natureOfBusiness' => 'nature_of_business',
            'natureOfBusinessSpecify' => 'nature_of_business_specify',
            'contactNoBusiness' => 'telephone_no_business',
            'emailAddress' => 'email_address',
            'firstName' => 'first_name',
            'middleName' => 'middle_name',
            'lastName' => 'last_name',
            'suffix' => 'suffix',
            'contactNoOwner' => 'telephone_no_owner',
            'typeOfStructure' => 'type_of_structure',
            'typeOfStructureSpecify' => 'type_of_structure_specify',
            'noOfEmployees' => 'no_of_employees',
            'applicationDate' => 'application_date',
            'natureOfApplication' => 'nature_of_application'
        ];
        
        // Check each possible field to see if it was submitted
        foreach ($possibleFields as $formField => $dbField) {
            $value = get_input($formField);
            if ($value !== null) {
                $updateFields[] = "$dbField = :$dbField";
                $params[":$dbField"] = $value;
            }
        }
        
        // Handle address fields separately
        $businessLotNo = get_input('businessLotNo');
        $businessStreet = get_input('businessStreet');
        if ($businessLotNo !== null || $businessStreet !== null) {
            $addressOfBusiness = trim(($businessLotNo ?? '') . ' ' . ($businessStreet ?? ''));
            $updateFields[] = "address_of_business = :address_of_business";
            $params[':address_of_business'] = $addressOfBusiness;
        }
        
        $lotNo = get_input('lotNo');
        $street = get_input('street');
        if ($lotNo !== null || $street !== null) {
            $addressOwner = trim(($lotNo ?? '') . ' ' . ($street ?? ''));
            $updateFields[] = "address_owner = :address_owner";
            $params[':address_owner'] = $addressOwner;
        }
        
        // Handle latitude/longitude
        $latitude = get_input('latitude2');
        $longitude = get_input('longitude2');
        if ($latitude !== null) {
            $updateFields[] = "latitude = :latitude";
            $params[':latitude'] = $latitude;
        }
        if ($longitude !== null) {
            $updateFields[] = "longitude = :longitude";
            $params[':longitude'] = $longitude;
        }
        
        // Handle business_status JSON field
        if (isset($_POST['businessStatus'])) {
            $businessStatus = json_encode($_POST['businessStatus']);
            $updateFields[] = "business_status = :business_status::json";
            $params[':business_status'] = $businessStatus;
        }
        
        // Handle requirements JSON field
        if (isset($_POST['requirements'])) {
            $requirements = json_encode($_POST['requirements']);
            $updateFields[] = "requirements = :requirements::json";
            $params[':requirements'] = $requirements;
        }
        
        // Get current DSS status
        $getDSSStmt = $pdo->prepare("SELECT dss_status FROM business_applications WHERE id = :id");
        $getDSSStmt->execute([':id' => $applicationId]);
        $currentDSS = $getDSSStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentDSS['dss_status'] ?? 'Pending Evaluation';
        
        // Always include these updates
        $updateFields[] = "dss_status = :dss_status";
        $updateFields[] = "updated_at = NOW()";
        $updateFields[] = "status = 'Complied'";
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
        if (count($updateFields) <= 3) { // Only dss_status, updated_at, and status were added
            echo json_encode(["status" => "success", "message" => "No changes to update."]);
            return;
        }
        
        // Build SQL query
        $sql = "UPDATE business_applications SET " . implode(', ', $updateFields);
        
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
            echo json_encode(["status" => "success", "message" => "Business application updated successfully! DSS re-evaluation triggered."]);
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
 * Evaluates a business application using the DSS rule engine
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

        $stmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        $dss = new DSSRuleEngine();
        $evaluationResult = $dss->evaluateApplication($application);
        $statusValue = (string)$evaluationResult['status'];

        $checkStmt = $pdo->prepare("SELECT 1 FROM business_evaluations WHERE application_id = :app_id");
        $checkStmt->execute([':app_id' => $applicationId]);

        if ($checkStmt->fetch()) {
            $evalStmt = $pdo->prepare("
                UPDATE business_evaluations 
                SET dss_status = :status, 
                    evaluation_details = :details, 
                    evaluated_at = NOW()
                WHERE application_id = :app_id
            ");
        } else {
            $evalStmt = $pdo->prepare("
                INSERT INTO business_evaluations 
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
            UPDATE business_applications 
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
            $checkStmt = $pdo->prepare("SELECT id FROM business_applications WHERE id = :id AND supabase_user_id = :user_id");
            $checkStmt->execute([':id' => $applicationId, ':user_id' => $supabaseUserId]);
            if (!$checkStmt->fetch()) {
                echo json_encode(["status" => "error", "message" => "Unauthorized to view this evaluation"]);
                return;
            }
        }

        $stmt = $pdo->prepare("
            SELECT e.*, a.business_name, a.type_of_business, a.nature_of_application,
                   a.status as app_status, a.dss_status as app_dss_status
            FROM business_evaluations e
            JOIN business_applications a ON e.application_id = a.id
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
                    'max_score' => 6,
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
            SELECT ba.*, 
                   be.dss_status, 
                   be.evaluation_details,
                   be.evaluated_at as dss_evaluated_at,
                   (SELECT json_agg(json_build_object('status', status, 'comments', comments, 'changed_at', changed_at))
                    FROM business_status_history 
                    WHERE application_id = ba.id 
                    ORDER BY changed_at DESC) as status_history
            FROM business_applications ba
            LEFT JOIN business_evaluations be ON ba.id = be.application_id
            WHERE ba.id = :id
        ");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        if (is_string($application['business_status'])) {
            $application['business_status'] = json_decode($application['business_status'], true);
        }
        if (is_string($application['requirements'])) {
            $application['requirements'] = json_decode($application['requirements'], true);
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
            FROM business_applications ba
            LEFT JOIN business_evaluations be ON ba.id = be.application_id
        ");
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        $trendsStmt = $pdo->query("
            SELECT 
                DATE(evaluated_at) as evaluation_date,
                COUNT(*) as total_evaluations,
                SUM(CASE WHEN dss_status = 'Pre-Approved' THEN 1 ELSE 0 END) as pre_approved_count
            FROM business_evaluations 
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
                'description' => 'Checks if all required documents are submitted based on application type',
                'priority' => 10
            ],
            [
                'id' => 'R2',
                'name' => 'Valid Business Location Rule',
                'description' => 'Verifies business is within barangay boundaries',
                'priority' => 9
            ],
            [
                'id' => 'R3',
                'name' => 'Business Type Compliance Rule',
                'description' => 'Ensures business type is not restricted',
                'priority' => 8
            ],
            [
                'id' => 'R4',
                'name' => 'Structure Safety Rule',
                'description' => 'Checks if business structure meets safety standards',
                'priority' => 7
            ],
            [
                'id' => 'R5',
                'name' => 'Employee Capacity Rule',
                'description' => 'Verifies employee count is within structure capacity limits',
                'priority' => 6
            ],
            [
                'id' => 'R6',
                'name' => 'Valid Contact Information Rule',
                'description' => 'Validates phone number and email format',
                'priority' => 5
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

        $sql = "SELECT ba.id FROM business_applications ba
                LEFT JOIN business_evaluations be ON ba.id = be.application_id
                WHERE be.id IS NULL OR be.dss_status = 'Pending Evaluation' OR be.dss_status = 'Evaluation Error'";

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
            SELECT ba.*, 
                   be.dss_status, 
                   be.evaluation_details,
                   be.evaluated_at as dss_evaluated_at
            FROM business_applications ba
            LEFT JOIN business_evaluations be ON ba.id = be.application_id
            WHERE ba.id = :id
        ");
        $stmt->execute([':id' => $applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            echo json_encode(["status" => "error", "message" => "Application not found"]);
            return;
        }

        if (is_string($application['business_status'])) {
            $application['business_status'] = json_decode($application['business_status'], true);
        }
        if (is_string($application['requirements'])) {
            $application['requirements'] = json_decode($application['requirements'], true);
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
 * Creates business_evaluations, business_status_history tables if missing
 * Also adds dss_status column to business_applications if not present
 * 
 * @param PDO $pdo Database connection object
 * @return bool True if tables exist or were created successfully
 */
function ensureEvaluationTableExists($pdo)
{
    try {
        $checkStmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_evaluations')");
        $exists = $checkStmt->fetchColumn();

        if (!$exists) {
            $createSQL = "
                CREATE TABLE business_evaluations (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER UNIQUE NOT NULL,
                    dss_status VARCHAR(50) NOT NULL DEFAULT 'Pending Evaluation',
                    evaluation_details JSONB,
                    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES business_applications(id) ON DELETE CASCADE
                );
                
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'business_applications' 
                                  AND column_name = 'dss_status') THEN
                        ALTER TABLE business_applications ADD COLUMN dss_status VARCHAR(50) DEFAULT 'Pending Evaluation';
                    END IF;
                END $$;
                
                CREATE TABLE IF NOT EXISTS business_status_history (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    comments TEXT,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES business_applications(id) ON DELETE CASCADE
                );
                
                CREATE INDEX IF NOT EXISTS idx_business_evaluations_app_id ON business_evaluations(application_id);
                CREATE INDEX IF NOT EXISTS idx_business_status_history_app_id ON business_status_history(application_id);
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
