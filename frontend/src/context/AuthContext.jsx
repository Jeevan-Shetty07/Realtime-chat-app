import { createContext, useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { getMe } from "../api/authApi";
import { setAuthToken } from "../api/axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, signOut, isLoaded: isAuthLoaded } = useAuth();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const logout = async () => {
    await signOut();
    setAuthToken(null);
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const token = await getToken();

      if (!token) {
        setUser(null);
        setLoadingAuth(false);
        return;
      }

      setAuthToken(token);
      const data = await getMe();
      setUser(data.user);
    } catch (error) {
      console.error("Load user error:", error);
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && isAuthLoaded) {
        if (clerkUser) {
            loadUser();
        } else {
            setUser(null);
            setLoadingAuth(false);
        }
    }
  }, [clerkUser, isUserLoaded, isAuthLoaded]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loadingAuth,
        logout,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
