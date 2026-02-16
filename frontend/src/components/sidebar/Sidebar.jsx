import { useState, memo } from "react";
import { getAvatarUrl } from "../../utils/imageHelper";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/Chat.css";
import CreateGroupModal from "../modals/CreateGroupModal";
import ProfileModal from "../modals/ProfileModal";

const Sidebar = memo(({
  user,
  logout,
  onlineUsers,
  myChats,
  activeChat,
  setActiveChat,
  users,
  startChatWithUser,
  onNewGroup,
  onHideChat,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' or 'users'
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getUserId = (u) => {
    if (!u) return null;
    return typeof u === 'string' ? u : u._id?.toString() || u.toString();
  };
  const isBlocked = (targetId) => {
    const tid = getUserId(targetId);
    return user?.blockedUsers?.some(bid => getUserId(bid) === tid);
  };

  // ... (filteredUsers and getChatInfo remain same)

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const getChatInfo = (chat) => {
    if (!chat) return { name: "Unknown", avatar: "?" };
    
    if (chat.isGroupChat) {
      return {
        name: chat.chatName || "Group",
        avatar: null,
        isGroup: true,
        online: false
      };
    }
    
    const members = Array.isArray(chat.members) ? chat.members : [];
    const other = members.find((m) => (typeof m === 'string' ? m : m._id) !== user?._id);
    
    return {
      name: other?.name || "Unknown",
      avatarLink: other?.avatar,
      avatar: other?.name?.charAt(0).toUpperCase() || "?",
      isGroup: false,
      online: other ? onlineUsers.includes(other._id) : false,
      isBlocked: chat.isBlockedByMe || chat.isBlockingMe,
      isAdmin: other?.isAdmin
    };
  };

  return (
    <div className="sidebar glass-panel">
      {/* Header */}
      <div className="sidebar-header">
        <div className="user-profile-summary" onClick={() => setShowProfileModal(true)}>
          <div className="user-avatar-sm">
            {user?.avatar ? (
              <img src={getAvatarUrl(user.avatar)} alt="avatar" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="user-info">
            <div className="user-name-row">
                <span className="user-name">{user?.name}</span>
                {user?.isAdmin && <span className="admin-badge">ADMIN</span>}
            </div>
            <div className="user-status">
              My Profile
            </div>
          </div>
        </div>
        
        <div className="header-actions">
            <button onClick={toggleTheme} className="action-btn" title="Toggle Theme">
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            {user?.isAdmin && (
              <button onClick={() => window.location.href="/admin"} className="action-btn" title="Admin Panel">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
              </button>
            )}
            <button onClick={logout} className="action-btn" title="Logout">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar-container">
        <input
          className="search-input"
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      {/* Action Buttons */}
      <div style={{ padding: "0 24px", marginBottom: "12px", display: "flex", gap: "10px" }}>
        <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
            onClick={() => setShowGroupModal(true)}
        >
            + New Group
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <div className={`tab-slider ${activeTab}`} />
        <button
          className={`tab-btn ${activeTab === "chats" ? "active" : ""}`}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </button>
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          All Users
        </button>
      </div>

      {/* List */}
      <div className="chat-list">
        {activeTab === "chats" ? (
          myChats.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
              No conversations yet
            </div>
          ) : (
            (() => {
                // Deduplicate 1-on-1 chats: key by participant IDs array (sorted)
                const seenPairs = new Set();
                const deduplicated = myChats.filter(chat => {
                    if (chat.isGroupChat) return true;
                    if (!chat.members || !Array.isArray(chat.members)) return false;
                    
                    // Sort members IDs to ensure [A,B] and [B,A] are treated same
                    const pairKey = chat.members
                        .map(m => typeof m === 'string' ? m : m._id)
                        .filter(Boolean)
                        .sort()
                        .join("-");
                    
                    if (!pairKey || seenPairs.has(pairKey)) return false;
                    seenPairs.add(pairKey);
                    return true;
                });

                return deduplicated.map((chat) => {
                    const info = getChatInfo(chat);
                    const isActive = activeChat?._id === chat._id;
                    
                    return (
                        <div
                            key={chat._id}
                            className={`chat-item ${isActive ? "active" : ""}`}
                            onClick={() => {
                                console.debug("Sidebar: click chat", chat._id);
                                setActiveChat(chat);
                            }}
                        >
                            <div className="user-avatar-sm" style={{ 
                                background: info.isGroup ? "#ec4899" : (info.online ? "#22c55e" : "#6366f1") 
                            }}>
                                {info.isGroup ? "#" : (
                                    info.avatarLink ? (
                                        <img src={getAvatarUrl(info.avatarLink)} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                    ) : info.avatar
                                )}
                            </div>
                            <div className="chat-info">
                                <div className="chat-name-row">
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <span className="chat-name">{info.name}</span>
                                        {info.isAdmin && <span className="admin-badge">ADMIN</span>}
                                    </div>
                                    {info.isBlocked && <span className="blocked-tag">Blocked</span>}
                                </div>
                                <div className="chat-last-msg-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div className="chat-last-msg">
                                        {chat.lastMessage || "Start a conversation"}
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <div className="unread-badge">
                                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                                        </div>
                                    )}
                                    <button 
                                        className="delete-chat-btn" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Are you sure you want to delete this chat? All messages will be permanently deleted and the chat will be hidden until new activity.")) {
                                                onHideChat(chat._id);
                                            }
                                        }}
                                        title="Delete Chat"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                });
            })()
          )
        ) : (
          filteredUsers.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
              No other users found
            </div>
          ) : (
          filteredUsers.map((u) => (
            <div
              key={u._id}
              className="chat-item"
              onClick={() => {
                console.debug("Sidebar: click user", u._id);
                startChatWithUser(u._id);
              }}
            >
             <div className="user-avatar-sm" style={{ background: "#ec4899" }}>
                {u.avatar ? (
                  <img src={getAvatarUrl(u.avatar)} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  u.name.charAt(0).toUpperCase()
                )}
             </div>
              <div className="chat-info">
                <div className="chat-name-row">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <div className="chat-name">{u.name}</div>
                        {u.isAdmin && <span className="admin-badge">ADMIN</span>}
                    </div>
                    {isBlocked(u._id) && <span className="blocked-tag">Blocked</span>}
                </div>
                <div className="chat-last-msg">{isBlocked(u._id) ? "Blocked contact" : "Available"}</div>
              </div>
            </div>
          ))
          )
        )}
      </div>

      {showGroupModal && (
        <CreateGroupModal 
            onClose={() => setShowGroupModal(false)}
            users={users}
            onGroupCreated={(newChat) => {
                // If it's a group, newChat is the group object
                onNewGroup(newChat);
                setShowGroupModal(false);
            }}
        />
      )}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
});

export default Sidebar;
