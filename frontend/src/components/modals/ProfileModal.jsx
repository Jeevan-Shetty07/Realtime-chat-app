import { useState, useRef, useContext, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { uploadFile } from "../../api/uploadApi";
import API, { setAuthToken } from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { getBlockedUsersApi } from "../../api/authApi";
import ConfirmModal from "./ConfirmModal";
import { useNotification } from "../../context/NotificationContext";

const ProfileModal = ({ onClose, isForced = false }) => {
  const { user, setUser, deleteAccount, unblockUser } = useContext(AuthContext);
  const { addNotification } = useNotification();
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [about, setAbout] = useState(user?.about || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" or "blocked"
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
      type: "danger"
  });

  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      console.log("📸 Starting avatar upload for file:", file.name);
      setUploading(true);
      
      const { imageUrl, url } = await uploadFile(file);
      console.log("✅ Avatar uploaded successfully:", url || imageUrl);
      setAvatar(url || imageUrl);
    } catch (error) {
      console.error("❌ Avatar upload failed detailed:", error.response?.data || error.message);
      addNotification("Failed to upload image. Check console for details.", "error");
    } finally {
      setUploading(false);
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_API_BASE_URL}${path}`;
  };

  const checkUsernameAvailability = async (val) => {
      const trimmed = val.trim().toLowerCase();
      if (trimmed.length < 3) return;

      try {
          setCheckingAvailability(true);
          const { data } = await API.get(`/api/users/check-username?username=${trimmed}`);
          if (data.available) {
              setUsernameError("");
              setSuggestions([]);
          } else {
              setUsernameError("Username is already taken");
              setSuggestions(data.suggestions || []);
          }
      } catch (err) {
          console.error("Check username error", err);
      } finally {
          setCheckingAvailability(false);
      }
  };

  const timeoutRef = useRef(null);

  const handleUsernameChange = (e) => {
      const val = e.target.value.replace(/\s/g, "");
      setUsername(val);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (val.length >= 3) {
          timeoutRef.current = setTimeout(() => checkUsernameAvailability(val), 500);
      } else {
          setSuggestions([]);
          setUsernameError("");
      }
  };

  const { getToken } = useAuth();

  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const data = await getBlockedUsersApi();
      setBlockedUsers(data);
    } catch (err) {
      console.error("Fetch blocked users error", err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    if (activeTab === "blocked") {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  const handleSave = async () => {
    if (!name.trim()) {
        addNotification("Name is required", "warning");
        return;
    }
    if (!username.trim()) {
        addNotification("Username is required", "warning");
        return;
    }
    if (username.length < 3) {
        addNotification("Username must be at least 3 characters", "warning");
        return;
    }
    
    try {
      console.log("💾 Attempting to save profile...", { name, username, about, avatar });
      setLoading(true);

      // Refresh token to ensure it's valid
      const token = await getToken();
      if (token) setAuthToken(token);

      const { data } = await API.put("/api/users/profile", {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        about,
        avatar
      });
      
      console.log("✅ Profile save response:", data);
      setUser(data.user);
      addNotification("Profile updated successfully!", "success");
      if (!isForced) onClose();
    } catch (error) {
      console.error("❌ Update profile failed detailed:", error.response?.data || error.message);
      const errorMsg = error?.response?.data?.message || "Failed to update profile";
      addNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setConfirmModal({
        isOpen: true,
        title: "Delete Account",
        message: "ARE YOU SURE? This will permanently delete your account and all data. This action cannot be undone.",
        type: "danger",
        onConfirm: async () => {
            try {
                setLoading(true);
                await deleteAccount();
                addNotification("Account deleted", "info");
                onClose();
            } catch (error) {
                addNotification("Failed to delete account. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        }
    });
  };

  const handleUnblockClick = async (uid) => {
    try {
      await unblockUser(uid);
      setBlockedUsers(prev => prev.filter(u => u._id !== uid));
      addNotification("User unblocked", "success");
    } catch (err) {
      addNotification("Failed to unblock", "error");
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={!isForced ? onClose : undefined}>
      <div className="modal-content profile-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{isForced ? "Welcome! Complete Your Profile" : "My Settings"}</div>
          {!isForced && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>

        {!isForced && (
            <div className="modal-tabs">
                <button 
                    className={`modal-tab ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    Profile
                </button>
                <button 
                    className={`modal-tab ${activeTab === "blocked" ? "active" : ""}`}
                    onClick={() => setActiveTab("blocked")}
                >
                    Blocked Users
                </button>
            </div>
        )}

        <div className="profile-edit-body">
          {activeTab === "profile" ? (
            <>
              <div className="avatar-edit-container">
                <div className="avatar-main" onClick={handleAvatarClick} title="Click to change photo">
                  {avatar ? (
                    <img src={getAvatarUrl(avatar)} alt="avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                        {(name || user?.name || user?.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="avatar-overlay">
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                </div>
                <p className="avatar-hint">Click to upload profile photo</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {uploading && <div className="uploading-spinner">Uploading...</div>}
              </div>

              <div className="form-group">
                <label className="input-label">Username (Unique) *</label>
                <input 
                  className={`search-input ${usernameError ? "input-error" : ""}`} 
                  value={username} 
                  onChange={handleUsernameChange}
                  placeholder="e.g. john_doe"
                  autoComplete="off"
                />
                {checkingAvailability && <small className="status-hint">Checking availability...</small>}
                {usernameError && <small className="error-text">{usernameError}</small>}
                
                {suggestions.length > 0 && (
                    <div className="suggestions-container">
                        <p>Suggestions:</p>
                        <div className="suggestion-chips">
                            {suggestions.map(s => (
                                <span key={s} className="suggestion-chip" onClick={() => setUsername(s)}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
              </div>

              <div className="form-group">
                <label className="input-label">Full Name *</label>
                <input 
                  className="search-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label className="input-label">About (Bio)</label>
                <textarea 
                  className="chat-input bio-textarea" 
                  style={{ height: "60px", resize: "none" }}
                  value={about} 
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell others about yourself..."
                />
              </div>

              <button 
                className={`btn btn-primary continue-btn ${loading ? "btn-loading" : ""}`} 
                onClick={handleSave}
                disabled={loading || uploading || !!usernameError || username.length < 3}
              >
                {loading && <div className="btn-spinner"></div>}
                <span>{loading ? "Saving Profile..." : isForced ? "Let's Go!" : "Save Changes"}</span>
              </button>

              {!isForced && (
                <div className="account-danger-zone">
                  <div className="auth-divider"><span>Danger Zone</span></div>
                  <button 
                    className="delete-account-btn" 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                  >
                    Delete Account
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="blocked-list-container">
               {loadingBlocked ? (
                   <p>Loading blocked users...</p>
               ) : blockedUsers.length === 0 ? (
                   <div className="empty-blocked">
                       <p>You haven't blocked anyone yet.</p>
                   </div>
               ) : (
                   <div className="blocked-items">
                       {blockedUsers.map(u => (
                           <div key={u._id} className="blocked-item">
                               <div className="blocked-user-info">
                                   <div className="user-avatar-xs">
                                       {u.avatar ? <img src={getAvatarUrl(u.avatar)} alt="avatar" /> : u.name.charAt(0).toUpperCase()}
                                   </div>
                                   <span>{u.name}</span>
                               </div>
                               <button className="unblock-btn-sm" onClick={() => handleUnblockClick(u._id)}>Unblock</button>
                           </div>
                       ))}
                   </div>
               )}
            </div>
          )}
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

export default ProfileModal;
