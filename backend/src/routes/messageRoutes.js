import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMessages,
  markAsSeen,
  sendMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/:chatId", protect, getMessages);
router.post("/", protect, sendMessage);
router.put("/seen/:chatId", protect, markAsSeen);

export default router;
