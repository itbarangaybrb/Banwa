<?php
require_once __DIR__ . '/../../configs/database.php';
require_once __DIR__ . '/../../api/shared/insert_audit_logs.php';

try {
    $stmt = $pdo->prepare("
        SELECT * FROM users 
        WHERE status = 'suspended' 
          AND suspended_until != '1970-01-01 00:00:00'
          AND suspended_until <= NOW()
    ");
    $stmt->execute();
    $expiredUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($expiredUsers)) {
        echo "No expired suspensions.\n";
        exit;
    }

    foreach ($expiredUsers as $user) {
        $uid = $user['user_id'];

        $update = $pdo->prepare("
            UPDATE users 
            SET status = 'active', 
                suspend_reason = '', 
                reason_details = '', 
                suspended_until = '1970-01-01 00:00:00'
            WHERE user_id = ?
        ");
        $update->execute([$uid]);

        writeAuditLog($pdo, 'AUTO_UNSUSPEND', 'users', $uid, $user, null, 'SYSTEM');

        echo "Unsuspended user_id: {$uid}\n";
    }

    echo "Done.\n";

    // Broadcast users_update via WebSocket
    $wsHost = 'ws';
    $wsPort = 8081;

    $client = stream_socket_client("tcp://{$wsHost}:{$wsPort}", $errno, $errstr, 5);
    if ($client) {
        $key = base64_encode(random_bytes(16));
        $handshake = "GET / HTTP/1.1\r\n"
            . "Host: {$wsHost}:{$wsPort}\r\n"
            . "Upgrade: websocket\r\n"
            . "Connection: Upgrade\r\n"
            . "Sec-WebSocket-Key: {$key}\r\n"
            . "Sec-WebSocket-Version: 13\r\n\r\n";

        fwrite($client, $handshake);
        fread($client, 1500);

        $payload = json_encode(['type' => 'users_update']);
        $len = strlen($payload);
        $frame = chr(0x81) . chr($len) . $payload;
        fwrite($client, $frame);

        fclose($client);
        echo "Broadcasted users_update\n";
    } else {
        echo "Could not connect to WebSocket: {$errstr}\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}