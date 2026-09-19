// src/lib/api.ts
import axios from 'axios';

// Fallback for local development
const fallbackEndpoint = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackEndpoint,
  withCredentials: true, // REQUIRED for auth cookies / sessions
  paramsSerializer: {
    indexes: null, // Serializes arrays as ?type=waste&type=adjustment instead of ?type[]=waste
  },
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
  async (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      '';
    const code = error.response?.data?.code || error.response?.data?.error?.code;

    // Handle 401 Authentication & Branch Staleness
    if (status === 401) {
      const originalRequest = error.config;
      const isBranchMismatch =
        message.toLowerCase().includes('reassigned to a different branch') ||
        message.toLowerCase().includes('branch mismatch') ||
        code === 'JWT_STALE_BRANCHES';

      if (isBranchMismatch && originalRequest && !originalRequest._retryBranchRefresh) {
        originalRequest._retryBranchRefresh = true;
        console.warn('JWT rejected due to branch mismatch. Refreshing user context and retrying request...');

        try {
          const { refreshUserContext } = await import('./authSession');
          await refreshUserContext();

          const freshToken =
            localStorage.getItem('auth_token') ||
            localStorage.getItem('token') ||
            localStorage.getItem('jwt');
          if (freshToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          }

          // Retry the original request
          return api.request(originalRequest);
        } catch (refreshError) {
          console.error('Branch reassignment auto-refresh failed. Forcing re-login:', refreshError);
          const { forceReLogin } = await import('./authSession');
          forceReLogin(
            'session_expired',
            'You have been reassigned to a different branch. Please log in again.'
          );
          return Promise.reject(refreshError);
        }
      }

      // Standard 401 session expiry
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/sign-up')
      ) {
        const { forceReLogin } = await import('./authSession');
        forceReLogin('session_expired', 'Your session has expired. Please log in again.');
      }
    }

    // Auto-redirect on legacy 405 auth failure
    if (status === 405 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/sign-up')) {
      window.location.href = '/login';
    }

    // Handle feature & subscription 403 / 405 access control
    if (status === 403 || status === 405) {
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

