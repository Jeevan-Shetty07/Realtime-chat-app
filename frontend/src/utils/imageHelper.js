export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
    // Ensure path starts with / if not present
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};

export const getAvatarUrl = (path) => {
    return getImageUrl(path);
};
