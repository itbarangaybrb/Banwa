<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 1) {
    header("Location: /client/pages/auth/signin.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
    <link rel="stylesheet" href="../../styles/global.css">
    <link rel="stylesheet" href="../../styles/resident/status.css">
</head>

<body>
    <!-- 
        TODO: Front-end developer, will change
        this into modal once the designs is fully completed. 
      -->
    <!-- <p id="userStatus"></p>
    <button id="signoutBtn">Logout</button> -->

    <?php
    $page_title = "Home";
    include '_layout/nav.php';
    ?>

    <section class="sections">
        <div class="header-and-parag">
            <h4>Current Status</h4>
            <p>Track your ongoing applications and payment history</p>
        </div>

        <!-- Tabs -->
        <div class="tab-navigation">
            <button class="tab-btn active" data-tab="applications">Applications</button>
            <button class="tab-btn" data-tab="payments">Payment History</button>
        </div>

        <!-- Single Table -->
        <div class="containers status-table-container">
            <table class="status-table" id="mainStatusTable">
                <thead id="tableHeader">
                    <!-- JS fills this -->
                </thead>
                <tbody id="mainTableBody">
                    <tr>
                        <td colspan="4" style="text-align:center; padding: 60px;">Loading...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- Modal -->

    <div class="modal" id="editModal">
        <div class="modal-content">
            <span class="modal-close-btn">&times;</span>
            <div id="modal-form-content"></div>
        </div>
    </div>

    <div class="modal" id="paymentModal">
        <div class="modal-content">
            <span class="modal-close-btn payment-modal-close-btn">&times;</span>
            <div id="payment-modal-form-content"></div>
        </div>
    </div>

    <div class="modal" id="remarksModal">
        <div class="modal-content" style="max-width: 500px;">
            <span class="modal-close-btn remarks-modal-close-btn">&times;</span>
            <h2 style="color: var(--color-blue-1); margin-top: 0;">Application Remarks</h2>
            <div id="remarks-content" style="padding: 20px 0; font-size: 16px; line-height: 1.6; color: #333;">
            </div>
            <div style="text-align: right; margin-top: 10px;">
                <button class="remarks-close-btn-secondary" style="padding: 8px 16px; cursor: pointer;">Close</button>
            </div>
        </div>
    </div>

    <script type="module" src="../../scripts/resident/status.js"></script>
</body>

</html>

<?php include '_layout/end.php'; ?>