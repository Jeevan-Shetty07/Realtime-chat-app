import express from "express";
import { getMe, register, login, forgotPassword, deleteMe, getAllUsers, getAllGroups, adminDeleteUser, toggleAdminStatus } from "../controllers/authController.js";
import { deleteGroup } from "../controllers/chatController.js";
import { unifiedProtect, adminProtect } from "../middleware/clerkMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/me", unifiedProtect, getMe);
router.delete("/me", unifiedProtect, deleteMe);

// Admin Routes
router.get("/admin/users", unifiedProtect, adminProtect, getAllUsers);
router.get("/admin/groups", unifiedProtect, adminProtect, getAllGroups);
router.delete("/admin/users/:id", unifiedProtect, adminProtect, adminDeleteUser);
router.delete("/admin/groups/:chatId", unifiedProtect, adminProtect, deleteGroup);
router.put("/admin/users/:id/role", unifiedProtect, adminProtect, toggleAdminStatus);

export default router;
