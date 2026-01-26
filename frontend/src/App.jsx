import { useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthContext, AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import ProtectedRoute from "./components/common/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatDashboard from "./pages/ChatDashboard";
import Profile from "./pages/Profile";

const AppRoutes = () => {
  const { user, loadingAuth } = useContext(AuthContext);

  return (
    <SocketProvider user={user}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute user={user} loadingAuth={loadingAuth}>
              <ChatDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user} loadingAuth={loadingAuth}>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </SocketProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
