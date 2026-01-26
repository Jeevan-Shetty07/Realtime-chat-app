import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const MessageBubble = ({ message }) => {
  const { user } = useContext(AuthContext);

  const isMe = message?.senderId?._id === user?._id;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "10px 12px",
          borderRadius: "14px",
          background: isMe ? "#2563eb" : "#111827",
          color: "white",
          border: isMe ? "1px solid #1d4ed8" : "1px solid #334155",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: isMe ? "#dbeafe" : "#93c5fd",
            marginBottom: "4px",
            fontWeight: "600",
          }}
        >
          {isMe ? "You" : message?.senderId?.name || "User"}
        </div>

        <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
          {message?.text}
        </div>

        <div
          style={{
            fontSize: "11px",
            color: isMe ? "#bfdbfe" : "#94a3b8",
            marginTop: "6px",
            textAlign: "right",
          }}
        >
          {message?.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
