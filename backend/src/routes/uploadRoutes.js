import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { unifiedProtect } from "../middleware/clerkMiddleware.js";

const router = express.Router();

router.post("/", unifiedProtect, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    if (req.file) {
      console.log("📁 Uploading file:", req.file.originalname, "Mime:", req.file.mimetype, "Size:", req.file.size);
    }
    
    // Determine file type category
    let fileType = "file";
    const mime = req.file.mimetype;
    if (mime.startsWith("image/")) fileType = "image";
    else if (mime.startsWith("video/")) fileType = "video";
    
    res.send({
      message: "File uploaded successfully",
      url: `/public/images/${req.file.filename}`,
      fileType,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error("🔥 UPLOAD ERROR:", error);
    res.status(500).json({ message: "Upload failed on server" });
  }
});

export default router;
