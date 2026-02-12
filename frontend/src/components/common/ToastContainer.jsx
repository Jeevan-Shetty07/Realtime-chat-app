import React from 'react';
import '../../styles/Chat.css';

const Toast = ({ message, type, id, onRemove }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    };

    return (
        <div className={`toast-card glass-panel toast-${type}`} onClick={() => onRemove(id)}>
            <div className="toast-icon">{getIcon()}</div>
            <div className="toast-message">{message}</div>
            <button className="toast-close">×</button>
        </div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast 
                    key={toast.id} 
                    {...toast} 
                    onRemove={removeToast} 
                />
            ))}
        </div>
    );
};

export default ToastContainer;
