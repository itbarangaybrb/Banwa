<?php
// Configure error reporting / output before includes so any failures return JSON rather than HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

ob_start();
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Include dependencies after error handling is configured
require_once __DIR__ . '/../../../configs/database.php';
// require_once __DIR__ . '/../../../services/staff/business/business_analytics.php';
// require_once __DIR__ . '/../../../services/staff/business/business_applications.php';
require_once __DIR__ . '/../../../services/staff/business/business_dss.php';
require_once __DIR__ . '/../../../api/shared/insert_audit_logs.php';


if (!extension_loaded('pdo_pgsql')) {
    ob_clean();
    echo json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled. Check php.ini."]);
    exit;
}

// require_once __DIR__ . '/../../../api/dss_rule_engine/business_dss.php';
require_once __DIR__ . '/../../../api/shared/ocr_service.php';
require_once __DIR__ . '/../../../configs/ocr_config.php';

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
        case 'chart_business_type':
            handleChartBusinessType($pdo);
            break;
        case 'get_evaluation':
            handleGetEvaluation($pdo);
            break;
        case 'get_application_details':
            handleGetApplicationDetails($pdo);
            break;
        case 'analyze_documents':
            handleAnalyzeDocuments($pdo);
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

function ensureEvaluationTableExists($pdo) {
    try {
        $check = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_evaluations')");
        if (!$check->fetchColumn()) {
            $pdo->exec("
                CREATE TABLE business_evaluations (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER NOT NULL,
                    dss_status TEXT NOT NULL DEFAULT 'Pending Evaluation',
                    evaluated_at TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES business_applications(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_business_evaluations_app_id ON business_evaluations(application_id);
            ");
        }
        return true;
    } catch (Exception $e) {
        error_log("Failed to create business_evaluations table: " . $e->getMessage());
        return false;
    }
}
// ==================== ENSURE FILES TABLE EXISTS ====================
function ensureFilesTableExists($pdo) {
    try {
        $check = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_files')");
        if (!$check->fetchColumn()) {
            $pdo->exec("
                CREATE TABLE business_files (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER NOT NULL,
                    filename TEXT NOT NULL,
                    saved_filename TEXT NOT NULL,
                    file_url TEXT,
                    checksum TEXT,
                    size_bytes INTEGER,
                    mime_type TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES business_applications(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_business_files_app_id ON business_files(application_id);
            ");
        }
        return true;
    } catch (Exception $e) {
        error_log("business_files table creation failed: " . $e->getMessage());
        return false;
    }
}

// Call it near the bottom of the file (after ensureEvaluationTableExists)
ensureEvaluationTableExists($pdo);
ensureFilesTableExists($pdo);

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
        if (!is_array($rawStatus)) $rawStatus = [$rawStatus];
        $businessStatus = json_encode($rawStatus);

        $requirements = isset($_POST['requirements']) ? $_POST['requirements'] : [];
        if (!is_array($requirements)) $requirements = [$requirements];
        $requirements = json_encode($requirements);

        // ==================== FILE UPLOAD ====================
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $uploadedFiles = [];   // array of saved filenames

        if (isset($_FILES['requirementUpload']) && is_array($_FILES['requirementUpload']['name'])) {
            $file_count = count($_FILES['requirementUpload']['name']);
            for ($i = 0; $i < $file_count; $i++) {
                if ($_FILES['requirementUpload']['error'][$i] === UPLOAD_ERR_OK) {
                    $original = basename($_FILES['requirementUpload']['name'][$i]);
                    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
                    $saved_name = uniqid('biz_', true) . '.' . $ext;
                    $target_path = $uploadDir . $saved_name;

                    if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'][$i], $target_path)) {
                        $uploadedFiles[] = $saved_name;
                    }
                }
            }
        }

        $requirementUploadJson = !empty($uploadedFiles) ? json_encode($uploadedFiles) : json_encode([]);

        // ==================== INSERT APPLICATION ====================
        $sql = "INSERT INTO business_applications (
            supabase_user_id, business_name, type_of_business, nature_of_business, 
            nature_of_business_specify, address_of_business, latitude, longitude, 
            business_status, telephone_no_business, email_address, first_name, 
            middle_name, last_name, suffix, telephone_no_owner, address_owner,
            type_of_structure, type_of_structure_specify, no_of_employees,
            requirements, requirement_upload, requirement_upload_json, application_date, 
            nature_of_application, status
        ) VALUES (
            :supabase_user_id, :business_name, :type_of_business, :nature_of_business, 
            :nature_of_business_specify, :address_of_business, :latitude, :longitude, 
            :business_status::json, :telephone_no_business, :email_address, :first_name, 
            :middle_name, :last_name, :suffix, :telephone_no_owner, :address_owner,
            :type_of_structure, :type_of_structure_specify, :no_of_employees,
            :requirements::json, :requirement_upload, :requirement_upload_json::jsonb, 
            :application_date, :nature_of_application, 'Pending'
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
            ':requirement_upload' => $requirementUploadJson,
            ':requirement_upload_json' => $requirementUploadJson,
            ':application_date' => $applicationDate,
            ':nature_of_application' => $natureOfApplication
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $applicationId = $result['id'];

        // ==================== SAVE FILES TO DB ====================
        if (!empty($uploadedFiles)) {
            foreach ($uploadedFiles as $idx => $saved_name) {
                $original = basename($_FILES['requirementUpload']['name'][$idx]);
                $mime = $_FILES['requirementUpload']['type'][$idx];
                $size = filesize($uploadDir . $saved_name);
                $checksum = md5_file($uploadDir . $saved_name);
                $file_url = '/server/handlers/staff/business/uploads/' . $saved_name;

                // business_files
                $pdo->prepare("
                    INSERT INTO business_files 
                    (application_id, filename, saved_filename, file_url, checksum, size_bytes, mime_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ")->execute([$applicationId, $original, $saved_name, $file_url, $checksum, $size, $mime]);

                // business_ocr_results (placeholder)
                $pdo->prepare("
                    INSERT INTO business_ocr_results 
                    (application_id, filename, saved_filename, file_url, ocr_result)
                    VALUES (?, ?, ?, ?, ?::jsonb)
                ")->execute([
                    $applicationId,
                    $original,
                    $saved_name,
                    $file_url,
                    json_encode(['detected' => [], 'text' => ''])
                ]);
            }
        }

        // ==================== AUTO OCR ON CREATE ====================
        if (!empty($uploadedFiles)) {
            $_POST['application_id'] = $applicationId;
            
            // ←←← CAPTURE OUTPUT SO IT DOESN'T POLLUTE THE MAIN RESPONSE
            ob_start();
            handleAnalyzeDocuments($pdo);
            $ocrOutput = ob_get_clean();
            
            // Optional: log for debugging
            if (!empty($ocrOutput)) {
                error_log("Auto-OCR output: " . substr($ocrOutput, 0, 500));
            }
            
            unset($_POST['application_id']);
        }

        // Always create the evaluation record **once** at the very end
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
                ORDER BY ba.id ASC";
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

        echo json_encode([
            "status" => "success",
            "message" => "Status updated to " . $newStatus,
            "dss_status" => $currentDSSStatus
        ]);

        $oldStmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
        $oldStmt->execute([':id' => $id]);
        $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $newStmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
        $newStmt->execute([':id' => $id]);
        $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

        // Log the status update in the audit log
        writeAuditLog(
            $pdo,
            'STATUS UPDATED',
            'business_applications',
            $id,
            $oldData,
            $newData,
            'STATUS_UPDATE'
        );

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

        // Only change status if explicitly provided in the update payload
        $explicitStatus = get_input('status');
        if ($explicitStatus !== null) {
            $updateFields[] = "status = :status_field";
            $params[':status_field'] = $explicitStatus;
        }

        // Handle file upload if provided
        if (isset($_FILES['requirementUpload'])) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $names = is_array($_FILES['requirementUpload']['name']) ? $_FILES['requirementUpload']['name'] : [$_FILES['requirementUpload']['name']];
            $tmps = is_array($_FILES['requirementUpload']['tmp_name']) ? $_FILES['requirementUpload']['tmp_name'] : [$_FILES['requirementUpload']['tmp_name']];
            $errs = is_array($_FILES['requirementUpload']['error']) ? $_FILES['requirementUpload']['error'] : [$_FILES['requirementUpload']['error']];

            $updatedFiles = [];
            foreach ($names as $i => $origName) {
                if (!isset($tmps[$i]) || $errs[$i] !== UPLOAD_ERR_OK) continue;
                $fileName = time() . '_' . basename($origName);
                if (move_uploaded_file($tmps[$i], $uploadDir . $fileName)) {
                    $updatedFiles[] = $fileName;
                }
            }

            if (!empty($updatedFiles)) {
                $updateFields[] = "requirement_upload = :requirement_upload";
                $params[':requirement_upload'] = json_encode($updatedFiles);
                // Analyze newly uploaded files and persist metadata
                $fakeFiles = ['name' => [], 'tmp_name' => [], 'error' => []];
                foreach ($updatedFiles as $f) {
                    $fakeFiles['name'][] = $f;
                    $fakeFiles['tmp_name'][] = __DIR__ . '/uploads/' . $f;
                    $fakeFiles['error'][] = UPLOAD_ERR_OK;
                }
                $analysis = analyze_files($fakeFiles, $_POST['requirements'] ?? []);
                $detectedTypesFromFiles = [];
                if (isset($analysis['results']) && is_array($analysis['results'])) {
                    foreach ($analysis['results'] as $res) {
                        $detected = $res['detected'] ?? [];
                        $detectedTypesFromFiles = array_merge($detectedTypesFromFiles, $detected);
                        $insertFileStmt = $pdo->prepare("INSERT INTO business_ocr_results (application_id, filename, saved_filename, file_url, ocr_result, created_at) VALUES (:app_id, :filename, :saved_filename, :file_url, :ocr_result::jsonb, NOW())");
                        $insertFileStmt->execute([
                            ':app_id' => $applicationId,
                            ':filename' => $res['filename'],
                            ':saved_filename' => $res['filename'],
                            ':file_url' => '/server/handlers/staff/business/uploads/' . $res['filename'],
                            ':ocr_result' => json_encode(['detected' => array_values($detected), 'text' => $res['text'] ?? ''])
                        ]);
                    }
                    // Merge detected into existing requirements
                    $currentReqsStmt = $pdo->prepare("SELECT requirements FROM business_applications WHERE id = :id");
                    $currentReqsStmt->execute([':id' => $applicationId]);
                    $current = $currentReqsStmt->fetch(PDO::FETCH_ASSOC);
                    $currentReqs = [];
                    if ($current && isset($current['requirements']) && $current['requirements']) {
                        $currentReqs = is_string($current['requirements']) ? json_decode($current['requirements'], true) : $current['requirements'];
                    }
                    $mergedReqs = array_values(array_unique(array_merge($currentReqs, $detectedTypesFromFiles)));
                    $updateFields[] = "requirements = :requirements::json";
                    $params[':requirements'] = json_encode($mergedReqs);
                    $updateFields[] = "requirement_upload_json = :files::jsonb";
                    $params[':files'] = json_encode($updatedFiles);
                }
            }
        }

        // If no fields to update, return early
        if (count($updateFields) <= 2) { // Only dss_status and updated_at were added
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

        $oldStmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
        $oldStmt->execute([':id' => $applicationId]);
        $oldData = $oldStmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            $newStmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
            $newStmt->execute([':id' => $applicationId]);
            $newData = $newStmt->fetch(PDO::FETCH_ASSOC);

            // Log the update in the audit log
            writeAuditLog(
                $pdo,
                'UPDATE',
                'business_applications',
                $applicationId,
                $oldData,
                $newData,
                'BUSINESS_APPLICATION'
            );

            triggerDSSevaluation($pdo, $applicationId);
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

        // Include OCR results (if any)
        $ocrStmt = $pdo->prepare("SELECT id, filename, saved_filename, file_url, ocr_result, created_at FROM business_ocr_results WHERE application_id = :id ORDER BY created_at DESC");
        $ocrStmt->execute([':id' => $applicationId]);
        $ocrRows = $ocrStmt->fetchAll(PDO::FETCH_ASSOC);
        $application['ocr_results'] = [];
        foreach ($ocrRows as $r) {
            $ocr = $r;
            // decode ocr_result JSON if present
            if (is_string($ocr['ocr_result'])) {
                $ocr['ocr_result'] = json_decode($ocr['ocr_result'], true);
            }
            $application['ocr_results'][] = $ocr;
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
 * Analyze uploaded documents using shared OCR service (staff endpoint)
 */
function handleAnalyzeDocuments($pdo)
{
    try {
        ini_set('max_execution_time', 180);   // Allow up to 3 minutes
        set_time_limit(180);
        ini_set('max_input_time', 180);
        ini_set('memory_limit', '256M');
        ob_clean();                    // Clear any warnings/notices
        error_reporting(E_ALL);        // Make sure errors are logged
        // Log incoming request and cookie/session presence to help debug missing session
        $sessionCookieName = session_name();
        $sessionCookiePresent = isset($_COOKIE[$sessionCookieName]) ? 'yes' : 'no';
        $cookieKeys = is_array($_COOKIE) ? implode(',', array_keys($_COOKIE)) : 'none';
        $sessionKeys = is_array($_SESSION) ? implode(',', array_keys($_SESSION)) : 'none';
        $isStaff = $_SESSION['is_staff'] ?? null;
        error_log("handleAnalyzeDocuments invoked. method={$_SERVER['REQUEST_METHOD']}, session_cookie_present={$sessionCookiePresent}, cookie_keys={$cookieKeys}, session_keys={$sessionKeys}, is_staff=" . var_export($isStaff, true));

        // Temporarily bypass `is_staff` session guard so staff can run OCR
        // TODO (future): restore strict check below and remove the bypass once session issues are resolved.
        /*
        // Strict check: only staff may call this endpoint
        if ($isStaff !== true && $isStaff !== '1' && $isStaff !== 1) {
            // Log detailed session for debugging (avoid logging sensitive values in production)
            error_log("handleAnalyzeDocuments unauthorized. full_session_dump: " . json_encode($_SESSION));
            echo json_encode(["status" => "error", "message" => "Unauthorized"]);
            return;
        }
        */
        error_log("handleAnalyzeDocuments: temporary bypass of is_staff check (debug mode). session_keys={$sessionKeys}");

        $files = null;
        if (!empty($_FILES['documents'])) {
            $files = $_FILES['documents'];
        } else if (!empty($_FILES['requirementUpload'])) {
            // normalize requirementUpload to same structure
            $files = $_FILES['requirementUpload'];
        } else {
            // If no files were uploaded in the request, but an application_id is provided,
            // load stored file records from `business_ocr_results` and analyze those files.
            $applicationId = $_POST['application_id'] ?? null;
            if (!$applicationId) {
                echo json_encode(["status" => "error", "message" => "No files provided and no application_id specified"]);
                return;
            }

            // Fetch stored filenames for this application
            $filesStmt = $pdo->prepare("SELECT saved_filename FROM business_ocr_results WHERE application_id = :id ORDER BY created_at");
            $filesStmt->execute([':id' => $applicationId]);
            $rows = $filesStmt->fetchAll(PDO::FETCH_ASSOC);
            if (!$rows) {
                echo json_encode(["status" => "error", "message" => "No stored files found for application_id"]);
                return;
            }

            // Build a fake $_FILES-like structure pointing to the saved files
            $fake = ['name' => [], 'tmp_name' => [], 'error' => []];
            foreach ($rows as $r) {
                $saved = $r['saved_filename'];
                $path = __DIR__ . '/uploads/' . $saved;
                if (file_exists($path)) {
                    $fake['name'][] = $saved;
                    $fake['tmp_name'][] = $path;
                    $fake['error'][] = UPLOAD_ERR_OK;
                }
            }

            if (empty($fake['name'])) {
                echo json_encode(["status" => "error", "message" => "No accessible stored files for OCR"]);
                return;
            }

            $files = $fake;
        }

        $required = $_POST['requirements'] ?? [];

        $result = analyze_files($files, $required);

        if (isset($result['error'])) {
            echo json_encode(["status" => "error", "message" => $result['error']]);
            return;
        }

        // If application_id provided, persist file metadata and merge detected types
        $applicationId = $_POST['application_id'] ?? null;
        if ($applicationId && isset($result['results']) && is_array($result['results'])) {
            $allDetected = [];
            foreach ($result['results'] as $res) {
                $detected = $res['detected'] ?? [];
                $allDetected = array_merge($allDetected, $detected);

                $insertFileStmt = $pdo->prepare("INSERT INTO business_ocr_results (application_id, filename, saved_filename, file_url, ocr_result, created_at) VALUES (:app_id, :filename, :saved_filename, :file_url, :ocr_result::jsonb, NOW())");
                $insertFileStmt->execute([
                    ':app_id' => $applicationId,
                    ':filename' => $res['filename'],
                    ':saved_filename' => $res['filename'],
                    ':file_url' => '/server/handlers/staff/business/uploads/' . $res['filename'],
                    ':ocr_result' => json_encode(['detected' => array_values($detected), 'text' => $res['text'] ?? ''])
                ]);
            }

            // Merge detected into existing requirements
            $currentReqsStmt = $pdo->prepare("SELECT requirements FROM business_applications WHERE id = :id");
            $currentReqsStmt->execute([':id' => $applicationId]);
            $current = $currentReqsStmt->fetch(PDO::FETCH_ASSOC);
            $currentReqs = [];
            if ($current && isset($current['requirements']) && $current['requirements']) {
                $currentReqs = is_string($current['requirements']) ? json_decode($current['requirements'], true) : $current['requirements'];
            }
            $mergedReqs = array_values(array_unique(array_merge($currentReqs, $allDetected)));
            $updateReqStmt = $pdo->prepare("UPDATE business_applications SET requirements = :reqs::json WHERE id = :id");
            $updateReqStmt->execute([':reqs' => json_encode($mergedReqs), ':id' => $applicationId]);

            // Trigger DSS re-evaluation now that requirements have been updated
            // if (function_exists('createInitialDSSEvaluation')) {
            //     // try {
            //     //     createInitialDSSEvaluation($pdo, $applicationId);
            //     // } catch (Exception $e) {
            //     //     error_log('DSS re-evaluation failed after OCR analyze: ' . $e->getMessage());
            //     // }
            // }
        }

        echo json_encode(["status" => "success", "analysis" => $result]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Analysis Error: " . $e->getMessage()]);
    }
}

/**
 * Generates chart data for business analytics including application trends by date,
 * business type distribution, and DSS status breakdown
 * 
 * @param PDO $pdo Database connection object
 */
function handleChartBusinessType($pdo)
{
    $sql1 = "
        SELECT application_date, COUNT(*) AS total
        FROM business_applications
        GROUP BY application_date
        ORDER BY total ASC
    ";

    $stmt1 = $pdo->query($sql1);
    $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $sql2 = "
        SELECT 
        type_of_business,
        COUNT(*) AS total,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
        FROM business_applications
        GROUP BY type_of_business
        ORDER BY total ASC
    ";

    $stmt2 = $pdo->query($sql2);
    $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $sql3 = "
    SELECT 
        COALESCE(be.dss_status, 'Pending Evaluation') AS dss_status,
        COUNT(*) AS total,
        ROUND(
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (),
            2
        ) AS percentage
        FROM business_applications ba
        LEFT JOIN business_evaluations be 
            ON ba.id = be.application_id
        GROUP BY COALESCE(be.dss_status, 'Pending Evaluation')
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