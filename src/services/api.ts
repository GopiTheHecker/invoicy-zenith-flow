
import axios from 'axios';

// Use window.location.hostname to determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost';

// Set BASE_URL based on environment
const BASE_URL = isDevelopment 
  ? 'http://localhost:5000/api' 
  : 'https://invoice-app-api.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout for slower connections
  timeout: 30000, // Increased from 10000 to 30000 ms
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
    if (error.code === 'ECONNABORTED') {
      console.error('API Request Timeout:', error.message);
      return Promise.reject(new Error('Request timeout. Please check your internet connection and try again.'));
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    console.error('API Response Error:', error.response?.status, errorMessage);
    return Promise.reject(error);
  }
);

export default api;
