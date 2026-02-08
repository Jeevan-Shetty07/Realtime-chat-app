import express from "express";
import { getMe, register, login, deleteMe, getAllUsers, adminDeleteUser, toggleAdminStatus } from "../controllers/authController.js";
import { unifiedProtect, adminProtect } from "../middleware/clerkMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", unifiedProtect, getMe);
router.delete("/me", unifiedProtect, deleteMe);

// Admin Routes
router.get("/admin/users", unifiedProtect, adminProtect, getAllUsers);
router.delete("/admin/users/:id", unifiedProtect, adminProtect, adminDeleteUser);
router.put("/admin/users/:id/role", unifiedProtect, adminProtect, toggleAdminStatus);

export default router;
