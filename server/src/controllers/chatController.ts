import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "../lib/prisma.js";
import type { ActiveConnections, IncomingEvent } from "../types/chat.js";

const phonebook: ActiveConnections = new Map();

export async function handleMessage(
  socket: WebSocket,
  wss: WebSocketServer,
  rawData: any,
) {
  try {
    const event = JSON.parse(rawData.toString()) as IncomingEvent;
    const { conversationId } = event.payload;

    const userId = (socket as any).userId;
    const username = (socket as any).username;

    if (!userId || !username) {
      socket.send(
        JSON.stringify({ error: "Unauthorized session connection context." }),
      );
      return;
    }

    if (
      !phonebook.has(socket) ||
      phonebook.get(socket)?.conversationId !== conversationId
    ) {
      const membership = await prisma.conversationMember.findUnique({
        where: {
          userId_conversationId: { userId, conversationId },
        },
      });

      if (!membership) {
        console.log(
          `❌ Access Denied: User [${username}] tried to target room [${conversationId}] without membership.`,
        );
        socket.send(
          JSON.stringify({
            type: "SECURITY_ALERT",
            payload: {
              text: "You must be a member of this conversation room to send messages.",
            },
          }),
        );
        return;
      }

      phonebook.set(socket, { userId, username, conversationId });
      console.log(
        `📌 Room Entrance: [${username}] checked into conversation room [${conversationId}].`,
      );

      await prisma.message.updateMany({
        where: {
          conversationId,
          NOT: { userId },
          status: { in: ["SENT", "DELIVERED"] },
        },
        data: { status: "READ" },
      });

      broadcastToRoom(
        wss,
        conversationId,
        JSON.stringify({
          type: "MESSAGES_READ",
          payload: { conversationId },
        }),
      );

      broadcastOnlineUsers(wss, conversationId);
    }

    const cachedUser = phonebook.get(socket)!;

    switch (event.type) {
      case "JOIN_ROOM": {
        console.log(
          `🔄 Session Sync: [${cachedUser.username}] is now actively listening to stream [${conversationId}].`,
        );
        await prisma.message.updateMany({
          where: {
            conversationId,
            NOT: { userId },
            status: { in: ["SENT", "DELIVERED"] },
          },
          data: { status: "READ" },
        });

        broadcastToRoom(
          wss,
          conversationId,
          JSON.stringify({
            type: "MESSAGES_READ",
            payload: { conversationId },
          }),
        );
        break;
      }

      case "SEND_MESSAGE": {
        const { text } = event.payload;
        console.log(
          `[Message][Room: ${conversationId}] ${cachedUser.username}: ${text}`,
        );

        const roomMembers = await prisma.conversationMember.findMany({
          where: { conversationId },
        });
        const peerIds = roomMembers
          .filter((m) => m.userId !== userId)
          .map((m) => m.userId);

        const currentActiveSessions = Array.from(phonebook.values());

        const activePeersInRoom = currentActiveSessions.filter(
          (s) =>
            s.conversationId === conversationId && peerIds.includes(s.userId),
        );

        const activePeersGlobally = currentActiveSessions.filter((s) =>
          peerIds.includes(s.userId),
        );

        let computedStatus: "SENT" | "DELIVERED" | "READ" = "SENT";

        if (activePeersInRoom.length > 0) {
          computedStatus = "READ";
        } else if (activePeersGlobally.length > 0) {
          computedStatus = "DELIVERED";
        }

        const savedMessage = await prisma.message.create({
          data: {
            text,
            userId,
            conversationId,
            status: computedStatus,
          },
        });

        const outboundPayload = JSON.stringify({
          type: "NEW_MESSAGE",
          payload: {
            id: savedMessage.id,
            user: cachedUser.username,
            text: savedMessage.text,
            status: savedMessage.status,
            timeStamp: savedMessage.createdAt,
          },
        });

        broadcastToRoom(wss, conversationId, outboundPayload);
        socket.send(outboundPayload);
        break;
      }

      case "TYPING_START": {
        const outboundPayload = JSON.stringify({
          type: "USER_TYPING_START",
          payload: { username: cachedUser.username },
        });
        broadcastToRoom(wss, conversationId, outboundPayload, socket);
        break;
      }

      case "TYPING_STOP": {
        const outboundPayload = JSON.stringify({
          type: "USER_TYPING_STOP",
          payload: { username: cachedUser.username },
        });
        broadcastToRoom(wss, conversationId, outboundPayload, socket);
        break;
      }
    }
  } catch (error) {
    console.error("Error processing event in controller:", error);
    socket.send(
      JSON.stringify({
        error: "Internal server error parsing message pipeline.",
      }),
    );
  }
}

function broadcastOnlineUsers(wss: WebSocketServer, conversationId: string) {
  const onlineUsernames: string[] = [];

  for (const session of phonebook.values()) {
    if (session.conversationId === conversationId) {
      onlineUsernames.push(session.username);
    }
  }

  const outboundPayload = JSON.stringify({
    type: "ONLINE_USERS",
    payload: { users: onlineUsernames },
  });

  broadcastToRoom(wss, conversationId, outboundPayload);
}

function broadcastToRoom(
  wss: WebSocketServer,
  conversationId: string,
  payload: string,
  senderSocket?: WebSocket,
) {
  wss.clients.forEach((client) => {
    const clientSession = phonebook.get(client);
    if (
      client.readyState === client.OPEN &&
      clientSession?.conversationId === conversationId &&
      client !== senderSocket
    ) {
      client.send(payload);
    }
  });
}

export function handleDisconnect(socket: WebSocket, wss: WebSocketServer) {
  const session = phonebook.get(socket);
  if (session) {
    console.log(`👋 ${session.username} left the chat stream.`);
    const targetRoom = session.conversationId;
    phonebook.delete(socket);

    const systemPayload = JSON.stringify({
      type: "SYSTEM_ALERT",
      payload: { text: `${session.username} has left the chat` },
    });

    broadcastToRoom(wss, targetRoom, systemPayload);
    broadcastOnlineUsers(wss, targetRoom);
  }
}
