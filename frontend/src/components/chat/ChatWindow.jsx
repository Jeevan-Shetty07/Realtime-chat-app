import { useState, useEffect, useRef } from "react";
import { uploadFile } from "../../api/uploadApi";
import { formatTime } from "../../utils/formatTime";

const ChatWindow = ({
  user,
  activeChat,
  messages,
  loadingMessages,
  sendMessage,
  typingState,
  handleTyping,
  onlineUsers,
}) => {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingState]);

  const onSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend(e);
    }
    handleTyping(e);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        setUploading(true);
        const { imageUrl } = await uploadFile(file);
        // Send immediately
        await sendMessage("", "image", [imageUrl]);
    } catch (error) {
        console.error("Upload failed", error);
        alert("Image upload failed");
    } finally {
        setUploading(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!activeChat) {
    return (
      <div className="chat-window">
        <div className="empty-state">
          <div className="auth-bg-glow" style={{ position: "relative", width: "200px", height: "200px" }}></div>
          <h2 style={{ zIndex: 1, position: "relative" }}>Welcome to Chat App</h2>
          <p style={{ zIndex: 1, position: "relative" }}>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const getOtherUser = (chat) => {
    if (chat.isGroupChat) return null;
    if (!chat?.members) return null;
    return chat.members.find((m) => m._id !== user?._id);
  };

  const otherUser = getOtherUser(activeChat);
  const isGroup = activeChat.isGroupChat;
  
  // Logic for header info
  let headerName = "Unknown";
  let headerStatus = "";
  let headerAvatar = "?";

  if (isGroup) {
      headerName = activeChat.chatName;
      headerAvatar = "#";
      headerStatus = `${activeChat.members.length} members`;
  } else {
      headerName = otherUser?.name || "Unknown";
      headerAvatar = otherUser?.name?.charAt(0).toUpperCase();
      const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;
      headerStatus = isOnline ? "Online" : "Offline";
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-room-header">
        <div className="header-user-info">
          <div className="user-avatar-sm" style={{ background: isGroup ? "#ec4899" : (headerStatus === "Online" ? "#22c55e" : "#6366f1") }}>
            {headerAvatar}
          </div>
          <div>
            <div style={{ fontWeight: "700", color: "white" }}>
              {headerName}
            </div>
            <div style={{ fontSize: "12px", color: headerStatus === "Online" ? "#22c55e" : "var(--text-secondary)" }}>
              {headerStatus}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {loadingMessages ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "20px" }}>
            Loading messages...
          </div>
        ) : (
          messages.map((m) => {
            const senderId = typeof m.senderId === "string" ? m.senderId : m.senderId?._id;
            const isMine = senderId === user?._id;
            
            // For group chats, show sender name if not me
            const senderName = typeof m.senderId === "object" ? m.senderId.name : "User";

            return (
              <div
                key={m._id}
                className={`message-bubble ${isMine ? "msg-sent" : "msg-received"}`}
              >
                {!isMine && isGroup && <div style={{ fontSize: "0.75rem", color: "#ec4899", marginBottom: "4px", fontWeight: "600" }}>{senderName}</div>}
                
                {/* Image Rendering */}
                {m.attachments?.length > 0 ? (
                    m.attachments.map((url, i) => (
                        <div key={i} style={{ marginBottom: "6px" }}>
                            <img 
                                src={`http://localhost:5000${url}`} 
                                alt="attachment" 
                                style={{ maxWidth: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }} 
                            />
                        </div>
                    ))
                ) : null}

                {m.text && <div className="msg-text">{m.text}</div>}
                
                <div className="msg-meta">
                    {formatTime(m.createdAt)}
                    {isMine && <span>✓</span>} 
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Bubble */}
        {typingState.isTyping && typingState.chatId === activeChat._id && (
           <div className="typing-indicator">
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginRight: "6px" }}>{typingState.userName}:</span>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
           </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <form onSubmit={onSend} className="input-wrapper">
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handleFileChange}
                accept="image/*"
            />
            
            <button 
                type="button" 
                className="action-btn"
                onClick={handleFileClick}
                disabled={uploading}
                title="Attach Image"
            >
                {uploading ? (
                    <div className="typing-dot" style={{ background: "var(--primary-color)" }}></div>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                )}
            </button>

            <textarea
                className="chat-input"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
            />

            <button className="send-btn" type="submit" disabled={!text.trim() && !uploading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
