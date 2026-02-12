import { createContext, useState, useContext, useCallback } from "react";
import ReactDOM from "react-dom";
import "../../styles/Notification.css";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {ReactDOM.createPortal(
        <div className="notification-container">
          {notifications.map((n) => (
            <div key={n.id} className={`notification-card ${n.type}`} onClick={() => removeNotification(n.id)}>
              <div className="notification-icon">
                {n.type === "success" && "✓"}
                {n.type === "error" && "✕"}
                {n.type === "warning" && "⚠"}
                {n.type === "info" && "ℹ"}
              </div>
              <div className="notification-content">
                <p>{n.message}</p>
              </div>
              <div className="notification-progress"></div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
