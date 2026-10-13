import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { broadcastToRoom } from "./chatController.js";

const getUserId = (req: AuthenticatedRequest): string | undefined => {
  const user = req.user as any;
  return user?.userId || user?.id || user?._id;
};

export const createSystemMessage = async (
  conversationId: string,
  userId: string,
  text: string,
  req?: AuthenticatedRequest,
) => {
  try {
    const sysMsg = await prisma.message.create({
      data: {
        conversationId,
        userId,
        text,
        isSystem: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.conversation
      .update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })
      .catch((err) => console.error("Failed updating group timestamp:", err));

    const wss = req?.app?.get("wss");

    if (wss) {
      const outboundPayload = JSON.stringify({
        type: "NEW_MESSAGE",
        payload: {
          id: sysMsg.id,
          userId: sysMsg.userId,
          user: sysMsg.user?.username || "System",
          conversationId: sysMsg.conversationId,
          text: sysMsg.text,
          status: sysMsg.status,
          timeStamp: sysMsg.createdAt,
          createdAt: sysMsg.createdAt,
          isSystem: true,
          type: "SYSTEM",
        },
      });

      broadcastToRoom(wss, conversationId, outboundPayload);
    }

    return sysMsg;
  } catch (err) {
    console.error("Error creating system message:", err);
  }
};

export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { name, description, isGroup, memberIds } = req.body;
    const creatorId = getUserId(req);

    if (!creatorId) {
      return res
        .status(401)
        .json({ error: "User authentication identification missing." });
    }

    const creatorUser = await prisma.user.findUnique({
      where: { id: String(creatorId) },
    });

    if (!creatorUser) {
      return res
        .status(401)
        .json({ error: "Authenticated user record not found in database." });
    }

    let rawMemberIds: any[] = [];
    if (typeof memberIds === "string") {
      try {
        rawMemberIds = JSON.parse(memberIds);
      } catch {
        rawMemberIds = [memberIds];
      }
    } else if (Array.isArray(memberIds)) {
      rawMemberIds = memberIds;
    }

    const extractedIdentifiers = rawMemberIds
      .map((m) => {
        if (typeof m === "string" || typeof m === "number") return String(m);
        return m?.id || m?.userId || m?.value || m?.username || m?._id;
      })
      .filter(Boolean)
      .map(String);

    const candidates = Array.from(
      new Set([...extractedIdentifiers, String(creatorId)]),
    );

    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [{ id: { in: candidates } }, { username: { in: candidates } }],
      },
      select: { id: true },
    });

    const validUserIds = Array.from(
      new Set([...existingUsers.map((u) => String(u.id)), String(creatorId)]),
    );

    const isGroupBool = isGroup !== undefined ? Boolean(isGroup) : true;
    const groupName =
      isGroupBool && name ? name.trim() : isGroupBool ? "Unnamed Group" : null;

    const newChat = await prisma.conversation.create({
      data: {
        name: groupName,
        description:
          description && description.trim() ? description.trim() : null,
        isGroup: isGroupBool,
        members: {
          create: validUserIds.map((userId) => ({
            userId,
            isAdmin: isGroupBool && userId === String(creatorId),
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });

    if (isGroupBool) {
      await createSystemMessage(
        newChat.id,
        String(creatorId),
        `${creatorUser.username || "Admin"} created group "${newChat.name}"`,
        req,
      );
    }

    const peerMember = newChat.members.find(
      (m: any) => String(m.userId) !== String(creatorId),
    );
    const peer = peerMember?.user;

    const formattedChat = {
      ...newChat,
      name: isGroupBool
        ? newChat.name
        : peer?.username || newChat.name || "Chat Partner",
      avatarUrl: isGroupBool ? (newChat as any).avatarUrl : peer?.avatarUrl,
      peer: peer || null,
      isOnline: isGroupBool ? false : Boolean(peer?.isOnline),
      lastMessageText: null,
      lastMessageTime: newChat.createdAt,
      unreadCount: 0,
    };

    return res.status(201).json(formattedChat);
  } catch (error: any) {
    console.error("🔥 Detailed Prisma error creating conversation:", error);
    return res.status(500).json({
      error: error?.message || "Failed to create conversation room.",
    });
  }
};

export const updateGroupDetails = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const currentUserId = getUserId(req);
  const conversationId = (req.params.conversationId ||
    req.params.id ||
    req.body.conversationId) as string;
  const { name, description, avatarUrl } = req.body;

  if (!currentUserId) {
    return res.status(401).json({ error: "Unauthorized session." });
  }

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is missing." });
  }

  try {
    const adminCheck = await prisma.conversationMember.findFirst({
      where: {
        userId: String(currentUserId),
        conversationId: String(conversationId),
      },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!adminCheck || !adminCheck.isAdmin) {
      return res.status(403).json({
        error: "Unauthorized: Only administrators can update group details.",
      });
    }

    const currentGroup = await prisma.conversation.findUnique({
      where: { id: String(conversationId) },
    });

    if (!currentGroup) {
      return res.status(404).json({ error: "Group not found." });
    }

    const updateData: Record<string, any> = {};
    const changes: string[] = [];
    const updaterName = adminCheck.user?.username || "Admin";

    if (
      typeof name === "string" &&
      name.trim() &&
      name.trim() !== currentGroup.name
    ) {
      updateData.name = name.trim();
      changes.push(`changed group name to "${name.trim()}"`);
    }
    if (
      typeof description === "string" &&
      description.trim() !== currentGroup.description
    ) {
      updateData.description = description.trim();
      changes.push(`updated the group description`);
    }
    if (
      typeof avatarUrl === "string" &&
      avatarUrl.trim() !== (currentGroup as any).avatarUrl
    ) {
      updateData.avatarUrl = avatarUrl.trim();
      changes.push(`changed the group icon`);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json(currentGroup);
    }

    const updatedGroup = await prisma.conversation.update({
      where: { id: String(conversationId) },
      data: updateData,
    });

    const systemMsgText = `${updaterName} ${changes.join(", ")}`;
    await createSystemMessage(
      String(conversationId),
      String(currentUserId),
      systemMsgText,
      req,
    );

    return res.status(200).json(updatedGroup);
  } catch (error: any) {
    console.error("🔥 Error updating group details:", error);
    return res.status(500).json({
      error: error?.message || "Failed to update group details.",
    });
  }
};

export const addConversationMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const conversationId = (req.params.conversationId ||
      req.body.conversationId) as string;
    const targetUserId = req.body.targetUserId || req.body.userId;
    const adminId = getUserId(req);

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized operation." });
    }

    if (!conversationId || !targetUserId) {
      return res
        .status(400)
        .json({ error: "Missing conversationId or userId." });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    let adminUser: { username: string | null } | null = null;
    if (conversation.isGroup) {
      const requesterMembership = await prisma.conversationMember.findUnique({
        where: {
          userId_conversationId: { userId: String(adminId), conversationId },
        },
        include: { user: { select: { username: true } } },
      });

      if (!requesterMembership || !requesterMembership.isAdmin) {
        return res.status(403).json({
          error: "Unauthorized: Only administrators can add members.",
        });
      }
      adminUser = requesterMembership.user;
    }

    const currentMemberCount = await prisma.conversationMember.count({
      where: { conversationId },
    });

    if (!conversation.isGroup && currentMemberCount >= 2) {
      return res
        .status(400)
        .json({ error: "Direct Messages are strictly limited to 2 members." });
    }

    const newMember = await prisma.conversationMember.create({
      data: { userId: String(targetUserId), conversationId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            isOnline: true,
          },
        },
      },
    });

    if (conversation.isGroup) {
      const addedUsername = newMember.user?.username || "A new member";
      const adminUsername = adminUser?.username || "Admin";
      await createSystemMessage(
        conversationId,
        String(adminId),
        `${adminUsername} added ${addedUsername}`,
        req,
      );
    }

    return res.status(201).json(newMember);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "User might already be inside this chat room." });
  }
};

