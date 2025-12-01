<?php
// finance_handler.php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'capstone');
define('DB_USER', 'postgres');
define('DB_PASS', '080702');

header('Content-Type: application/json');

if (!extension_loaded('pdo_pgsql')) {
    ob_clean();
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver not loaded"]));
}

try {
    $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
} catch (PDOException $e) {
    ob_clean();
    echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    exit;
}

$action = $_REQUEST['action'] ?? null;
ob_clean();

switch ($action) {
    case 'fetch_pending':
        // Fetch items where status is specifically 'For Payment'
        // You can join with other tables here if you have separate tables for Construction/Utilities
        try {
            $stmt = $pdo->query("SELECT * FROM business_applications WHERE status = 'For Payment' ORDER BY created_at DESC");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        } catch (Exception $e) { echo json_encode(["status" => "error", "message" => $e->getMessage()]); }
        break;

    case 'fetch_history':
        // Fetch items that are Paid/Completed
        try {
            $stmt = $pdo->query("SELECT * FROM business_applications WHERE payment_status = 'Paid' ORDER BY payment_date DESC");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        } catch (Exception $e) { echo json_encode(["status" => "error", "message" => $e->getMessage()]); }
        break;

    case 'fetch_one':
        $id = $_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM business_applications WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "data" => $stmt->fetch()]);
        break;

    case 'process_payment':
        $id = $_POST['id'];
        $amountDue = $_POST['amountDue'];
        $amountPaid = $_POST['amountPaid'];
        $orNumber = $_POST['orNumber'];
        $method = $_POST['paymentMethod'];

        try {
            // Update Status to 'Paid' and Payment Status to 'Paid'
            $sql = "UPDATE business_applications SET 
                    status = 'Paid',
                    payment_status = 'Paid',
                    amount_due = :due,
                    amount_paid = :paid,
                    or_number = :or,
                    payment_method = :method,
                    payment_date = NOW()
                    WHERE id = :id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':due' => $amountDue,
                ':paid' => $amountPaid,
                ':or' => $orNumber,
                ':method' => $method,
                ':id' => $id
            ]);

            echo json_encode(["status" => "success", "id" => $id, "message" => "Payment processed"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid Action"]);
}
?>