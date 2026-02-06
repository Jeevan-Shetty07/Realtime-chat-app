import { useState, useRef, useContext, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { uploadFile } from "../../api/uploadApi";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const ProfileModal = ({ onClose, isForced = false }) => {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [about, setAbout] = useState(user?.about || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [usernameError, setUsernameError] = useState("");

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
      alert("Failed to upload image. Check console for details.");
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

  const handleSave = async () => {
    if (!name.trim()) {
        alert("Name is required");
        return;
    }
    if (!username.trim()) {
        alert("Username is required");
        return;
    }
    if (username.length < 3) {
        alert("Username must be at least 3 characters");
        return;
    }
    
    try {
      console.log("💾 Attempting to save profile...", { name, username, about, avatar });
      setLoading(true);

      const { data } = await API.put("/api/users/profile", {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        about,
        avatar
      });
      
      console.log("✅ Profile save response:", data);
      setUser(data.user);
      alert("Profile updated successfully!");
      if (!isForced) onClose();
    } catch (error) {
      console.error("❌ Update profile failed detailed:", error.response?.data || error.message);
      const errorMsg = error?.response?.data?.message || "Failed to update profile";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={!isForced ? onClose : undefined}>
      <div className="modal-content profile-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{isForced ? "Welcome! Complete Your Profile" : "My Profile"}</div>
          {!isForced && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>

        <div className="profile-edit-body">
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
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