export const removeConversationMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const adminId = getUserId(req);
    const conversationId = (req.params.conversationId ||
      req.body.conversationId) as string;
    const targetUserId =
      req.body.targetUserId || req.body.userIdToRemove || req.body.userId;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized operation." });
    }

    if (!conversationId || !targetUserId) {
      return res
        .status(400)
        .json({ error: "Missing conversationId or target user." });
    }

    const adminCheck = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: { userId: String(adminId), conversationId },
      },
      include: { user: { select: { username: true } } },
    });

    if (!adminCheck || !adminCheck.isAdmin) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Only administrators can kick members." });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: String(targetUserId) },
      select: { username: true },
    });

    await prisma.conversationMember.delete({
      where: {
        userId_conversationId: { userId: String(targetUserId), conversationId },
      },
    });

    const adminUsername = adminCheck.user?.username || "Admin";
    const removedUsername = targetUser?.username || "a member";
    await createSystemMessage(
      conversationId,
      String(adminId),
      `${adminUsername} removed ${removedUsername}`,
      req,
    );

    return res
      .status(200)
      .json({ message: "Member successfully removed from the conversation." });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to remove member. They might not be in this conversation.",
    });
  }
};

export const promoteToAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const adminId = getUserId(req);
    const conversationId = (req.params.conversationId ||
      req.body.conversationId) as string;
    const targetUserId = req.body.targetUserId || req.body.userId;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized operation." });
    }

    if (!conversationId || !targetUserId) {
      return res
        .status(400)
        .json({ error: "Missing conversationId or target user." });
    }

    const adminCheck = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: { userId: String(adminId), conversationId },
      },
      include: { user: { select: { username: true } } },
    });

    if (!adminCheck || !adminCheck.isAdmin) {
      return res.status(403).json({
        error: "Unauthorized: Only admins can assign new administrative roles.",
      });
    }

    const updatedMember = await prisma.conversationMember.update({
      where: {
        userId_conversationId: { userId: String(targetUserId), conversationId },
      },
      data: { isAdmin: true },
      include: { user: { select: { username: true } } },
    });

    const adminUsername = adminCheck.user?.username || "Admin";
    const promotedUsername = updatedMember.user?.username || "a member";
    await createSystemMessage(
      conversationId,
      String(adminId),
      `${adminUsername} promoted ${promotedUsername} to group admin`,
      req,
    );

    return res.status(200).json(updatedMember);
  } catch (error) {
    return res.status(500).json({
      error: "Could not promote user. Ensure they are a member of this chat.",
    });
  }
};

