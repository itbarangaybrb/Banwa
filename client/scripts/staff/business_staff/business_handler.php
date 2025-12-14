<?php
require_once __DIR__ . '/../../../../server/configs/database.php';
// Business Application Backend (FIXED)


// 1. Start Output Buffering (Prevents whitespace/warnings from breaking JSON)
ob_start();

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
        default:
            ob_clean(); // Ensure no prior output before echoing error
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    ob_clean(); // Ensure no prior output before echoing error
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
}
// End the script here to ensure no extra whitespace is added
exit;
ob_end_flush(); // End output buffering here!


// HELPER FUNCTIONS


function get_input($key)
{
    return isset($_POST[$key]) && trim($_POST[$key]) !== '' ? trim($_POST[$key]) : null;
}

function handleUpdateApplication($pdo) {
    try {
        $applicationId = get_input('application_id');
        if (!$applicationId) {
            throw new Exception("Application ID is required for update.");
        }

        $supabaseUserId = get_input('supabase_user_id'); // From originalData in status.js
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

        // Status and requirements might be passed as JSON strings from JS
        $rawBusinessStatus = $_POST['businessStatus'] ?? [];
        // If it's a string, try to decode it, otherwise ensure it's an array for json_encode
        if (is_string($rawBusinessStatus)) {
            $decoded = json_decode($rawBusinessStatus, true);
            $businessStatus = (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $decoded : [$rawBusinessStatus];
        } else if (is_array($rawBusinessStatus)) {
            $businessStatus = $rawBusinessStatus;
        } else {
            $businessStatus = [];
        }
        $businessStatus = json_encode($businessStatus);

        $rawRequirements = $_POST['requirements'] ?? [];
        if (is_string($rawRequirements)) {
            $decoded = json_decode($rawRequirements, true);
            $requirements = (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $decoded : [$rawRequirements];
        } else if (is_array($rawRequirements)) {
            $requirements = $rawRequirements;
        } else {
            $requirements = [];
        }
        $requirements = json_encode($requirements);


        $requirementUpload = null;
        // Check if a new file was uploaded
        if (isset($_FILES['requirementUpload']) && $_FILES['requirementUpload']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../../../../server/configs/uploads/business_requirements/'; // Correct path for uploads
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $fileName = time() . '_' . basename($_FILES['requirementUpload']['name']);
            if (move_uploaded_file($_FILES['requirementUpload']['tmp_name'], $uploadDir . $fileName)) {
                $requirementUpload = $fileName;
            } else {
                throw new Exception("Failed to move uploaded file.");
            }
        }


        $sql = "UPDATE business_applications SET
            supabase_user_id = :supabase_user_id,
            business_name = :business_name,
            type_of_business = :type_of_business,
            nature_of_business = :nature_of_business,
            nature_of_business_specify = :nature_of_business_specify,
            address_of_business = :address_of_business,
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
            status = 'Complied'
            " . ($requirementUpload ? ", requirement_upload = :requirement_upload" : "") . "
            WHERE id = :id";

        $params = [
            ':id' => $applicationId,
            ':supabase_user_id' => $supabaseUserId,
            ':business_name' => $businessName,
            ':type_of_business' => $typeOfBusiness,
            ':nature_of_business' => $natureOfBusiness,
            ':nature_of_business_specify' => $natureOfBusinessSpecify,
            ':address_of_business' => $addressOfBusiness,
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
            ':application_date' => $applicationDate
        ];

        if ($requirementUpload) {
            $params[':requirement_upload'] = $requirementUpload;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        ob_clean(); // Ensure no prior output before echoing JSON
        echo json_encode(["status" => "success", "message" => "Application Updated Successfully!"]);

    } catch (PDOException $e) {
        ob_clean(); // Ensure no prior output before echoing error
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        ob_clean(); // Ensure no prior output before echoing error
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "General Error: " . $e->getMessage()]);
    }
}

function handleGenerateClearance($pdo) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        // This case should still output JSON and clear buffer
        ob_clean();
        echo json_encode(['status' => 'error', 'message' => 'Missing application ID']);
        return;
    }

    // FIX 2: Corrected table name from 'businessapplications' to 'business_applications'
    // FIX 3: Removed strict "AND status='Approved'" to allow re-printing or printing if status is Paid. 
    // You can add it back if strict approval is required.
    $stmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $app = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$app) {
        ob_clean(); // Clear buffer before JSON output
        echo json_encode(['status' => 'error', 'message' => 'Application not found']);
        return;
    }

    // FIX 4: Corrected Column Names (snake_case to match DB)
    // The previous code used $app['firstname'], but your insert uses 'first_name'
    $grantee_name = trim($app['first_name'] . ' ' . ($app['middle_name'] ?? '') . ' ' . $app['last_name']);
    $businessName = $app['business_name'];
    $natureOfApplication = $app['nature_of_application'];
    
    // FIX 5: defined missing variables used in HTML
    $or_number = $app['or_number'] ?? '_________'; // Fallback if no OR number
    $date_issued = date('F j, Y');
    
    $day = date('j');
    $month = date('F');
    $year = date('y');

    // Prepare HTML content
    $html = '<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Barangay Blue Ridge B - Business Clearance</title>
            <style>
                :root {
                    /* Light green theme from original reference. 
                    Change this hex code if Blue Ridge B uses a different color. */
                    --sidebar-bg: #eef7e3; 
                    --text-color: #000;

                }

                body {
                    font-family: "Times New Roman", Serif, sans-serif;
                    color: var(--text-color);
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                    background-color: #f4f4f4;
                }

                .document-container {
                    width: 8.5in;
                    min-height: 11in;
                    margin: 0 auto;
                    background-color: white;
                    padding: 40px 50px;
                    box-shadow: 0 0 15px rgba(0,0,0,0.1);
                    position: relative;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                /* --- Header Section --- */
                header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 30px;
                    position: relative;
                    z-index: 2;
                }

                .logo-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                }

                .logo-container img {
                    width: 110px;
                    height: auto;
                }

                .header-text {
                    text-align: center;
                    line-height: 1.4;
                }

                .header-text div { font-size: 14px; }
                .header-text h1 { margin: 10px 0 5px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;}
                .header-text h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }

                /* --- Document Titles --- */
                .doc-title {
                    text-align: center;
                    text-transform: uppercase;
                    font-size: 28px;
                    font-weight: bold;
                    margin: 40px 0 50px 0;
                    position: relative;
                    z-index: 2;
                    text-shadow: 2px 2px 0px white;
                }

                /* --- Main Content Grid Layout --- */
                .content-wrapper {
                    display: grid;
                    grid-template-columns: 220px 1fr;
                    gap: 30px;
                    position: relative;
                    z-index: 2;
                }

                /* --- Watermark background --- */
                .content-wrapper::before {
                    content: "";
                    position: absolute;
                    top: 50px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    height: 90%;
                    background-image: var(--logo-url);
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: contain;
                    opacity: 0.12; 
                    z-index: -1;
                }

                /* --- Sidebar (Officials) --- */
                .sidebar {
                    background-color: var(--sidebar-bg);
                    padding: 20px 15px;
                    border: 1px solid #cddbad;
                    font-size: 13px;
                    height: fit-content;
                }

                .sidebar .official-group { margin-bottom: 20px; }
                .sidebar .name { font-weight: bold; display: block; margin-top: 12px; text-transform: uppercase;}
                .sidebar .title { font-style: italic; display: block; font-size: 12px; }
                .sidebar .main-title { text-align: center; font-weight: bold; margin-bottom: 20px; display: block;}

                /* --- Main Body Text --- */
                .main-body {
                    font-size: 15px;
                    line-height: 1.6;
                }

                .salutation {
                    font-weight: bold;
                    margin-bottom: 25px;
                    display: block;
                }

                .fill-line {
                    border-bottom: 1px solid black;
                    display: inline-block;
                    min-width: 50px;
                    padding: 0 5px;
                }
                
                .fill-block {
                    width: 100%;
                }

                .business-nature-section { margin: 20px 0; }
                .checkbox-group { margin-left: 40px; font-weight: bold; }
                .checkbox-option { display: block; margin: 5px 0; }
                .checkbox-option::before { content: "☐ "; font-weight: normal;}
                /* Use this class for the selected option */
                .checkbox-option.checked::before { content: "☑ "; font-weight: normal; }

                .issue-date { margin-top: 30px; text-align: right; }
                .or-details { margin-top: 30px; font-size: 14px;}
                .or-details div { margin-bottom: 5px; }

                /* --- Footer (Signatures) --- */
                footer {
                    margin-top: 60px;
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    z-index: 2;
                    page-break-inside: avoid;
                }

                .signature-block {
                    width: 45%;
                    text-align: center;
                }

                .attested-by { text-align: left; margin-bottom: 40px; }
                .signature-line {
                    border-bottom: 1px solid black;
                    margin-bottom: 5px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                /* --- Print Specific Styles --- */
                @media print {
                    body { background-color: white; padding: 0; }
                    .document-container {
                        width: 100%; height: auto; box-shadow: none; margin: 0; padding: 30px 40px;
                    }
                    .sidebar, .content-wrapper::before {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>

            <div class="document-container">
                <header>
                    <!--<div class="logo-container">
                        <img src="logo.png" alt="Barangay Blue Ridge B Logo">
                    </div>-->
                    <div class="header-text">
                        <div>Republic of the Philippines</div>
                        <div>Quezon City</div>
                        <div>District III</div>
                        <h1>BARANGAY BLUE RIDGE B</h1>
                        <h2>OFFICE OF THE BARANGAY CHAIRMAN</h2>
                    </div>
                </header>

                <div class="doc-title">BARANGAY BUSINESS CLEARANCE</div>

                <div class="content-wrapper">
                    <aside class="sidebar">
                        <div class="official-group" style="text-align: center;">
                            <span class="name">HON. [CAPTAIN NAME]</span>
                            <span class="title">Punong Barangay</span>
                        </div>

                        <span class="main-title">KAGAWADS</span>

                        <div class="official-group">
                            <span class="name">HON. [KAGAWAD 1]</span>
                            <span class="name">HON. [KAGAWAD 2]</span>
                            <span class="name">HON. [KAGAWAD 3]</span>
                            <span class="name">HON. [KAGAWAD 4]</span>
                            <span class="name">HON. [KAGAWAD 5]</span>
                            <span class="name">HON. [KAGAWAD 6]</span>
                            <span class="name">HON. [KAGAWAD 7]</span>
                        </div>

                        <div class="official-group">
                            <span class="name">HON. [SK CHAIR NAME]</span>
                            <span class="title">S.K Chairperson</span>
                        </div>

                        <div class="official-group">
                            <span class="name">MR. [SECRETARY NAME]</span>
                            <span class="title">Brgy. Secretary</span>
                        </div>

                        <div class="official-group">
                            <span class="name">MR. [TREASURER NAME]</span>
                            <span class="title">Brgy. Treasurer</span>
                        </div>
                    </aside>

                    <main class="main-body">
                        <span class="salutation">TO WHOM IT MAY CONCERN:</span>

                        <p>
                            This clearance is hereby granted to <span class="fill-line fill-block">' . htmlspecialchars($grantee_name) . '</span> with business address at <span class="fill-line" style="font-weight: bold;">Barangay Blue Ridge B, Quezon City</span>, to operate or engage in business trade or occupation in the vicinity of the Barangay for:
                        </p>

                        <div class="business-nature-section">
                            Business Name/Trade Name: <span class="fill-line fill-block">' . htmlspecialchars($businessName) . '</span>
                        <div class="checkbox-group">
                                <span class="checkbox-option' . (strtoupper($applicationType) === 'NEW' ? ' checked' : '') . '">NEW</span>
                                <span class="checkbox-option' . (strtoupper($applicationType) === 'RENEWAL' ? ' checked' : '') . '">RENEWAL</span>
                                <span class="checkbox-option' . (strtoupper($applicationType) === 'CLOSURE' ? ' checked' : '') . '">CLOSURE</span>
                            </div>
                        </div>

                        <p>
                            As having been complied with the requirements of the Barangay.
                        </p>

                        <p>
                            This clearance is issued upon request of the herein interested party for whatever purposes it may serve.
                        </p>

                        <p class="issue-date">
                            Issued this <span class="fill-line" style="width: 50px; text-align: center;">' . htmlspecialchars($day) . '</span> day of <span class="fill-line" style="width: 100px; text-align: center;">' . htmlspecialchars($month) . '</span>, 20<span class="fill-line" style="width: 30px;">' . htmlspecialchars($year) . '</span>.
                        </p>

                        <div class="or-details">
                            <div>Issued at OR No.: <span class="fill-line fill-block">' . htmlspecialchars($or_number) . '</span></div>
                            <div>Date Issued: <span class="fill-line fill-block">' . htmlspecialchars($date_issued) . '</span></div>
                            <div>Issued at: <span class="fill-line fill-block">Barangay Blue Ridge B Hall</span></div>
                        </div>
                    </main>
                </div>

                <footer>
                    <div class="signature-block" style="text-align: left;">
                        <div class="attested-by">Attested by:</div>
                        <div class="signature-line">MR. [SECRETARY NAME]</div>
                        <div class="title">Barangay Secretary</div>
                    </div>

                    <div class="signature-block">
                        <div class="attested-by" style="text-align: center;">Approved by:</div>
                        <div class="signature-line" style="margin-top: 40px;">HON. [CAPTAIN NAME]</div>
                        <div class="title">Punong Barangay</div>
                    </div>
                </footer>
            </div>
        </body>
        </html>';

    // Must set header to text/html so the browser renders it, not JSON
    header('Content-Type: text/html; charset=UTF-8');
    ob_clean(); // Ensure no prior output before echoing HTML
    echo $html;
}

function handleCreateApplication($pdo) {
    // ... [Your existing create logic here, no changes needed] ...
    // Note: ensure this code block remains from your original file
    try {
        $supabaseUserId = get_input('supabase_user_id');
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
        address_of_business, business_status, telephone_no_business, email_address,
        first_name, middle_name, last_name, telephone_no_owner, address_owner,
        type_of_structure, type_of_structure_specify, no_of_employees,
        requirements, requirement_upload, application_date, status
        ) VALUES (
            :supabase_user_id, :business_name, :type_of_business, :nature_of_business, :nature_of_business_specify,
            :address_of_business, :business_status::json, :telephone_no_business, :email_address,
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
        ob_clean(); // Ensure no prior output before echoing JSON
        echo json_encode(["status" => "success", "id" => $result['id'], "message" => "Application Created!"]);
    } catch (PDOException $e) {
        ob_clean(); // Ensure no prior output before echoing error
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        ob_clean(); // Ensure no prior output before echoing error
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "General Error: " . $e->getMessage()]);
    }
}

