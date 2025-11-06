<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Forgot Password — Verify</title>
    <!-- reuse signup styles so layout and OTP look match exactly -->
    <link rel="stylesheet" href="../../styles/auth/signup.css">
  </head>
  <body>
    <div class="container">
      <div class="left-panel">
        <div class="logo-circle">
          <img src="../../assets/img/banwalogo.png" alt="logo">
        </div>
      </div>
      <div class="right-panel">
        <div class="top-buttons">
            <button type="button" class="back-btn" aria-label="Back" onclick="location.href='../auth/forgot_pass.php'">&#x2039;</button>
            <a class="top-pill" href="../auth/signin.php">Login</a>
            <a class="top-pill active" href="signupform.html">Sign Up</a>
        </div>


        <div id="verificationPanel" class="panel visible" style="margin-top:14px;">
          <div class="panel-top">
            <div>
              <div class="verify-heading">Verification Code</div>
              <div class="verify-sub">We have sent the verification code to your mobile number</div>
            </div>
          </div>

          <div class="code-inputs" id="codeInputs">
            <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
            <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
            <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
            <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
            <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
            <div class="code-input"><input inputmode="numeric" pattern="[0-9]*" maxlength="1" /></div>
          </div>

          <div class="muted-small">Didn't receive it? <a id="resendLink" href="#">Resend</a></div>

          <div style="margin-top:16px">
            <button id="confirmBtn" class="next-btn" disabled>Confirm</button>
          </div>
        </div>
      </div>
    </div>

    <script src="../../scripts/auth/fotgot_pass_verification.js"></script>
  </body>
</html>
