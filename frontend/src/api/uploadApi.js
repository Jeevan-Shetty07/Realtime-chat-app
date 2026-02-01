import API from "./axios";

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await API.post("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data; // { message, imageUrl }
};
