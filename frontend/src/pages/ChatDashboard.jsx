import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { accessChat, fetchMyChats, fetchUsers } from "../api/chatApi";
import { fetchMessages, markChatSeen, sendMessageApi } from "../api/messageApi";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import "../styles/Chat.css";

const ChatDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, onlineUsers, typingState } = useSocket();

  const [users, setUsers] = useState([]);
  const [myChats, setMyChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState(null);

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
    const handler = async ({ chatId, message }) => {
      if (!message) return;

      // Only push message if we are currently in that chat
      if (activeChat?._id === chatId) {
        setMessages((prev) => [...prev, message]);
        await markChatSeen(chatId);
      }

      // Refresh chat list lastMessage
      setMyChats((prev) => {
        const updated = prev.map((c) => {
          if (c._id === chatId) {
            return {
              ...c,
              lastMessage: message.text,
              lastMessageAt: message.createdAt,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return [...updated];
      });
    };

    socket.on("receiveMessage", handler);

    return () => {
      socket.off("receiveMessage", handler);
    };
  }, [socket, activeChat]);

  const startChatWithUser = async (userId) => {
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
  };

  const handleTyping = () => {
    if (!activeChat?._id) return;

    socket.emit("typing", { chatId: activeChat._id, userName: user.name });

    if (typingTimeoutId) clearTimeout(typingTimeoutId);

    const id = setTimeout(() => {
      socket.emit("stopTyping", { chatId: activeChat._id });
    }, 900);

    setTypingTimeoutId(id);
  };

  const handleNewGroup = (newGroupChat) => {
      setMyChats((prev) => [newGroupChat, ...prev]);
      setActiveChat(newGroupChat);
  };

  const sendMessage = async (content, type = "text", attachments = []) => {
    if (!activeChat?._id) return;

    try {
      socket.emit("stopTyping", { chatId: activeChat._id });

      // Save message in DB (REST)
      const savedMessage = await sendMessageApi({
        chatId: activeChat._id,
        text: content,
        type,
        attachments
      });

      // Show instantly for sender
      setMessages((prev) => [...prev, savedMessage]);

      // Send real-time to other user (Socket.js updated to accept full object)
      socket.emit("sendMessage", {
        chatId: activeChat._id,
        message: savedMessage,
      });

      // Update chat list preview
      setMyChats((prev) => {
        const updated = prev.map((c) => {
          if (c._id === activeChat._id) {
            return {
              ...c,
              lastMessage: type === 'image' ? '📷 Image' : content,
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
  };

  return (
    <div className="chat-container">
      <div className="chat-bg"></div>
      
      <Sidebar
        user={user}
        logout={logout}
        onlineUsers={onlineUsers}
        myChats={myChats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        users={users}
        startChatWithUser={startChatWithUser}
        onNewGroup={handleNewGroup}
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
      />
    </div>
  );
};

export default ChatDashboard;