function handleFetchApplications($pdo)
{
    try {
        $stmt = $pdo->query("SELECT * FROM business_applications ORDER BY created_at DESC");
        $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Check if any data was retrieved
        error_log("DEBUG: Rows fetched from DB: " . count($applications));

        if (empty($applications)) {
            ob_clean(); // Clear buffer before JSON output
            error_log("DEBUG: No applications found in the database.");
            echo json_encode(["status" => "success", "data" => []]);
            return;
        }

        // Process JSON fields and check for memory increase
        $initial_count = count($applications);
        foreach ($applications as &$app) {
            if (isset($app['business_status']) && is_string($app['business_status'])) {
                $decoded = json_decode($app['business_status'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $app['business_status'] = $decoded;
                }
            }
            
            if (isset($app['requirements']) && is_string($app['requirements'])) {
                $decoded = json_decode($app['requirements'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $app['requirements'] = $decoded;
                }
            }
        }
        unset($app); // Important to break the reference

        // Check memory usage after processing
        error_log("DEBUG: Memory usage after processing: " . memory_get_usage(true) / (1024 * 1024) . " MB");


        // Robust JSON encoding for final output
        $jsonOutput = json_encode(
            ["status" => "success", "data" => $applications], 
            JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR
        );

        if ($jsonOutput === false) {
            // Check if json_encode failed (e.g., extremely large data or internal error)
            $error_message = "JSON Encoding Failed: " . json_last_error_msg();
            error_log("FATAL ERROR: " . $error_message);
            throw new Exception($error_message);
        }

        ob_clean(); // Clear buffer before final JSON output
        echo $jsonOutput;

    } catch (PDOException $e) {
        ob_clean(); // Clear buffer before error output
        http_response_code(500);
        error_log("PDO ERROR: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    } catch (Exception $e) {
        ob_clean(); // Clear buffer before error output
        http_response_code(500);
        error_log("SERVER ERROR: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
    }
}

function handleUpdateStatus($pdo){
    // [COMMENT] Logic for updating status (from previous conversation)
    $id = $_POST['id'] ?? null;
    $newStatus = $_POST['newStatus'] ?? null;
    $comments = $_POST['updateComments'] ?? '';
    $amount = $_POST['assessmentAmount'] ?? 0;

    if (!$id || !$newStatus) {
        ob_clean(); // Clear buffer before JSON output
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

        ob_clean(); // Clear buffer before JSON output
        echo json_encode(["status" => "success", "message" => "Status updated to " . $newStatus]);
    } catch (PDOException $e) {
        ob_clean(); // Clear buffer before error output
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

