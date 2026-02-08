import express from "express";
import { unifiedProtect } from "../middleware/clerkMiddleware.js";
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

router.get("/", unifiedProtect, getMyChats);
router.post("/", unifiedProtect, accessChat);
router.get("/users", unifiedProtect, getUsers);

// Group Chat Routes
router.route("/group").post(unifiedProtect, createGroupChat);
router.route("/group/rename").put(unifiedProtect, renameGroup);
router.route("/group/add").put(unifiedProtect, addToGroup);
router.route("/group/remove").put(unifiedProtect, removeFromGroup);

export default router;
