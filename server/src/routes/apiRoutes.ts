import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import {
  createConversation,
  addConversationMember,
  removeConversationMember,
  promoteToAdmin,
  getAllConversations,
  getConversationMessages,
  markAsRead,
} from "../controllers/httpController.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);

router.post("/conversations", authenticateJWT, createConversation);
router.post("/conversations/members", authenticateJWT, addConversationMember);
router.patch("/conversations/promote", authenticateJWT, promoteToAdmin);
router.delete("/conversations/kick", authenticateJWT, removeConversationMember);
router.get("/conversations", authenticateJWT, getAllConversations);
router.get(
  "/conversations/:conversationId/messages",
  authenticateJWT,
  getConversationMessages,
);
router.patch("/messages/read", authenticateJWT, markAsRead);

export default router;
