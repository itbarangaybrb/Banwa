<?php
require_once __DIR__ . '/../../../server/api/shared/check_session.php';

if ($_SESSION['role_id'] != 2) {
	header("Location: /Banwa/client/pages/auth/signin.php");
	exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>
		<?php echo htmlspecialchars($pageTitle); ?>
	</title>

	<link rel="stylesheet" href="../../layouts/superadmin_layout/main.css">
	<link rel="stylesheet" href="../../styles/superadmin/manage_users.css">
</head>

<body>
	<header class="header">
		<h1>
			<?php echo htmlspecialchars($pageTitle); ?>
		</h1>
	</header>