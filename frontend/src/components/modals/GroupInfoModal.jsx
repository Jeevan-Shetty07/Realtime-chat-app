import { useState } from "react";
import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { getAvatarUrl } from "../../utils/imageHelper";
import { addToGroup, removeFromGroup, renameGroup } from "../../api/chatApi";
import { useNotification } from "../../context/NotificationContext";
import ConfirmModal from "./ConfirmModal";

const GroupInfoModal = ({ chat, onClose, onUpdate, allUsers, currentUser }) => {
  const [activeTab, setActiveTab] = useState("info"); // 'info' or 'add'
  const [search, setSearch] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingExit, setLoadingExit] = useState(false);
  const [loadingRename, setLoadingRename] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(chat.chatName);
  const { addNotification } = useNotification();
  const [loadingKick, setLoadingKick] = useState(null); // stores user ID being kicked
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
      type: "danger"
  });

  if (!chat) return null;

  const isAdmin = chat.groupAdmins?.some(a => a._id === currentUser._id) || false;

  const handleLeaveGroup = async () => {
    setConfirmModal({
        isOpen: true,
        title: "Exit Group",
        message: "Are you sure you want to leave this group?",
        type: "danger",
        onConfirm: async () => {
            try {
                setLoadingExit(true);
                const updated = await removeFromGroup(chat._id, currentUser._id);
                onUpdate(updated, true); // true = 'left'
                onClose();
                addNotification("You left the group", "info");
            } catch (error) {
                console.error("Leave group error:", error);
                addNotification("Failed to leave group", "error");
            } finally {
                setLoadingExit(false);
            }
        }
    });
  };

  const handleAddMember = async (userId) => {
    try {
        setLoadingAdd(true);
        const updated = await addToGroup(chat._id, userId);
        onUpdate(updated);
        addNotification("Member added successfully", "success");
        // Switch back to info
        setActiveTab("info");
    } catch (error) {
        console.error("Add member error:", error);
        addNotification("Failed to add member", "error");
    } finally {
        setLoadingAdd(false);
    }
  };

  const handleRename = async () => {
    if (!tempName.trim() || tempName === chat.chatName) {
        setEditingName(false);
        return;
    }
    try {
        setLoadingRename(true);
        const updated = await renameGroup(chat._id, tempName);
        onUpdate(updated);
        addNotification("Group renamed", "success");
        setEditingName(false);
    } catch (error) {
        console.error("Rename error:", error);
        addNotification("Failed to rename group", "error");
    } finally {
        setLoadingRename(false);
    }
  };

  const handleKickMember = async (userId, userName) => {
    setConfirmModal({
        isOpen: true,
        title: "Kick Member",
        message: `Are you sure you want to kick ${userName} from the group?`,
        type: "danger",
        onConfirm: async () => {
            try {
                setLoadingKick(userId);
                const updated = await removeFromGroup(chat._id, userId);
                onUpdate(updated);
                addNotification(`${userName} kicked from group`, "info");
            } catch (error) {
                console.error("Kick member error:", error);
                addNotification("Failed to kick member", "error");
            } finally {
                setLoadingKick(null);
            }
        }
    });
  };

  const memberIds = chat.members.map(m => m._id);
  const eligibleUsers = allUsers.filter(u => !memberIds.includes(u._id) && u.name.toLowerCase().includes(search.toLowerCase()));

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <div className="modal-title">Group Info</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-edit-body" style={{ paddingBottom: "20px" }}>
            {/* Header Info */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div className="avatar-main" style={{ margin: "0 auto 16px", width: "90px", height: "90px", fontSize: "2rem", background: "var(--accent-gradient)", boxShadow: "0 8px 20px var(--accent-glow)" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800" }}>
                        #
                    </div>
                </div>
                
                {editingName ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                        <div className="input-wrapper" style={{ width: "240px" }}>
                            <input 
                                className="chat-input" 
                                value={tempName} 
                                onChange={(e) => setTempName(e.target.value)}
                                autoFocus
                                style={{ textAlign: "center", background: "transparent", width: "100%" }}
                            />
                        </div>
                        <button className="msg-action-btn" onClick={handleRename} style={{ width: "36px", height: "36px" }}>✓</button>
                        <button className="msg-action-btn" onClick={() => setEditingName(false)} style={{ width: "36px", height: "36px" }}>✕</button>
                    </div>
                ) : (
                    <h2 style={{ fontSize: "1.6rem", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-primary)" }}>
                        {chat.chatName}
                        {isAdmin && (
                            <button className="msg-action-btn" onClick={() => setEditingName(true)} style={{ border: "none", background: "rgba(255,255,255,0.05)" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                        )}
                    </h2>
                )}
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "500" }}>{chat.members.length} members</p>
            </div>

            {/* Tabs */}
            <div className="tabs-nav" style={{ marginBottom: "20px" }}>
                <button className={`tab-btn ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>Members</button>
                <button className={`tab-btn ${activeTab === "add" ? "active" : ""}`} onClick={() => setActiveTab("add")}>Add People</button>
            </div>

            {/* Content */}
            <div style={{ height: "320px", overflowY: "auto", paddingRight: "4px" }}>
                {activeTab === "info" ? (
                    <div className="list-col" style={{ gap: "4px" }}>
                        {chat.members.map(m => (
                            <div key={m._id} className="user-select-item" style={{ cursor: "default", borderRadius: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div className="user-avatar-sm" style={{ width: "40px", height: "40px" }}>
                                        {m.avatar ? <img src={getAvatarUrl(m.avatar)} alt="avatar" /> : (m.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <div style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "0.95rem" }}>
                                            {m.name} {m._id === currentUser._id && <span style={{ color: "var(--accent-color)", marginLeft: "4px" }}>(You)</span>}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>
                                            {chat.groupAdmins.some(a => a._id === m._id) ? "Admin" : "Member"}
                                        </div>
                                    </div>
                                </div>
                                
                                {isAdmin && m._id !== currentUser._id && !chat.groupAdmins.some(a => a._id === m._id) && (
                                    <button 
                                        className={`kick-btn-small ${loadingKick === m._id ? "loading" : ""}`} 
                                        onClick={() => handleKickMember(m._id, m.name)}
                                        disabled={loadingKick === m._id}
                                    >
                                        {loadingKick === m._id ? "..." : "Kick"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                       <div className="input-wrapper" style={{ marginBottom: "16px", borderRadius: "14px" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          <input
                            className="chat-input"
                            placeholder="Find users to add..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ background: "transparent", width: "100%", padding: "4px 8px" }}
                          />
                      </div>
                        {eligibleUsers.length === 0 ? (
                            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔍</div>
                                <p>No eligible users found</p>
                            </div>
                        ) : (
                            <div className="list-col" style={{ gap: "4px" }}>
                                {eligibleUsers.map(u => (
                                    <div key={u._id} className="user-select-item" style={{ borderRadius: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div className="user-avatar-sm" style={{ width: "40px", height: "40px" }}>
                                                {u.avatar ? <img src={getAvatarUrl(u.avatar)} alt="avatar" /> : u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ color: "var(--text-primary)", fontWeight: "700" }}>{u.name}</div>
                                        </div>
                                        <button 
                                            className="add-btn-small" 
                                            onClick={() => handleAddMember(u._id)}
                                            disabled={loadingAdd}
                                        >
                                            {loadingAdd ? "..." : "Add"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--glass-border)" }}>
                <button 
                    className="btn-danger" 
                    onClick={handleLeaveGroup}
                    disabled={loadingExit}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    {loadingExit ? "Leaving..." : "Exit Group"}
                </button>
            </div>
        </div>
      </div>

      <ConfirmModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
      />
    </div>,
    document.body
  );
};

export default GroupInfoModal;
