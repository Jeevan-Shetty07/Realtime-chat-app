import { useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ChatDashboard from "./pages/ChatDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from "@clerk/clerk-react";

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

import LoadingScreen from "./components/common/LoadingScreen";

const AppRoutes = () => {
  const { user, loadingAuth } = useContext(AuthContext);

  return (
    <SocketProvider user={user}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                {loadingAuth ? (
                  <LoadingScreen />
                ) : (
                  <ChatDashboard />
                )}
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        <Route path="/login/*" element={<div className="flex-center" style={{ minHeight: "100vh" }}><SignIn routing="path" path="/login" /></div>} />
        <Route path="/register/*" element={<div className="flex-center" style={{ minHeight: "100vh" }}><SignUp routing="path" path="/register" /></div>} />

        <Route
          path="/profile"
          element={
            <SignedIn>
              <Profile />
            </SignedIn>
          }
        />
        <Route
          path="/admin"
          element={
            <SignedIn>
              <AdminDashboard />
            </SignedIn>
          }
        />
      </Routes>
    </SocketProvider>
  );
};

import { NotificationProvider } from "./context/NotificationContext";

const App = () => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ClerkProvider>
  );
};

export default App;
