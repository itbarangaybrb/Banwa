<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Reset Password</title>
  <link rel="stylesheet" href="../../styles/auth/signup.css">
  <link rel="stylesheet" href="../../styles/auth/reset_pass.css">
</head>

<body>
  <div class="container">
    <div class="left-panel">
      <div class="logo-circle">
        <img src="../../img/banwalogo.png" alt="logo">
      </div>
    </div>
    <div class="right-panel">

      <div style="max-width:520px;margin:38px auto 0;">
        <h1 class="welcome-header" style="font-size:28px;color:#0b3a82">Reset Password</h1>
        <div class="reset-help">Password is 8-16 characters long and must contain both letters and numbers.</div>

        <form id="resetForm" style="margin-top:18px">
          <div>
            <label for="newPassword">New Password</label>
            <input id="newPassword" name="newPassword" type="password" placeholder="New Password">
            <div class="err-msg" id="errMsgNew"></div>
          </div>
          <div>
            <label for="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm Password">
            <div class="err-msg" id="errMsgConfirm"></div>
          </div>
          <div style="margin-top:20px">
            <button type="submit" class="next-btn">SUBMIT</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script src="../../scripts/auth/reset_pass.js"></script>
</body>

</html>