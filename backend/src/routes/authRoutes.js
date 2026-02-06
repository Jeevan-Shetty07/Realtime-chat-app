import express from "express";
import { getMe } from "../controllers/authController.js";
import { clerkProtect } from "../middleware/clerkMiddleware.js";

const router = express.Router();

router.get("/me", clerkProtect, getMe);

export default router;
