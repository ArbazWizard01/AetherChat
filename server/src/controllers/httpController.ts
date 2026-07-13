import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { name, isGroup } = req.body;

    const creatorId = req.user?.userId;

    if (!creatorId) {
      return res
        .status(401)
        .json({ error: "User authentication identification missing." });
    }

    const newChat = await prisma.conversation.create({
      data: {
        name: isGroup ? name || "Unnamed Group" : null,
        isGroup: isGroup || false,
      },
    });

    await prisma.conversationMember.create({
      data: {
        userId: creatorId,
        conversationId: newChat.id,
        isAdmin: isGroup ? true : false,
      },
    });

    return res.status(201).json(newChat);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Failed to create conversation room." });
  }
};

export const addConversationMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { userId, conversationId } = req.body;
    const adminId = req.user?.userId;

    if (!adminId)
      return res.status(401).json({ error: "Unauthorized operation." });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    if (conversation.isGroup) {
      const requesterMembership = await prisma.conversationMember.findUnique({
        where: { userId_conversationId: { userId: adminId, conversationId } },
      });

      if (!requesterMembership || !requesterMembership.isAdmin) {
        return res.status(403).json({
          error: "Unauthorized: Only administrators can add members.",
        });
      }
    }

    const currentMemberCount = await prisma.conversationMember.count({
      where: { conversationId },
    });

    if (!conversation.isGroup && currentMemberCount >= 2) {
      return res
        .status(400)
        .json({ error: "Direct Messages are strictly limited to 2 members." });
    }

    if (conversation.isGroup && currentMemberCount >= 10) {
      return res
        .status(400)
        .json({ error: "Group chats are capped at 10 members max." });
    }

    const newMember = await prisma.conversationMember.create({
      data: { userId, conversationId },
    });

    return res.status(201).json(newMember);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "User might already be inside this chat room." });
  }
};

export const removeConversationMember = async (req: Request, res: Response) => {
  try {
    const { adminId, userIdToRemove, conversationId } = req.body;

    const adminCheck = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId: adminId, conversationId } },
    });

    if (!adminCheck || !adminCheck.isAdmin) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Only administrators can kick members." });
    }

    await prisma.conversationMember.delete({
      where: {
        userId_conversationId: { userId: userIdToRemove, conversationId },
      },
    });

    return res
      .status(200)
      .json({ message: "Member successfully removed from the conversation." });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to remove member. They might not be in this conversation.",
    });
  }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId, targetUserId, conversationId } = req.body;

    const adminCheck = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId: adminId, conversationId } },
    });

    if (!adminCheck || !adminCheck.isAdmin) {
      return res.status(403).json({
        error: "Unauthorized: Only admins can assign new administrative roles.",
      });
    }

    const updatedMember = await prisma.conversationMember.update({
      where: {
        userId_conversationId: { userId: targetUserId, conversationId },
      },
      data: { isAdmin: true },
    });

    return res.status(200).json(updatedMember);
  } catch (error) {
    return res.status(500).json({
      error: "Could not promote user. Ensure they are a member of this chat.",
    });
  }
};

export const getAllConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany();
    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ error: "Could not retrieve conversations." });
  }
};

export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { conversationId } = req.params;
  const currentUserId = req.user?.userId;

  if (!currentUserId || !conversationId) {
    return res
      .status(401)
      .json({ error: "Unauthorized session or missing parameters." });
  }

  const targetConversationId = String(conversationId);
  const targetUserId = String(currentUserId);

  try {
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: {
          userId: targetUserId,
          conversationId: targetConversationId,
        },
      },
    });

    if (!isMember) {
      return res
        .status(403)
        .json({
          error: "Access denied. You are not a member of this channel.",
        });
    }

    const messageLogs = await prisma.message.findMany({
      where: { conversationId: targetConversationId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json(messageLogs);
  } catch (error) {
    console.error("Failed to compile message timeline data:", error);
    return res
      .status(500)
      .json({ error: "Internal server error retrieving history logs." });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { conversationId, userId } = req.body;

    await prisma.message.updateMany({
      where: {
        conversationId,
        NOT: { userId },
        status: { not: "READ" },
      },
      data: { status: "READ" },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to update read status receipts." });
  }
};
