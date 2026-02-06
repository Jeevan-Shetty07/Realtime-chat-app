import { SignUp } from "@clerk/clerk-react";
import "../styles/Auth.css";

const Register = () => {
  return (
    <div className="auth-container">
      <div className="auth-bg-glow"></div>
      <div className="auth-card" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
        <SignUp signInUrl="/login" />
      </div>
    </div>
  );
};

export default Register;
