import { useState } from "react";
import ReactDOM from "react-dom";
import "../../styles/Chat.css";
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create Group Chat</div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="profile-edit-body">
            <div className="form-group">
              <label className="input-label">Group Name</label>
              <input
                className="search-input"
                placeholder="e.g. Project Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Select Members ({selectedUsers.length} selected)</label>
              
              <div className="chip-container" style={{ minHeight: selectedUsers.length > 0 ? "auto" : "0", margin: selectedUsers.length > 0 ? "10px 0" : "0" }}>
                {selectedUsers.map((u) => (
                    <div key={u._id} className="user-chip">
                        {u.name}
                        <span className="chip-remove" onClick={() => handleSelectUser(u)}>✕</span>
                    </div>
                ))}
              </div>

              <input
                className="search-input"
                placeholder="Search users to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: "12px" }}
              />

              <div className="user-selection-list" style={{ maxHeight: "250px", overflowY: "auto", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                {filteredUsers.length > 0 ? filteredUsers.map((u) => {
                     const isSelected = selectedUsers.some((sel) => sel._id === u._id);
                     return (
                        <div 
                            key={u._id} 
                            className={`user-select-item ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSelectUser(u)}
                            style={{ padding: "10px 15px", transition: "background 0.2s" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div className="user-avatar-sm" style={{ width: "36px", height: "36px", fontSize: "0.9rem" }}>
                                    {u.avatar ? <img src={u.avatar.startsWith('http') ? u.avatar : `${import.meta.env.VITE_API_BASE_URL}${u.avatar}`} alt="avatar" style={{width: '100%', height: '100%', borderRadius: '50%'}} /> : u.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ color: "white", fontSize: "0.95rem", fontWeight: "500" }}>{u.name}</span>
                                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>@{u.username || "user"}</span>
                                </div>
                            </div>
                            {isSelected && <div className="selected-indicator">✓</div>}
                        </div>
                     );
                }) : (
                    <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "20px" }}>No users found</p>
                )}
              </div>
            </div>
        </div>

        <div className="modal-footer" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: "10px 20px" }}>Cancel</button>
            <button 
                className={`btn btn-primary ${loading ? "btn-loading" : ""}`} 
                onClick={handleCreate}
                disabled={!groupName || selectedUsers.length < 2 || loading}
                style={{ padding: "10px 25px" }}
            >
                {loading ? "Creating..." : "Create Group"}
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CreateGroupModal;
