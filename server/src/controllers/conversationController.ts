import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const getPeerDetails = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const currentUserId = req.user?.userId;

  if (!currentUserId) {
    return res.status(401).json({ error: "Identity profile unrecognized." });
  }

  const conversationId = req.params.conversationId as string;

  try {
    const peerMember = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        NOT: { userId: currentUserId },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            bio: true,
            githubUrl: true,
            linkedinUrl: true,
            websiteUrl: true,
            instagramUrl: true,
          },
        },
      },
    });

    if (!peerMember || !(peerMember as any).user) {
      return res.status(404).json({ error: "Peer profile details not found." });
    }

    const userData = (peerMember as any).user;

    return res.json({
      ...userData,
      peer: userData,
    });
  } catch (error) {
    console.error("Error retrieving peer details:", error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve peer profile details." });
  }
};

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
      userConversations.map(async (convo: any) => {
        let resolvedRoomName = convo.name;
        let isOnline = false;
        let peerData = null;

        if (!convo.isGroup) {
          const otherParticipant = convo.members.find(
            (m: any) => m.userId !== currentUserId,
          ) as any;

          if (otherParticipant && otherParticipant.user) {
            resolvedRoomName = otherParticipant.user.username;
            isOnline = Boolean(otherParticipant.user.isOnline);
            peerData = {
              id: otherParticipant.user.id,
              username: otherParticipant.user.username,
              email: otherParticipant.user.email,
              avatarUrl: otherParticipant.user.avatarUrl,
              bio: otherParticipant.user.bio,
              githubUrl: otherParticipant.user.githubUrl,
              linkedinUrl: otherParticipant.user.linkedinUrl,
              websiteUrl: otherParticipant.user.websiteUrl,
              instagramUrl: otherParticipant.user.instagramUrl,
            };
          } else {
            resolvedRoomName = "Personal Space";
          }
        }

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: convo.id,
            NOT: { userId: currentUserId },
            status: { in: ["SENT", "DELIVERED"] },
          },
        });

        const lastMessageObj = convo.messages[0];
        const lastMessageTime = lastMessageObj
          ? lastMessageObj.createdAt
          : convo.createdAt;
        const lastMessageText = lastMessageObj
          ? lastMessageObj.text || (lastMessageObj as any).content
          : "No messages yet";

        return {
          id: convo.id,
          isGroup: convo.isGroup,
          name: resolvedRoomName,
          isOnline: isOnline,
          unreadCount: unreadCount,
          lastMessageTime: lastMessageTime,
          lastMessageText: lastMessageText,
          peer: peerData,
        };
      }),
    );

    formattedConversations.sort(
      (a: any, b: any) =>
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
