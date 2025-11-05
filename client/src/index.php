<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  header("Location: /client/src/pages/auth/signin.php");
  exit;
}
?>


