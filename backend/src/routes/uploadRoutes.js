import express from "express";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", upload.single("image"), (req, res) => {
  res.send({
    message: "Image uploaded",
    imageUrl: `/public/images/${req.file.filename}`,
  });
});

export default router;
