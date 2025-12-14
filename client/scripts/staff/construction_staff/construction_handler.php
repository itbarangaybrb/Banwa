<?php
include __DIR__ . '../../../../../server/configs/database.php';


// Initialize error message variable
$error_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax_search'])) {
    $search = $_POST['search'] ?? '';
    
    if (!empty($search)) {
        $like = "%$search%";
        $sql = "SELECT * FROM construction_doc WHERE homeowner_name ILIKE ? OR permit_no ILIKE ? OR contractor_name ILIKE ? ORDER BY construction_id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$like, $like, $like]);
    } else {
        $sql = "SELECT * FROM construction_doc ORDER BY construction_id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
    }
    $result = $stmt;
    
    if ($result->rowCount() === 0): ?>
        <tr><td colspan="10" class="no-data">No records found.</td></tr>
    <?php else: 
        while($row = $result->fetch(PDO::FETCH_ASSOC)): ?>
        <tr>
            <td><?= htmlspecialchars($row['permit_no']) ?></td>
            <td><?= htmlspecialchars($row['homeowner_name']) ?></td>
            <td><?= htmlspecialchars($row['contractor_name']) ?></td>
            <td class="address-cell"><?= htmlspecialchars($row['address_of_construction']) ?></td>
            <td><?= htmlspecialchars($row['type_of_work']) ?></td>
            <td><?= htmlspecialchars($row['start_date']) ?></td>
            <td><?= (int)$row['num_of_workers'] ?> / <?= (int)$row['num_of_working_days'] ?></td>
            <td>₱<?= number_format((float)$row['fee_paid'], 2) ?></td>
            <td><span class="status-badge status-<?= strtolower($row['payment_status']) ?>"><?= htmlspecialchars($row['payment_status']) ?></span></td>
            <td class="actions">
                <button class="action-btn view-btn" data-row="<?= htmlspecialchars(base64_encode(json_encode($row))) ?>" onclick="openView(this)">View</button>
                <button class="action-btn edit-btn" data-row="<?= htmlspecialchars(base64_encode(json_encode($row))) ?>" onclick="openEdit(this)">Edit</button>
            </td>
        </tr>
        <?php endwhile; 
    endif;
    
    exit; 
}

// Handle form submission for updates
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    try {
        $construction_id = (int)$_POST['construction_id'];
        $permit_no = $_POST['permit_no'] ?? '';
        $homeowner_name = $_POST['homeowner_name'] ?? '';
        $contractor_name = $_POST['contractor_name'] ?? '';
        $address_of_construction = $_POST['address_of_construction'] ?? '';
        $nature_of_activity = $_POST['nature_of_activity'] ?? '';
        $type_of_work = $_POST['type_of_work'] ?? '';
        $details_of_work = $_POST['details_of_work'] ?? '';
        $start_date = $_POST['start_date'] ?? '';
        $end_date = $_POST['end_date'] ?? '';
        $num_of_workers = (int)($_POST['num_of_workers'] ?? 0);
        $num_of_working_days = (int)($_POST['num_of_working_days'] ?? 0);
        $fee_paid = (float)($_POST['fee_paid'] ?? 0);
        $payment_type = $_POST['payment_type'] ?? '';
        $payment_status = $_POST['payment_status'] ?? 'Unpaid';
        $approved_by = $_POST['approved_by'] ?? '';
        $noted_by = $_POST['noted_by'] ?? '';
        $remarks = $_POST['remarks'] ?? '';

        // File handling would go here (for blueprint and additional images)
        // For now, we'll keep the existing files
        $existing_blueprint = $_POST['existing_blueprint'] ?? '';
        $existing_additional = $_POST['existing_additional'] ?? '';
        
        $sql = "UPDATE construction_doc SET 
                permit_no = ?, homeowner_name = ?, contractor_name = ?, 
                address_of_construction = ?, nature_of_activity = ?, 
                type_of_work = ?, details_of_work = ?, start_date = ?, 
                end_date = ?, num_of_workers = ?, num_of_working_days = ?, 
                fee_paid = ?, payment_type = ?, payment_status = ?, 
                approved_by = ?, noted_by = ?, remarks = ?, application_status = ?
                WHERE construction_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $permit_no, $homeowner_name, $contractor_name, 
            $address_of_construction, $nature_of_activity, 
            $type_of_work, $details_of_work, $start_date, 
            $end_date, $num_of_workers, $num_of_working_days, 
            $fee_paid, $payment_type, $payment_status, 
            $approved_by, $noted_by, $remarks, 'Complied', $construction_id
        ]);
        
        // Redirect to show success message
        header("Location: construction.php?success=updated");
        exit;
        
    } catch (PDOException $e) {
        $error_message = "Error updating record: " . $e->getMessage();
    }
}

