const TypingIndicator = ({ text = "Typing..." }) => {
  return (
    <div style={styles.typing}>
      {text}
    </div>
  );
};

const styles = {
  typing: {
    color: "#9ca3af",
    fontSize: "12px",
    padding: "6px 0",
  },
};

export default TypingIndicator;
