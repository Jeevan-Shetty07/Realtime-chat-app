import { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import EmailPasswordAuth from "../components/auth/EmailPasswordAuth";
import "../styles/Auth.css";

const Login = () => {
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  return (
    <div className="auth-container">
      <div className="auth-bg-glow"></div>
      <div className="auth-card" style={showEmailAuth ? {} : { background: "transparent", border: "none", boxShadow: "none" }}>
        {showEmailAuth ? (
          <EmailPasswordAuth onToggle={() => setShowEmailAuth(false)} />
        ) : (
          <div className="clerk-auth-wrapper">
             <SignIn signUpUrl="/register" />
             <div className="auth-footer" style={{ marginTop: "20px" }}>
                <p>
                  Prefer email & password?{" "}
                  <span className="auth-link" onClick={() => setShowEmailAuth(true)}>
                    Sign in here
                  </span>
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