// Handle form submission for creation (from staff create form)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create') {
    try {
        $permit_no = $_POST['permit_no'] ?? '';
        $homeowner_name = $_POST['homeowner_name'] ?? '';
        $contractor_name = $_POST['contractor_name'] ?? '';
        $address_of_construction = $_POST['address_of_construction'] ?? '';
        $nature_of_activity = $_POST['nature_of_activity'] ?? '';
        $type_of_work = $_POST['type_of_work'] ?? '';
        $details_of_work = $_POST['details_of_work'] ?? '';
        $start_date = $_POST['start_date'] ?? null;
        $end_date = $_POST['end_date'] ?? null;
        $num_of_workers = (int)($_POST['num_of_workers'] ?? 0);
        $num_of_working_days = (int)($_POST['num_of_working_days'] ?? 0);
        $fee_paid = (float)($_POST['fee_paid'] ?? 0);
        $payment_type = $_POST['payment_type'] ?? '';
        $payment_status = $_POST['payment_status'] ?? 'Pending';
        $latitude = $_POST['latitude'] ?? null;
        $longitude = $_POST['longitude'] ?? null;

        // File uploads: save into server configs uploads construction folder
        $blueprint_path = '';
        $additional_images = '';

        $uploads_base = __DIR__ . '/../../../../../server/configs/uploads/construction/';
        if (!file_exists($uploads_base)) mkdir($uploads_base, 0755, true);

        if (isset($_FILES['blueprint_image']) && $_FILES['blueprint_image']['error'] === 0) {
            $bp_name = time() . '_' . basename($_FILES['blueprint_image']['name']);
            $target = $uploads_base . $bp_name;
            if (move_uploaded_file($_FILES['blueprint_image']['tmp_name'], $target)) {
                // store path relative to repo root for consistency
                $blueprint_path = 'server/configs/uploads/construction/' . $bp_name;
            }
        }

        if (isset($_FILES['additional_images'])) {
            $added = [];
            foreach ($_FILES['additional_images']['tmp_name'] as $k => $tmp) {
                if ($_FILES['additional_images']['error'][$k] === 0) {
                    $name = time() . '_' . $k . '_' . basename($_FILES['additional_images']['name'][$k]);
                    $t = $uploads_base . $name;
                    if (move_uploaded_file($tmp, $t)) {
                        $added[] = 'server/configs/uploads/construction/' . $name;
                    }
                }
            }
            if (!empty($added)) $additional_images = implode(',', $added);
        }

        $sql = "INSERT INTO construction_doc (
            permit_no, homeowner_name, contractor_name, address_of_construction,
            nature_of_activity, type_of_work, details_of_work, start_date, end_date,
            num_of_workers, num_of_working_days, fee_paid, payment_type, payment_status,
            blueprint_image_path, additional_images, latitude, longitude
        ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $permit_no, $homeowner_name, $contractor_name, $address_of_construction,
            $nature_of_activity, $type_of_work, $details_of_work, $start_date, $end_date,
            $num_of_workers, $num_of_working_days, $fee_paid, $payment_type, $payment_status,
            $blueprint_path, $additional_images, $latitude, $longitude
        ]);

        header('Location: construction.php?success=created');
        exit;
    } catch (PDOException $e) {
        $error_message = 'Error creating record: ' . $e->getMessage();
    }
}

// Sorting and initial data loading
$allowedSortCols = ['construction_id','permit_no','homeowner_name','contractor_name','start_date','payment_status','approved_by', 'fee_paid'];
$sort = isset($_GET['sort']) && in_array($_GET['sort'], $allowedSortCols) ? $_GET['sort'] : 'construction_id';
$order = (isset($_GET['order']) && strtolower($_GET['order']) === 'asc') ? 'ASC' : 'DESC';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

if (!empty($search)) {
    $like = "%$search%";
    $sql = "SELECT * FROM construction_doc WHERE homeowner_name ILIKE ? OR permit_no ILIKE ? OR contractor_name ILIKE ? ORDER BY \"$sort\" $order";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$like, $like, $like]);
} else {
    $sql = "SELECT * FROM construction_doc ORDER BY \"$sort\" $order";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
}
$result = $stmt;
?>