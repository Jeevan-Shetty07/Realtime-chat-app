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

// Rename Group
export const renameGroup = async (chatId, chatName) => {
  const res = await API.put("/api/chats/group/rename", { chatId, chatName });
  return res.data;
};

// Add to Group
export const addToGroup = async (chatId, userId) => {
  const res = await API.put("/api/chats/group/add", { chatId, userId });
  return res.data;
};

// Remove from Group
export const removeFromGroup = async (chatId, userId) => {
  const res = await API.put("/api/chats/group/remove", { chatId, userId });
  return res.data;
};

// Delete Group
export const deleteGroupChat = async (chatId) => {
    const res = await API.delete(`/api/chats/group-delete/${chatId}`);
    return res.data;
};
