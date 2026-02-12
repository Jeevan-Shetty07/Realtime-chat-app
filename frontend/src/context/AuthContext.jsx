import { createContext, useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { getMe, deleteMeApi, blockUserApi, unblockUserApi } from "../api/authApi";
import { setAuthToken } from "../api/axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, signOut, isLoaded: isAuthLoaded } = useAuth();
  const [user, setUser] = useState(null);
  const [localToken, setLocalToken] = useState(sessionStorage.getItem("token"));
  const [loadingAuth, setLoadingAuth] = useState(true);

  const logout = async () => {
    if (clerkUser) await signOut();
    sessionStorage.removeItem("token");
    setLocalToken(null);
    setAuthToken(null);
    setUser(null);
  };

  const loginLocal = (userData, token) => {
    sessionStorage.setItem("token", token);
    setLocalToken(token);
    setAuthToken(token);
    setUser(userData);
  };

  const loadUser = async () => {
    try {
      let token = null;
      
      if (clerkUser) {
        token = await getToken();
      } else {
        token = sessionStorage.getItem("token");
      }

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
      // If local token fails, clear it
      if (!clerkUser) {
          sessionStorage.removeItem("token");
          setLocalToken(null);
      }
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && isAuthLoaded) {
        loadUser();
    }
  }, [clerkUser, isUserLoaded, isAuthLoaded]);

  useEffect(() => {
    const handleBlockUpdate = ({ detail }) => {
        // If I am the recipient, I need to reload my full profile to see who blocked me
        // Actually, if someone blocks me, it doesn't change MY profile's blockedUsers list.
        // It changes THEIR profile's blockedUsers list.
        // BUT, I need to refresh my chats to see the updated member data.
        if (detail?.type?.includes('recipient')) {
            // No need to loadUser here, as my own profile didn't change.
            // But we need to signal the dashboard to refresh chats.
        }
    };
    window.addEventListener('userBlockUpdate', handleBlockUpdate);
    return () => window.removeEventListener('userBlockUpdate', handleBlockUpdate);
  }, []);

  const deleteAccount = async () => {
    try {
      await deleteMeApi();
      await logout();
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
    }
  };

  const blockUser = async (userId) => {
    try {
      const { data } = await blockUserApi(userId);
      setUser(prev => ({ ...prev, blockedUsers: data.blockedUsers }));
      // Trigger a refresh of chats to update member statuses
      window.dispatchEvent(new CustomEvent('userBlockUpdate'));
    } catch (error) {
      console.error("Block user error:", error);
      throw error;
    }
  };

  const unblockUser = async (userId) => {
    try {
      const { data } = await unblockUserApi(userId);
      setUser(prev => ({ ...prev, blockedUsers: data.blockedUsers }));
      window.dispatchEvent(new CustomEvent('userBlockUpdate'));
    } catch (error) {
      console.error("Unblock user error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loadingAuth,
        logout,
        loadUser,
        loginLocal,
        localToken,
        deleteAccount,
        blockUser,
        unblockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
