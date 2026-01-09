<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status</title>

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

    <main>
        <!-- ==================== Status section ==================== -->
        <section class="sections">
            <div class="header-and-parag">
                <h4>Current Status</h4>
                <p>Pending Applications</p>
                <button id="notificationBtn">notify</button>
            </div>
            <div class="containers status">
                <div class="content">
                    <div class="status-bar-container" id="applicationStatus">
                        <!-- <span>You have no active service requests.</span> -->
                    </div>
                </div>
            </div>
        </section>

        <section class="sections">
            <div class="containers status">
                <div class="content">
                    <div class="header-and-text">
                        <h4>Payment History</h4>
                        <p>Past and Pending Payments</p>
                    </div>
                    <div class="status-bar-container" id="paymentHistoryList">
                        <!-- Payment history will be loaded here by JavaScript -->
                    </div>
                </div>
            </div>
        </section>

        <div class="bg-logo">
            <img src="../../img/banwa-logo-1.png" alt="">
        </div>

        <div class="modal" id="editModal">
            <div class="modal-content">
                <span class="modal-close-btn">&times;</span>
                <div id="modal-form-content">
                    <!-- Form content will be loaded here by JavaScript -->
                </div>
            </div>
        </div>

        <div class="modal" id="paymentModal">
            <div class="modal-content">
                <span class="modal-close-btn payment-modal-close-btn">&times;</span>
                <div id="payment-modal-form-content">
                    <!-- Payment form content will be loaded here by JavaScript -->
                </div>
            </div>
        </div>
    </main>

    <script type="module" src="../../scripts/resident/status.js"></script>
</body>

</html>

<?php include '_layout/end.php'; ?>