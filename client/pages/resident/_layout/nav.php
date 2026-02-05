<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../../styles/global.css">
</head>

<body>
    <header>
        <div class="logo_container">
            <div class="head_space">
                <img class="logo" src="../../img/logo-1.png">
                <img class="logo" src="../../img/banwalogo.png">
                <span class="company_name">BANWA</span>
            </div>

            <nav>
                <ul class="nav_list">
                    <li><a class="nav_select" href="../resident/home.php" <?php if ($page_title == "Home") echo 'class="active"'; ?>>Home</a></li>
                    <li><a class="nav_select" href="../resident/about_us.php" <?php if ($page_title == "About Us") echo 'class="active"'; ?>>About Us</a></li>
                    <li class="dropdown">
                        <a class="nav_select2 dropdown-toggle" href="#" id="clearancesDropdown">
                            Clearances
                        </a>
                        <ul class="dropdown-menu">
                            <li><a href="../resident/construction_app.php" <?php if ($page_title == "Construction Application") echo 'class="active"'; ?>>Construction Application</a></li>
                            <li><a href="../resident/utilities_app.php" <?php if ($page_title == "Utilities Application") echo 'class="active"'; ?>>Utilities Application</a></li>
                            <li><a href="../resident/business_app.php" <?php if ($page_title == "Business Application") echo 'class="active"'; ?>>Business Application</a></li>
                        </ul>
                    </li>
                </ul>
            </nav>

            <div class="user_profile">
                <div class="profile_dropdown">
                    <button class="profile_circle" id="profileIcon">
                    </button>
                    <div class="profile_dropdown_menu">
                        <a href="../resident/profile.php" class="dropdown_link" <?php if ($page_title == "Profile") echo 'class="active"'; ?>>Profile</a>
                        <a href="../resident/status.php" class="dropdown_link" <?php if ($page_title == "Status") echo 'class="active"'; ?>>Status</a>
                        <button class="dropdown_link" id="signoutBtn">Logout</button>
                    </div>
                </div>
                <div class="time_date" id="live_datetime">
                    <div class="time-display">
                        <span class="weekday-box"></span>
                        <span class="time-part"></span>
                    </div>
                    <div class="date-display"></div>
                </div>
            </div>
        </div>
    </header>

    <div id="page-loader">
        <div class="spinner"></div>
        <p>Loading…</p>
    </div>

    <main>