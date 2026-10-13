import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import {
  createConversation,
  updateGroupDetails,
  addConversationMember,
  removeConversationMember,
  promoteToAdmin,
  getGroupDetails,
  leaveGroup,
  getUserConversations,
  markAsRead,
  deleteConversation,
} from "../controllers/groupController.js";
import { getPeerDetails } from "../controllers/conversationController.js";
import {
  getConversationMessages,
  deleteMessage,
  editMessage,
} from "../controllers/messageController.js";
import {
  searchUsers,
  sendRequest,
  getPendingRequests,
  respondToRequest,
} from "../controllers/contactController.js";

const router = Router();

// Authentication & User Profile Routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", authenticateJWT, getMe);
router.patch("/users/profile", authenticateJWT, updateProfile);

// Contact & Search Routes
router.get("/contacts/search", authenticateJWT, searchUsers);
router.get("/contacts/pending", authenticateJWT, getPendingRequests);
router.post("/contacts/requests/send", authenticateJWT, sendRequest);
router.post("/contacts/requests/respond", authenticateJWT, respondToRequest);

// Base Conversation Routes
router.post("/conversations", authenticateJWT, createConversation);
router.get("/conversations", authenticateJWT, getUserConversations);
router.get(
  "/conversations/:conversationId/peer",
  authenticateJWT,
  getPeerDetails,
);
router.delete(
  "/conversations/:conversationId",
  authenticateJWT,
  deleteConversation,
);

// Group Details & Management Sub-resources
router.get(
  "/conversations/:conversationId/group",
  authenticateJWT,
  getGroupDetails,
);
router.patch(
  "/conversations/:conversationId/group",
  authenticateJWT,
  updateGroupDetails,
);

// Conversation Membership Sub-resources
router.post(
  "/conversations/:conversationId/members",
  authenticateJWT,
  addConversationMember,
);
router.delete(
  "/conversations/:conversationId/members/kick",
  authenticateJWT,
  removeConversationMember,
);
router.patch(
  "/conversations/:conversationId/members/promote",
  authenticateJWT,
  promoteToAdmin,
);
router.post(
  "/conversations/:conversationId/leave",
  authenticateJWT,
  leaveGroup,
);

// Message & Sync Routes
router.get(
  "/conversations/:conversationId/messages",
  authenticateJWT,
  getConversationMessages,
);
router.patch(
  "/conversations/:conversationId/read",
  authenticateJWT,
  markAsRead,
);
router.patch("/messages/:messageId", authenticateJWT, editMessage);
router.delete("/messages/:messageId", authenticateJWT, deleteMessage);

export default router;
