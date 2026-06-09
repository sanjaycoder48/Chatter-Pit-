import express from "express";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = Number(process.env.CHATTER_PIT_PORT || 3001);
const CLIENT_ORIGIN = process.env.CHATTER_PIT_CLIENT_ORIGIN || "*";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

const roomMessages = new Map();

function getPairRoom(userId, peerId) {
  return [userId, peerId].sort().join(":");
}

function getPeerFromRoom(room, userId) {
  return room.split(":").find((id) => id !== userId) || "";
}

function joinPair(socket, userId, peerId) {
  if (!userId || !peerId || userId === peerId) {
    socket.emit("chat:error", {
      message: "Enter a different Chatter Pit ID to start a chat.",
    });
    return;
  }

  const room = getPairRoom(userId, peerId);
  socket.join(room);
  socket.data.userId = userId;
  socket.data.activeRoom = room;

  const history = roomMessages.get(room) || [];
  socket.emit("chat:joined", { peerId, room, messages: history });
  socket.to(`user:${peerId}`).emit("chat:invite", { from: userId });
}

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.on("user:online", ({ userId }) => {
    if (!userId) return;

    socket.data.userId = userId;
    socket.join(`user:${userId}`);
  });

  socket.on("chat:join", ({ userId, peerId }) => {
    joinPair(socket, userId, peerId);
  });

  socket.on("chat:message", ({ userId, peerId, text }) => {
    const cleanText = String(text || "").trim();
    if (!userId || !peerId || !cleanText) return;

    const room = getPairRoom(userId, peerId);
    const message = {
      id: randomUUID(),
      sender: userId,
      peerId: getPeerFromRoom(room, userId),
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    const history = roomMessages.get(room) || [];
    history.push(message);
    roomMessages.set(room, history.slice(-100));

    io.to(room).emit("chat:message", message);
    socket.to(`user:${peerId}`).emit("chat:invite", { from: userId });
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Chatter Pit realtime server running on http://localhost:${PORT}`);
});
