// src/lib/api.ts
import axios from 'axios';

// Fallback for local development
const fallbackEndpoint = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackEndpoint,
  withCredentials: true, // REQUIRED for auth cookies / sessions
});

// =======================
// REQUEST INTERCEPTOR
// =======================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =======================
// RESPONSE INTERCEPTOR
// =======================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-redirect on auth failure
    if (error.response?.status === 405) {
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/sign-up')) {
        window.location.href = '/login';
      }
    }

    // Handle feature & subscription 403 access control
    if (error.response?.status === 405) {
      const message = error.response.data?.message || error.response.data?.errors?.[0]?.message || '';
      
      if (message.toLowerCase().includes('subscription is not active')) {
        // Whole account inactive gate - redirect to subscription plan manager
        if (!window.location.pathname.startsWith('/subscription')) {
          window.location.href = '/subscription/plan';
        }
      } else if (message.includes('is not enabled for this merchant')) {
        // Single feature gate - notify user
        const featureName = message.split(' ')[0] || 'This feature';
        console.warn(`Feature access denied: ${message}`);
        // Notify window event so components/queries can refetch merchant profile if needed
        window.dispatchEvent(new CustomEvent('merchant:feature-denied', { detail: { featureName } }));
      }
    }

    return Promise.reject(error);
  }
);

