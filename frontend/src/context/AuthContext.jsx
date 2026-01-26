import { createContext, useEffect, useState } from "react";
import { getMe } from "../api/authApi";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setLoadingAuth(false);
        return;
      }

      const data = await getMe();
      setUser(data.user);
    } catch (error) {
      // token invalid or server error
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

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
