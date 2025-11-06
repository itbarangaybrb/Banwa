<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BANWA Login</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../styles/auth/signin.css">
</head>
<body>
  <div class="container">
    <div class="left-panel">
      <div class="logo-circle">
  <img src="../../assets/img/banwalogo.png" alt="Barangay Blue Ridge B Logo">
      </div>
    </div>
    <div class="right-panel">
      <div class="top-buttons">
        <button type="button" onclick="location.href='./signup.php'">Sign Up</button>
        <button class="active">Login</button>
      </div>

      <h2 class="welcome-header">Welcome to BANWA</h2>
      <div class="sub-header">Login to your Account</div>

      <form class="login-form" id="login">
        <div>
          <label for="username">Username</label>
          <input type="text" id="username" name="username" >
          <div class="err-msg" id="errMsg"></div>
        </div>

        <div>
          <label for="password">Password</label>
          <input type="password" id="password" name="password" >
          <div class="err-msg" id="errMsg"></div>
        </div>
        <a href="../auth/forgot_pass.php" class="forgot-link">Forgot password?</a>
        <button type="submit" id="submit" class="login-btn">Login</button>
      </form>
    </div>
  </div>
</body>
<script type="module" src="../../scripts/auth/signin.js"></script>
</html>