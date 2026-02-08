import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { getAvatarUrl } from "../../utils/imageHelper";

const ViewUserModal = ({ user, onClose }) => {
  if (!user) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
        <div className="modal-header" style={{ justifyContent: "flex-end", marginBottom: "0" }}>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="avatar-edit-container" style={{ marginBottom: "20px" }}>
            <div className="avatar-main" style={{ cursor: "default", borderColor: "var(--accent-color)" }}>
              {user.avatar ? (
                <img src={getAvatarUrl(user.avatar)} alt="avatar" />
              ) : (
                <div className="avatar-placeholder">
                    {(user.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
        </div>

        <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user.name}
            {user.isAdmin && <span className="admin-badge">ADMIN</span>}
        </h2>
        
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "1rem" }}>
            @{user.username || "username"}
        </p>

        <div style={{ 
            background: "rgba(0,0,0,0.2)", 
            padding: "20px", 
            borderRadius: "20px",
            textAlign: "left",
            border: "1px solid var(--glass-border)"
        }}>
            <h4 style={{ 
                fontSize: "0.85rem", 
                textTransform: "uppercase", 
                letterSpacing: "1px", 
                color: "var(--text-secondary)",
                marginBottom: "8px"
            }}>
                About
            </h4>
            <p style={{ 
                color: "var(--text-primary)", 
                lineHeight: "1.6",
                fontSize: "1rem",
                whiteSpace: "pre-wrap"
            }}>
                {user.about || "No bio available."}
            </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewUserModal;
