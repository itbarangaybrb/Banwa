<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../../styles/resident/nav.css">
    <link rel="stylesheet" href="../../styles/components/loader.css">
    <link rel="stylesheet" href="../../styles/resident/home.css">
</head>

<body>
    <header>
        <!-- NAV -->
        <nav class="nav" id="mainNav" aria-label="Main navigation">
            <div class="wrap nav__inner">

                <!-- Brand -->
                <a href="/client/pages/resident/home.php" class="nav__brand">
                <div class="nav__logos" aria-hidden="true">
                    <img src="/client/img/logo-1.png" alt="">
                    <img src="/client/img/banwalogo.png" alt="">
                </div>
                <span class="nav__wordmark">BANWA</span>
                </a>

                <!-- Centre links -->
                <div class="nav__links" id="navMenu" aria-label="Site navigation">
                <ul class="nav__list">
                    <li>
                    <a class="nav__link" href="/client/pages/resident/home.php">Home</a>
                    </li>
                    <li>
                    <a class="nav__link" href="/client/pages/resident/about_us.php">About Us</a>
                    </li>
                    <li class="nav__dropdown">
                    <button class="nav__link nav__dropdown-toggle" aria-haspopup="true" aria-expanded="false" id="clearancesToggle">
                        Clearances
                        <svg class="nav__dropdown-chevron" viewBox="0 0 24 24" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    <ul class="nav__dropdown-menu" role="menu" aria-labelledby="clearancesToggle">
                        <li role="none"><a role="menuitem" href="/client/pages/resident/construction_app.php">Construction Application</a></li>
                        <li role="none"><a role="menuitem" href="/client/pages/resident/business_app.php">Business Application</a></li>
                        <li role="none"><a role="menuitem" href="/client/pages/resident/utilities_app.php">Utilities Application</a></li>
                        <li role="none"><a role="menuitem" href="/client/pages/resident/incidentReport.php">Incident Report</a></li>
                    </ul>
                    </li>
                </ul>
                </div>

                <!-- Right side -->
                <div class="nav__right">
                <time class="nav__time" id="navTime" aria-live="polite"></time>

                <!-- Profile dropdown -->
                <div class="nav__profile" id="navProfile">
                    <button class="nav__profile-circle" id="profileIcon" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
                    <!-- Initials injected by JS -->
                    </button>
                    <div class="nav__profile-menu" id="profileMenu" role="menu">
                    <a role="menuitem" class="nav__profile-link" href="/client/pages/resident/profile.php">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        Profile
                    </a>
                    <a role="menuitem" class="nav__profile-link" href="/client/pages/resident/status.php">
                        <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        My Status
                    </a>
                    <div class="nav__profile-divider" role="separator"></div>
                    <button role="menuitem" class="nav__profile-link nav__profile-link--danger" id="signoutBtn">
                        <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Logout
                    </button>
                    </div>
                </div>

                <!-- Hamburger (mobile only) -->
                <button class="nav__hamburger" id="hamburgerBtn" aria-label="Open menu" aria-expanded="false" aria-controls="navMenu">
                    <span class="nav__hamburger-line"></span>
                    <span class="nav__hamburger-line"></span>
                    <span class="nav__hamburger-line"></span>
                </button>
                </div>

            </div>
        </nav>

        <!-- Mobile overlay -->
        <div class="nav__overlay" id="navOverlay" aria-hidden="true"></div>
    </header>

    <div id="loader" role="status" aria-label="Loading BANWA">
        <span class="loader__wordmark">BANWA</span>
        <span class="loader__sub">Barangay Blue Ridge B</span>
        <div class="loader__track"><div class="loader__bar"></div></div>
    </div>

    <main>