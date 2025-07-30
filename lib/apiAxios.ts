// import axios from "axios";

// export const apiAxios = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   withCredentials: true,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });





import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const apiAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- INTERCEPTORS ---

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor to refresh token on 401
apiAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignore if it's already a retried request or refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue up if a refresh is already in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiAxios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const { data } = await axios.get("/api/auth/refresh", {
          withCredentials: true,
        });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        // Store tokens in Zustand
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        // Retry all queued requests
        processQueue(null, newAccessToken);

        // Retry the original failed request with new access token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiAxios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout(); // clear frontend session
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
