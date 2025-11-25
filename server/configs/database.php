<?php
// ===============================
// Database Connection Diagnostic
// ===============================

// Configuration
$host = 'localhost';
$dbname   = 'capstone';
$username = 'postgres';
$password = '$Xz_11182025';
$port = '5432';

try {
    $conn = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>