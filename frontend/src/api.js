import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://dabbe-wala.onrender.com/api",
});

/* 🔐 Add token automatically */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* 🚨 Auto logout if token is invalid */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const skipLogout =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");
    if (!skipLogout && error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;