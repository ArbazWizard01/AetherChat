import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { getOrSeedAetherBot } from "../lib/aiBot.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const getUserId = (req: AuthenticatedRequest): string | undefined => {
  const user = req.user as any;
  return user?.userId || user?.id || user?._id;
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const rawQuery = (req.query.q ||
      req.query.query ||
      req.query.search) as string;

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized session." });
    }

    const cleanQuery = rawQuery?.trim();
    if (!cleanQuery) {
      return res.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        NOT: { id: String(currentUserId) },
        OR: [
          { email: { contains: cleanQuery, mode: "insensitive" } },
          { username: { contains: cleanQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        isOnline: true,
      },
      take: 10,
    });

    return res.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Failed to search users." });
  }
};

export const sendRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = getUserId(req);
    const receiverId =
      req.body.receiverId || req.body.userId || req.body.targetUserId;

    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized session." });
    }

    if (!receiverId || String(senderId) === String(receiverId)) {
      return res.status(400).json({ error: "Invalid receiver target." });
    }

    const botId = await getOrSeedAetherBot();

    if (String(receiverId) === botId) {
      let conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: String(senderId) } } },
            { members: { some: { userId: botId } } },
          ],
        },
      });

      // If no room exists, create a direct conversation instantly
      if (!conversation) {
        conversation = await prisma.$transaction(async (tx) => {
          const newConv = await tx.conversation.create({
            data: { isGroup: false },
          });

          await tx.conversationMember.createMany({
            data: [
              { userId: String(senderId), conversationId: newConv.id },
              { userId: botId, conversationId: newConv.id },
            ],
          });

          return newConv;
        });
      }

      return res.status(200).json({
        message: "AetherBot added successfully!",
        conversationId: conversation.id,
        isBot: true,
      });
    }
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          { senderId: String(senderId), receiverId: String(receiverId) },
          { senderId: String(receiverId), receiverId: String(senderId) },
        ],
      },
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ error: "A contact request already exists or is pending." });
    }

    const request = await prisma.contactRequest.create({
      data: {
        senderId: String(senderId),
        receiverId: String(receiverId),
        status: "PENDING",
      },
    });

    return res.status(201).json({
      message: "Contact request sent successfully.",
      request,
    });
  } catch (error) {
    console.error("Error sending contact request:", error);
    return res.status(500).json({ error: "Failed to send contact request." });
  }
};

export const getPendingRequests = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized session." });
    }

    const targetUserId = String(userId);

    const [received, sent] = await Promise.all([
      prisma.contactRequest.findMany({
        where: { receiverId: targetUserId, status: "PENDING" },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              bio: true,
              isOnline: true,
            },
          },
        },
      }),
      prisma.contactRequest.findMany({
        where: { senderId: targetUserId, status: "PENDING" },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              bio: true,
              isOnline: true,
            },
          },
        },
      }),
    ]);

    const incoming = received.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      user: item.sender,
    }));

    const outgoing = sent.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      user: item.receiver,
    }));

    return res.json({ incoming, outgoing });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({ error: "Failed to load pending requests." });
  }
};

export const respondToRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const currentUserId = getUserId(req);
    const requestId = (req.body.requestId || req.params.requestId) as string;
    const action = req.body.action as "ACCEPT" | "DECLINE";

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized session." });
    }

    if (!requestId) {
      return res.status(400).json({ error: "Missing request ID." });
    }

    const contactReq = await prisma.contactRequest.findUnique({
      where: { id: String(requestId) },
    });

    if (!contactReq || contactReq.receiverId !== String(currentUserId)) {
      return res
        .status(404)
        .json({ error: "Request not found or unauthorized." });
    }

    if (action === "DECLINE") {
      await prisma.contactRequest.delete({
        where: { id: String(requestId) },
      });
      return res.json({ message: "Contact request declined." });
    }

    if (action === "ACCEPT") {
      const result = await prisma.$transaction(async (tx) => {
        const newConversation = await tx.conversation.create({
          data: { isGroup: false },
        });

        await tx.conversationMember.createMany({
          data: [
            {
              userId: contactReq.senderId,
              conversationId: newConversation.id,
            },
            {
              userId: contactReq.receiverId,
              conversationId: newConversation.id,
            },
          ],
        });

        await tx.contactRequest.delete({
          where: { id: String(requestId) },
        });

        return newConversation;
      });

      return res.status(200).json({
        message: "Request accepted and conversation created!",
        conversationId: result.id,
      });
    }

    return res.status(400).json({ error: "Invalid action type." });
  } catch (error) {
    console.error("Error responding to request:", error);
    return res.status(500).json({ error: "Failed to respond to request." });
  }
};
