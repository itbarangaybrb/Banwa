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
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled."]));
}

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
            handleUpdateApplicationStatus($pdo);
            break;
        case 'update':
            handleUpdateApplication($pdo);
            break;
        case 'chart_construction_type':
            handleChartConstructionType($pdo);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
}
exit;

// =========================
// HELPER FUNCTION
// =========================
function get_input($key)
{
    return isset($_POST[$key]) && trim($_POST[$key]) !== '' ? trim($_POST[$key]) : null;
}

// =========================
// CREATE APPLICATION
// =========================
function handleCreateApplication($pdo)
{
    try {
        $supabaseUserId = get_input('supabase_user_id') ?? null;

        // Owner Info
        $firstName = get_input('firstName');
        $middleName = get_input('middleName');
        $lastName = get_input('lastName');
        $suffix = get_input('suffix');
        $contactNoOwner = get_input('contactNoOwner');
        $lotNo = get_input('lotNo');
        $street = get_input('street');
        $ownerAddress = trim("$lotNo $street");

        // Construction Info
        // $natureOfWork = get_input('natureOfWork');
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
        $constructionLotNo = get_input('constructionLotNo');
        $constructionStreet = get_input('constructionStreet');
        $constructionAddress = trim("$constructionLotNo $constructionStreet");

        // Coordinates
        $latitude = get_input('latitude2');
        $longitude = get_input('longitude2');

        // Files
        $requirementUpload = $_FILES['requirementUpload']['name'] ?? null;
        if ($requirementUpload) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $targetFile = $uploadDir . basename($requirementUpload);
            move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $targetFile);
        }

        // Agreement
        $agreeCheckBox = (int)(get_input('agreed'));

        // Application Date
        $applicationDate = get_input('applicationDate') ?? date('Y-m-d');

        $sql = "INSERT INTO construction_applications (
            supabase_user_id,
            first_name, middle_name, last_name, suffix,
            contact_no_owner, owner_address, type_of_work, nature_of_activity, details_of_work,
            start_date, end_date, number_of_working_days, number_of_workers,
            contractor_name, contractor_contact_number, application_method,
            construction_address, latitude, longitude, requirement_upload,
            agreed, application_date, created_at, updated_at
        ) VALUES (
            :supabase_user_id,
            :first_name, :middle_name, :last_name, :suffix,
            :contact_no_owner, :owner_address, :type_of_work, :nature_of_activity, :details_of_work,
            :start_date, :end_date, :number_of_working_days, :number_of_workers,
            :contractor_name, :contractor_contact_number, :application_method,
            :construction_address, :latitude, :longitude, :requirement_upload,
            :agreed, :application_date, NOW(), NOW()
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
            // ':nature_of_work' => $natureOfWork,
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
        echo json_encode([
            "status" => "success",
            "id" => $result['id'],
            "message" => "Application submitted successfully!"
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}

// =========================
// FETCH APPLICATIONS
// =========================
function handleFetchApplications($pdo)
{
    try {
        $stmt = $pdo->query("SELECT * FROM construction_applications ORDER BY created_at ASC");
        $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $applications]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Fetch Error: " . $e->getMessage()]);
    }
}

// =========================
// UPDATE STATUS
// =========================
function handleUpdateApplicationStatus($pdo)
{
    $id = $_POST['id'] ?? null;
    $newStatus = $_POST['newStatus'] ?? null;
    $comments = $_POST['approval_comments'] ?? '';
    $reason = $_POST['disapproval_reason'] ?? '';

    if (!$id || !$newStatus) {
        echo json_encode(["status" => "error", "message" => "Missing ID or Status"]);
        return;
    }

    try {
        $sql = "UPDATE construction_applications SET
            status = :status,
            approval_comments = :comments,
            disapproval_reason = :reason,
            updated_at = NOW()
            WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':status' => $newStatus,
            ':comments' => $comments,
            ':reason' => $reason,
            ':id' => $id
        ]);

        echo json_encode(["status" => "success", "message" => "Status updated to " . $newStatus]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// =========================
// UPDATE APPLICATION
// =========================
function handleUpdateApplication($pdo)
{
    try {
        $id = get_input('application_id');
        if (!$id) {
            throw new Exception("Application ID is required for update.");
        }

        // Fetch existing record to preserve missing fields
        $stmtCheck = $pdo->prepare("SELECT * FROM construction_applications WHERE id = :id");
        $stmtCheck->execute([':id' => $id]);
        $currentRecord = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$currentRecord) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Application not found."]);
            return;
        }

        // Collect inputs (fallback to current values if not provided)
        $firstName    = get_input('firstName') ?? $currentRecord['first_name'];
        $middleName   = get_input('middleName') ?? $currentRecord['middle_name'];
        $lastName     = get_input('lastName') ?? $currentRecord['last_name'];
        $suffix       = get_input('suffix') ?? $currentRecord['suffix'];
        $contactNoOwner = get_input('contactNoOwner') ?? $currentRecord['contact_no_owner'];
        $lotNo        = get_input('constructionLotNo') ?? '';
        $street       = get_input('constructionStreet') ?? '';
        $constructionAddress = trim($lotNo . ' ' . $street) ?: $currentRecord['construction_address'];
        $latitude     = get_input('latitude2') ?? $currentRecord['latitude'];
        $longitude    = get_input('longitude2') ?? $currentRecord['longitude'];
        // $natureOfWork = get_input('natureOfWork') ?? $currentRecord['nature_of_work'];
        $typeOfWork   = get_input('typeOfWork') ?? $currentRecord['type_of_work'];
        $natureOfActivity = get_input('natureOfActivity') ?? $currentRecord['nature_of_activity'];
        $detailsOfWork   = get_input('detailsOfWork') ?? $currentRecord['details_of_work'];
        $startDate   = get_input('startDate') ?? $currentRecord['start_date'];
        $endDate     = get_input('endDate') ?? $currentRecord['end_date'];
        $numberOfWorkingDays = get_input('numberOfWorkingDays') ?? $currentRecord['number_of_working_days'];
        $numberOfWorkers     = get_input('numberOfWorkers') ?? $currentRecord['number_of_workers'];
        $contractorName      = get_input('contractorName') ?? $currentRecord['contractor_name'];
        $contractorContact   = get_input('contractorContactNumber') ?? $currentRecord['contractor_contact_number'];
        $applicationMethod   = get_input('applicationMethod') ?? $currentRecord['application_method'];
        $agreeCheckBox       = isset($_POST['agreeCheckBox']) ? (int)$_POST['agreeCheckBox'] : $currentRecord['agreed'];

        // File handling
        $requirementUpload = $currentRecord['requirement_upload'];
        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['name']) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $targetFile = $uploadDir . basename($_FILES['requirementUpload']['name']);
            move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $targetFile);
            $requirementUpload = $_FILES['requirementUpload']['name'];
        }

        $sql = "UPDATE construction_applications SET
            first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            suffix = :suffix,
            contact_no_owner = :contact_no_owner,
            construction_address = :construction_address,
            latitude = :latitude,
            longitude = :longitude,
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
            requirement_upload = :requirement_upload,
            agreed = :agreed,
            updated_at = NOW()
            WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':first_name' => $firstName,
            ':middle_name' => $middleName,
            ':last_name' => $lastName,
            ':suffix' => $suffix,
            ':contact_no_owner' => $contactNoOwner,
            ':construction_address' => $constructionAddress,
            ':latitude' => $latitude,
            ':longitude' => $longitude,
            ':type_of_work' => $typeOfWork,
            ':nature_of_activity' => $natureOfActivity,
            ':details_of_work' => $detailsOfWork,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
            ':number_of_working_days' => $numberOfWorkingDays,
            ':number_of_workers' => $numberOfWorkers,
            ':contractor_name' => $contractorName,
            ':contractor_contact_number' => $contractorContact,
            ':application_method' => $applicationMethod,
            ':requirement_upload' => $requirementUpload,
            ':agreed' => $agreeCheckBox,
            ':id' => $id
        ]);

        echo json_encode([
            "status" => "success",
            "message" => "Application updated successfully.",
            "updated_id" => $id
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

function handleChartConstructionType($pdo)
{
    // Data by Application Date
    $sql1 = "
        SELECT application_date, COUNT(*) AS total
        FROM construction_applications
        GROUP BY application_date
        ORDER BY application_date ASC
    ";

    $stmt1 = $pdo->query($sql1);
    $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // Data by Application Type of Business
    $sql2 = "
        SELECT nature_of_activity, COUNT(*) AS total
        FROM construction_applications
        GROUP BY nature_of_activity
        ORDER BY nature_of_activity ASC
    ";

    $stmt2 = $pdo->query($sql2);
    $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data_by_date" => $dataByDate,
        "data_by_type" => $dataByType
    ]);
}
