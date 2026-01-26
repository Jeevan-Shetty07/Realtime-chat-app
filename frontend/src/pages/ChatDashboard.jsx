import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { accessChat, fetchMyChats, fetchUsers } from "../api/chatApi";
import { fetchMessages, markChatSeen, sendMessageApi } from "../api/messageApi";
import { formatTime } from "../utils/formatTime";

const ChatDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, onlineUsers, typingState } = useSocket();

  const [users, setUsers] = useState([]);
  const [myChats, setMyChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [typingTimeoutId, setTypingTimeoutId] = useState(null);

  const bottomRef = useRef(null);

  const getOtherUser = (chat) => {
    if (!chat?.members) return null;
    return chat.members.find((m) => m._id !== user?._id);
  };

  const otherUser = activeChat ? getOtherUser(activeChat) : null;
  const otherOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

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

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const openChat = (chat) => {
    setActiveChat(chat);
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

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!activeChat?._id) return;
    if (!messageText.trim()) return;

    try {
      socket.emit("stopTyping", { chatId: activeChat._id });

      // Save message in DB (REST)
      const savedMessage = await sendMessageApi({
        chatId: activeChat._id,
        text: messageText.trim(),
      });

      // Show instantly for sender
      setMessages((prev) => [...prev, savedMessage]);

      // Send real-time to other user
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
              lastMessage: savedMessage.text,
              lastMessageAt: savedMessage.createdAt,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return [...updated];
      });

      setMessageText("");
    } catch (error) {
      console.log("send message error:", error?.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div>
            <h2 style={{ color: "white", margin: 0 }}>Chat App</h2>

            <p style={styles.loggedInText}>
              Logged in as{" "}
              <span style={styles.loggedInName}>{user?.name}</span> (
              {user?.email})
            </p>
          </div>

          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>

        <input
          style={styles.search}
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={styles.sectionTitle}>Start New Chat</div>

        <div style={styles.userList}>
          {filteredUsers.map((u) => (
            <button
              key={u._id}
              onClick={() => startChatWithUser(u._id)}
              style={styles.userItem}
            >
              <div>
                <div style={styles.userNameRow}>
                  <span style={{ color: "white", fontWeight: "600" }}>
                    {u.name}
                  </span>

                  <span style={{ color: onlineUsers.includes(u._id) ? "#22c55e" : "#9ca3af" }}>
                    {onlineUsers.includes(u._id) ? "●" : "○"}
                  </span>
                </div>

                <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                  {u.email}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={styles.sectionTitle}>My Chats</div>

        <div style={styles.chatList}>
          {loadingChats ? (
            <p style={{ color: "#9ca3af" }}>Loading chats...</p>
          ) : myChats.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No chats yet</p>
          ) : (
            myChats.map((c) => {
              const other = getOtherUser(c);
              return (
                <button
                  key={c._id}
                  onClick={() => openChat(c)}
                  style={{
                    ...styles.chatItem,
                    border:
                      activeChat?._id === c._id
                        ? "1px solid #2563eb"
                        : "1px solid #1f2937",
                  }}
                >
                  <div style={{ color: "white", fontWeight: "600" }}>
                    {other?.name || "Unknown"}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                    {c.lastMessage || "No messages yet"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {!activeChat ? (
          <div style={styles.emptyChat}>
            <h2 style={{ color: "white" }}>Select a chat to start messaging</h2>
            <p style={{ color: "#9ca3af" }}>
              No stress, messages won’t send themselves 😄
            </p>
          </div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              <div>
                <div style={{ color: "white", fontWeight: "700" }}>
                  {otherUser?.name}
                </div>
                <div style={{ color: otherOnline ? "#22c55e" : "#9ca3af" }}>
                  {otherOnline ? "Online" : "Offline"}
                </div>
              </div>

              <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                Chat ID: {activeChat._id.slice(-6)}
              </div>
            </div>

            <div style={styles.messagesBox}>
              {loadingMessages ? (
                <p style={{ color: "#9ca3af" }}>Loading messages...</p>
              ) : (
               messages.map((m) => {
  // senderId can be either:
  // 1) string: "65ab..."
  // 2) object: { _id: "65ab...", name: "...", email: "..." }
  const senderId =
    typeof m.senderId === "string" ? m.senderId : m.senderId?._id;

  const isMine = senderId === user?._id;

  // Name label
  const senderLabel = isMine ? "You" : otherUser?.name || "User";

  return (
    <div
      key={m._id}
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          ...styles.bubble,
          background: isMine ? "#2563eb" : "#111827",
          border: isMine ? "1px solid #1d4ed8" : "1px solid #334155",
          borderTopLeftRadius: isMine ? "14px" : "4px",
          borderTopRightRadius: isMine ? "4px" : "14px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "700",
            marginBottom: "4px",
            color: isMine ? "#dbeafe" : "#93c5fd",
            textAlign: isMine ? "right" : "left",
          }}
        >
          {senderLabel}
        </div>

        <div style={{ fontSize: "14px", color: "white" }}>{m.text}</div>

        <div
          style={{
            ...styles.time,
            textAlign: isMine ? "right" : "left",
          }}
        >
          {formatTime(m.createdAt)}
        </div>
      </div>
    </div>
  );
})

              )}

              {/* Typing indicator */}
              {typingState.isTyping && typingState.chatId === activeChat._id && (
                <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                  {typingState.userName} is typing...
                </div>
              )}

              <div ref={bottomRef}></div>
            </div>

            <form onSubmit={sendMessage} style={styles.inputBar}>
              <input
                style={styles.messageInput}
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleTyping}
              />
              <button style={styles.sendBtn}>Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    background: "#0f172a",
  },
  sidebar: {
    borderRight: "1px solid #1f2937",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  loggedInText: {
    margin: "6px 0 0",
    color: "#9ca3af",
    fontSize: "12px",
    lineHeight: "16px",
  },
  loggedInName: {
    color: "white",
    fontWeight: "800",
  },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    height: "fit-content",
  },
  search: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #334155",
    outline: "none",
    background: "#0b1220",
    color: "white",
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: "6px",
  },
  userList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "180px",
    overflowY: "auto",
  },
  userItem: {
    width: "100%",
    textAlign: "left",
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "10px",
    cursor: "pointer",
  },
  userNameRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
    paddingBottom: "10px",
  },
  chatItem: {
    width: "100%",
    textAlign: "left",
    background: "#0b1220",
    borderRadius: "12px",
    padding: "10px",
    cursor: "pointer",
  },
  chatArea: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  emptyChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  chatHeader: {
    padding: "14px",
    borderBottom: "1px solid #1f2937",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0b1220",
  },
  messagesBox: {
    flex: 1,
    padding: "14px",
    overflowY: "auto",
  },
  bubble: {
    maxWidth: "70%",
    padding: "10px 12px",
    borderRadius: "14px",
  },
  time: {
    fontSize: "11px",
    color: "#cbd5e1",
    marginTop: "4px",
    textAlign: "right",
  },
  inputBar: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    borderTop: "1px solid #1f2937",
    background: "#0b1220",
  },
  messageInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #334155",
    outline: "none",
    background: "#111827",
    color: "white",
  },
  sendBtn: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default ChatDashboard;
