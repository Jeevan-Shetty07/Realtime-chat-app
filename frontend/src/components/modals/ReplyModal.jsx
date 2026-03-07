import React, { useState } from "react";
import "../../styles/Chat.css";

const ReplyModal = ({ isOpen, onClose, onConfirm, initialValue = "", subject = "" }) => {
  const [response, setResponse] = useState(initialValue);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 2000 }}>
      <div className="glass-card animate-slide-up" style={{ width: "90%", maxWidth: "500px", padding: "24px" }}>
        <h3 className="modal-title" style={{ marginBottom: "8px" }}>Reply to Support Issue</h3>
        <p style={{ fontSize: "14px", opacity: 0.7, marginBottom: "20px" }}>Subject: <strong>{subject}</strong></p>
        
        <textarea
            className="chat-input"
            style={{ 
                width: "100%", 
                minHeight: "120px", 
                marginBottom: "20px", 
                padding: "12px",
                borderRadius: "12px",
                fontSize: "14px",
                resize: "vertical"
            }}
            placeholder="Write your response here..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
        />

        <div className="modal-actions" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "10px 20px" }}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={() => onConfirm(response)} 
            disabled={!response.trim()}
            style={{ padding: "10px 20px" }}
          >
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;
