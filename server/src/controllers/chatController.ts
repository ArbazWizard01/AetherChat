import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "../lib/prisma.js";
import type { ActiveConnections, IncomingEvent } from "../types/chat.js";
import { getOrSeedAetherBot, AETHER_BOT_USERNAME } from "../lib/aiBot.js";
import { generateAetherResponse } from "../services/aiService.js";

export interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  username?: string;
}

const phonebook: ActiveConnections = new Map();

export async function handleMessage(
  socket: AuthenticatedSocket,
  wss: WebSocketServer,
  rawData: any,
) {
  try {
    const event = JSON.parse(rawData.toString()) as IncomingEvent;
    const { conversationId } = event.payload;

    const userId = socket.userId;
    const username = socket.username;

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
          payload: { conversationId, userId },
        }),
      );

      broadcastOnlineUsers(wss, conversationId);
    }

    const cachedUser = phonebook.get(socket)!;

    switch (event.type) {
      case "JOIN_ROOM": {
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
            payload: { conversationId, userId },
          }),
        );
        break;
      }

      case "SEND_MESSAGE": {
        const { text, replyTo } = event.payload;
        const clientMsgId = (event.payload as any).clientMsgId;

        const roomMembers = await prisma.conversationMember.findMany({
          where: { conversationId },
        });

        const peerIds = roomMembers
          .filter((m: any) => m.userId !== userId)
          .map((m: any) => m.userId);

        const peerIdsSet = new Set(peerIds);
        const currentActiveSessions = Array.from(phonebook.values());

        const activePeersInRoom = currentActiveSessions.filter(
          (s) =>
            s.conversationId === conversationId && peerIdsSet.has(s.userId),
        );

        const activePeersGlobally = currentActiveSessions.filter((s) =>
          peerIdsSet.has(s.userId),
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
            replyToId: replyTo?.id || null,
          },
          include: {
            replyTo: {
              select: {
                id: true,
                text: true,
                userId: true,
                user: { select: { username: true } },
              },
            },
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        const outboundPayload = JSON.stringify({
          type: "NEW_MESSAGE",
          payload: {
            id: savedMessage.id,
            clientMsgId: clientMsgId || null,
            userId: savedMessage.userId,
            user: cachedUser.username,
            conversationId: savedMessage.conversationId,
            text: savedMessage.text,
            status: savedMessage.status,
            timeStamp: savedMessage.createdAt,
            isSystem: false,
            replyTo: savedMessage.replyTo
              ? {
                  id: savedMessage.replyTo.id,
                  user: savedMessage.replyTo.user.username,
                  text: savedMessage.replyTo.text,
                }
              : null,
          },
        });

        broadcastToRoom(wss, conversationId, outboundPayload, socket);
        socket.send(outboundPayload);

        handleAiTrigger({
          conversationId,
          text,
          userMessageId: savedMessage.id,
          senderUserId: userId,
          ...(savedMessage.replyTo?.userId
            ? { replyToUserId: savedMessage.replyTo.userId }
            : {}),
          wss,
        });

        break;
      }

      case "TYPING_START": {
        const outboundPayload = JSON.stringify({
          type: "USER_TYPING",
          payload: {
            conversationId,
            userId: cachedUser.userId,
            username: cachedUser.username,
          },
        });
        broadcastToRoom(wss, conversationId, outboundPayload, socket);
        break;
      }

      case "TYPING_STOP": {
        const outboundPayload = JSON.stringify({
          type: "USER_STOPPED_TYPING",
          payload: {
            conversationId,
            userId: cachedUser.userId,
            username: cachedUser.username,
          },
        });
        broadcastToRoom(wss, conversationId, outboundPayload, socket);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Error processing websocket message:", err);
  }
}

