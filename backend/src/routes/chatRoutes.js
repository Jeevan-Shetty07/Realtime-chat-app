import express from "express";
import { clerkProtect } from "../middleware/clerkMiddleware.js";
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

router.get("/", clerkProtect, getMyChats);
router.post("/", clerkProtect, accessChat);
router.get("/users", clerkProtect, getUsers);

// Group Chat Routes
router.route("/group").post(clerkProtect, createGroupChat);
router.route("/group/rename").put(clerkProtect, renameGroup);
router.route("/group/add").put(clerkProtect, addToGroup);
router.route("/group/remove").put(clerkProtect, removeFromGroup);

export default router;
