import ReactDOM from "react-dom";
import "../../styles/Chat.css";
import { getAvatarUrl } from "../../utils/imageHelper";

const ViewUserModal = ({ user, onClose }) => {
  if (!user) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", maxWidth: "460px" }}>
        <div className="modal-header" style={{ justifyContent: "flex-end", marginBottom: "0", border: "none" }}>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="avatar-edit-container" style={{ marginBottom: "28px" }}>
            <div className="avatar-main" style={{ cursor: "default", width: "120px", height: "120px", margin: "0 auto", padding: "4px", background: "var(--accent-gradient)", boxShadow: "0 10px 30px var(--accent-glow)" }}>
              {user.avatar ? (
                <img src={getAvatarUrl(user.avatar)} alt="avatar" style={{ border: "4px solid var(--chat-bg)" }} />
              ) : (
                <div className="avatar-placeholder" style={{ fontSize: "2.5rem", fontWeight: "800" }}>
                    {(user.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
        </div>

        <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-primary)" }}>
            {user.name}
            {user.isAdmin && <span className="admin-badge" style={{ verticalAlign: "middle" }}>ADMIN</span>}
        </h2>
        
        <p style={{ color: "var(--accent-color)", marginBottom: "32px", fontSize: "1.1rem", fontWeight: "600" }}>
            @{user.username || user.name.toLowerCase().replace(/\s+/g, '_')}
        </p>

        <div style={{ 
            background: "rgba(0,0,0,0.2)", 
            padding: "24px", 
            borderRadius: "24px",
            textAlign: "left",
            border: "1px solid var(--glass-border)",
            marginBottom: "10px"
        }}>
            <h4 style={{ 
                fontSize: "0.8rem", 
                textTransform: "uppercase", 
                letterSpacing: "2px", 
                color: "var(--text-muted)",
                marginBottom: "12px",
                fontWeight: "800"
            }}>
                About
            </h4>
            <p style={{ 
                color: "var(--text-primary)", 
                lineHeight: "1.7",
                fontSize: "1.05rem",
                whiteSpace: "pre-wrap",
                fontWeight: "400"
            }}>
                {user.about || "This user prefers to keep their bio a mystery."}
            </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewUserModal;
