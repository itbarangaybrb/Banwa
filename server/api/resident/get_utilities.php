<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../configs/database.php';

try {
    $stmt = $pdo->prepare("SELECT * FROM utility_doc ORDER BY id DESC");
    $stmt->execute();
    $utilities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $utilities]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
