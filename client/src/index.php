<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  header("Location: /Banwa/client/src/pages/auth/signin.php");
  exit;
}
?>


