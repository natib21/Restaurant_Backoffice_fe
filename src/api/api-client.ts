import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1', // Adjust this to match your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or wherever you store it
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For customer session endpoints, add session token if present
    const sessionToken = localStorage.getItem('customer_session_token');
    if (sessionToken && config.url?.includes('/customer/')) {
      config.headers['X-Session-Token'] = sessionToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;