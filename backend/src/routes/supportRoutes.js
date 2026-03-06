import express from "express";
import {
  createIssue,
  getAllIssues,
  updateIssue,
  getMyIssues,
} from "../controllers/supportController.js";
import { unifiedProtect, adminProtect } from "../middleware/clerkMiddleware.js";

const router = express.Router();

// Debug route
router.get("/test", (req, res) => {
  res.json({ message: "Support router is working!" });
});

router.post("/", unifiedProtect, createIssue);
router.get("/", unifiedProtect, adminProtect, getAllIssues);
router.get("/my-issues", unifiedProtect, getMyIssues);
router.patch("/:id", unifiedProtect, adminProtect, updateIssue);

export default router;
