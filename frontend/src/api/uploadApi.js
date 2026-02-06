import API from "./axios";

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file); // Backend expects 'file'

  const res = await API.post("/api/upload", formData);
  return res.data; // { message, url, fileType, originalName }
};