export const getGroupDetails = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const conversationId = (req.params.conversationId ||
      req.body.conversationId) as string;
    const userId = getUserId(req);

    if (!userId || !conversationId) {
      return res
        .status(400)
        .json({ error: "Missing required parameters or unauthenticated." });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Group conversation not found" });
    }

    if (!conversation.isGroup) {
      return res
        .status(400)
        .json({ error: "This conversation is not a group" });
    }

    const convAny = conversation as any;
    const currentMember = conversation.members.find(
      (m) => String(m.userId) === String(userId),
    );
    const amIAdmin = Boolean(currentMember?.isAdmin);

    const adminMember = conversation.members.find((m) => m.isAdmin);
    const adminId = adminMember ? String(adminMember.userId) : undefined;

    const members = conversation.members.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      isOnline: Boolean(m.user.isOnline),
      isAdmin: Boolean(m.isAdmin),
    }));

    return res.status(200).json({
      group: {
        id: conversation.id,
        name: conversation.name || "Group Chat",
        description: convAny.description || "",
        avatarUrl: convAny.avatarUrl || "",
        adminId,
        amIAdmin,
        members,
      },
    });
  } catch (error) {
    console.error("Error in getGroupDetails:", error);
    return res
      .status(500)
      .json({ error: "Internal server error fetching group details" });
  }
};

