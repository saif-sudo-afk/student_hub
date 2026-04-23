import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'student-hub.access-token';
const REFRESH_TOKEN_KEY = 'student-hub.refresh-token';

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: false,
});

let refreshPromise: Promise<string | null> | null = null;

function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    return null;
  }
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string }>(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/auth/refresh/`,
        { refresh },
      )
      .then((response) => {
        setAccessToken(response.data.access);
        return response.data.access;
      })
      .catch(() => {
        clearTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
    return client(originalRequest);
  },
);

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, client };
