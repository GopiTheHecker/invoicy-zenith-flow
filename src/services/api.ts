
import axios from 'axios';

// Use window.location.hostname to determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost';
const BASE_URL = isDevelopment ? 'http://localhost:5000/api' : 'https://invoice-app-api.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add a request interceptor to include token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response Success: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    console.error('API Response Error:', error.response?.status, errorMessage);
    return Promise.reject(error);
  }
);

export default api;
