import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { loginUser, registerUser, forgotPasswordApi } from "../../api/authApi";
import "../../styles/Auth.css";

const EmailPasswordAuth = ({ onToggle }) => {
  const { loginLocal } = useContext(AuthContext);
  const { addNotification } = useNotification();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await loginUser({ email: formData.email, password: formData.password });
        addNotification("Logged in successfully!", "success");
      } else {
        res = await registerUser(formData);
        addNotification("Account created! Welcome.", "success");
      }
      
      if (res.token) {
        loginLocal(res.user, res.token);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Authentication failed";
      setError(msg);
      addNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!formData.email) {
        addNotification("Please enter your email", "warning");
        return;
    }
    
    setLoading(true);
    try {
        const res = await forgotPasswordApi(formData.email);
        addNotification(res.message, "success");
        setShowForgot(false);
    } catch (err) {
        addNotification(err.response?.data?.message || "Failed to send reset link", "error");
    } finally {
        setLoading(false);
    }
  };

  if (showForgot) {
      return (
        <div className="email-auth-container">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your email to receive instructions</p>
          
          <form className="auth-form" onSubmit={handleForgot}>
             <div className="form-group">
                <input
                    type="email"
                    className="glass-input"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>
            <button className="continue-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="auth-footer">
            <span className="auth-link" onClick={() => setShowForgot(false)}>Back to Login</span>
          </div>
        </div>
      );
  }

  return (
    <div className="email-auth-container">
      <h2 className="auth-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
      <p className="auth-subtitle">
        {isLogin ? "Sign in to your account" : "Join our community today"}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <input
              type="text"
              className="glass-input"
              placeholder="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        )}
        <div className="form-group">
          <input
            type="email"
            className="glass-input"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="glass-input"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          {isLogin && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                  <span className="auth-link" style={{ fontSize: "0.8rem" }} onClick={() => setShowForgot(true)}>
                      Forgot Password?
                  </span>
              </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button className="continue-btn" disabled={loading}>
          {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="auth-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Register here" : "Login here"}
          </span>
        </p>
        <div className="auth-divider">
          <span>OR</span>
        </div>
        <button className="secondary-auth-btn" onClick={onToggle}>
          Use Social Login
        </button>
      </div>
    </div>
  );
};

export default EmailPasswordAuth;
