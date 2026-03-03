<?php
// Prevent PHP errors from rendering HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

require_once __DIR__ . '/../../../configs/database.php';
require_once __DIR__ . '/../../../services/staff/construction/construction_dss.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php'; // Add audit log function

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
        case 'chart_construction_type':
            handleChartConstructionType($pdo);
            break;
        case 'get_evaluation':
            handleGetEvaluation($pdo);
            break;
        case 'get_application_details':
            handleGetApplicationDetails($pdo);
            break;
        case 'get_requirements':
            handleGetRequirements($pdo);
            break;
        case 're_run_ocr':
            $appId = (int)($_POST['id'] ?? 0);
            if ($appId <= 0) {
                echo json_encode(["status" => "error", "message" => "Invalid ID"]);
                exit;
            }

            // Fetch current files
            $stmt = $pdo->prepare("SELECT requirement_upload_json FROM construction_applications WHERE id = :id");
            $stmt->execute([':id' => $appId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $files = json_decode($row['requirement_upload_json'] ?? '[]', true);

            if (empty($files)) {
                echo json_encode(["status" => "error", "message" => "No files found"]);
                exit;
            }

            queueOCRJob($pdo, $appId, $files);
            echo json_encode(["status" => "success", "message" => "OCR re-run queued"]);
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
function getCurrentDateString()
{
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

        // Agreement
        $agreeCheckBox = (int)(get_input('agreed') ?? 0);

        // Application Date
        $applicationDate = get_input('applicationDate') ?? getCurrentDateString();

        // === FILE UPLOAD HANDLING (MULTIPLE FILES ONLY) ===
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $uploadedFiles = [];
        if (!empty($_FILES['requirementUpload']['name'][0])) {
            foreach ($_FILES['requirementUpload']['tmp_name'] as $key => $tmpName) {
                if ($_FILES['requirementUpload']['error'][$key] === 0) {
                    $originalName = basename($_FILES['requirementUpload']['name'][$key]);
                    $savedName = uniqid('const_') . '_' . $originalName;
                    $targetPath = $uploadDir . $savedName;
                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $uploadedFiles[] = [
                            'filename' => $originalName,
                            'saved_filename' => $savedName,
                            'file_url' => '/Banwa/server/handlers/staff/construction/uploads/' . $savedName
                        ];
                    }
                }
            }
        }

        // Always create JSON (empty array if no files)
        $filesJson = json_encode($uploadedFiles);
        error_log("=== CREATE DEBUG === Uploaded files count: " . count($uploadedFiles) . " | JSON: " . $filesJson);

        // === VALIDATION ===
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

        // === INSERT QUERY (removed old requirement_upload column) ===
        $sql = "INSERT INTO construction_applications (
            supabase_user_id, first_name, middle_name, last_name, suffix,
            contact_no_owner, owner_address, type_of_work, nature_of_activity, 
            details_of_work, start_date, end_date, number_of_working_days, 
            number_of_workers, contractor_name, contractor_contact_number, 
            application_method, construction_address, latitude, longitude, 
            agreed, application_date, 
            status, created_at, updated_at, requirement_upload_json
        ) VALUES (
            :supabase_user_id, :first_name, :middle_name, :last_name, :suffix,
            :contact_no_owner, :owner_address, :type_of_work, :nature_of_activity, 
            :details_of_work, :start_date, :end_date, :number_of_working_days, 
            :number_of_workers, :contractor_name, :contractor_contact_number, 
            :application_method, :construction_address, :latitude, :longitude, 
            :agreed, :application_date, 
            'Pending', NOW(), NOW(), :requirement_upload_json
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
            ':agreed' => $agreeCheckBox,
            ':application_date' => $applicationDate,
            ':requirement_upload_json' => $filesJson
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $applicationId = $result['id'];

        // Get the newly created application data for audit log
        $newStmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
        $newStmt->execute([':id' => $applicationId]);
        $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

        // Write audit log for CREATE action
        // writeAuditLog(
        //     $pdo,
        //     'CREATE',
        //     'construction_applications',
        //     $applicationId,
        //     null,
        //     $newData,
        //     'CONSTRUCTION_APPLICATION'
        // );

        // === QUEUE OCR JOB AFTER SUCCESSFUL INSERT ===
        if (!empty($uploadedFiles)) {
            try {
                queueOCRJob($pdo, $applicationId, $uploadedFiles);
                error_log("OCR job queued for application {$applicationId} with " . count($uploadedFiles) . " files");
            } catch (Exception $qE) {
                error_log("Queue OCR error for application {$applicationId}: " . $qE->getMessage());
            }
        } else {
            error_log("No files uploaded for application {$applicationId}, skipping OCR queue.");
        }

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

function queueOCRJob($pdo, $applicationId, $files)
{
    $payload = json_encode([
        'application_id' => $applicationId,
        'files' => $files
    ]);

    $stmt = $pdo->prepare("INSERT INTO ocr_jobs (job_type, payload, status, created_at) 
                           VALUES ('construction_application_files', :payload::json, 'pending', NOW())");
    $stmt->execute([':payload' => $payload]);
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
        // Get current data before update for audit log
        $oldStmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
        $oldStmt->execute([':id' => $id]);
        $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

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

        // Get new data after update for audit log
        $newStmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
        $newStmt->execute([':id' => $id]);
        $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

        // Write audit log for status update
        // writeAuditLog(
        //     $pdo,
        //     'STATUS UPDATED',
        //     'construction_applications',
        //     $id,
        //     $oldData,
        //     $newData,
        //     'STATUS_UPDATE'
        // );

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
 * Handles updates to existing construction applications
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
        $oldStmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
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
            'contactNoOwner' => 'contact_no_owner',
            'owner_address' => 'owner_address',
            'typeOfWork' => 'type_of_work',
            'natureOfActivity' => 'nature_of_activity',
            'detailsOfWork' => 'details_of_work',
            'startDate' => 'start_date',
            'endDate' => 'end_date',
            'numberOfWorkingDays' => 'number_of_working_days',
            'numberOfWorkers' => 'number_of_workers',
            'contractorName' => 'contractor_name',
            'contractorContactNumber' => 'contractor_contact_number',
            'applicationMethod' => 'application_method',
            'constructionAddress' => 'construction_address',
            'latitude' => 'latitude',
            'longitude' => 'longitude',
            'agreed' => 'agreed'
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
        $lotNo = get_input('lotNo');
        $street = get_input('street');
        if ($lotNo !== null || $street !== null) {
            $ownerAddress = trim(($lotNo ?? '') . ' ' . ($street ?? ''));
            $updateFields[] = "owner_address = :owner_address";
            $params[':owner_address'] = $ownerAddress;
        }

        $constructionLotNo = get_input('constructionLotNo');
        $constructionStreet = get_input('constructionStreet');
        if ($constructionLotNo !== null || $constructionStreet !== null) {
            $constructionAddress = trim(($constructionLotNo ?? '') . ' ' . ($constructionStreet ?? ''));
            $updateFields[] = "construction_address = :construction_address";
            $params[':construction_address'] = $constructionAddress;
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
        $getDSSStmt = $pdo->prepare("SELECT dss_status FROM construction_applications WHERE id = :id");
        $getDSSStmt->execute([':id' => $applicationId]);
        $currentDSS = $getDSSStmt->fetch(PDO::FETCH_ASSOC);
        $currentDSSStatus = $currentDSS['dss_status'] ?? 'Pending Evaluation';

        // Always include these updates
        $updateFields[] = "dss_status = :dss_status";
        $updateFields[] = "updated_at = NOW()";
        $updateFields[] = "status = 'Complied'";
        $params[':dss_status'] = $currentDSSStatus;

        // Handle file upload if provided
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $uploadedFiles = [];
        if (!empty($_FILES['requirementUpload']['name'][0])) {
            foreach ($_FILES['requirementUpload']['tmp_name'] as $key => $tmpName) {
                if ($_FILES['requirementUpload']['error'][$key] === 0) {
                    $originalName = basename($_FILES['requirementUpload']['name'][$key]);
                    $savedName = uniqid('const_') . '_' . $originalName;
                    $targetPath = $uploadDir . $savedName;
                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $uploadedFiles[] = [
                            'filename' => $originalName,
                            'saved_filename' => $savedName,
                            'file_url' => '/Banwa/server/handlers/staff/construction/uploads/' . $savedName
                        ];
                    }
                }
            }
        }

        // Fetch current requirement_upload_json to preserve existing files
        $currentStmt = $pdo->prepare("SELECT requirement_upload_json FROM construction_applications WHERE id = :id");
        $currentStmt->execute([':id' => $applicationId]);
        $currentRow = $currentStmt->fetch(PDO::FETCH_ASSOC);
        $currentFiles = json_decode($currentRow['requirement_upload_json'] ?? '[]', true);

        // If new files were uploaded, append them to existing files
        if (!empty($uploadedFiles)) {
            $allFiles = array_merge($currentFiles, $uploadedFiles);
            $filesJson = json_encode($allFiles);

            // Queue OCR job with ALL current files (so everything gets re-processed)
            queueOCRJob($pdo, $applicationId, $allFiles);
        } else {
            // No new files → just preserve the existing JSON
            $filesJson = json_encode($currentFiles);
        }

        // Always update the column (preserves old files if no new upload)
        $updateFields[] = "requirement_upload_json = :requirement_upload_json";
        $params[':requirement_upload_json'] = $filesJson;

        // Remove the duplicate and incorrect code block that was causing the error
        // The following lines have been removed:
        // $filesJson = json_encode($uploadedFiles);
        // error_log("=== CREATE DEBUG === Uploaded files count: " . count($uploadedFiles) . " | JSON: " . $filesJson);
        // 
        // if (!empty($uploadedFiles)) {
        //     queueOCRJob($pdo, $newAppId, $uploadedFiles);  // $newAppId = lastInsertId or updated id
        // }

        // If no fields to update, return early
        if (count($updateFields) <= 3) { // Only dss_status, updated_at, and status were added
            echo json_encode(["status" => "success", "message" => "No changes to update."]);
            return;
        }

        // Build SQL query
        $sql = "UPDATE construction_applications SET " . implode(', ', $updateFields);

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
            $newStmt = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
            $newStmt->execute([':id' => $applicationId]);
            $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

            // Write audit log for UPDATE action
            // writeAuditLog(
            //     $pdo,
            //     'UPDATE',
            //     'construction_applications',
            //     $applicationId,
            //     $oldData,
            //     $newData,
            //     'CONSTRUCTION_APPLICATION'
            // );

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

        // --- FIX THIS SECTION IN construction_handler.php ---
        // 1. Get the raw value from the database first
        $rawUploadData = $application['requirement_upload_json'] ?? '';

        // 2. NOW you can initialize it as an array
        $application['requirement_upload_json'] = [];

        // 3. Decode the raw string we saved in step 1
        if (is_string($rawUploadData) && trim($rawUploadData) !== '' && trim($rawUploadData) !== 'null') {
            $decoded = json_decode($rawUploadData, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $application['requirement_upload_json'] = $decoded;
            }
        }

        $ocrStmt = $pdo->prepare("
            SELECT filename, saved_filename, file_url, ocr_result, created_at 
            FROM construction_ocr_results 
            WHERE application_id = :id 
            ORDER BY created_at DESC
        ");
        $ocrStmt->execute([':id' => $application['id']]);
        $ocrResults = $ocrStmt->fetchAll(PDO::FETCH_ASSOC);

        $application['ocr_results'] = $ocrResults ?: [];
        // ... rest unchanged


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
            ORDER BY total ASC
        ";

        $stmt1 = $pdo->query($sql1);
        $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

        $sql2 = "
            SELECT 
                nature_of_activity, 
                COUNT(*) AS total,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
            FROM construction_applications
            GROUP BY nature_of_activity
            ORDER BY total ASC
        ";

        $stmt2 = $pdo->query($sql2);
        $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $sql3 = "
            SELECT 
                COALESCE(ce.dss_status, 'Pending Evaluation') as dss_status, 
                COUNT(*) as total,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
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
