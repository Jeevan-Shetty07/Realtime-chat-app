import { Link } from "react-router-dom";

const Navbar = ({ user }) => {
  return (
    <div style={styles.nav}>
      <Link to="/" style={styles.brand}>
        ChatApp
      </Link>

      <div style={styles.right}>
        {user ? (
          <Link to="/profile" style={styles.link}>
            {user.name}
          </Link>
        ) : (
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  nav: {
    height: "60px",
    background: "#0b1220",
    borderBottom: "1px solid #1f2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
  },
  brand: {
    color: "white",
    fontWeight: "800",
    textDecoration: "none",
    fontSize: "18px",
  },
  right: { display: "flex", gap: "12px" },
  link: {
    color: "#93c5fd",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Navbar;
