import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";

// Store online users in memory (fast lookup)
const onlineUsers = new Map(); // userId -> socketId

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  io.on("connection", (socket) => {
    console.log("\ud83d\udfE2 New socket connected:", socket.id);

    // Setup user online status
    socket.on("setup", async (userId) => {
      try {
        if (!userId) {
          console.warn("\u26a0\ufe0f setup called without userId");
          socket.emit("error", { message: "User ID is required" });
          return;
        }

        // Validate userId format (basic MongoDB ObjectId check)
        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
          console.warn("\u26a0\ufe0f Invalid userId format:", userId);
          socket.emit("error", { message: "Invalid user ID format" });
          return;
        }

        socket.userId = userId;
        onlineUsers.set(userId, socket.id);

        // Update user status in database
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: null,
        });

        // Broadcast updated online users list
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        
        console.log(`\u2705 User ${userId} is now online`);
      } catch (error) {
        console.error("\ud83d\udd25 Setup error:", error.message);
        socket.emit("error", { message: "Failed to setup user connection" });
      }
    });

    // Join chat room
    socket.on("joinChat", (chatId) => {
      try {
        if (!chatId) {
          console.warn("\u26a0\ufe0f joinChat called without chatId");
          return;
        }

        // Validate chatId format
        if (!/^[0-9a-fA-F]{24}$/.test(chatId)) {
          console.warn("\u26a0\ufe0f Invalid chatId format:", chatId);
          return;
        }

        socket.join(chatId);
        console.log(`\ud83d\udcac Socket ${socket.id} joined chat ${chatId}`);
      } catch (error) {
        console.error("\ud83d\udd25 Join chat error:", error.message);
      }
    });

    // Typing events
    socket.on("typing", ({ chatId, userName }) => {
      try {
        if (!chatId || !userName) {
          console.warn("\u26a0\ufe0f Typing event missing data");
          return;
        }

        socket.to(chatId).emit("typing", { chatId, userName });
      } catch (error) {
        console.error("\ud83d\udd25 Typing event error:", error.message);
      }
    });

    socket.on("stopTyping", ({ chatId }) => {
      try {
        if (!chatId) {
          console.warn("\u26a0\ufe0f StopTyping event missing chatId");
          return;
        }

        socket.to(chatId).emit("stopTyping", { chatId });
      } catch (error) {
        console.error("\ud83d\udd25 Stop typing event error:", error.message);
      }
    });

    // Real-time message delivery
    socket.on("sendMessage", ({ chatId, message }) => {
      try {
        if (!chatId || !message) {
          console.warn("\u26a0\ufe0f SendMessage event missing data");
          return;
        }

        // Validate message object has required fields
        if (!message._id || !message.senderId) {
          console.warn("\u26a0\ufe0f Invalid message object");
          return;
        }

        // Broadcast to all users in the chat room except sender
        socket.to(chatId).emit("receiveMessage", {
          chatId,
          message,
        });
        
        console.log(`\u2709\ufe0f Message sent to chat ${chatId}`);
      } catch (error) {
        console.error("\ud83d\udd25 Send message error:", error.message);
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        const userId = socket.userId;

        if (userId) {
          onlineUsers.delete(userId);

          // Update user status in database
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          // Broadcast updated online users list
          io.emit("onlineUsers", Array.from(onlineUsers.keys()));
          
          console.log(`\ud83d\udd34 User ${userId} disconnected`);
        }

        console.log("\ud83d\udd34 Socket disconnected:", socket.id);
      } catch (error) {
        console.error("\ud83d\udd25 Disconnect error:", error.message);
      }
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("\ud83d\udd25 Socket error:", error);
    });
  });

  return io;
};
