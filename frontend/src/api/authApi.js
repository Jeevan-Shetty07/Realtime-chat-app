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
