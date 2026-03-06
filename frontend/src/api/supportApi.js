import API from "./axios";

// Create support issue
export const createSupportIssue = async (data) => {
  const res = await API.post("/api/support", data);
  return res.data;
};

// Get all support issues (Admin)
export const getAllSupportIssues = async () => {
  const res = await API.get("/api/support");
  return res.data;
};

// Update support issue (Admin)
export const updateSupportIssue = async (id, data) => {
  const res = await API.patch(`/api/support/${id}`, data);
  return res.data;
};

// Get user's issues
export const getMySupportIssues = async () => {
  const res = await API.get("/api/support/my-issues");
  return res.data;
};
