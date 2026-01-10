<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 1) {
    header("Location: /Banwa/client/pages/auth/signin.php");
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
                    <a class="links" href="../resident/business_app.php">
                        <img src="../../img/business-icon.svg" alt="">
                        <p>Business</p>
                    </a>
                    <a class="links" href="../resident/construction_app.php">
                        <img src="../../img/construction-hat-icon.svg" alt="">
                        <p>Construction</p>
                    </a>
                    <a class="links" href="../resident/utilities_app.php">
                        <img src="../../img/utility-pole-icon.svg" alt="">
                        <p>Utilities</p>
                    </a>

                    <a class="links" href="#">
                        <img src="../../img/file-icon.svg" alt="">
                        <p>Report</p>
                    </a>
                </div>
            </div>
        </section>
    </main>

    <?php include '_layout/end.php'; ?>

</body>

</html>