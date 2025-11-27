<?php
// ===============================
// Database Connection Diagnostic
// ===============================

// Configuration
$host = 'localhost';
$db   = 'capstone';
$user = 'postgres';
$pass = '$Xz_11182025';
$port = '5432';

if (!extension_loaded('pdo_pgsql')) {
    ob_clean(); // Clear any previous junk
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled. Check php.ini."]));
}

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
