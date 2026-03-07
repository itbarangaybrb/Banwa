<?php
require_once __DIR__ . '/../../vendor/autoload.php';

// Check if the file actually exists to debug the path
$envPath = __DIR__ . '/../../';
$envFile = $envPath . '.env';

if (!file_exists($envFile)) {
    die("ERROR: .env file not found at: " . realpath($envPath));
}

$dotenv = Dotenv\Dotenv::createImmutable($envPath);
$dotenv->safeLoad();

// Configuration - Define these FIRST
$host = $_ENV['DB_HOST'] ?? 'host.docker.internal'; 
$db   = $_ENV['DB_NAME'] ?? 'capstone';
$user = $_ENV['DB_USER'] ?? 'postgres';
$pass = $_ENV['DB_PASS'] ?? '';
$port = $_ENV['DB_PORT'] ?? '5432';

if (!extension_loaded('pdo_pgsql')) {
    ob_clean(); // Clear any previous junk
    die(json_encode(["status" => "error", "message" => "PostgreSQL Driver (pdo_pgsql) is NOT enabled. Check php.ini."]));
}

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $e->getMessage()]));
}
