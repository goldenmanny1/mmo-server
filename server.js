const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// Create app FIRST
const app = express();
app.use(cors());

// Test route (so browser shows it works)
app.get("/", (req, res) => {
  res.send("MMO server is running");
});

// Create HTTP server
const server = http.createServer(app);

// Socket.IO server with CORS enabled
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store players in memory
const players = {};

// Socket logic
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

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
    console.log("Player disconnected:", socket.id);

    if (players[socket.id]) {
      const room = players[socket.id].room;
      delete players[socket.id];

      io.to(room).emit("players_update", players);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