async function handleAiTrigger(params: {
  conversationId: string;
  text: string;
  userMessageId: string;
  senderUserId: string;
  replyToUserId?: string;
  wss: WebSocketServer;
}) {
  const {
    conversationId,
    text,
    userMessageId,
    senderUserId,
    replyToUserId,
    wss,
  } = params;

  let botId: string | null = null;

  try {
    botId = await getOrSeedAetherBot();

    if (senderUserId === botId) return;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: { select: { userId: true } } },
    });

    if (!conversation) return;

    const isDirectBotDm =
      !conversation.isGroup &&
      conversation.members.some((m) => m.userId === botId);

    const hasMention = text.toLowerCase().includes("@aetherbot");

    const isReplyToBot = replyToUserId === botId;

    if (isDirectBotDm || hasMention || isReplyToBot) {
      broadcastToRoom(
        wss,
        conversationId,
        JSON.stringify({
          type: "USER_TYPING",
          payload: {
            conversationId,
            userId: botId,
            username: AETHER_BOT_USERNAME,
          },
        }),
      );

      const aiText = await generateAetherResponse(conversationId, text);

      const botMessage = await prisma.message.create({
        data: {
          text: aiText,
          userId: botId,
          conversationId,
          status: "READ",
          replyToId: userMessageId,
        },
        include: {
          user: { select: { username: true } },
          replyTo: {
            select: {
              id: true,
              text: true,
              user: { select: { username: true } },
            },
          },
        },
      });

      broadcastToRoom(
        wss,
        conversationId,
        JSON.stringify({
          type: "USER_STOPPED_TYPING",
          payload: {
            conversationId,
            userId: botId,
            username: AETHER_BOT_USERNAME,
          },
        }),
      );

      const botOutboundPayload = JSON.stringify({
        type: "NEW_MESSAGE",
        payload: {
          id: botMessage.id,
          userId: botMessage.userId,
          user: AETHER_BOT_USERNAME,
          conversationId: botMessage.conversationId,
          text: botMessage.text,
          status: botMessage.status,
          timeStamp: botMessage.createdAt,
          isSystem: false,
          replyTo: botMessage.replyTo
            ? {
                id: botMessage.replyTo.id,
                user: botMessage.replyTo.user.username,
                text: botMessage.replyTo.text,
              }
            : null,
        },
      });

      for (const [clientSocket, session] of phonebook.entries()) {
        if (
          clientSocket.readyState === WebSocket.OPEN &&
          session.conversationId === conversationId
        ) {
          clientSocket.send(botOutboundPayload);
        }
      }
    }
  } catch (error) {
    console.error("Failed to generate AetherBot reply:", error);

    if (botId) {
      broadcastToRoom(
        wss,
        conversationId,
        JSON.stringify({
          type: "USER_STOPPED_TYPING",
          payload: {
            conversationId,
            userId: botId,
            username: AETHER_BOT_USERNAME,
          },
        }),
      );

      broadcastToRoom(
        wss,
        conversationId,
        JSON.stringify({
          type: "NEW_MESSAGE",
          payload: {
            id: `err-${Date.now()}`,
            userId: botId,
            user: AETHER_BOT_USERNAME,
            conversationId,
            text: "Sorry, I'm having trouble connecting to my AI brain right now. Please try again in a moment!",
            status: "READ",
            timeStamp: new Date(),
            isSystem: true,
          },
        }),
      );
    }
  }
}

export function broadcastToRoom(
  wss: WebSocketServer,
  conversationId: string,
  message: string,
  senderSocket?: WebSocket,
) {
  for (const [clientSocket, session] of phonebook.entries()) {
    if (
      clientSocket !== senderSocket &&
      clientSocket.readyState === WebSocket.OPEN &&
      session.conversationId === conversationId
    ) {
      clientSocket.send(message);
    }
  }
}

export function broadcastOnlineUsers(
  wss: WebSocketServer,
  conversationId: string,
) {
  const activeUsernamesInRoom = Array.from(phonebook.values())
    .filter((session) => session.conversationId === conversationId)
    .map((session) => session.username);

  const payload = JSON.stringify({
    type: "ONLINE_USERS",
    payload: { users: Array.from(new Set(activeUsernamesInRoom)) },
  });

  for (const [clientSocket, session] of phonebook.entries()) {
    if (
      clientSocket.readyState === WebSocket.OPEN &&
      session.conversationId === conversationId
    ) {
      clientSocket.send(payload);
    }
  }
}

export function handleDisconnect(socket: WebSocket, wss: WebSocketServer) {
  const session = phonebook.get(socket);
  if (session) {
    const { conversationId } = session;
    phonebook.delete(socket);
    broadcastOnlineUsers(wss, conversationId);
  }
}
