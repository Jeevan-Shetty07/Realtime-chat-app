import API from "./axios";

// Get all users (for starting new chats)
export const fetchUsers = async () => {
  const res = await API.get("/api/chats/users");
  return res.data;
};

// Create or get one-to-one chat
export const accessChat = async (userId) => {
  const res = await API.post("/api/chats", { userId });
  return res.data;
};

// Get my chats
export const fetchMyChats = async () => {
  const res = await API.get("/api/chats");
  return res.data;
};

// Create Group Chat
export const createGroupChat = async (groupData) => {
  const res = await API.post("/api/chats/group", groupData);
  return res.data;
};
