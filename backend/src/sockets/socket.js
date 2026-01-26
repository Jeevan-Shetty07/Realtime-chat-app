import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";

// store online users in memory (fast)
const onlineUsers = new Map(); // userId -> socketId

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 New socket connected:", socket.id);

    // setup user online
    socket.on("setup", async (userId) => {
      try {
        if (!userId) {
          console.log("⚠️ setup called without userId");
          return;
        }

        socket.userId = userId;
        onlineUsers.set(userId, socket.id);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: null,
        });

        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      } catch (error) {
        console.log("setup error:", error.message);
      }
    });

    // join chat room
    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
    });

    // typing events
    socket.on("typing", ({ chatId, userName }) => {
      socket.to(chatId).emit("typing", { chatId, userName });
    });

    socket.on("stopTyping", ({ chatId }) => {
      socket.to(chatId).emit("stopTyping", { chatId });
    });

    // ✅ FIXED real-time message (always populate sender)
    socket.on("sendMessage", async ({ chatId, messageId }) => {
      try {
        if (!chatId || !messageId) return;

        const fullMessage = await Message.findById(messageId).populate(
          "senderId",
          "_id name email avatar"
        );

        socket.to(chatId).emit("receiveMessage", {
          chatId,
          message: fullMessage,
        });
      } catch (error) {
        console.log("sendMessage error:", error.message);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const userId = socket.userId;

        if (userId) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        }

        console.log("🔴 Socket disconnected:", socket.id);
      } catch (error) {
        console.log("disconnect error:", error.message);
      }
    });
  });
};
