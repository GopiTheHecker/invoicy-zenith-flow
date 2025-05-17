
import axios from 'axios';

// Use window.location.hostname to determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost';

// Set BASE_URL based on environment - using the Lovable preview URL pattern when not in development
const BASE_URL = isDevelopment 
  ? 'http://localhost:5000/api' 
  : '/api'; // Changed to relative path to work in the Lovable preview environment

// Create axios instance with configured base URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Increased timeout for slower connections
  timeout: 30000, // 30 seconds
});

// Add a request interceptor to include token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
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
    console.log(`API Response Success: ${response.status} ${response.config.url}`, response.data);
    
    // Check if response is HTML instead of JSON (indicates an error)
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML response instead of JSON', response.data);
      throw new Error('Invalid response format from server');
    }
    
    return response;
  },
  (error) => {
    if (!error.response) {
      console.error('Network Error - Cannot connect to API server:', error.message);
      // Use guest mode if API server is unavailable
      throw new Error('Cannot connect to the server. Using guest mode.');
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('API Request Timeout:', error.message);
      throw new Error('Request timeout. Please check your internet connection and try again.');
    }
    
    // Check if response is HTML instead of JSON
    const contentType = error.response?.headers?.['content-type'];
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML error response instead of JSON', error.response.data);
      throw new Error('Invalid response format from server');
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    console.error('API Response Error:', error.response?.status, errorMessage);
    throw error;
  }
);

export default api;
