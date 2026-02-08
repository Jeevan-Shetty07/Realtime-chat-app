import { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children, user }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingState, setTypingState] = useState({
    chatId: null,
    userName: "",
    isTyping: false,
  });

  const socket = useMemo(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5001", {
      transports: ["polling", "websocket"],
      withCredentials: true
    });
    
    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
    });
    
    newSocket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });
    
    newSocket.on("error", (error) => {
      console.error("🔥 Socket error:", error);
    });
    
    return newSocket;
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    console.log("🔧 Setting up socket for user:", user._id);
    socket.emit("setup", user._id);

    socket.on("onlineUsers", (users) => {
      console.log("👥 Online users updated:", users.length);
      setOnlineUsers(users);
    });

    socket.on("typing", ({ chatId, userName }) => {
      setTypingState({ chatId, userName, isTyping: true });
    });

    socket.on("stopTyping", ({ chatId }) => {
      setTypingState((prev) => {
        if (prev.chatId === chatId) {
          return { chatId: null, userName: "", isTyping: false };
        }
        return prev;
      });
    });

    socket.on("userBlocked", ({ blockedBy, blockedUser }) => {
        // If I am the one who was blocked, I should probably refresh my view of the other user
        // Or if I am the one who blocked (though that's handled locally usually)
        if (user._id === blockedUser) {
            console.log("🚫 You have been blocked by:", blockedBy);
            // This event tells the recipient they are blocked
            window.dispatchEvent(new CustomEvent('userBlockUpdate', { detail: { blockedBy, status: true } }));
        }
    });

    socket.on("userUnblocked", ({ unblockedBy, unblockedUser }) => {
        if (user._id === unblockedUser) {
            console.log("✅ You have been unblocked by:", unblockedBy);
            window.dispatchEvent(new CustomEvent('userBlockUpdate', { detail: { unblockedBy, status: false } }));
        }
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("userBlocked");
      socket.off("userUnblocked");
    };
  }, [socket, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        typingState,
        setTypingState,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
