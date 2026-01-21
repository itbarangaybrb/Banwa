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
    <title>Contact Us</title>
    <link rel="stylesheet" href="../../styles/resident/contact_us.css">
</head>

<body>
    <?php
    $page_title = "Contact Us";
    include '_layout/nav.php';
    ?>

    <!-- ================== Contact Banner Section ================== -->
    <section class="sections>
        <div class=" about-container">
        <div class="contact-content">
            <div class="banner">
                <div class="header-and-parags">
                    <h3>Contact Us</h3>
                    <p>We'd love to hear from you! Please reach out to us with any questions, feedback, or inquiries, and our team will be happy to assist.</p>
                </div>
            </div>

            <div class="container-1">
                <div class="content">
                    <h4>Get in touch</h4>
                    <div class="icon-and-info">
                        <div><img src="../../img/icon-1.svg" alt="Location Icon"></div>
                        <div class="info">
                            <h6>Meet Us</h6>
                            <p>5 Moonlight Loop, Project 4, Quezon City, 1800 Metro Manila</p>
                        </div>
                    </div>

                    <div class="icon-and-info">
                        <div><img src="../../img/icon-2.svg" alt="Phone Icon"></div>
                        <div class="info">
                            <h6>Call Us</h6>
                            <p>(+63) 986 896 7894</p>
                        </div>
                    </div>
                </div>

                <div class="content">
                    <img src="../../img/contact-1.png" alt="Contact Visual">
                </div>
            </div>
        </div>
        </div>
    </section>

    <?php include '_layout/end.php'; ?>

    <script src="../../scripts/resident/contact_us.js"></script>
</body>

</html>