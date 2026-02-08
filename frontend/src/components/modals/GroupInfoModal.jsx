import { useState } from "react";
import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { getAvatarUrl } from "../../utils/imageHelper";
import { addToGroup, removeFromGroup, renameGroup } from "../../api/chatApi";
import ConfirmModal from "./ConfirmModal";

const GroupInfoModal = ({ chat, onClose, onUpdate, allUsers, currentUser }) => {
  const [activeTab, setActiveTab] = useState("info"); // 'info' or 'add'
  const [search, setSearch] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingExit, setLoadingExit] = useState(false);
  const [loadingRename, setLoadingRename] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(chat.chatName);
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
            } catch (error) {
                console.error("Leave group error:", error);
                alert("Failed to leave group");
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
        // Switch back to info
        setActiveTab("info");
    } catch (error) {
        console.error("Add member error:", error);
        alert("Failed to add member");
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
        setEditingName(false);
    } catch (error) {
        console.error("Rename error:", error);
        alert("Failed to rename group");
    } finally {
        setLoadingRename(false);
    }
  };

  const memberIds = chat.members.map(m => m._id);
  const eligibleUsers = allUsers.filter(u => !memberIds.includes(u._id) && u.name.toLowerCase().includes(search.toLowerCase()));

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Group Info</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Header Info */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div className="avatar-main" style={{ margin: "0 auto 10px", width: "80px", height: "80px", fontSize: "1.5rem" }}>
                <div style={{ width: "100%", height: "100%", background: "#ec4899", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                    #
                </div>
            </div>
            
            {editingName ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                    <input 
                        className="glass-input" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)}
                        autoFocus
                        style={{ textAlign: "center", width: "200px" }}
                    />
                    <button className="glass-btn" onClick={handleRename}>✓</button>
                    <button className="glass-btn" onClick={() => setEditingName(false)}>✕</button>
                </div>
            ) : (
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {chat.chatName}
                    <button className="icon-btn" style={{ fontSize: "1rem", opacity: 0.7 }} onClick={() => setEditingName(true)}>✏️</button>
                </h2>
            )}
            <p style={{ color: "var(--text-secondary)" }}>{chat.members.length} members</p>
        </div>

        {/* Tabs */}
        <div className="tabs-nav" style={{ marginBottom: "16px" }}>
            <button className={`tab-btn ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>Members</button>
            <button className={`tab-btn ${activeTab === "add" ? "active" : ""}`} onClick={() => setActiveTab("add")}>Add Members</button>
        </div>

        {/* Content */}
        <div style={{ height: "300px", overflowY: "auto", paddingRight: "4px" }}>
            {activeTab === "info" ? (
                <div className="list-col">
                    {chat.members.map(m => (
                        <div key={m._id} className="group-user-item" style={{ cursor: "default" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div className="user-avatar-sm">
                                    {m.avatar ? <img src={getAvatarUrl(m.avatar)} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : (m.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                                        {m.name} {m._id === currentUser._id && "(You)"}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                        {chat.groupAdmins.some(a => a._id === m._id) ? "Admin" : "Member"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div>
                   <input
                        className="search-input"
                        placeholder="Search users to add..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ marginBottom: "12px" }}
                    />
                    {eligibleUsers.length === 0 ? (
                        <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "20px" }}>No users found</div>
                    ) : (
                        eligibleUsers.map(u => (
                            <div key={u._id} className="group-user-item">
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div className="user-avatar-sm">
                                        {u.avatar ? <img src={getAvatarUrl(u.avatar)} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ color: "var(--text-primary)", fontWeight: "600" }}>{u.name}</div>
                                </div>
                                <button 
                                    className="add-btn-small" 
                                    onClick={() => handleAddMember(u._id)}
                                    disabled={loadingAdd}
                                >
                                    {loadingAdd ? "..." : "+ Add"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>

        <div style={{ marginTop: "24px" }}>
            <button 
                className="btn-danger" 
                onClick={handleLeaveGroup}
                disabled={loadingExit}
            >
                {loadingExit ? "Leaving..." : "Exit Group"}
            </button>
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
