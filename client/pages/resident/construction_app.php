<?php
// db connection
include '../../configs/database.php';

// If form submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {

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
    $approved_by = $_POST['approved_by'];
    $noted_by = $_POST['noted_by'];
    $remarks = $_POST['remarks'];

    // Create folder if it does not exist
    $upload_dir = "client/uploads/";
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    // Handle Blueprint Upload
    $blueprint_image_path = null;
    if (!empty($_FILES['blueprint_image']['name'])) {
        $blueprint_filename = time() . "_" . $_FILES['blueprint_image']['name'];
        $blueprint_dest = $upload_dir . $blueprint_filename;
        move_uploaded_file($_FILES['blueprint_image']['tmp_name'], $blueprint_dest);
        $blueprint_image_path = $blueprint_dest;
    }

    // Handle Additional Images (Multiple)
    $additional_images = [];
    if (!empty($_FILES['additional_images']['name'][0])) {
        foreach ($_FILES['additional_images']['tmp_name'] as $key => $tmp_name) {
            $add_filename = time() . "_" . $_FILES['additional_images']['name'][$key];
            $add_dest = $upload_dir . $add_filename;
            move_uploaded_file($tmp_name, $add_dest);
            $additional_images[] = $add_dest;
        }
    }
    $additional_images = implode(",", $additional_images);

    // Insert Data (Notice: NO document_id)
    $stmt = $conn->prepare("INSERT INTO construction_doc (
        permit_no, homeowner_name, contractor_name, address_of_construction, 
        nature_of_activity, type_of_work, details_of_work, start_date, end_date,
        num_of_workers, num_of_working_days, fee_paid, payment_type, payment_status,
        approved_by, noted_by, remarks, blueprint_image_path, additional_images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->bind_param(
        "sssssssss" . "iid" . "sssssss",
        $permit_no,
        $homeowner_name,
        $contractor_name,
        $address_of_construction,
        $nature_of_activity,
        $type_of_work,
        $details_of_work,
        $start_date,
        $end_date,
        $num_of_workers,
        $num_of_working_days,
        $fee_paid,
        $payment_type,
        $payment_status,
        $approved_by,
        $noted_by,
        $remarks,
        $blueprint_image_path,
        $additional_images
    );


    if ($stmt->execute()) {
        echo "<script>
    alert('Construction Permit Form Submitted Successfully!');
    window.location.href='/Banwa/client/pages/resident/home.php';
</script>";
    } else {
        echo "<script>alert('Error Saving Data!');</script>";
    }

    $stmt->close();
    $conn->close();
}
?>

<!DOCTYPE html>
<html>

<head>
    <title>Construction Permit Form</title>
    <link rel="stylesheet" href="../../styles/resident/construction_app.css">
</head>

<body>



    <div class="form-container">

        <div class="form-header">
            <h2>Construction Permit Application Form</h2>
            <p>Please fill out all required fields.</p>
        </div>

        <div class="stepper">
            <div class="step active">Construction Permit Form</div>
        </div>

        <form action="" method="POST" enctype="multipart/form-data" id="constructionForm">

            <h3>Owner & Project Information</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Permit No.</label>
                    <input type="text" name="permit_no" required>
                </div>

                <div class="form-group">
                    <label>Homeowner Name</label>
                    <input type="text" name="homeowner_name" required>
                </div>

                <div class="form-group">
                    <label>Contractor Name</label>
                    <input type="text" name="contractor_name" required>
                </div>

                <div class="form-group full-width">
                    <label>Address of Construction</label>
                    <textarea name="address_of_construction" required></textarea>
                </div>

                <div class="form-group full-width">
                    <label for="nature_of_activity">Nature of Activity</label>
                    <select id="nature_of_activity" name="nature_of_activity" required>
                        <option value="" disabled selected>Select Nature of Activity</option>
                        <option value="Repairs">Repairs</option>
                        <option value="Minor Construction">Minor Construction</option>
                        <option value="Construction">Construction</option>
                        <option value="Demolition">Demolition</option>
                    </select>
                </div>

                <div class="form-group full-width">
                    <label for="activity_details">Specific Details (if any)</label>
                    <textarea id="activity_details" name="activity_details" placeholder="Example: Installation of roofing for open parking"></textarea>
                </div>

                <div class="form-group">
                    <label>Type of Work</label>
                    <input type="text" name="type_of_work" required>
                </div>

                <div class="form-group full-width">
                    <label>Details of Work</label>
                    <textarea name="details_of_work" required></textarea>
                </div>
            </div>

            <h3>Work Schedule & Labor</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" name="start_date" required>
                </div>

                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" name="end_date" required>
                </div>

                <div class="form-group">
                    <label>Number of Workers</label>
                    <input type="number" name="num_of_workers" required>
                </div>

                <div class="form-group">
                    <label>Number of Working Days</label>
                    <input type="number" name="num_of_working_days" required>
                </div>
            </div>

            <h3>Payment & Approval</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Fee Paid</label>
                    <input type="number" step="0.01" name="fee_paid" required>
                </div>

                <div class="form-group">
                    <label>Payment Type</label>
                    <select name="payment_type">
                        <option value="Cash">Cash</option>
                        <option value="GCash">GCash</option>
                        <option value="Bank">Bank</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Payment Status</label>
                    <select name="payment_status">
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Approved By</label>
                    <input type="text" name="approved_by">
                </div>

                <div class="form-group">
                    <label>Noted By</label>
                    <input type="text" name="noted_by">
                </div>

                <div class="form-group full-width">
                    <label>Remarks</label>
                    <textarea name="remarks"></textarea>
                </div>
            </div>

            <h3>Attachments</h3>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>Upload Blueprint</label>
                    <input type="file" name="blueprint_image" accept="image/*">
                </div>

                <div class="form-group full-width">
                    <label>Upload Additional Images (Multiple)</label>
                    <input type="file" name="additional_images[]" multiple accept="image/*">
                </div>
            </div>

            <button type="submit" class="submit-btn">Submit Form</button>

        </form>

    </div>

    <script>
        document.getElementById("constructionForm").addEventListener("submit", function(e) {
            let form = e.target;
            let requiredFields = form.querySelectorAll("input[required], select[required], textarea[required]");
            let allFilled = true;

            requiredFields.forEach(field => {
                field.style.border = "1px solid #ccc"; // reset border

                if (!field.value.trim()) {
                    field.style.border = "2px solid red"; // highlight missing
                    allFilled = false;
                }
            });

            if (!allFilled) {
                e.preventDefault(); // stop submit
                alert("Please fill in all required fields before submitting.");
            }
        });

        // Validate Start Date < End Date
        let start = document.querySelector("input[name='start_date']");
        let end = document.querySelector("input[name='end_date']");

        if (start.value && end.value && start.value > end.value) {
            e.preventDefault();
            start.style.border = end.style.border = "2px solid red";
            alert("End Date must be later than Start Date.");
            return;
        }
    </script>


</body>

</html>