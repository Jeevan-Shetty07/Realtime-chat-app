import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { accessChat, getMyChats, getUsers } from "../controllers/chatController.js";

const router = express.Router();

router.get("/", protect, getMyChats);
router.post("/", protect, accessChat);
router.get("/users", protect, getUsers);

export default router;
