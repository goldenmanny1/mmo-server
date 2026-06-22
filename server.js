const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const players = {};

io.on("connection", (socket) => {
  socket.on("join_room", ({ room, username }) => {
    socket.join(room);

    players[socket.id] = { id: socket.id, username, room, x: 0, y: 0 };

    io.to(room).emit("players_update", players);
  });

  socket.on("move", (data) => {
    const p = players[socket.id];
    if (!p) return;

    p.x = data.x;
    p.y = data.y;

    io.to(p.room).emit("players_update", players);
  });

  socket.on("chat", (msg) => {
    const p = players[socket.id];
    if (!p) return;

    io.to(p.room).emit("chat", {
      user: p.username,
      message: msg
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players_update", players);
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
