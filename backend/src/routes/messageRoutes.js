import express from "express";
import { clerkProtect } from "../middleware/clerkMiddleware.js";
import {
  getMessages,
  markAsSeen,
  sendMessage,
  addReaction,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/:chatId", clerkProtect, getMessages);
router.post("/", clerkProtect, sendMessage);
router.put("/seen/:chatId", clerkProtect, markAsSeen);
router.put("/reaction/:messageId", clerkProtect, addReaction);

export default router;
