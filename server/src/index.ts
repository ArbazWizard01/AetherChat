import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";
import { prisma } from "./lib/prisma.js";
import {
  handleMessage,
  handleDisconnect,
} from "./controllers/chatController.js";


export interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  username?: string;
  isAlive?: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/api", apiRoutes);

const server = createServer(app);
const wss = new WebSocketServer({ server });

// MUST attach wss to app so API controllers can access req.app.get("wss")
app.set("wss", wss);

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const socket = ws as AuthenticatedSocket;
    if (socket.isAlive === false) return socket.terminate();
    socket.isAlive = false;
    socket.ping();
  });
}, 30000);

wss.on("close", () => clearInterval(heartbeatInterval));

wss.on("connection", async (ws: WebSocket, req) => {
  const socket = ws as AuthenticatedSocket;
  socket.isAlive = true;

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  try {
    const requestUrl = new URL(req.url || "", `http://${req.headers.host}`);
    const token = requestUrl.searchParams.get("token");

    if (!token) {
      socket.send(JSON.stringify({ error: "Authentication token required." }));
      socket.close(4001);
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      username: string;
    };

    const targetUserId = decoded.userId || decoded.id;

    if (!targetUserId) {
      socket.send(JSON.stringify({ error: "Invalid token payload." }));
      socket.close(4003);
      return;
    }

    socket.userId = targetUserId;
    socket.username = decoded.username;

    await prisma.user
      .update({
        where: { id: targetUserId },
        data: { isOnline: true },
      })
      .catch((err) => console.error("Presence update failed:", err));

    socket.on("message", (rawData) => handleMessage(socket, wss, rawData));

    socket.on("close", async () => {
      const remainingSockets = Array.from(wss.clients).filter((client) => {
        const activeSocket = client as AuthenticatedSocket;
        return (
          activeSocket.userId === targetUserId &&
          activeSocket.readyState === WebSocket.OPEN
        );
      });

      if (remainingSockets.length === 0) {
        await prisma.user
          .update({
            where: { id: targetUserId },
            data: { isOnline: false, lastSeen: new Date() },
          })
          .catch((err) =>
            console.error("Disconnect presence update failed:", err),
          );
      }

      handleDisconnect(socket, wss);
    });
  } catch (error) {
    console.error("Handshake error:", error);
    socket.close(4003);
  }
});

server.listen(8080, () => {
  console.log("🚀 Server running on port 8080");
});
