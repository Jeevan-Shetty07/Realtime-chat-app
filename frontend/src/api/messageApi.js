import API from "./axios";

// Get messages of a chat
export const fetchMessages = async (chatId) => {
  const res = await API.get(`/api/messages/${chatId}`);
  return res.data;
};

// Send message (REST)
export const sendMessageApi = async ({ chatId, text, type = "text", attachments = [] }) => {
  const res = await API.post("/api/messages", { chatId, text, type, attachments });
  return res.data;
};

// Mark messages as seen
export const markChatSeen = async (chatId) => {
  const res = await API.put(`/api/messages/seen/${chatId}`);
  return res.data;
};
