// src/lib/api.ts
import axios from 'axios';

// Fallback for local development
const fallbackEndpoint = 'http://localhost:8000/api';
// const productionEndpoint = "https://restaurant-bo.onrender.com/api"
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackEndpoint,
  withCredentials: true, // REQUIRED for auth cookies / sessions
});

// =======================
// RESPONSE INTERCEPTOR
// =======================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-redirect on auth failure
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
