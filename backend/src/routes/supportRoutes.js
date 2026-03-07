import express from "express";
import {
  createIssue,
  getAllIssues,
  updateIssue,
  getMyIssues,
} from "../controllers/supportController.js";
import { unifiedProtect, adminProtect } from "../middleware/clerkMiddleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Support router is working!" });
});

router.get("/test-prod", (req, res) => {
  res.json({ message: "Render Production support router is working!", timestamp: new Date() });
});

router.post("/", unifiedProtect, createIssue);
router.get("/", unifiedProtect, adminProtect, getAllIssues);
router.get("/my-issues", unifiedProtect, getMyIssues);
router.patch("/:id", unifiedProtect, adminProtect, updateIssue);

export default router;
