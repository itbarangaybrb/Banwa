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
        case 'chart_utilities_type':
            handleChartUtilityType($pdo);
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
        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;

        // Basic Info
        $firstName    = get_input('firstName');
        $middleName   = get_input('middleName');
        $lastName     = get_input('lastName');
        $suffix       = get_input('suffix');
        $ownerContact = get_input('contactNoOwner');
        $ownerAddress = get_input('addressOwner');

        // Utility Details
        $requestDate  = get_input('requestDate');
        $dateOfWork   = get_input('dateOfWork');
        $natureOfWork = get_input('natureOfWork');
        $provider     = get_input('provider');

        // Utility Location
        $uLot         = get_input('utilityLotNo');
        $uStreet      = get_input('utilityStreet');
        $utilityAddr  = trim($uLot . ' ' . $uStreet);

        $latitude     = get_input('latitude2');
        $longitude    = get_input('longitude2');

        // Status and Agreement
        $status       = get_input('status') ?? 'Pending';
        $agreed       = (int)get_input('agreed');

        $sql = "INSERT INTO utility_applications (
            first_name, middle_name, last_name, suffix,
            owner_contact_no, owner_address,
            request_date, date_of_work, nature_of_work, provider,
            address_of_utility, latitude, longitude,
            status, agreed, supabase_user_id,
            created_at, updated_at
        ) VALUES (
            :first_name, :middle_name, :last_name, :suffix,
            :owner_contact_no, :owner_address,
            :request_date, :date_of_work, :nature_of_work, :provider,
            :address_of_utility, :latitude, :longitude,
            :status, :agreed, :supabase_user_id,
            NOW(), NOW()
        ) RETURNING id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':first_name'         => $firstName,
            ':middle_name'        => $middleName,
            ':last_name'          => $lastName,
            ':suffix'             => $suffix,
            ':owner_contact_no'   => $ownerContact,
            ':owner_address'      => $ownerAddress,
            ':request_date'       => $requestDate,
            ':date_of_work'       => $dateOfWork,
            ':nature_of_work'     => $natureOfWork,
            ':provider'           => $provider,
            ':address_of_utility' => $utilityAddr,
            ':latitude'           => $latitude,
            ':longitude'          => $longitude,
            ':status'             => $status,
            ':agreed'             => $agreed,
            ':supabase_user_id'   => $supabaseUserId
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
        $stmt = $pdo->query("SELECT * FROM utility_applications ORDER BY created_at ASC");
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
        $sql = "UPDATE utility_applications SET
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

        // 1. Fetch existing data to preserve fields not present in the update request
        $stmtCheck = $pdo->prepare("SELECT status FROM utility_applications WHERE id = :id");
        $stmtCheck->execute([':id' => $id]);
        $currentRecord = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$currentRecord) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Application not found."]);
            return;
        }

        // 2. Collect Inputs
        $firstName    = get_input('firstName');
        $middleName   = get_input('middleName');
        $lastName     = get_input('lastName');
        $suffix       = get_input('suffix');
        $ownerContact = get_input('contactNoOwner');
        $ownerAddress = get_input('addressOwner');

        // Reconstruct utility address if components are sent separately, 
        // or take the direct input
        $uLot         = get_input('utilityLotNo');
        $uStreet      = get_input('utilityStreet');
        $utilityAddr  = ($uLot || $uStreet) ? trim($uLot . ' ' . $uStreet) : get_input('addressOfUtility');

        $latitude     = get_input('latitude');
        $longitude    = get_input('longitude');
        $dateOfWork   = get_input('dateOfWork');

        // Logic: Use provided status, otherwise keep current status, default to 'Pending'
        $status       = get_input('status') ?? $currentRecord['status'] ?? 'Pending';

        // 3. Prepare SQL
        $sql = "UPDATE utility_applications SET
            first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            suffix = :suffix,
            owner_contact_no = :owner_contact_no,
            owner_address = :owner_address,
            address_of_utility = :address_of_utility,
            latitude = :latitude,
            longitude = :longitude,
            date_of_work = :date_of_work,
            status = :status,
            updated_at = NOW()
            WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $params = [
            ':first_name'         => $firstName,
            ':middle_name'        => $middleName,
            ':last_name'          => $lastName,
            ':suffix'             => $suffix,
            ':owner_contact_no'   => $ownerContact,
            ':owner_address'      => $ownerAddress,
            ':address_of_utility' => $utilityAddr,
            ':latitude'           => $latitude,
            ':longitude'          => $longitude,
            ':date_of_work'       => $dateOfWork,
            ':status'             => $status,
            ':id'                 => $id
        ];

        $stmt->execute($params);

        // 4. Response
        // Note: rowCount() might be 0 if the user clicked 'Save' without changing any values.
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

function handleChartUtilityType($pdo)
{
    // Data by Application Date
    $sql1 = "
        SELECT application_date, COUNT(*) AS total
        FROM utility_applications
        GROUP BY application_date
        ORDER BY application_date ASC
    ";

    $stmt1 = $pdo->query($sql1);
    $dataByDate = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // Data by Application Type of Business
    $sql2 = "
        SELECT provider, COUNT(*) AS total
        FROM utility_applications
        GROUP BY provider
        ORDER BY provider ASC
    ";

    $stmt2 = $pdo->query($sql2);
    $dataByType = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data_by_date" => $dataByDate,
        "data_by_type" => $dataByType
    ]);
}
