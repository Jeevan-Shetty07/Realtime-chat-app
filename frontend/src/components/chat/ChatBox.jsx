const ChatBox = ({ children }) => {
  return <div style={styles.box}>{children}</div>;
};

const styles = {
  box: {
    flex: 1,
    padding: "14px",
    overflowY: "auto",
  },
};

export default ChatBox;
