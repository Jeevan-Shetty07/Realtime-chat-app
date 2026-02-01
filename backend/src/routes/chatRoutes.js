import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  accessChat,
  getMyChats,
  getUsers,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", protect, getMyChats);
router.post("/", protect, accessChat);
router.get("/users", protect, getUsers);

// Group Chat Routes
router.route("/group").post(protect, createGroupChat);
router.route("/group/rename").put(protect, renameGroup);
router.route("/group/add").put(protect, addToGroup);
router.route("/group/remove").put(protect, removeFromGroup);

export default router;
