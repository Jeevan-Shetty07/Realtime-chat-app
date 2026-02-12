import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api/axios";
import { getAvatarUrl } from "../utils/imageHelper";
import "../styles/Chat.css";
import ConfirmModal from "../components/modals/ConfirmModal";
import { deleteGroupChat } from "../api/chatApi";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // "users" or "groups"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
      type: "danger"
  });

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchGroups();
    }
  }, [activeTab]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/api/auth/admin/groups");
      setGroups(data);
    } catch (err) {
      setError("Failed to fetch groups");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/api/auth/admin/users");
      setUsers(data);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setConfirmModal({
        isOpen: true,
        title: "Delete User",
        message: "Are you sure you want to delete this user? This action is permanent.",
        type: "danger",
        onConfirm: async () => {
            try {
                await API.delete(`/api/auth/admin/users/${id}`);
                setUsers(users.filter(u => u._id !== id));
            } catch (err) {
                alert("Failed to delete user");
            }
        }
    });
  };

  const handleToggleAdmin = async (id) => {
    try {
      const { data } = await API.put(`/api/auth/admin/users/${id}/role`);
      setUsers(users.map(u => u._id === id ? data.user : u));
    } catch (err) {
      alert("Failed to update user role");
    }
  };

  const handleDeleteGroup = async (id) => {
    setConfirmModal({
        isOpen: true,
        title: "Delete Group",
        message: "Are you sure you want to delete this group? This will remove all messages and is irreversible.",
        type: "danger",
        onConfirm: async () => {
            try {
                await API.delete(`/api/auth/admin/groups/${id}`);
                setGroups(groups.filter(g => g._id !== id));
            } catch (err) {
                console.error("Group deletion error:", err);
                alert(`Failed to delete group: ${err.response?.data?.message || err.message}`);
            }
        }
    });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredGroups = groups.filter(g => 
    g.chatName.toLowerCase().includes(search.toLowerCase())
  );

  if (!user?.isAdmin) {
    return (
      <div className="onboarding-screen">
          <div className="chat-bg"></div>
          <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
            <h2 style={{ color: "#ef4444" }}>Access Denied</h2>
            <p>You do not have permission to view this page.</p>
            <button className="btn btn-primary" onClick={() => window.location.href="/"}>Back to Home</button>
          </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="chat-bg"></div>
      
      <div className="admin-content glass-panel">
        <div className="admin-header">
          <div>
            <h1 className="auth-title" style={{ fontSize: "2rem", margin: 0 }}>System Administration</h1>
            <p className="auth-subtitle">Manage users, groups, and roles</p>
          </div>
          <button className="back-btn-premium" onClick={() => window.location.href="/"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Chat
          </button>
        </div>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users ({users.length})
          </button>
          <button 
            className={`admin-tab ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => setActiveTab("groups")}
          >
            Groups ({groups.length})
          </button>
        </div>

        <div className="admin-controls">
          <input 
            className="search-input" 
            placeholder={activeTab === "users" ? "Search users by name..." : "Search groups by name..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "400px" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading {activeTab}...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : activeTab === "users" ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email / Username</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="user-avatar-sm">
                          {u.avatar ? (
                            <img src={getAvatarUrl(u.avatar)} alt="avatar" />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "14px" }}>{u.email}</div>
                      <div style={{ fontSize: "12px", opacity: 0.6 }}>@{u.username || "no-username"}</div>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`role-badge ${u.isAdmin ? "admin" : "user"}`}>
                        {u.isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button 
                          className="action-btn-sm" 
                          onClick={() => handleToggleAdmin(u._id)}
                          title={u.isAdmin ? "Remove Admin" : "Make Admin"}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                        </button>
                        {u._id !== user._id && (
                          <button 
                            className="action-btn-sm delete" 
                            onClick={() => handleDeleteUser(u._id)}
                            title="Delete User"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-table-wrapper">
             <table className="admin-table">
               <thead>
                 <tr>
                   <th>Group Name</th>
                   <th>Members</th>
                   <th>Admins</th>
                   <th>Created</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredGroups.map((g) => (
                   <tr key={g._id}>
                     <td>
                        <div className="admin-user-cell">
                          <div className="user-avatar-sm" style={{ background: "var(--accent-gradient)" }}>
                            {g.groupImage ? (
                                <img src={getAvatarUrl(g.groupImage)} alt="group" />
                            ) : (
                                g.chatName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>{g.chatName}</span>
                        </div>
                     </td>
                     <td>
                        <div style={{ fontSize: "14px", fontWeight: "600" }}>{g.members?.length || 0} Members</div>
                        <div style={{ fontSize: "12px", opacity: 0.6, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.members?.map(m => m.name).join(", ")}
                        </div>
                     </td>
                     <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {g.groupAdmins?.map(admin => (
                                <span key={admin._id} className="role-badge admin" style={{ fontSize: "10px", padding: "2px 8px" }}>
                                    {admin.name}
                                </span>
                            ))}
                        </div>
                     </td>
                     <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                     <td>
                       <div className="admin-actions">
                         <button 
                           className="action-btn-sm delete" 
                           onClick={() => handleDeleteGroup(g._id)}
                           title="Delete Group"
                         >
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard-container {
          min-height: 100vh;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          position: relative;
        }
        .admin-content {
          width: 100%;
          max-width: 1200px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          animation: slideUp 0.6s var(--ease-smooth);
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .admin-tabs {
          display: flex;
          gap: 20px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 10px;
        }
        .admin-tab {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 16px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: 0.3s;
          position: relative;
        }
        .admin-tab.active {
          color: var(--accent-color);
        }
        .admin-tab.active::after {
          content: '';
          position: absolute;
          bottom: -11px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--accent-color);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .admin-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .admin-table-wrapper {
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 20px;
          border: 1px solid var(--glass-border);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .admin-table td {
          padding: 16px 24px;
          border-top: 1px solid var(--glass-border);
          color: var(--text-primary);
        }
        .admin-user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .role-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .role-badge.admin {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .role-badge.user {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--glass-border);
        }
        .admin-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn-sm {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .action-btn-sm:hover {
          background: var(--glass-highlight);
          color: var(--text-primary);
          border-color: var(--accent-color);
        }
        .action-btn-sm.delete:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border-color: #ef4444;
        }
        .user-avatar-sm {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-color);
          color: white;
          font-weight: 700;
          flex-shrink: 0;
        }
        .user-avatar-sm img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}} />
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

export default AdminDashboard;
