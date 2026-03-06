import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { createSupportIssue } from '../../api/supportApi';
import { useNotification } from '../../context/NotificationContext';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Support.css';

const SupportModal = ({ isOpen, onClose }) => {
    const { user } = useContext(AuthContext);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();

    if (!isOpen || user?.isAdmin) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject || !message) {
            addNotification("Please fill in all fields", "warning");
            return;
        }

        setLoading(true);
        try {
            await createSupportIssue({ subject, message });
            addNotification("Issue submitted successfully!", "success");
            
            // Clear and close immediately
            setSubject("");
            setMessage("");
            onClose();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to submit issue";
            addNotification(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="support-modal-overlay" onClick={onClose}>
            <div 
                className="support-modal-content" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="support-header">
                    <h3 className="support-title">Support & Feedback</h3>
                    <button className="support-close-btn" onClick={onClose} aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="support-body">
                    <p className="support-description">
                        Have an issue or suggestion? Let us know and we'll get back to you as soon as possible.
                    </p>
                    
                    <div className="support-input-group">
                        <label className="support-label">Subject</label>
                        <input 
                            type="text" 
                            className="support-input" 
                            placeholder="Brief description of the issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="support-input-group">
                        <label className="support-label">Message</label>
                        <textarea 
                            className="support-textarea" 
                            placeholder="Describe your issue in detail..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={loading}
                        ></textarea>
                    </div>

                    <div className="support-actions">
                        <button type="button" className="support-cancel-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="support-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="typing-dot" style={{ background: "white" }}></div>
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Submit Issue</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default SupportModal;
