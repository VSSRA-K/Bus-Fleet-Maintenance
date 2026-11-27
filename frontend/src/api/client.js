import axios from 'axios';

export const TOKEN_KEY = 'buscare_token';
export const USER_KEY = 'buscare_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// Readable error text for the UI (SRS 3.1).
export const errorMessage = (err) =>
  err?.response?.data?.message || (err?.request ? 'Cannot reach the server. Please check your connection.' : 'Something went wrong. Please try again.');

export default api;
