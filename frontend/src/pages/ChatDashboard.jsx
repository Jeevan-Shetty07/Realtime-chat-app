import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { accessChat, fetchMyChats, fetchUsers, hideChatApi } from "../api/chatApi";
import { fetchMessages, markChatSeen, sendMessageApi } from "../api/messageApi";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import ProfileModal from "../components/modals/ProfileModal";
import { useNotification } from "../context/NotificationContext";
import LoadingScreen from "../components/common/LoadingScreen";
import { useTheme } from "../context/ThemeContext";
import "../styles/Chat.css";

const ChatDashboard = () => {
  const { user, loadingAuth, logout } = useContext(AuthContext);
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const { socket, onlineUsers, typingState } = useSocket();

  const [users, setUsers] = useState([]);
  const [myChats, setMyChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const activeChatIdRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    activeChatIdRef.current = activeChat?._id;
  }, [activeChat]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // Only hide sidebar on initial small screen load IF a chat is selected
        // This prevents getting stuck on empty state with no menu
        if (activeChatIdRef.current) {
          setShowSidebar(false);
        }
      } else {
        setShowSidebar(true);
      }
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load users + my chats
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingChats(true);
        const [usersData, chatsData] = await Promise.all([
          fetchUsers(),
          fetchMyChats(),
        ]);
        setUsers(usersData);
        setMyChats(chatsData);
      } catch (error) {
        console.log("load dashboard error:", error?.message);
      } finally {
        setLoadingChats(false);
      }
    };

    load();
  }, []);

  // Join active chat room + load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat?._id) return;

      try {
        setLoadingMessages(true);
        setMessages([]);

        socket.emit("joinChat", activeChat._id);

        const msgs = await fetchMessages(activeChat._id);
        setMessages(msgs);

        await markChatSeen(activeChat._id);
        setMyChats((prev) => 
            prev.map(c => c._id === activeChat._id ? { ...c, unreadCount: 0 } : c)
        );
      } catch (error) {
        console.log("load messages error:", error?.message);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeChat, socket]);

  // Receive messages real-time
  useEffect(() => {
    const handleBlockUpdate = async () => {
        try {
            const [chatsData, usersData] = await Promise.all([
                fetchMyChats(),
                fetchUsers()
            ]);
            setMyChats(chatsData);
            setUsers(usersData);
            
            // Critical: Sync activeChat to ensure it has the latest blockedUsers info
            setActiveChat(prev => {
                if (!prev) return null;
                const updated = chatsData.find(c => c._id === prev._id);
                return updated || prev;
            });
        } catch (error) {
            console.error("Failed to refresh dashboard on block update", error);
        }
    };
    window.addEventListener('userBlockUpdate', handleBlockUpdate);
    
    const handler = async ({ chatId, message }) => {
      console.log("📩 receiveMessage event:", { chatId, message, currentActive: activeChatIdRef.current });
      if (!message) return;

      const isActive = activeChatIdRef.current === chatId;

      // Only push message if we are currently in that chat
      if (isActive) {
        setMessages((prev) => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          
          console.log("✅ Adding message to state");
          return [...prev, message];
        });
        await markChatSeen(chatId);
      }

      // Refresh chat list (handle lastMessage + unreadCount)
      setMyChats((prev) => {
        const chatExists = prev.some(c => c._id === chatId);
        
        if (!chatExists) {
            // New chat discovered! Fetch all chats to get full object
            fetchMyChats().then(data => setMyChats(data));
            return prev;
        }

        const updated = prev.map((c) => {
          if (c._id === chatId) {
            return {
              ...c,
              lastMessage: message.text || (message.attachments?.length > 0 ? "📷 Attachment" : ""),
              lastMessageAt: message.createdAt,
              updatedAt: new Date().toISOString(),
              unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return [...updated];
      });
    };

    socket.on("receiveMessage", handler);
    
    // Handle updates (Reactions)
    socket.on("messageUpdated", ({ chatId, message }) => {
        if (activeChatIdRef.current === chatId) {
            setMessages(prev => prev.map(m => m._id === message._id ? message : m));
        }
    });

    // Handle Group Updates
    socket.on("groupCreated", ({ userId: targetUserId, chat }) => {
        if (String(user?._id) === String(targetUserId)) {
            setMyChats(prev => [chat, ...prev]);
        }
    });

    socket.on("groupRenamed", (updatedChat) => {
        setMyChats(prev => prev.map(c => c._id === updatedChat._id ? { ...c, chatName: updatedChat.chatName } : c));
        if (activeChatIdRef.current === updatedChat._id) {
            setActiveChat(prev => ({ ...prev, chatName: updatedChat.chatName }));
        }
    });

    socket.on("groupUpdated", (updatedChat) => {
        // This covers adding/removing members
        setMyChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
        if (activeChatIdRef.current === updatedChat._id) {
            setActiveChat(updatedChat);
        }
    });

    socket.on("messageDeleted", ({ chatId, messageId }) => {
        if (activeChatIdRef.current === chatId) {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        }
    });

    socket.on("groupDeleted", ({ chatId }) => {
        setMyChats(prev => prev.filter(c => c._id !== chatId));
        if (activeChatIdRef.current === chatId) {
            setActiveChat(null);
            addNotification("This group has been deleted by an admin", "info");
        }
    });

    return () => {
      window.removeEventListener('userBlockUpdate', handleBlockUpdate);
      socket.off("receiveMessage", handler);
      socket.off("messageUpdated");
      socket.off("groupCreated");
      socket.off("groupRenamed");
      socket.off("groupUpdated");
      socket.off("messageDeleted");
      socket.off("groupDeleted");
    };
  }, [socket, user]); // Added user to deps to handle identity-based events

  const startChatWithUser = useCallback(async (userId) => {
    try {
      const chat = await accessChat(userId);

      setMyChats((prev) => {
        const exists = prev.some((c) => c._id === chat._id);
        if (exists) return prev;
        return [chat, ...prev];
      });

      setActiveChat(chat);
    } catch (error) {
      console.log("start chat error:", error?.message);
    }
  }, []); // socket not strictly needed here as it uses service

  const handleTyping = useCallback(() => {
    if (!activeChat?._id) return;

    socket.emit("typing", { chatId: activeChat._id, userName: user?.name });

    if (typingTimeoutId) clearTimeout(typingTimeoutId);

    const id = setTimeout(() => {
      socket.emit("stopTyping", { chatId: activeChat._id });
    }, 900);

    setTypingTimeoutId(id);
  }, [activeChat?._id, socket, user?.name, typingTimeoutId]);

  const handleNewGroup = useCallback((newGroupChat) => {
      setMyChats((prev) => [newGroupChat, ...prev]);
      setActiveChat(newGroupChat);
  }, []);

  const handleChatUpdate = useCallback((updatedChat, removed = false) => {
    if (!updatedChat) return;
    
    if (removed) {
        setMyChats((prev) => prev.filter((c) => c._id !== updatedChat._id));
        setActiveChat(null);
    } else {
        setActiveChat(updatedChat);
        setMyChats((prev) =>
            prev.map((c) => (c._id === updatedChat._id ? updatedChat : c))
        );
    }
  }, []);

  const handleHideChat = useCallback(async (chatId) => {
    try {
      await hideChatApi(chatId);
      setMyChats((prev) => prev.filter((c) => c._id !== chatId));
      if (activeChatIdRef.current === chatId) {
        setActiveChat(null);
      }
      addNotification("Chat deleted", "success");
    } catch (error) {
      console.error("Hide chat error:", error);
      addNotification("Failed to delete chat", "error");
    }
  }, [addNotification]);

  const sendMessage = useCallback(async (content, type = "text", attachments = []) => {
    if (!activeChat?._id) return;

    try {
      console.log("📤 Sending message:", { content, type, chatId: activeChat._id });
      socket.emit("stopTyping", { chatId: activeChat._id });

      // Save message in DB (REST)
      const savedMessage = await sendMessageApi({
        chatId: activeChat._id,
        text: content,
        type,
        attachments
      });
      console.log("💾 Message saved to DB:", savedMessage);

      // Show instantly for sender
      setMessages((prev) => [...prev, savedMessage]);
      console.log("✅ Message added to sender's state");

      // Note: Real-time broadcast is now handled by the backend controller
      // to ensure all participants receive it via their personal rooms.

      // Update chat list preview
      setMyChats((prev) => {
        const updated = prev.map((c) => {
          if (c._id === activeChat._id) {
            return {
              ...c,
              lastMessage: type === 'image' ? '📷 Image' : (type === 'file' ? '📎 Attachment' : content),
              lastMessageAt: savedMessage.createdAt,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return [...updated];
      });
    } catch (error) {
      console.log("send message error:", error?.message);
    }
  }, [activeChat?._id, socket]);

  if (loadingAuth || !user) {
    return <LoadingScreen />;
  }

  if (!user.username) {
    return (
        <div className="onboarding-screen">
          <div className="chat-bg"></div>
          <ProfileModal isForced={true} onClose={() => {}} />
        </div>
    );
  }

  return (
    <div className={`chat-container ${!showSidebar ? "sidebar-hidden" : ""}`}>
      <div className="chat-bg"></div>
      
      <Sidebar
        user={user}
        logout={logout}
        onlineUsers={onlineUsers}
        myChats={myChats}
        activeChat={activeChat}
        setActiveChat={(chat) => {
          setActiveChat(chat);
          if (window.innerWidth <= 768) setShowSidebar(false);
        }}
        users={users}
        startChatWithUser={async (uid) => {
          await startChatWithUser(uid);
          if (window.innerWidth <= 768) setShowSidebar(false);
        }}
        onNewGroup={handleNewGroup}
        onHideChat={handleHideChat}
      />

      <ChatWindow
        user={user}
        activeChat={activeChat}
        messages={messages}
        loadingMessages={loadingMessages}
        sendMessage={sendMessage}
        typingState={typingState}
        handleTyping={handleTyping}
        onlineUsers={onlineUsers}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        users={users}
        onChatUpdate={handleChatUpdate}
      />
    </div>
  );
};

export default ChatDashboard;
