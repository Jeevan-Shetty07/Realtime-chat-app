import { useState } from "react";
import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { getAvatarUrl } from "../../utils/imageHelper";
import { createGroupChat } from "../../api/chatApi";
import { useNotification } from "../../context/NotificationContext";

const CreateGroupModal = ({ onClose, users, onGroupCreated }) => {
  const { addNotification } = useNotification();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectUser = (user) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreate = async () => {
    if (!groupName) {
        addNotification("Please enter a group name", "warning");
        return;
    }
    if (selectedUsers.length < 2) {
        addNotification("Select at least 2 members", "warning");
        return;
    }

    try {
      setLoading(true);
      const userIds = selectedUsers.map((u) => u._id);
      
      const data = await createGroupChat({ name: groupName, users: JSON.stringify(userIds) });
      
      addNotification("Group created successfully!", "success");
      onGroupCreated(data);
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
      addNotification("Failed to create group", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <div className="modal-title">Create Group Chat</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-edit-body">
            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label className="input-label">Group Name</label>
              <div className="input-wrapper">
                  <input
                    className="chat-input"
                    placeholder="Enter a name (e.g. Project Team)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    style={{ background: "transparent", width: "100%" }}
                  />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">
                  Members <span style={{ color: "var(--accent-color)", marginLeft: "4px" }}>({selectedUsers.length} selected)</span>
              </label>
              
              <div className="chip-container">
                {selectedUsers.map((u) => (
                    <div key={u._id} className="user-chip">
                        <span>{u.name}</span>
                        <span className="chip-remove" onClick={() => handleSelectUser(u)}>✕</span>
                    </div>
                ))}
              </div>

              <div className="input-wrapper" style={{ marginBottom: "16px", borderRadius: "14px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    className="chat-input"
                    placeholder="Search users to add..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ background: "transparent", width: "100%", padding: "4px 8px" }}
                  />
              </div>

              <div className="user-selection-list">
                {filteredUsers.length > 0 ? filteredUsers.map((u) => {
                     const isSelected = selectedUsers.some((sel) => sel._id === u._id);
                     const displayUsername = u.username || u.name.toLowerCase().replace(/\s+/g, '_');
                     return (
                        <div 
                            key={u._id} 
                            className={`user-select-item ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSelectUser(u)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div className="user-avatar-sm" style={{ width: "40px", height: "40px", fontSize: "1rem", background: isSelected ? "var(--accent-color)" : "rgba(255,255,255,0.1)" }}>
                                    {u.avatar ? <img src={getAvatarUrl(u.avatar)} alt="avatar" /> : u.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: "600" }}>{u.name}</span>
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>@{displayUsername}</span>
                                </div>
                            </div>
                            {isSelected && (
                                <div className="selected-indicator">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                            )}
                        </div>
                     );
                }) : (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔍</div>
                        <p>No users found matching your search</p>
                    </div>
                )}
              </div>
            </div>
        </div>

        <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
                className={`btn btn-primary ${loading ? "btn-loading" : ""}`} 
                onClick={handleCreate}
                disabled={!groupName.trim() || selectedUsers.length < 2 || loading}
            >
                {loading ? (
                    <>
                        <div className="spinner-xs"></div>
                        <span>Creating...</span>
                    </>
                ) : "Create Group"}
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CreateGroupModal;
