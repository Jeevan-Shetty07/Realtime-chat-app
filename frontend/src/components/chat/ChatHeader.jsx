const ChatHeader = ({ name = "Chat", status = "Offline" }) => {
  return (
    <div style={styles.header}>
      <div>
        <div style={styles.name}>{name}</div>
        <div style={styles.status}>{status}</div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    padding: "14px",
    borderBottom: "1px solid #1f2937",
    background: "#0b1220",
  },
  name: { color: "white", fontWeight: "800" },
  status: { color: "#9ca3af", fontSize: "12px" },
};

export default ChatHeader;
