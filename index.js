const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

server.listen(3000);
const rooms = {};

app.use(
    cors({
        origin: "*",
    })
);
const connections = {};



app.get("/api/reg", function (request, response) {
    const uid = uuidv4();

    response.json({ uid });
});
app.get("/api/create-room", function (request, response) {
    const id = uuidv4();
    rooms[id] = {
        players: {},
        history: [],
    };
    response.json({ roomId: id });
});
app.get("/api/rooms", function (request, response) {
    response.json(Object.keys(rooms));
});

app.get("/api/history", function ({ query: { room } }, response) {
    response.json(
        rooms && rooms[room] && rooms[room].history ? rooms[room].history : []
    );
});

app.use(express.static('static'))

app.get("/", function (request, response) {
    response.sendFile(__dirname + "/static/index.html");
});

io.sockets.on("connection", function (socket) {
    console.log("Успешное соединение", socket.handshake.query.roomId);
    const id = uuidv4();

    connections[id] = socket;
    const roomId =
        socket.handshake &&
        socket.handshake.query &&
        socket.handshake.query.roomId;

    if (roomId && uid) {
        socket.join(roomId);
    }

    socket.on("disconnect", function (data) {
        delete connections[id];
        console.log("Отключились");
    });

    socket.on("push-history", function (roomid, data) {
        if (rooms[roomid] && rooms[roomid].history) {
            rooms[roomid].history.push(data);
            socket.broadcast.to(roomId).emit("make-action", data);
        } else {
            return;
        }
    });
});
