<?php
// ===============================
// Database Connection Diagnostic
// ===============================

// Configuration
$host = 'localhost';
$db   = 'capstone';
$user = 'postgres';
$pass = '080702';
$port = '5432';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
