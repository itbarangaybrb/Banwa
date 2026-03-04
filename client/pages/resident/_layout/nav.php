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
            <!-- Hamburger Menu Button for Mobile - Position it before nav -->
            <button class="hamburger-menu" id="hamburgerBtn" aria-label="Menu">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
            
            <div class="head_space">
                <img class="logo" src="../../img/logo-1.png" alt="Logo">
                <img class="logo" src="../../img/banwalogo.png" alt="BANWA Logo">
                <span class="company_name">BANWA</span>
            </div>

            <!-- Add nav-menu class here for mobile functionality -->
            <nav class="nav-menu" id="navMenu">
                <ul class="nav_list">
                    <li><a class="nav_select <?php echo ($page_title == "Home") ? 'active' : ''; ?>" href="../resident/home.php">Home</a></li>
                    <li><a class="nav_select <?php echo ($page_title == "About Us") ? 'active' : ''; ?>" href="../resident/about_us.php">About Us</a></li>
                    <li class="dropdown">
                        <a class="nav_select2 dropdown-toggle" id="clearancesDropdown">
                            Clearances
                        </a>
                        <ul class="dropdown-menu">
                            <li><a href="../resident/construction_app.php" <?php echo ($page_title == "Construction Application") ? 'class="active"' : ''; ?>>Construction Application</a></li>
                            <li><a href="../resident/business_app.php" <?php echo ($page_title == "Business Application") ? 'class="active"' : ''; ?>>Business Application</a></li>
                            <li><a href="../resident/utilities_app.php" <?php echo ($page_title == "Utilities Application") ? 'class="active"' : ''; ?>>Utilities Application</a></li>
                        </ul>
                    </li>
                </ul>
            </nav>

            <div class="user_profile">
                <div class="profile_dropdown">
                    <button class="profile_circle" id="profileIcon">
                        <!-- Initials will be set by JS -->
                    </button>
                    <div class="profile_dropdown_menu">
                        <a href="../resident/profile.php" class="dropdown_link <?php echo ($page_title == "Profile") ? 'active' : ''; ?>">Profile</a>
                        <a href="../resident/status.php" class="dropdown_link <?php echo ($page_title == "Status") ? 'active' : ''; ?>">Status</a>
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