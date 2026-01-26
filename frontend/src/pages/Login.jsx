import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password required");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser(form);

      localStorage.setItem("token", data.token);
      setUser(data.user);

      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          <button style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.text}>
          New here?{" "}
          <Link style={styles.link} to="/register">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "#111827",
    padding: "25px",
    borderRadius: "14px",
    border: "1px solid #1f2937",
  },
  title: { color: "white", marginBottom: "15px" },
  error: { color: "#ff6b6b", marginBottom: "10px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    outline: "none",
    background: "#0b1220",
    color: "white",
  },
  button: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },
  text: { color: "#9ca3af", marginTop: "12px" },
  link: { color: "#60a5fa", textDecoration: "none" },
};

export default Login;
