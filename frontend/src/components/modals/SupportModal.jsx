import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { createSupportIssue } from '../../api/supportApi';
import { useNotification } from '../../context/NotificationContext';

const SupportModal = ({ isOpen, onClose }) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();

    if (!isOpen) return null;

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
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 5000 }}>
            <div 
                className="modal-content animate-slide-up" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px', width: '90%' }}
            >
                <div className="modal-header">
                    <h3 className="modal-title">Support & Feedback</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                        Have an issue or suggestion? Let us know and we'll get back to you as soon as possible.
                    </p>
                    
                    <div className="input-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subject</label>
                        <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Brief description of the issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Message</label>
                        <textarea 
                            className="glass-input" 
                            placeholder="Describe your issue in detail..."
                            style={{ minHeight: '120px', resize: 'vertical' }}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={loading}
                        ></textarea>
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className="glass-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
                            {loading ? "Submitting..." : "Submit Issue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default SupportModal;
