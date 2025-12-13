<?php
session_start();
session_unset();
session_destroy();
header("Location: /Banwa/client/pages/auth/signin.php");
exit;