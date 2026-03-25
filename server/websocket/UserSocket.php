<?php

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class UserSocket implements MessageComponentInterface
{
    protected \SplObjectStorage $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        $this->clients->attach($conn);
        echo "[" . date('H:i:s') . "] Connected: {$conn->resourceId} | Total: {$this->clients->count()}\n";
    }

    public function onClose(ConnectionInterface $conn): void
    {
        $this->clients->detach($conn);
        echo "[" . date('H:i:s') . "] Disconnected: {$conn->resourceId} | Total: {$this->clients->count()}\n";
    }

    public function onMessage(ConnectionInterface $from, $msg): void
    {
        $data = json_decode($msg, true);

        if (json_last_error() !== JSON_ERROR_NONE || empty($data['type'])) {
            $from->send(json_encode(['type' => 'error', 'message' => 'Invalid payload']));
            return;
        }

        // Broadcast to all EXCEPT sender
        foreach ($this->clients as $client) {
            if ($client !== $from) {
                $client->send($msg);
            }
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e): void
    {
        echo "[ERROR] {$e->getMessage()}\n";
        $conn->close();
    }

    public function broadcast(array $data): void
    {
        $payload = json_encode($data);
        foreach ($this->clients as $client) {
            $client->send($payload);
        }
    }
}