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

header('Content-Type: text/plain');

if (!extension_loaded('pdo')) {
    die("CRITICAL ERROR: PHP PDO extension is not enabled.\n");
}

if (!extension_loaded('pdo_pgsql')) {
    die("CRITICAL ERROR: PDO PostgreSQL driver (pdo_pgsql) is not enabled.\n" .
        "ACTION: Open php.ini, uncomment ';extension=pdo_pgsql', and restart your server.\n");
}

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    echo "Error Message: " . $e->getMessage() . "\n";

    if (strpos($e->getMessage(), 'password authentication failed') !== false) {
        echo "\n--> DIAGNOSIS: Incorrect password. Verify your credentials.\n";
    } elseif (strpos($e->getMessage(), 'database "' . $db . '" does not exist') !== false) {
        echo "\n--> DIAGNOSIS: Database '$db' does not exist. Create it in pgAdmin or via SQL.\n";
    } elseif (strpos($e->getMessage(), 'Connection refused') !== false) {
        echo "\n--> DIAGNOSIS: PostgreSQL service may not be running or is not accessible on port $port.\n";
    }
}
