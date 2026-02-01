import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Serve static files
const __dirname = path.resolve();
app.use("/public", express.static(path.join(__dirname, "/public")));

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
