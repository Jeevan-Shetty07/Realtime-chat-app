import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api/axios";
import { getAvatarUrl } from "../utils/imageHelper";
import "../styles/Chat.css";
import ConfirmModal from "../components/modals/ConfirmModal";
import { useNotification } from "../context/NotificationContext";
import { getAllSupportIssues, updateSupportIssue } from "../api/supportApi";
import ReplyModal from "../components/modals/ReplyModal";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [issues, setIssues] = useState([]);
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
  const [replyModal, setReplyModal] = useState({
      isOpen: false,
      issue: null
  });
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        if (activeTab === "users") {
          const { data } = await API.get("/api/auth/admin/users");
          setUsers(data);
        } else if (activeTab === "groups") {
          const { data } = await API.get("/api/auth/admin/groups");
          setGroups(data);
        } else if (activeTab === "support") {
          console.log("AdminDashboard: Fetching support issues...");
          const data = await getAllSupportIssues();
          console.log("AdminDashboard: Support issues received:", data);
          setIssues(data);
        }
      } catch (err) {
        console.error("AdminDashboard: Fetch error:", err);
        setError(`Failed to fetch ${activeTab}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleToggleAdmin = async (id) => {
    try {
      const { data } = await API.put(`/api/auth/admin/users/${id}/role`);
      setUsers(users.map(u => u._id === id ? data.user : u));
    } catch (err) {
      addNotification("Failed to update user role", "error");
    }
  };

  const handleDeleteUser = (id) => {
    setConfirmModal({
        isOpen: true,
        title: "Delete User",
        message: "Are you sure? This action is permanent.",
        type: "danger",
        onConfirm: async () => {
            try {
                await API.delete(`/api/auth/admin/users/${id}`);
                setUsers(users.filter(u => u._id !== id));
            } catch (err) {
                addNotification("Failed to delete user", "error");
            }
        }
    });
  };

  const handleDeleteGroup = (id) => {
    setConfirmModal({
        isOpen: true,
        title: "Delete Group",
        message: "Are you sure? This will remove all messages.",
        type: "danger",
        onConfirm: async () => {
            try {
                await API.delete(`/api/auth/admin/groups/${id}`);
                setGroups(groups.filter(g => g._id !== id));
            } catch (err) {
                addNotification("Failed to delete group", "error");
            }
        }
    });
  };

  const handleUpdateIssueStatus = async (id, status) => {
    try {
      const updated = await updateSupportIssue(id, { status });
      setIssues(issues.map(i => i._id === id ? { ...i, status: updated.status } : i));
      addNotification(`Status updated to ${status}`, "success");
    } catch (err) {
      addNotification("Failed to update status", "error");
    }
  };

  const handleRespondToIssue = (issue) => {
    setReplyModal({ isOpen: true, issue });
  };

  const handleSendReply = async (text) => {
    if (!replyModal.issue) return;
    
    try {
      const updated = await updateSupportIssue(replyModal.issue._id, { adminResponse: text });
      setIssues(issues.map(i => i._id === replyModal.issue._id ? { ...i, adminResponse: updated.adminResponse } : i));
      setReplyModal({ isOpen: false, issue: null });
      
      // Show success card
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 3000);
      
      addNotification("Reply sent successfully", "success");
    } catch (err) {
      addNotification("Failed to save response", "error");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredGroups = groups.filter(g => 
    g.chatName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIssues = Array.isArray(issues) ? issues.filter(i => 
    i.subject?.toLowerCase().includes(search.toLowerCase()) ||
    (i.user?.name && i.user.name.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  if (!user?.isAdmin) {
    return (
      <div className="onboarding-screen">
          <div className="chat-bg"></div>
          <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
            <h2 style={{ color: "#ef4444" }}>Access Denied</h2>
            <button className="btn btn-primary" onClick={() => window.location.href="/"}>Back Home</button>
          </div>
      </div>
    );
  }

  const renderContent = () => {
    if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    if (activeTab === "users") {
      return (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="user-avatar-sm">{u.avatar ? <img src={getAvatarUrl(u.avatar)} alt="" /> : u.name[0]}</div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge ${u.isAdmin ? 'admin' : 'user'}`}>{u.isAdmin ? 'Admin' : 'User'}</span></td>
                  <td>
                    <div className="admin-actions">
                      <button onClick={() => handleToggleAdmin(u._id)} className="action-btn-sm">Role</button>
                      {u._id !== user._id && <button onClick={() => handleDeleteUser(u._id)} className="action-btn-sm delete">Del</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "groups") {
      return (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>Group</th><th>Members</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredGroups.map(g => (
                <tr key={g._id}>
                  <td>{g.chatName}</td>
                  <td>{g.members?.length || 0}</td>
                  <td>
                    <button onClick={() => handleDeleteGroup(g._id)} className="action-btn-sm delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "support") {
      return (
        <div className="admin-table-wrapper">
          <div style={{ padding: "10px", background: "rgba(255,255,255,0.1)", textAlign: "center", fontWeight: "bold", color: "var(--accent-color)" }}>
            Support Issues Tab Active (Total: {issues?.length || 0})
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Issue</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredIssues.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No issues found matching search.</td></tr>
              )}
              {filteredIssues.map(i => (
                <tr key={i._id}>
                  <td>{i.user?.name || "Unknown"}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{i.subject}</div>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>{i.message}</div>
                  </td>
                  <td>
                    <select value={i.status} onChange={(e) => handleUpdateIssueStatus(i._id, e.target.value)} className={`role-badge ${i.status}`}>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleRespondToIssue(i)} className="action-btn-sm">Reply</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="chat-bg"></div>
      <div className="admin-content glass-panel">
        <div className="admin-header">
          <h1 className="auth-title">Admin Dashboard</h1>
          {showSuccessCard && (
            <div className="animate-slide-down" style={{ position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 3000 }}>
              <div className="glass-card" style={{ padding: "12px 24px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", color: "white", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Reply Sent Successfully!
              </div>
            </div>
          )}
          <button className="back-btn-premium" onClick={() => window.location.href="/"}>Back</button>
        </div>

        <div className="admin-tabs">
          {["users", "groups", "support"].map(tab => (
            <button 
                key={tab} 
                className={`admin-tab ${activeTab === tab ? "active" : ""}`} 
                onClick={() => {
                    setActiveTab(tab);
                    setSearch("");
                }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="admin-controls">
          <input className="search-input" placeholder={`Search ${activeTab}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {renderContent()}
      </div>

      <ReplyModal 
        isOpen={replyModal.isOpen}
        subject={replyModal.issue?.subject}
        initialValue={replyModal.issue?.adminResponse}
        onClose={() => setReplyModal({ isOpen: false, issue: null })}
        onConfirm={handleSendReply}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))} 
        onConfirm={confirmModal.onConfirm} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard-container { min-height: 100vh; padding: 40px; position: relative; display: flex; justify-content: center; }
        .admin-content { width: 100%; max-width: 1200px; padding: 40px; display: flex; flex-direction: column; gap: 24px; z-index: 1; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; }
        .admin-tabs { display: flex; gap: 16px; border-bottom: 1px solid var(--glass-border); }
        .admin-tab { background: none; border: none; padding: 12px; cursor: pointer; color: var(--text-secondary); font-weight: 600; }
        .admin-tab.active { color: var(--accent-color); border-bottom: 2px solid var(--accent-color); }
        .admin-table-wrapper { border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--glass-border); }
        .admin-user-cell { display: flex; align-items: center; gap: 12px; }
        .role-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .role-badge.admin { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
        .role-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .role-badge.resolved { background: rgba(16, 185, 129, 0.1); color: #10b881; }
        .admin-actions { display: flex; gap: 8px; }
        .action-btn-sm { padding: 6px 12px; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); cursor: pointer; }
        .action-btn-sm.delete:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
      `}} />
    </div>
  );
};

export default AdminDashboard;
