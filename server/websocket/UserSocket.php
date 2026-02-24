<?php

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class UserSocket implements MessageComponentInterface
{

    protected $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        echo "New connection: {$conn->resourceId}\n";
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        echo "Connection closed\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        // Broadcast to everyone
        foreach ($this->clients as $client) {
            $client->send($msg);
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "Error: {$e->getMessage()}\n";
        $conn->close();
    }

    public function broadcast($data)
    {
        foreach ($this->clients as $client) {
            $client->send(json_encode($data));
        }
    }
}
