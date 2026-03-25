<?php

/**
 * Broadcasts an event to all connected Socket.io clients.
 * Call this after every DB change (create, update, delete).
 *
 * @param string $type  Event name (e.g. 'status_updated', 'application_created')
 * @param array  $data  Payload to send to clients
 */
function broadcastEvent(string $type, array $data = []): void
{
    $payload = json_encode(['type' => $type, 'data' => $data]);

    $ch = curl_init('http://localhost:8081/broadcast');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    curl_exec($ch);
    curl_close($ch);
}