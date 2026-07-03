import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import apiRoutes from "./routes/apiRoutes.js";
import { prisma } from "./lib/prisma.js";
import {
  handleMessage,
  handleDisconnect,
} from "./controllers/chatController.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";
const app = express();
app.use(express.json());
app.use("/api", apiRoutes);

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", async (socket: WebSocket, req) => {
  try {
    const requestUrl = new URL(req.url || "", `http://${req.headers.host}`);
    const token = requestUrl.searchParams.get("token");

    if (!token) {
      console.log(
        "❌ Connection Blocked: Missing token in WebSocket connection request.",
      );
      socket.send(
        JSON.stringify({ error: "Authentication token parameter required." }),
      );
      socket.close(4001);
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as unknown as {
      userId: string;
      username: string;
    };

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isOnline: true },
    });
    console.log(`🟢 Live Status: [${decoded.username}] has come ONLINE.`);

    (socket as any).userId = decoded.userId;
    (socket as any).username = decoded.username;

    socket.on("message", (rawData) => handleMessage(socket, wss, rawData));

    socket.on("close", async () => {
      console.log(`🔴 Live Status: [${decoded.username}] dropped connection.`);
      try {
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { isOnline: false, lastSeen: new Date() },
        });
      } catch (dbErr) {
        console.error("Failed to update status on connection drop:", dbErr);
      }
      handleDisconnect(socket, wss);
    });
  } catch (error) {
    console.log(
      "❌ Connection Terminated: Invalid WebSocket authentication handshake token.",
    );
    socket.send(
      JSON.stringify({ error: "Invalid or expired token credentials." }),
    );
    socket.close(4003);
  }
});

server.listen(8080, () => {
  console.log("Complete Secure Real-time Backend online on port 8080");
});
