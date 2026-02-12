import express from "express";
import { unifiedProtect } from "../middleware/clerkMiddleware.js";
import {
  getMessages,
  markAsSeen,
  sendMessage,
  addReaction,
  clearChat,
  deleteMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/:chatId", unifiedProtect, getMessages);
router.post("/", unifiedProtect, sendMessage);
router.put("/seen/:chatId", unifiedProtect, markAsSeen);
router.put("/reaction/:messageId", unifiedProtect, addReaction);
router.delete("/:chatId/clear", unifiedProtect, clearChat);
router.delete("/:messageId", unifiedProtect, deleteMessage);

export default router;
