export const formatTime = (dateString) => {
  if (!dateString) return "";

  const d = new Date(dateString);

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
