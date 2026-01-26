import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Profile = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={{ color: "white", marginBottom: "10px" }}>Profile</h2>

        <div style={styles.row}>
          <span style={styles.label}>Name:</span>
          <span style={styles.value}>{user?.name}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Email:</span>
          <span style={styles.value}>{user?.email}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>User ID:</span>
          <span style={styles.value}>{user?._id}</span>
        </div>

        <button style={styles.btn} onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "450px",
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #1f2937",
  },
  label: { color: "#9ca3af" },
  value: { color: "white", fontWeight: "600" },
  btn: {
    marginTop: "15px",
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default Profile;
