const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors()); // Allow frontend connections

// ✅ Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ Serve index.html on root request
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('set username', (username) => {
        users[socket.id] = username;
        io.emit('user update', Object.values(users));
    });

    socket.on('chat message', (data) => {
        if (!users[socket.id]) return;
        io.emit('chat message', { username: users[socket.id], message: data.message, timestamp: new Date().toLocaleTimeString() });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            socket.broadcast.emit('chat message', { username: "System", message: `${users[socket.id]} left the chat!`, system: true });
            delete users[socket.id];
            io.emit('user update', Object.values(users));
        }
    });
});

// ✅ Use `0.0.0.0` to allow access from any device on the network
server.listen(3000, '172.20.10.7', () => {
    console.log('Server running on http://172.20.10.7:3000');
});
