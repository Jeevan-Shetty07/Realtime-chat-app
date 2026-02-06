import { SignIn } from "@clerk/clerk-react";
import "../styles/Auth.css";

const Login = () => {
  return (
    <div className="auth-container">
      <div className="auth-bg-glow"></div>
      <div className="auth-card" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
        <SignIn signUpUrl="/register" />
      </div>
    </div>
  );
};

export default Login;
