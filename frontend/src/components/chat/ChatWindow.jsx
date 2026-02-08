import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getImageUrl, getAvatarUrl } from "../../utils/imageHelper";
import { uploadFile } from "../../api/uploadApi";
import { formatTime } from "../../utils/formatTime";
import ViewUserModal from "../../components/modals/ViewUserModal";
import GroupInfoModal from "../../components/modals/GroupInfoModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { clearMessagesApi } from "../../api/messageApi";
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from "../../context/ThemeContext";

const ChatWindow = ({
  user,
  activeChat,
  messages,
  loadingMessages,
  sendMessage,
  typingState,
  handleTyping,
  onlineUsers,
  onToggleSidebar,
  users,
  onChatUpdate,
}) => {
  const { user: currentUser, blockUser, unblockUser } = useContext(AuthContext);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
      type: "primary"
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      // For options menu
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
      // For emoji picker
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    // Use 'click' instead of 'mousedown' to ensure internal clicks fire first
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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
        const { url, fileType } = await uploadFile(file);
        // Send immediately - use dynamic type from backend or fallback to 'file'
        await sendMessage("", fileType || "file", [{ url, fileType: fileType || "file" }]);
    } catch (error) {
        console.error("Upload failed", error);
        alert("Image upload failed");
    } finally {
        setUploading(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  if (!activeChat) {
    return (
      <div className="chat-window">
        <div className="empty-state">
          {/* Mobile Menu Button for Empty State */}
          <button className="mobile-toggle-btn empty-state-toggle" onClick={onToggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          
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

  const getUserId = (u) => {
    if (!u) return null;
    return typeof u === 'string' ? u : u._id?.toString() || u.toString();
  };

  const isBlockedByMe = user?.blockedUsers?.some(bid => getUserId(bid) === getUserId(otherUser?._id));
  const isBlockingMe = otherUser?.blockedUsers?.some(bid => getUserId(bid) === getUserId(user?._id));
  const isBlocked = !!(otherUser && (isBlockedByMe || isBlockingMe));

  const handleBlockToggle = async () => {
    if (!otherUser) return;
    try {
      if (isBlockedByMe) {
        await unblockUser(otherUser._id);
      } else {
        setConfirmModal({
            isOpen: true,
            title: "Block User",
            message: `Are you sure you want to block ${otherUser.name}? You won't be able to message each other.`,
            type: "danger",
            onConfirm: async () => {
                try {
                    await blockUser(otherUser._id);
                } catch (err) {
                    alert("Failed to block user");
                }
            }
        });
      }
    } catch (error) {
      alert("Failed to update block status");
    }
  };

  const handleClearChat = async () => {
      setConfirmModal({
          isOpen: true,
          title: "Clear Chat",
          message: "Are you sure you want to clear all messages in this chat? This action cannot be undone.",
          type: "danger",
          onConfirm: async () => {
              try {
                  await clearMessagesApi(activeChat._id);
                  onChatUpdate({ ...activeChat }); // Pass new reference to trigger refresh
              } catch (err) {
                  alert("Failed to clear chat");
              }
          }
      });
  };

  return (
    <div className="chat-window glass-panel">
      {/* Header */}
      <div className="chat-room-header">
        <button className="mobile-toggle-btn" onClick={onToggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div 
            className="header-user-info" 
            onClick={() => isGroup ? setShowGroupInfo(true) : setShowViewProfile(true)}
        >
          <div className="user-avatar-sm" style={{ background: isGroup ? "linear-gradient(135deg, #ec4899, #be185d)" : (headerStatus === "Online" ? "#22c55e" : "#6366f1") }}>
            {isGroup ? "#" : (
              otherUser?.avatar ? (
                <img src={getAvatarUrl(otherUser.avatar)} alt="avatar" />
              ) : headerAvatar
            )}
          </div>
          <div className="user-text-info">
            <div className="user-name-row">
              <span className="user-name">{headerName}</span>
              {!isGroup && otherUser?.isAdmin && <span className="admin-badge">ADMIN</span>}
            </div>
            <div className={`user-status ${headerStatus === "Online" ? "online" : ""}`}>
              {headerStatus}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="header-actions">
          {!isGroup && otherUser && (
            <div className="options-menu-container" ref={menuRef}>
              <button 
                  className={`action-btn ${showOptionsMenu ? "active" : ""}`} 
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  title="More Options"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
              
              {showOptionsMenu && (
                <div 
                    className="options-dropdown glass-panel animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                    style={{ zIndex: 1002 }}
                >
                    <button 
                        type="button"
                        className="dropdown-item" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setShowViewProfile(true); setShowOptionsMenu(false); }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        View Profile
                    </button>
                    <button 
                        type="button"
                        className={`dropdown-item ${isBlockedByMe ? "text-success" : "text-danger"}`} 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); handleBlockToggle(); setShowOptionsMenu(false); }}
                    >
                        {isBlockedByMe ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z"/></svg>
                                Unblock User
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                Block User
                            </>
                        )}
                    </button>
                    <button 
                        type="button"
                        className="dropdown-item text-danger" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); handleClearChat(); setShowOptionsMenu(false); }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        Clear Chat
                    </button>
                </div>
              )}
            </div>
          )}
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
                onDoubleClick={() => addReaction(m._id, "❤️")} // Quick reaction
                title="Double click to like"
              >
                {!isMine && (
                  <div className="msg-sender-info">
                    <div className="user-avatar-xs">
                      {m.senderId?.avatar ? (
                        <img src={getAvatarUrl(m.senderId.avatar)} alt="avatar" />
                      ) : (
                        m.senderId?.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    {isGroup && <span className="msg-sender-name">{senderName}</span>}
                  </div>
                )}
                
                {/* Image Rendering */}
                {m.attachments?.length > 0 ? (
                    m.attachments.map((att, i) => {
                        // Handle both old format (string) and new format (object)
                        // Safety check: ensure att is not null/undefined if treating as object
                        const src = typeof att === 'string' ? att : att?.url;
                        
                        if (!src) return null; // Skip invalid attachments

                        const type = (typeof att === 'object' && att.fileType) 
                            ? att.fileType 
                            : (src.match(/\.(mp4|webm)$/i) ? 'video' : 'image');

                        return (
                          <div key={i} style={{ marginBottom: "6px" }}>
                              {type === 'video' ? (
                                  <video 
                                      src={getImageUrl(src)} 
                                      controls 
                                      className="msg-attachment"
                                      style={{ width: "100%", maxWidth: "280px", height: "200px", objectFit: "cover", borderRadius: "12px" }}
                                  />
                              ) : type === 'image' ? (
                                  <img 
                                      src={getImageUrl(src)} 
                                      alt="attachment" 
                                      className="msg-attachment"
                                      style={{ width: "100%", maxWidth: "280px", height: "200px", objectFit: "cover", borderRadius: "12px" }}
                                  />
                              ) : (
                                  <a 
                                      href={getImageUrl(src)} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="file-attachment-link"
                                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", textDecoration: "none" }}
                                  >
                                      <span>📂</span>
                                      <span>Download File</span>
                                  </a>
                              )}
                          </div>
                       );
                    })
                ) : null}

                {m.text && <div className="msg-text">{m.text}</div>}
                
                {/* Reactions Display */}
                {m.reactions && m.reactions.length > 0 && (
                    <div className="reactions-row" style={{ display: "flex", gap: "2px", marginTop: "4px", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                        {m.reactions.map((r, idx) => (
                            <span key={idx} style={{ fontSize: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "2px 6px" }}>
                                {r.emoji}
                            </span>
                        ))}
                    </div>
                )}
                
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
        {isBlocked ? (
            <div className="blocked-notice animate-fade-in">
                <div className="blocked-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
                <span>
                    {isBlockedByMe ? "You have blocked this user." : "This user has blocked you."}
                </span>
                {isBlockedByMe && (
                    <button className="unblock-inline-btn" onClick={handleBlockToggle}>Unblock Now</button>
                )}
            </div>
        ) : (
            <form onSubmit={onSend} className="input-wrapper">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: "none" }} 
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
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

                <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
                    {showEmojiPicker && (
                        <div className="emoji-picker-container">
                            <EmojiPicker 
                                onEmojiClick={onEmojiClick} 
                                theme={theme}
                                lazyLoadEmojis={true}
                                skinTonesDisabled
                                searchPlaceHolder="Search emoji..."
                                width={300}
                                height={400}
                            />
                        </div>
                    )}
                    <button 
                        type="button" 
                        className="action-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Add emoji"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </button>
                </div>

                <button className="send-btn" type="submit" disabled={!text.trim() && !uploading}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </form>
        )}
      </div>

      {showViewProfile && otherUser && (
        <ViewUserModal 
            user={otherUser}
            onClose={() => setShowViewProfile(false)}
        />
      )}
      {showGroupInfo && isGroup && (
        <GroupInfoModal 
          chat={activeChat}
          onClose={() => setShowGroupInfo(false)}
          onUpdate={onChatUpdate}
          allUsers={users}
          currentUser={user}
        />
      )}

      <ConfirmModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
};

export default ChatWindow;
