import React from 'react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger" // 'danger' or 'primary'
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div 
                className="modal-content confirm-modal-content animate-slide-up" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '400px', padding: '32px' }}
            >
                <div className={`confirm-icon-box ${type}`}>
                    {type === "danger" ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ) : (
                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    )}
                </div>
                
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                
                <div className="confirm-actions">
                    <button className="confirm-cancel-btn" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button 
                        className={`confirm-submit-btn ${type === 'danger' ? 'danger-bg' : 'primary-bg'}`} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
