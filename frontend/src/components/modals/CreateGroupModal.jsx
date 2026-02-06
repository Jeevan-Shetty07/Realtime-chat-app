import { useState } from "react";
import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { createGroupChat } from "../../api/chatApi";

const CreateGroupModal = ({ onClose, users, onGroupCreated }) => {
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
    if (!groupName || selectedUsers.length < 2) return;

    try {
      setLoading(true);
      const userIds = selectedUsers.map((u) => u._id);
      
      const data = await createGroupChat({ name: groupName, users: JSON.stringify(userIds) });
      
      onGroupCreated(data);
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group");
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

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", color: "#94a3b8", marginBottom: "8px", fontSize: "0.9rem" }}>Group Name</label>
          <input
            className="search-input"
            placeholder="e.g. Project Team"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", color: "#94a3b8", marginBottom: "8px", fontSize: "0.9rem" }}>Select Members</label>
          
          {/* Chips */}
          <div className="chip-container">
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

          <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "8px" }}>
            {filteredUsers.map((u) => {
                 const isSelected = selectedUsers.some((sel) => sel._id === u._id);
                 return (
                    <div 
                        key={u._id} 
                        className={`user-select-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectUser(u)}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="user-avatar-sm" style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: "white", fontSize: "0.9rem" }}>{u.name}</span>
                        </div>
                        {isSelected && <span style={{ color: "#6366f1" }}>✓</span>}
                    </div>
                 );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
                className="btn btn-primary" 
                onClick={handleCreate}
                disabled={!groupName || selectedUsers.length < 2 || loading}
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
