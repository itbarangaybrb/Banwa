<!-- <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Home page</title>
</head>
<body>
    <h1>Home page</h1>
    <p id="userStatus"></p>
    <a href="../resident/about_us.php">About Us</a><br>
    <a href="../resident/contact_us.php">Contact Us</a><br>
    <a href="../resident/profile.php">Profile</a><br>
    <a href="../resident/status.php">status</a><br>
    <a href="../resident/construction_app.php">Construction Application</a><br>
    <a href="../resident/utilities_app.php">Utilities Application</a><br>
    <a href="../resident/business_app.php">Business Application</a><br>
    <button id="signoutBtn">Logout</button>

    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>
</html> -->
<!DOCTYPE html>
<html lang="en">

<head>
    <title>Home</title>
    <link rel="stylesheet" href="../../styles/resident/.css">
</head>
<body>
<?php 
$page_title = "Home";
include '_layout/nav.php';
?>

 <div class="content_wrapper">
    <div class="content-section active" id="default">
        <h2>Welcome to BANWA</h2>
        <p>Select a size from the navigation menu to view product details.</p>
    </div>
                <!-- Add other content sections for each size -->
</div>

<?php include '_layout/end.php'; ?>