const MessageInput = ({
  value,
  onChange,
  onSend,
  onTyping,
  disabled = false,
}) => {
  return (
    <form onSubmit={onSend} style={styles.bar}>
      <input
        style={styles.input}
        placeholder="Type a message..."
        value={value}
        onChange={onChange}
        onKeyDown={onTyping}
        disabled={disabled}
      />
      <button style={styles.btn} disabled={disabled}>
        Send
      </button>
    </form>
  );
};

const styles = {
  bar: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    borderTop: "1px solid #1f2937",
    background: "#0b1220",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #334155",
    outline: "none",
    background: "#111827",
    color: "white",
  },
  btn: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default MessageInput;
