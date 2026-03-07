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
    <title>Services</title>
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <link rel="stylesheet" href="../../styles/resident/services.css">
    
<style>
    /* MODAL STYLES - Forced Visibility */
    .modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.8) !important; /* Darker background */
        display: none; /* Logic handled by JS */
        justify-content: center;
        align-items: center;
        z-index: 999999 !important; /* Extremely high z-index */
    }

    /* When this class is added, force display */
    .modal-overlay.active-modal {
        display: flex !important;
    }

    .modal-content {
        background: #ffffff !important;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        position: relative;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        color: #333 !important;
    }

    .modal-body ul {
        text-align: left;
        list-style: none;
        margin: 20px 0;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    /* Ensure buttons are visible */
    .btn-modal {
        padding: 12px 25px;
        border-radius: 8px;
        cursor: pointer;
        border: none;
        font-weight: bold;
    }
    .btn-cancel { background: #ccc; }
    .btn-proceed { background: #00247C; color: white; }
</style>
</head>

<body>
    <?php
    $page_title = "Home";
    include '_layout/nav.php';
    ?>

    <main>
        <section class="sections">
            <div class="containers">
                <div class="header-and-parag">
                    <h4>Services</h4>
                    <p>Choose a service to proceed</p>
                </div>
                <div class="list">
                    <a class="links" href="../resident/business_app.php" data-service="business">
                        <img src="../../img/business-icon.svg" alt="">
                        <p>Business</p>
                    </a>
                    <a class="links" href="../resident/construction_app.php" data-service="construction">
                        <img src="../../img/construction-hat-icon.svg" alt="">
                        <p>Construction</p>
                    </a>
                    <a class="links" href="../resident/utilities_app.php" data-service="utilities">
                        <img src="../../img/utility-pole-icon.svg" alt="">
                        <p>Utilities</p>
                    </a>
                    <a class="links" href="../resident/incidentReport.php" data-service="report">
                        <img src="../../img/file-icon.svg" alt="">
                        <p>Report</p>
                    </a>
                </div>
            </div>
        </section>
    </main>

    <div id="guidelinesModal" class="modal-overlay">
        <div class="modal-content">
            <h3 id="modalTitle">Guidelines</h3>

            <div id="modalBody" class="modal-body"></div>
            <h5 id="disclaimer"> Disclaimer: </h5>
            <div class="modal-footer">
                <button type="button" class="btn-modal btn-cancel" id="closeModal">Cancel</button>
                <button type="button" class="btn-modal btn-proceed" id="confirmProceed">Proceed</button>
            </div>
            
        </div>
    </div>

    <?php include '_layout/end.php'; ?>

    <script src="../../scripts/resident/services.js"></script>
</body>
</html>