export const leaveGroup = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = getUserId(req);
  const conversationId = (req.params.conversationId ||
    req.body.conversationId) as string;

  if (!currentUserId) {
    return res.status(401).json({ error: "Unauthorized session." });
  }

  if (!conversationId) {
    return res.status(400).json({ error: "Missing conversation ID." });
  }

  try {
    const member = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: {
          userId: String(currentUserId),
          conversationId,
        },
      },
      include: { user: { select: { username: true } } },
    });

    if (!member) {
      return res
        .status(400)
        .json({ error: "You are not a member of this group." });
    }

    await prisma.conversationMember.delete({
      where: {
        userId_conversationId: {
          userId: String(currentUserId),
          conversationId,
        },
      },
    });

    const username = member.user?.username || "A member";
    await createSystemMessage(
      conversationId,
      String(currentUserId),
      `${username} left the group`,
      req,
    );

    return res.status(200).json({ message: "Left group successfully." });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({ error: "Failed to leave group." });
  }
};

export const getUserConversations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const currentUserId = getUserId(req);

  if (!currentUserId) {
    return res.status(401).json({ error: "Unauthorized session." });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: String(currentUserId),
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const peerMember = conv.members.find(
          (m: any) => String(m.userId) !== String(currentUserId),
        );
        const peer = peerMember?.user;
        const lastMsg = conv.messages?.[0];

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            userId: { not: String(currentUserId) },
            status: { not: "READ" },
          },
        });

        return {
          ...conv,
          name: conv.isGroup
            ? conv.name
            : peer?.username || conv.name || "Chat Partner",
          avatarUrl: conv.isGroup ? conv.avatarUrl : peer?.avatarUrl,
          peer: peer || null,
          isOnline: conv.isGroup ? false : Boolean(peer?.isOnline),
          lastMessageText: lastMsg
            ? lastMsg.text || lastMsg.content || ""
            : null,
          lastMessageTime: lastMsg ? lastMsg.createdAt : conv.updatedAt,
          unreadCount,
        };
      }),
    );

    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Failed to fetch user conversations:", error);
    return res
      .status(500)
      .json({ error: "Could not retrieve user conversations." });
  }
};

export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const conversationId = (req.params.conversationId ||
    req.body.conversationId) as string;
  const currentUserId = getUserId(req);

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
      return res.status(403).json({
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
        replyTo: {
          select: {
            id: true,
            text: true,
            user: { select: { username: true } },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedMessages = messageLogs.map((msg: any) => ({
      ...msg,
      isSystem: Boolean(msg.isSystem),
      type: msg.isSystem ? "SYSTEM" : "USER",
    }));

    return res.json(formattedMessages);
  } catch (error) {
    console.error("Failed to compile message timeline data:", error);
    return res
      .status(500)
      .json({ error: "Internal server error retrieving history logs." });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversationId = (req.params.conversationId ||
      req.body.conversationId) as string;
    const userId = getUserId(req) || req.body.userId;

    if (!userId || !conversationId || conversationId === "undefined") {
      return res
        .status(400)
        .json({ error: "Missing valid conversationId or userId." });
    }

    await prisma.message.updateMany({
      where: {
        conversationId: String(conversationId),
        NOT: { userId: String(userId) },
        status: { not: "READ" },
      },
      data: { status: "READ" },
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("🔥 Error marking messages as read:", error);
    return res.status(500).json({
      error: error?.message || "Failed to update read status receipts.",
    });
  }
};

export const deleteConversation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const rawConversationId =
      req.params.conversationId || req.body.conversationId;
    const userId = getUserId(req);

    if (!userId || !rawConversationId) {
      return res
        .status(401)
        .json({ error: "Unauthorized session or missing conversation ID." });
    }

    const conversationId = String(rawConversationId);
    const targetUserId = String(userId);

    const membership = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: {
          userId: targetUserId,
          conversationId: conversationId,
        },
      },
    });

    if (!membership) {
      return res
        .status(403)
        .json({ error: "Access denied. You are not a member of this chat." });
    }

    await prisma.message.deleteMany({
      where: { conversationId },
    });

    await prisma.conversationMember.deleteMany({
      where: { conversationId },
    });

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return res
      .status(200)
      .json({ message: "Conversation deleted successfully." });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return res
      .status(500)
      .json({ error: "Internal server error deleting conversation." });
  }
};
