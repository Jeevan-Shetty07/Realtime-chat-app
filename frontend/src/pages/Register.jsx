import { useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import EmailPasswordAuth from "../components/auth/EmailPasswordAuth";
import "../styles/Auth.css";

const Register = () => {
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  return (
    <div className="auth-container">
      <div className="auth-bg-glow"></div>
      <div className="auth-card" style={showEmailAuth ? {} : { background: "transparent", border: "none", boxShadow: "none" }}>
        {showEmailAuth ? (
          <EmailPasswordAuth onToggle={() => setShowEmailAuth(false)} />
        ) : (
          <div className="clerk-auth-wrapper">
             <SignUp signInUrl="/login" />
             <div className="auth-footer" style={{ marginTop: "20px" }}>
                <p>
                  Prefer email & password?{" "}
                  <span className="auth-link" onClick={() => setShowEmailAuth(true)}>
                    Register here
                  </span>
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
