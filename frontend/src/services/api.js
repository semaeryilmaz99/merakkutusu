import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

const resolvePending = (token) => {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // /auth/login kendi 401'i "yanlış şifre" anlamına geliyor, "oturum süresi
    // doldu" değil — bunu da refresh/redirect akışına sokarsak yanlış şifre
    // girildiğinde sayfa tam olarak yenilenir (ve tüm form state'i silinir).
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          if (!token) return reject(error);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("Refresh token yok");

      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);

      resolvePending(data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolvePending(null);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
