<?php
require_once __DIR__ . '/../../../../server/configs/database.php';
// Business Application Backend (FIXED)


// 1. Start Output Buffering (Prevents whitespace/warnings from breaking JSON)
ob_start();

session_start();

// 2. Error Reporting (For debugging)
ini_set('display_errors', 0); // Hide errors from output (log them instead)
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Set up error logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// 3. Database Configuration
// define('DB_HOST', 'localhost');
// define('DB_PORT', '5432');
// define('DB_NAME', 'capstone');
// define('DB_USER', 'postgres');
// define('DB_PASS', '080702');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// 4. Check Drivers (Crucial for your setup)
if (!extension_loaded('pdo_pgsql')) {
    ob_clean(); // Clear any previous junk
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled. Check php.ini."]));
}

// 5. Database Connection
// try {
//     $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
//     $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
// } catch (PDOException $e) {
//      ob_clean();
//     http_response_code(500);
//      echo json_encode(["status" => "error", "message" => "DB Connection Failed: " . $e->getMessage()]);
//      exit;
//  }

// 6. Route Handling
$action = $_REQUEST['action'] ?? null;
// Clear the buffer before sending the real response
ob_clean();

try {
    switch ($action) {
        case 'create':
            handleCreateApplication($pdo);
            break;
        case 'fetch':
            handleFetchApplications($pdo);
            break;
        case 'update_status': // NEW UNIFIED ACTION
            handleUpdateStatus($pdo);
            break;
        case 'update':
            handleUpdateApplication($pdo);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
}
// End the script here to ensure no extra whitespace is added
exit;


// HELPER FUNCTIONS


function get_input($key){
    return isset($_POST[$key]) && trim($_POST[$key]) !== '' ? trim($_POST[$key]) : null;
}

function handleCreateApplication($pdo){
    try {
        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null;
        // Collect Data
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

        // Handle JSON Fields
        $rawStatus = $_POST['businessStatus'] ?? [];
        if (!is_array($rawStatus)) {
            $rawStatus = [$rawStatus]; // Convert string "Owned" to array ["Owned"]
        }
        $businessStatus = json_encode($rawStatus);
        $requirements = isset($_POST['requirements']) ? json_encode($_POST['requirements']) : '[]';

        // Handle File Upload
        $requirementUpload = null;
        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $fileName = time() . '_' . basename($_FILES['requirementUpload']['name']);
            if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $uploadDir . $fileName)) {
                $requirementUpload = $fileName;
            }
        }

        // SQL Query (Explicit JSON Casting for Postgres)
        $sql = "INSERT INTO business_applications (
        supabase_user_id, business_name, type_of_business, nature_of_business, nature_of_business_specify,
        address_of_business, latitude, longitude, business_status, telephone_no_business, email_address,
        first_name, middle_name, last_name, telephone_no_owner, address_owner,
        type_of_structure, type_of_structure_specify, no_of_employees,
        requirements, requirement_upload, application_date, status
        ) VALUES (
            :supabase_user_id, :business_name, :type_of_business, :nature_of_business, :nature_of_business_specify,
            :address_of_business, :latitude, :longitude, :business_status::json, :telephone_no_business, :email_address,
            :first_name, :middle_name, :last_name, :telephone_no_owner, :address_owner,
            :type_of_structure, :type_of_structure_specify, :no_of_employees,
            :requirements::json, :requirement_upload, :application_date, 'Pending'
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
            ':telephone_no_owner' => $contactNoOwner,
            ':address_owner' => $addressOwner,
            ':type_of_structure' => $typeOfStructure,
            ':type_of_structure_specify' => $typeOfStructureSpecify,
            ':no_of_employees' => $noOfEmployees ?: 0,
            ':requirements' => $requirements,
            ':requirement_upload' => $requirementUpload,
            ':application_date' => $applicationDate
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "id" => $result['id'], "message" => "Application Created!"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "General Error: " . $e->getMessage()]);
    }
}

