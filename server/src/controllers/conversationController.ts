import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const getUserConversations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const currentUserId = req.user?.userId;

  if (!currentUserId) {
    return res.status(401).json({ error: "Identity profile unrecognized." });
  }

  try {
    const userConversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: currentUserId },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const formattedConversations = await Promise.all(
      userConversations.map(async (convo) => {
        let resolvedRoomName = convo.name;
        let isOnline = false;
        if (!convo.isGroup) {
          const otherParticipant = convo.members.find(
            (m) => m.userId !== currentUserId,
          );
          resolvedRoomName = otherParticipant
            ? otherParticipant.user.username
            : "Personal Space";
          isOnline = otherParticipant ? otherParticipant.user.isOnline : false;
        }

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: convo.id,
            NOT: { userId: currentUserId },
            status: { in: ["SENT", "DELIVERED"] },
          },
        });

        const lastMessageTime = convo.messages[0]
          ? convo.messages[0].createdAt
          : convo.createdAt;

        return {
          id: convo.id,
          isGroup: convo.isGroup,
          name: resolvedRoomName,
          isOnline: isOnline,
          unreadCount: unreadCount,
          lastMessageTime: lastMessageTime,
        };
      }),
    );

    formattedConversations.sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime(),
    );

    return res.json(formattedConversations);
  } catch (error) {
    console.error(
      "Database selection error mapping conversational streams:",
      error,
    );
    return res
      .status(500)
      .json({ error: "Failed to collect secure conversation rooms." });
  }
};
