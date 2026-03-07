import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";

const app = express();

// ABSOLUTE TOP LOGGER (Before everything)
app.use((req, res, next) => {
  console.log(`📍 TOP-LEVEL: ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  console.log(`🏠 Host: ${req.headers.host} | Origin: ${req.headers.origin}`);
  next();
});

// Middlewares
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://localhost:")) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Routes
app.get("/health", (req, res) => {
  console.log("🟢 HIT /health");
  res.send("BlinkChat Backend is Healthy (Top Level)");
});

const healthRouter = express.Router();
healthRouter.get("/", (req, res) => {
  console.log("🟢 HIT /api/health");
  res.json({ status: "ok", msg: "v7-router-health", time: new Date() });
});
app.use("/api/health", healthRouter);

app.use("/api/support", supportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

// Serve static files
const __dirname = path.resolve();
app.use("/public", express.static(path.join(__dirname, "/public")));

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 404 fallback
app.use((req, res, next) => {
  console.log(`🔍 404 HIT: ${req.method} ${req.originalUrl || req.url} | Path: ${req.path}`);
  res.status(404).json({ 
    message: "Route not found", 
    requested: req.method + " " + (req.originalUrl || req.url),
    timestamp: new Date()
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("💥 GLOBAL ERROR HANDLER:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

export default app;
