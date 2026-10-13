import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const getUserId = (req: AuthenticatedRequest): string | undefined => {
  const user = req.user as any;
  return user?.userId || user?.id || user?._id;
};

export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const currentUserId = getUserId(req);
  const conversationId = (req.params.conversationId ||
    req.body.conversationId) as string;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limit =
    typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 20;

  if (!currentUserId) {
    return res.status(401).json({ error: "Identity profile unrecognized." });
  }

  if (!conversationId) {
    return res
      .status(400)
      .json({ error: "Conversation ID parameter is required." });
  }

  try {
    const membership = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: {
          userId: String(currentUserId),
          conversationId: String(conversationId),
        },
      },
    });

    if (!membership) {
      return res
        .status(403)
        .json({ error: "Access denied to conversation history." });
    }

    const fetchedMessages = await prisma.message.findMany({
      where: { conversationId: String(conversationId) },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    let hasMore = false;
    let nextCursor: string | null = null;

    if (fetchedMessages.length > limit) {
      hasMore = true;
      const extraItem = fetchedMessages.pop();
      nextCursor = extraItem?.id || null;
    }

    const formattedMessages = fetchedMessages.reverse().map((msg) => ({
      id: msg.id,
      userId: msg.userId,
      user: msg.user.username,
      avatarUrl: msg.user.avatarUrl,
      text: msg.text,
      status: msg.status,
      timeStamp: msg.createdAt,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            user: msg.replyTo.user.username,
            text: msg.replyTo.text,
          }
        : null,
    }));

    return res.json({
      messages: formattedMessages,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Database error retrieving message timeline:", error);
    return res
      .status(500)
      .json({ error: "Failed to load paginated conversation timeline." });
  }
};

export const deleteMessage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const rawMessageId = req.params.messageId || req.body.messageId;
    const userId = getUserId(req);

    if (!userId || !rawMessageId) {
      return res
        .status(401)
        .json({ error: "Unauthorized session or missing message ID." });
    }

    const messageId = String(rawMessageId);

    const messageItem = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!messageItem) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (messageItem.userId !== String(userId)) {
      return res.status(403).json({
        error: "Unauthorized: You can only delete your own messages.",
      });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return res
      .status(500)
      .json({ error: "Internal server error deleting message." });
  }
};

export const editMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawMessageId = req.params.messageId || req.body.messageId;
    const userId = getUserId(req);
    const { text } = req.body;

    if (!userId || !rawMessageId) {
      return res
        .status(401)
        .json({ error: "Unauthorized session or missing message ID." });
    }

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ error: "Message content cannot be empty." });
    }

    const messageId = String(rawMessageId);

    const messageItem = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!messageItem) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (messageItem.userId !== String(userId)) {
      return res.status(403).json({
        error: "Unauthorized: You can only edit your own messages.",
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: text.trim(),
      },
    });

    return res.status(200).json({
      message: "Message updated successfully.",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Failed to edit message:", error);
    return res
      .status(500)
      .json({ error: "Internal server error editing message." });
  }
};
