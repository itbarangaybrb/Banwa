<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
  <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">
  <title>BANWA Login</title>
  <!-- <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&display=swap" rel="stylesheet"> -->
  <link rel="stylesheet" href="../../styles/auth/signin.css">
</head>

<body>
  <section class="sections">
    <div class="containers login-container">
      <form class="form" id="login">
        <div class="header-and-parag">
          <img src="../../img/banwalogo.png" alt="Barangay Blue Ridge B Logo">
          <h4>Sign in to BBRB</h4>
          <!-- <p>Log in to access your account.</p> -->
        </div>

        <div id="formMessage" class="form-message"></div>

        <div class="inputs-container">
          <div class="label-and-input">
            <label for="email">Email</label>
            <input type="email" id="email" name="email">
            <div class="error-msg"></div>
          </div>
          <div class="label-and-input">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" autocomplete="false">
            <div class="error-msg"></div>
          </div>
          <a href="../auth/forgot_pass.php">Forgot password?</a>
        </div>

        <div class="buttons-container">
          <button type="submit" id="submit" class="login-btn">Log in</button>
          <!-- <div class="divider"></div> -->
          <p>Don’t have an account yet? <a href="./signup.php" class="forgot-link">Register now</a></p>
        </div>
      </form>
    </div>
  </section>

  <!-- <div class="container">
    <div class="left-panel">
      <div class="logo-circle">
        <img src="../../img/banwalogo.png" alt="Barangay Blue Ridge B Logo">
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

        <div id="formMessage" class="form-message"></div>

        <div>
          <label for="email">Email</label>
          <input type="email" id="email" name="email">
          <div class="error-msg"></div>
        </div>

        <div>
          <label for="password">Password</label>
          <input type="password" id="password" name="password" autocomplete="false">
          <div class="error-msg"></div>
        </div>
        <a href="../auth/forgot_pass.php" class="forgot-link">Forgot password?</a>
        <button type="submit" id="submit" class="login-btn">Login</button>
      </form>
    </div>
  </div> -->
  <script type="module" src="../../scripts/auth/signin.js"></script>
</body>

</html>