<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 2) {
	header("Location: /Banwa/client/pages/auth/signin.php");
	exit;
}
?>