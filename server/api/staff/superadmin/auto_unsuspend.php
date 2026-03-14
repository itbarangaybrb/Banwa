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
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}