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
  deleteGroup,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", unifiedProtect, getMyChats);
router.post("/", unifiedProtect, accessChat);
router.get("/users", unifiedProtect, getUsers);

// Group Chat Routes
router.post("/group", unifiedProtect, createGroupChat);
router.put("/group/rename", unifiedProtect, renameGroup);
router.put("/group/add", unifiedProtect, addToGroup);
router.put("/group/remove", unifiedProtect, removeFromGroup);
router.delete("/group-delete/:chatId", unifiedProtect, deleteGroup);

export default router;
