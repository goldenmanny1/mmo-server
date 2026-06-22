const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// 1. Create app FIRST (this was your bug)
const app = express();
app.use(cors());

// 2. Safe test route
app.get("/", (req, res) => {
  res.send("MMO server is running");
});

// 3. Create server
const server = http.createServer(app);

// 4. Socket setup
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const players = {};

// 5. Multiplayer logic
io.on("connection", (socket) => {
  socket.on("join_room", ({ room, username }) => {
    socket.join(room);

    players[socket.id] = {
      id: socket.id,
      username,
      room,
      x: 0,
      y: 0
    };

    io.to(room).emit("players_update", players);
  });

  socket.on("move", (data) => {
    if (!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].y = data.y;

    io.to(players[socket.id].room).emit("players_update", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players_update", players);
  });
});

// 6. Start server LAST
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
