<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../../img/browser-icon.svg">

    <title></title>

    <link rel="stylesheet" href="../../styles/resident/nav.css">
    <link rel="stylesheet" href="../../styles/resident/body.css">
    <link rel="stylesheet" href="../../styles/global.css">
</head>

    <body>
        <aside class="side_nav">
            <div class="nav_header">
                <div class="nav_logo">☰</div>
                <div class="logo_title">
                    <img class="logo" src="../../img/logo-1.png">
                    <img class="logo" src="../../img/banwalogo.png">
                    <span class="company_name">BANWA</span>
                </div>
            </div>

            <ul class="nav_list">
                <div>
                    <li>
                        <a href="../resident/home.php" class="nav_select">
                            <svg
                                class="nav_icon"
                                width="30"
                                height="30"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                                stroke="white"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                                <path
                                d="M9 22V12H15V22"
                                stroke="white"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                            </svg>
                            <span class="nav_text">Home</span>
                        </a>
                    </li>

                    <li class="nav_dropdown">
                        <a href="#" class="nav_select2 download_toggle">
                            <svg
                                class="nav_icon" width="30" height="30" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9 12H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span class="nav_text">Application</span>
                            <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </a>
                        <ul class="dropdown_menu">
                            <li><a href="../resident/business_app.php" class="dropdown_item">Business Clearance</a></li>
                            <li><a href="../resident/construction_app.php" class="dropdown_item">Construction / Infrastructure</a></li>
                            <li><a href="../resident/utilities_app.php" class="dropdown_item">Utilities</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="../resident/about_us.php" class="nav_select">
                            <svg
                                class="nav_icon"
                                width="30"
                                height="30"
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                d="M12 7V13M12 17H12.01M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12Z"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                            </svg>
                            <span class="nav_text">About Us</span>
                        </a>
                    </li>
                    <li>
                        <a href="../resident/contact_us.php" class="nav_select">
                            <svg
                                class="nav_icon"
                                width="30"
                                height="30"
                                viewBox="0 0 19 19"
                                fill="white"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                d="M10.7074 12.426C10.8623 12.4971 11.0368 12.5134 11.2021 12.4721C11.3675 12.4308 11.5139 12.3344 11.6171 12.1987L11.8834 11.85C12.0231 11.6637 12.2043 11.5125 12.4126 11.4084C12.6208 11.3042 12.8505 11.25 13.0834 11.25H15.3334C15.7312 11.25 16.1127 11.408 16.394 11.6893C16.6753 11.9706 16.8334 12.3522 16.8334 12.75V15C16.8334 15.3978 16.6753 15.7794 16.394 16.0607C16.1127 16.342 15.7312 16.5 15.3334 16.5C11.753 16.5 8.31917 15.0777 5.78743 12.5459C3.25569 10.0142 1.83337 6.58042 1.83337 3C1.83337 2.60218 1.99141 2.22064 2.27271 1.93934C2.55402 1.65804 2.93555 1.5 3.33337 1.5H5.58337C5.9812 1.5 6.36273 1.65804 6.64403 1.93934C6.92534 2.22064 7.08337 2.60218 7.08337 3V5.25C7.08337 5.48287 7.02916 5.71254 6.92501 5.92082C6.82087 6.1291 6.66967 6.31028 6.48337 6.45L6.13237 6.71325C5.99469 6.81838 5.89764 6.96794 5.85772 7.13651C5.8178 7.30509 5.83746 7.48228 5.91337 7.638C6.93838 9.7199 8.62419 11.4036 10.7074 12.426Z"
                                stroke="white"
                                stroke-width="1"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                            </svg>
                            <span class="nav_text">Contact Us</span>
                        </a>
                    </li>
                </div>
                <div>
                    <li>
                        <button id="signoutBtn" type="button" class="nav_select_btn">
                            <svg
                                class="nav_icon"
                                width="30"
                                height="30"
                                viewBox="0 0 25 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path
                                d="M16 17L21 12L16 7"
                                stroke="white"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                                <path
                                d="M21 12H9"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                            </svg>
                            <span class="nav_text">Logout</span>
                        </button>
                    </li>
                </div>
            </ul>
        </aside>

        <header>
            <div class="logo_container">
                <div class="head_space">
                    <img class="logo" src="../../img/logo-1.png">
                    <img class="logo" src="../../img/banwalogo.png">
                    <span class="company_name">BANWA</span>
                </div>
                <div class="user_profile">
                    <p class="username">Anne Palen</p>
                    <div class="user_image">
                        <img src="../../img/sample.png" alt="User Profile">
                    </div>
                    <div class="time_date" id="live_datetime"></div>
                </div>
            </div>
        </header>
        <main class="content">

        