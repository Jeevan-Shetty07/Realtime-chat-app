import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, loadingAuth, children }) => {
  if (loadingAuth) {
    return (
      <div style={{ padding: "20px", color: "white" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
