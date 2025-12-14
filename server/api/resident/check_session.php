<?php
session_start();
if(!isset($_SESSION['user_id']) || !isset($_SESSION['supabase_user_id'])){
    header("Location: /Banwa/client/pages/auth/signin.php");
    exit;
}
?>