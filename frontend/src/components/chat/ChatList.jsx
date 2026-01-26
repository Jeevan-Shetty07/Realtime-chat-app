const ChatList = ({ chats = [], activeChatId, onSelect }) => {
  return (
    <div style={styles.list}>
      {chats.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No chats</p>
      ) : (
        chats.map((chat) => (
          <button
            key={chat._id}
            onClick={() => onSelect(chat)}
            style={{
              ...styles.item,
              border:
                activeChatId === chat._id
                  ? "1px solid #2563eb"
                  : "1px solid #1f2937",
            }}
          >
            <div style={{ color: "white", fontWeight: "700" }}>
              Chat: {chat._id.slice(-6)}
            </div>
            <div style={{ color: "#9ca3af", fontSize: "12px" }}>
              {chat.lastMessage || "No messages yet"}
            </div>
          </button>
        ))
      )}
    </div>
  );
};

const styles = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  item: {
    width: "100%",
    textAlign: "left",
    background: "#0b1220",
    borderRadius: "12px",
    padding: "10px",
    cursor: "pointer",
  },
};

export default ChatList;
