<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Forgot Password — BANWA</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../../styles/auth/signin.css">
    <link rel="stylesheet" href="../../styles/auth/signup.css">
    <link rel="stylesheet" href="../../styles/auth/forgot_pass.css">
</head>

<body>
    <div class="container">
        <div class="left-panel">
            <div class="logo-circle">
                <img src="../../assets/img/banwalogo.png" alt="Barangay Blue Ridge B Logo">
            </div>
        </div>

        <div class="right-panel">
            <div class="forgot-card">
                <div class="panel-top">
                    <button class="back-btn" onclick="location.href='../auth/signin.php'" aria-label="Back">&#x2039;</button>
                </div>

                <h2 class="forgot-legend">Forgot Password</h2>
                <div class="forgot-text">Enter your number to receive OTP to reset your password</div>

                <form id="forgotForm" onsubmit="event.preventDefault(); document.getElementById('sendOtpBtn').innerText='SENT'; alert('OTP sent (demo)');">
                    <div class="number-input">
                        <div class="cc">+63</div>
                        <div style="flex:1">
                            <div class="input-with-icon">
                                <span class="input-icon">📱</span>
                                <input id="forgotNumber" type="tel" placeholder="Number" class="text-input">
                            </div>
                            <div class="err-msg" id="errMsg"></div>
                        </div>
                    </div>

                    <div style="margin-top:18px">
                        <button id="sendOtpBtn" class="next-btn" type="submit">SEND OTP</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
<script src="../../scripts/auth/forgot_pass.js"></script>

</html>
</body>

</html>