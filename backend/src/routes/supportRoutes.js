import express from "express";
import {
  createIssue,
  getAllIssues,
  updateIssue,
  getMyIssues,
} from "../controllers/supportController.js";
import { unifiedProtect, adminProtect } from "../middleware/clerkMiddleware.js";

const router = express.Router();

router.route("/")
  .post(unifiedProtect, createIssue)
  .get(unifiedProtect, adminProtect, getAllIssues);

router.route("/my-issues")
  .get(unifiedProtect, getMyIssues);

router.route("/:id")
  .patch(unifiedProtect, adminProtect, updateIssue);

export default router;
