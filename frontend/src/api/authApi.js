import API from "./axios";

// Register
export const registerUser = async (data) => {
  const res = await API.post("/api/auth/register", data);
  return res.data;
};

// Login
export const loginUser = async (data) => {
  const res = await API.post("/api/auth/login", data);
  return res.data;
};

// Google Login
export const googleLoginApi = async (tokenId) => {
  const res = await API.post("/api/auth/google", { tokenId });
  return res.data;
};

// Get logged in user
export const getMe = async () => {
  const res = await API.get(`/api/auth/me?t=${Date.now()}`);
  return res.data;
};

// Delete account
export const deleteMeApi = async () => {
  const res = await API.delete("/api/auth/me");
  return res.data;
};

// User Blocking
export const blockUserApi = async (userId) => {
  return await API.post("/api/users/block", { userId });
};

export const unblockUserApi = async (userId) => {
  return await API.post("/api/users/unblock", { userId });
};

export const getBlockedUsersApi = async () => {
  const res = await API.get("/api/users/blocked");
  return res.data;
};
