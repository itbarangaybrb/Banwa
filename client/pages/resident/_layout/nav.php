<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="stylesheet" href="../../styles/global2.css">
</head>

<body>
    <header>
        <div class="header_cont">
            <div class="logo_container">
                <div class="head_space">
                    <img class="logo" src="../../img/logo-1.png">
                    <img class="logo" src="../../img/banwalogo.png">
                    <span class="company_name">BANWA</span>
                </div>

                <nav>
                    <ul class="nav_list">
                        <li><a class="nav_select" href="../resident/home2.php" <?php if ($page_title == "home2") echo 'class="active"'; ?>>Home</a></li>
                        <li><a class="nav_select" href="../resident/about_us2.php" <?php if ($page_title == "About Us") echo 'class="active"'; ?>>Updates</a></li>
                        <li><a class="nav_select" href="../resident/contact_us2.php" <?php if ($page_title == "Contact Us") echo 'class="active"'; ?>>Clearances</a></li>
                        <!-- <li><a href="../resident/construction_app2.php" <?php if ($page_title == "Construction Application") echo 'class="active"'; ?>>Construction Application</a></li>
                        <li><a href="../resident/utilities_app2.php" <?php if ($page_title == "Utilities Application") echo 'class="active"'; ?>>Utilities Application</a></li>
                        <li><a href="../resident/business_app2.php" <?php if ($page_title == "Business Application") echo 'class="active"'; ?>>Business Application</a></li> -->

                        <li><a class="nav_select" href="../resident/status2.php" <?php if ($page_title == "Status") echo 'class="active"'; ?>>Status</a></li>
                        <li><a class="nav_select" href="../resident/profile.php" <?php if ($page_title == "Profile") echo 'class="active"'; ?>>Profile</a></li>
                    </ul>
                </nav>
                <div class="user_profile">
                    <p id="userStatus" class="username"></p>
                    <div class="time_date" id="live_datetime">
                        <div class="time-display">
                            <span class="weekday-box"></span>
                            <span class="time-part"></span>
                        </div>
                        <div class="date-display"></div>
                    </div>
                </div>
            </div>
        </div>
    </header>

<main>
