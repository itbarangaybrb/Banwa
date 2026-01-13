<?php
// server/api/resident/submit_incident.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    $baseDir = dirname(__DIR__, 2); 
    $dbPath = $baseDir . '/configs/database.php'; 
    $sessionPath = $baseDir . '/api/shared/check_session.php';

    if (!file_exists($dbPath)) throw new Exception("Database config not found.");
    require_once $dbPath;
    require_once $sessionPath;

    if (!isset($pdo)) throw new Exception("Database connection variable \$pdo is missing.");

    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (!$data) throw new Exception("No valid data received.");

    $sql = "INSERT INTO incident_reports (
        rp_full_name, rp_address, rp_contact, rp_relationship,
        vic_full_name, vic_address, vic_contact, vic_citizenship, vic_gender, vic_dob, vic_occupation,
        sus_full_name, sus_address, sus_contact, sus_gender, sus_description,
        incident_type, incident_timestamp, description, witness_data_json,
        date_reported
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $pdo->prepare($sql);
    
    // Using ?? "Not Specified" to ensure the DB gets the string even if the key is missing
    $stmt->execute([
        $data['rp_full_name'] ?? "Not Specified", 
        $data['rp_address'] ?? "Not Specified", 
        $data['rp_contact'] ?? "Not Specified", 
        $data['rp_relationship'] ?? "Not Specified",
        
        $data['vic_full_name'] ?? "Not Specified", 
        $data['vic_address'] ?? "Not Specified", 
        $data['vic_contact'] ?? "Not Specified", 
        $data['vic_citizenship'] ?? "Not Specified", 
        $data['vic_gender'] ?? "Not Specified", 
        $data['vic_dob'] ?? null, // Keep null for Date types
        $data['vic_occupation'] ?? "Not Specified",

        $data['sus_full_name'] ?? "Not Specified", 
        $data['sus_address'] ?? "Not Specified", 
        $data['sus_contact'] ?? "Not Specified", 
        $data['sus_gender'] ?? "Not Specified", 
        $data['sus_description'] ?? "Not Specified",

        $data['incident_type'] ?? "Not Specified", 
        $data['incident_timestamp'] ?? null, 
        $data['description'] ?? "Not Specified", 
        $data['witness_data_json'] ?? '[]'
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Report stored with defaults.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}