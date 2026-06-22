import express from "express";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const PORT = Number(process.env.CHATTER_PIT_PORT || process.env.PORT || 3001);
const CLIENT_ORIGIN = process.env.CHATTER_PIT_CLIENT_ORIGIN || "*";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
  // Allow image attachments (sent as compressed data URLs) up to ~8 MB.
  maxHttpBufferSize: 8e6,
});

const roomMessages = new Map();
// Track which sockets belong to which user so calls can be routed and so the
// caller learns immediately when the person they dialled is offline.
const onlineUsers = new Map();
const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "..", "dist");
const indexPath = join(distPath, "index.html");

function getPairRoom(userId, peerId) {
  return [userId, peerId].sort().join(":");
}

function getPeerFromRoom(room, userId) {
  return room.split(":").find((id) => id !== userId) || "";
}

function isUserOnline(userId) {
  return (onlineUsers.get(userId)?.size || 0) > 0;
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

if (existsSync(indexPath)) {
  app.use(express.static(distPath));

  app.use((request, response, next) => {
    if (request.method !== "GET" || !request.accepts("html")) {
      next();
      return;
    }

    response.sendFile(indexPath);
  });
}

io.on("connection", (socket) => {
  socket.on("user:online", ({ userId }) => {
    if (!userId) return;

    socket.data.userId = userId;
    socket.join(`user:${userId}`);

    const sockets = onlineUsers.get(userId) || new Set();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);
  });

  socket.on("chat:join", ({ userId, peerId }) => {
    joinPair(socket, userId, peerId);
  });

  socket.on("chat:message", ({ userId, peerId, text, image }) => {
    const cleanText = String(text || "").trim();
    const cleanImage =
      typeof image === "string" && image.startsWith("data:image/")
        ? image
        : "";

    if (!userId || !peerId || (!cleanText && !cleanImage)) return;

    const room = getPairRoom(userId, peerId);
    const message = {
      id: randomUUID(),
      sender: userId,
      peerId: getPeerFromRoom(room, userId),
      text: cleanText,
      image: cleanImage,
      createdAt: new Date().toISOString(),
    };

    const history = roomMessages.get(room) || [];
    history.push(message);
    roomMessages.set(room, history.slice(-100));

    io.to(room).emit("chat:message", message);
    socket.to(`user:${peerId}`).emit("chat:invite", { from: userId });
  });

  // ---- WebRTC call signaling -------------------------------------------------
  // The server is a blind relay: it forwards SDP offers/answers and ICE
  // candidates to the target user's room and never inspects the media.

  socket.on("call:offer", ({ to, from, callType, sdp }) => {
    if (!to || !from || !sdp) return;

    if (!isUserOnline(to)) {
      socket.emit("call:unavailable", { to });
      return;
    }

    socket.to(`user:${to}`).emit("call:offer", {
      from,
      callType: callType === "video" ? "video" : "audio",
      sdp,
    });
  });

  socket.on("call:answer", ({ to, from, sdp }) => {
    if (!to || !sdp) return;
    socket.to(`user:${to}`).emit("call:answer", { from, sdp });
  });

  socket.on("call:candidate", ({ to, from, candidate }) => {
    if (!to || !candidate) return;
    socket.to(`user:${to}`).emit("call:candidate", { from, candidate });
  });

  socket.on("call:reject", ({ to, from }) => {
    if (!to) return;
    socket.to(`user:${to}`).emit("call:reject", { from });
  });

  socket.on("call:end", ({ to, from }) => {
    if (!to) return;
    socket.to(`user:${to}`).emit("call:end", { from });
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (!userId) return;

    const sockets = onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socket.id);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Chatter Pit realtime server running on http://localhost:${PORT}`);
});
