const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: 'https://banwa.onrender.com', // lock this down in production to your domain
        methods: ['GET', 'POST']
    }
});

app.use(express.json());

// PHP calls this endpoint after every DB change
app.post('/broadcast', (req, res) => {
    const { type, data } = req.body;

    if (!type) {
        return res.status(400).json({ error: 'Missing type' });
    }

    io.emit(type, { type, ...data });
    console.log(`[${new Date().toLocaleTimeString()}] Broadcasted: ${type}`);
    res.json({ success: true });
});

io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.onAny((event, data) => {
        if (event === 'message') return;
        socket.broadcast.emit(event, { type: event, ...data });
    });

    socket.on('message', (msg) => {
        if (!msg?.type) return;
        socket.broadcast.emit(msg.type, msg);
    });

    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 8081;
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});