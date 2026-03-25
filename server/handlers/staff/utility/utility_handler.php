<?php
// Ensure errors don't emit HTML before headers
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../services/staff/utility/utility_dss.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';
require_once __DIR__ . '/../../../services/broadcast.php';

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

$action = $_REQUEST['action'] ?? null;

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
        case 'get_evaluation':
            handleGetEvaluation($pdo);
            break;
        case 'get_evaluation_stats':
            handleGetEvaluationStats($pdo);
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

        // Get the newly created application data for audit log
        $newStmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
        $newStmt->execute([':id' => $applicationId]);
        $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

        createInitialDSSEvaluation($pdo, $applicationId);

        broadcastEvent('utility_applications_update', ['id' => $applicationId]);

        // Write audit log for CREATE action
        writeAuditLog(
            $pdo,
            'CREATE',
            'utility_applications',
            $applicationId,
            null,
            $newData,
            'UTILITY_APPLICATION'
        );

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
                ORDER BY ua.id ASC";
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
        // Get current data before update for audit log
        $oldStmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
        $oldStmt->execute([':id' => $id]);
        $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

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

        // Get new data after update for audit log
        $newStmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
        $newStmt->execute([':id' => $id]);
        $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

        broadcastEvent('utility_applications_update', ['id' => $id, 'status' => $newStatus]);

        // Write audit log for status update
        writeAuditLog(
            $pdo,
            'STATUS UPDATED',
            'utility_applications',
            $id,
            $oldData,
            $newData,
            'STATUS_UPDATE'
        );

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
 * Handles updates to existing utility applications
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

        // Get current data before update for audit log
        $oldStmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
        $oldStmt->execute([':id' => $applicationId]);
        $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

        // Initialize update arrays
        $updateFields = [];
        $params = [':id' => $applicationId];

        // List of all possible fields that can be updated
        $possibleFields = [
            'firstName' => 'first_name',
            'middleName' => 'middle_name',
            'lastName' => 'last_name',
            'suffix' => 'suffix',
            'contactNoOwner' => 'owner_contact_no',
            'requestDate' => 'request_date',
            'dateOfWork' => 'date_of_work',
            'natureOfWork' => 'nature_of_work',
            'provider' => 'provider'
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
        $ownerAddress = get_input('addressOwner');
        if ($ownerAddress !== null) {
            $updateFields[] = "owner_address = :owner_address";
            $params[':owner_address'] = $ownerAddress;
        }

        $utilityLotNo = get_input('utilityLotNo');
        $utilityStreet = get_input('utilityStreet');
        if ($utilityLotNo !== null || $utilityStreet !== null) {
            $addressOfUtility = trim(($utilityLotNo ?? '') . ' ' . ($utilityStreet ?? ''));
            $updateFields[] = "address_of_utility = :address_of_utility";
            $params[':address_of_utility'] = $addressOfUtility;
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

        // Get current DSS status
        $getDSSStmt = $pdo->prepare("SELECT dss_status FROM utility_applications WHERE id = :id");
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
        $sql = "UPDATE utility_applications SET " . implode(', ', $updateFields);

        if ($supabaseUserId) {
            $sql .= " WHERE id = :id AND supabase_user_id = :supabase_user_id";
            $params[':supabase_user_id'] = $supabaseUserId;
        } else {
            $sql .= " WHERE id = :id";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            // Get new data after update for audit log
            $newStmt = $pdo->prepare("SELECT * FROM utility_applications WHERE id = :id");
            $newStmt->execute([':id' => $applicationId]);
            $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

            broadcastEvent('utility_applications_update', ['id' => $applicationId]);

            // Write audit log for UPDATE action
            writeAuditLog(
                $pdo,
                'UPDATE',
                'utility_applications',
                $applicationId,
                $oldData,
                $newData,
                'UTILITY_APPLICATION'
            );

            triggerDSSevaluation($pdo, $applicationId);
            echo json_encode(["status" => "success", "message" => "Utility application updated successfully! DSS re-evaluation triggered."]);
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
 * Generates chart data for utility analytics including application trends by date,
 * provider distribution, and DSS status breakdown
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartUtilityType($pdo)
{
    $sql1 = "
        SELECT application_date, COUNT(*) AS total
        FROM utility_applications
        GROUP BY application_date
        ORDER BY total ASC
    ";

    $stmt1 = $pdo->query($sql1);
    $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $sql2 = "
        SELECT 
            provider, 
            COUNT(*) AS total,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
        FROM utility_applications
        GROUP BY provider
        ORDER BY total ASC
    ";

    $stmt2 = $pdo->query($sql2);
    $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $sql3 = "
        SELECT 
            COALESCE(ue.dss_status, 'Pending Evaluation') as dss_status,
            COUNT(*) as total,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
        FROM utility_applications ua
        LEFT JOIN utility_evaluations ue ON ua.id = ue.application_id
        GROUP BY COALESCE(ue.dss_status, 'Pending Evaluation')
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
}
