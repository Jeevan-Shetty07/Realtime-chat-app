import { useState } from "react";
import "../../styles/Chat.css";
import CreateGroupModal from "../modals/CreateGroupModal";
import ProfileModal from "../modals/ProfileModal";

const Sidebar = ({
  user,
  logout,
  onlineUsers,
  myChats,
  activeChat,
  setActiveChat,
  users,
  startChatWithUser,
  onNewGroup,
}) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' or 'users'
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const getChatInfo = (chat) => {
    if (chat.isGroupChat) {
      return {
        name: chat.chatName,
        avatar: null, // Default group avatar logic can be here
        isGroup: true,
        online: false
      };
    }
    const other = chat.members.find((m) => m._id !== user?._id);
    return {
      name: other?.name || "Unknown",
      avatarLink: other?.avatar,
      avatar: other?.name?.charAt(0).toUpperCase(),
      isGroup: false,
      online: other ? onlineUsers.includes(other._id) : false
    };
  };

  return (
    <div className="sidebar glass-panel">
      {/* Header */}
      <div className="sidebar-header">
        <div className="user-profile-summary" onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }}>
          <div className="user-avatar-sm">
            {user?.avatar ? (
              <img src={`http://localhost:5001${user.avatar}`} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontWeight: "700", color: "white" }}>{user?.name}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              My Profile
            </div>
          </div>
        </div>
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
            myChats.map((chat) => {
              const info = getChatInfo(chat);
              const isActive = activeChat?._id === chat._id;
              
              return (
                <div
                  key={chat._id}
                  className={`chat-item ${isActive ? "active" : ""}`}
                  onClick={() => setActiveChat(chat)}
                >
                  <div className="user-avatar-sm" style={{ 
                      background: info.isGroup ? "#ec4899" : (info.online ? "#22c55e" : "#6366f1") 
                  }}>
                    {info.isGroup ? "#" : (
                      info.avatarLink ? (
                        <img src={`http://localhost:5001${info.avatarLink}`} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : info.avatar
                    )}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name-row">
                        <span className="chat-name">{info.name}</span>
                    </div>
                    <div className="chat-last-msg">
                        {chat.lastMessage || "Start a conversation"}
                    </div>
                  </div>
                </div>
              );
            })
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
              onClick={() => startChatWithUser(u._id)}
            >
             <div className="user-avatar-sm" style={{ background: "#ec4899" }}>
                {u.avatar ? (
                  <img src={`http://localhost:5001${u.avatar}`} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  u.name.charAt(0).toUpperCase()
                )}
             </div>
              <div className="chat-info">
                <div className="chat-name">{u.name}</div>
                <div className="chat-last-msg">Available</div>
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
};

export default Sidebar;
