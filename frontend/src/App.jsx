import { useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ChatDashboard from "./pages/ChatDashboard";
import Profile from "./pages/Profile";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from "@clerk/clerk-react";

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
                  <div className="flex-center" style={{ height: "100vh", color: "white" }}>
                    <div className="loader">Loading your profile...</div>
                  </div>
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
      </Routes>
    </SocketProvider>
  );
};

const App = () => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ClerkProvider>
  );
};

export default App;
