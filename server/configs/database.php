<?php
// DSN (Data Source Name) for PostgreSQL
// Replace 'your_host', 'your_db', and 'your_port' with your actual database credentials.
// The default PostgreSQL port is 5432. The user's log showed 5430.
$dsn = "pgsql:host=localhost;dbname=capstone;port=5432";

// Database username
// Replace 'your_user' with your database username.
$user = "postgres";

// Database password
// Replace 'your_password' with your database password.
$password = "080702";

// PDO options
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch associative arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Use real prepared statements
];

try {
    // Create a new PDO instance
    $pdo = new PDO($dsn, $user, $password, $options);
} catch (PDOException $e) {
    // If the connection fails, stop the script and show an error.
    // In a production environment, you would log this error instead of showing it.
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
    exit;
}