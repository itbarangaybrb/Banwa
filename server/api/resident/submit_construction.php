<?php
include __DIR__ . '/../../configs/database.php';

$success_message = "";
$error_message = "";

// Check if there is a session success message
if (!empty($_SESSION['success_message'])) {
    $success_message = $_SESSION['success_message'];
    unset($_SESSION['success_message']); // clear it after displaying
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Since you're using PDO from db.php, use PDO methods
    $permit_no = $_POST['permit_no'];
    $homeowner_name = $_POST['homeowner_name'];
    $contractor_name = $_POST['contractor_name'];
    $address_of_construction = $_POST['address_of_construction'];
    $nature_of_activity = $_POST['nature_of_activity'];
    $type_of_work = $_POST['type_of_work'];
    $details_of_work = $_POST['details_of_work'];
    $start_date = $_POST['start_date'];
    $end_date = $_POST['end_date'];
    $num_of_workers = $_POST['num_of_workers'];
    $num_of_working_days = $_POST['num_of_working_days'];
    $fee_paid = $_POST['fee_paid'];
    $payment_type = $_POST['payment_type'];
    $payment_status = $_POST['payment_status'];
    $latitude = isset($_POST['latitude']) && $_POST['latitude'] !== '' ? (float)$_POST['latitude'] : null;
    $longitude = isset($_POST['longitude']) && $_POST['longitude'] !== '' ? (float)$_POST['longitude'] : null;

    $blueprint_image_path = "";
    $additional_images = "";

    // Blueprint upload
    if (isset($_FILES['blueprint_image']) && $_FILES['blueprint_image']['error'] == 0) {
        $target_dir = "uploads/blueprints/";
        if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);
        $blueprint_file_name = time() . "_" . basename($_FILES["blueprint_image"]["name"]);
        $target_file = $target_dir . $blueprint_file_name;

        if (move_uploaded_file($_FILES["blueprint_image"]["tmp_name"], $target_file)) {
            $blueprint_image_path = $target_file;
        } else {
            $error_message = "Sorry, there was an error uploading your blueprint file.";
        }
    }

    // Additional images upload
    if (isset($_FILES['additional_images'])) {
        $additional_files = [];
        $target_dir = "uploads/additional/";
        if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);

        foreach ($_FILES['additional_images']['tmp_name'] as $key => $tmp_name) {
            if ($_FILES['additional_images']['error'][$key] == 0) {
                $additional_file_name = time() . "_" . $key . "_" . basename($_FILES["additional_images"]["name"][$key]);
                $target_file = $target_dir . $additional_file_name;
                if (move_uploaded_file($tmp_name, $target_file)) {
                    $additional_files[] = $target_file;
                }
            }
        }
        $additional_images = implode(",", $additional_files);
    }

    if (empty($error_message)) {
        try {
            $sql = "INSERT INTO construction_doc (
                permit_no, homeowner_name, contractor_name, address_of_construction, 
                nature_of_activity, type_of_work, details_of_work, start_date, end_date, 
                num_of_workers, num_of_working_days, fee_paid, payment_type, payment_status, 
                blueprint_image_path, additional_images, latitude, longitude, application_status
            ) VALUES (
                :permit_no, :homeowner_name, :contractor_name, :address_of_construction,
                :nature_of_activity, :type_of_work, :details_of_work, :start_date, :end_date,
                :num_of_workers, :num_of_working_days, :fee_paid, :payment_type, :payment_status,
                :blueprint_image_path, :additional_images, :latitude, :longitude, :application_status
            )";

            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([
                ':permit_no' => $permit_no,
                ':homeowner_name' => $homeowner_name,
                ':contractor_name' => $contractor_name,
                ':address_of_construction' => $address_of_construction,
                ':nature_of_activity' => $nature_of_activity,
                ':type_of_work' => $type_of_work,
                ':details_of_work' => $details_of_work,
                ':start_date' => $start_date,
                ':end_date' => $end_date,
                ':num_of_workers' => $num_of_workers,
                ':num_of_working_days' => $num_of_working_days,
                ':fee_paid' => $fee_paid,
                ':payment_type' => $payment_type,
                ':payment_status' => $payment_status,
                ':blueprint_image_path' => $blueprint_image_path,
                ':additional_images' => $additional_images,
                ':latitude' => $latitude,
                ':longitude' => $longitude,
                ':application_status' => 'Complied'
            ]);

            if ($result) {
                // Store success message in session
                $_SESSION['success_message'] = "Construction permit application submitted successfully!";

                // Redirect to same page to prevent resubmission
                header("Location: " . $_SERVER['PHP_SELF']);
                exit;
            } else {
                $error_message = "Error submitting application.";
            }
        } catch (PDOException $e) {
            $error_message = "Database error: " . $e->getMessage();
        }
    }
}
?>