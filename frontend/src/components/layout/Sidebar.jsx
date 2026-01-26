const Sidebar = ({ title = "Menu", children }) => {
  return (
    <div style={styles.sidebar}>
      <h3 style={styles.title}>{title}</h3>
      <div>{children}</div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: "260px",
    background: "#111827",
    borderRight: "1px solid #1f2937",
    padding: "14px",
    height: "100vh",
  },
  title: {
    color: "white",
    marginBottom: "12px",
  },
};

export default Sidebar;