function handleFetchApplications($pdo)
{
    try {
        $stmt = $pdo->query("SELECT * FROM business_applications ORDER BY created_at DESC");
        $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields for frontend
        foreach ($applications as &$app) {
            // Check if it's already an array (Postgres driver sometimes auto-decodes)
            if (is_string($app['business_status'])) {
                $app['business_status'] = json_decode($app['business_status'], true);
            }
            if (is_string($app['requirements'])) {
                $app['requirements'] = json_decode($app['requirements'], true);
            }
        }

        echo json_encode(["status" => "success", "data" => $applications]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Fetch Error: " . $e->getMessage()]);
    }
}

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
        $sql = "UPDATE business_applications SET status = :status, approval_comments = :comments ";
        $params = [':status' => $newStatus, ':comments' => $comments, ':id' => $id];

        // LOGIC: If sending for payment, update the Amount Due
        if ($newStatus === 'For Payment') {
            $sql .= ", amount_due = :amount, payment_status = 'Unpaid' ";
            $params[':amount'] = $amount;
        }

        // LOGIC: If Disapproved, we might want to record the specific reason column
        if ($newStatus === 'Disapproved') {
            $sql .= ", disapproval_reason = :comments ";
        }

        $sql .= " WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(["status" => "success", "message" => "Status updated to " . $newStatus]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

function handleUpdateApplication($pdo){
    try {
        $applicationId = get_input('application_id');
        // Basic validation
        if (!$applicationId) {
            throw new Exception("Application ID is required for update.");
        }

        // Collect all data, similar to handleCreateApplication but for update
        $supabaseUserId = $_SESSION['supabase_user_id'] ?? null; // For security/ownership check if needed
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
        $contactNoOwner = get_input('contactNoOwner');
        $lotNo = get_input('lotNo');
        $street = get_input('street');
        $addressOwner = trim($lotNo . ' ' . $street);

        $typeOfStructure = get_input('typeOfStructureSelect');
        $typeOfStructureSpecify = get_input('typeOfStructureSpecify');
        $noOfEmployees = get_input('noOfEmployees');
        $applicationDate = get_input('applicationDate');
        $latitude = get_input('latitude2'); // Assuming latitude2, longitude2 are used
        $longitude = get_input('longitude2');

        // Handle JSON Fields - they might come as strings or arrays, ensure they are stored as JSON strings
        $businessStatus = isset($_POST['businessStatus']) ? json_encode($_POST['businessStatus']) : '[]';
        $requirements = isset($_POST['requirements']) ? json_encode($_POST['requirements']) : '[]';

        // Initialize params array for the UPDATE statement
        $params = [
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
            ':telephone_no_owner' => $contactNoOwner,
            ':address_owner' => $addressOwner,
            ':type_of_structure' => $typeOfStructure,
            ':type_of_structure_specify' => $typeOfStructureSpecify,
            ':no_of_employees' => $noOfEmployees ?: 0,
            ':requirements' => $requirements,
            ':application_date' => $applicationDate,
            ':id' => $applicationId // Condition for WHERE clause
        ];

        // SQL Query for Update
        $sql = "UPDATE business_applications SET
            business_name = :business_name,
            type_of_business = :type_of_business,
            nature_of_business = :nature_of_business,
            nature_of_business_specify = :nature_of_business_specify,
            address_of_business = :address_of_business,
            latitude = :latitude,
            longitude = :longitude,
            business_status = :business_status::json,
            telephone_no_business = :telephone_no_business,
            email_address = :email_address,
            first_name = :first_name,
            middle_name = :middle_name,
            last_name = :last_name,
            telephone_no_owner = :telephone_no_owner,
            address_owner = :address_owner,
            type_of_structure = :type_of_structure,
            type_of_structure_specify = :type_of_structure_specify,
            no_of_employees = :no_of_employees,
            requirements = :requirements::json,
            application_date = :application_date,
            updated_at = NOW(),
            status = 'Complied' "; // Set status to Complied on update

        // Handle File Upload - only update if a new file is provided
        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/'; // Relative to where business_handler.php is
            // Ensure the directory exists
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileName = time() . '_' . basename($_FILES['requirementUpload']['name']);
            if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $uploadDir . $fileName)) {
                $sql .= ", requirement_upload = :requirement_upload ";
                $params[':requirement_upload'] = $fileName;
            } else {
                throw new Exception("Failed to move uploaded file.");
            }
        }
        
        // Add a check for ownership for security
        if ($supabaseUserId) {
            $sql .= " WHERE id = :id AND supabase_user_id = :supabase_user_id";
            $params[':supabase_user_id'] = $supabaseUserId;
        } else {
            $sql .= " WHERE id = :id";
        }


        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "message" => "Application updated successfully!"]);
        } else {
            // This might happen if ID doesn't exist or user doesn't own it
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


