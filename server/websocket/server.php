<?php
require dirname(__DIR__, 2) . '/vendor/autoload.php';
require 'UserSocket.php';

use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new UserSocket()
        )
    ),
    8081
);

echo "WebSocket server started on port 8081\n";
$server->run();
