
import axios from 'axios';

// Use window.location.hostname to determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost';

// Get the base URL from the window location
const getBaseUrl = () => {
  // For specific IP addresses, use the full origin
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  // For localhost development
  if (isDevelopment) {
    return 'http://localhost:5000/api';
  }
  
  // Default to relative path for production/preview environments
  return '/api';
};

const BASE_URL = getBaseUrl();

console.log('API Base URL:', BASE_URL);

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

// Function to check if response is HTML
const isHtmlResponse = (data, headers) => {
  if (headers && headers['content-type'] && headers['content-type'].includes('text/html')) {
    return true;
  }
  
  if (typeof data === 'string' && data.trim().startsWith('<!DOCTYPE html>')) {
    return true;
  }
  
  return false;
};

// Add a request interceptor to include token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Always set these headers to ensure proper responses
    config.headers.Accept = 'application/json';
    config.headers['Content-Type'] = 'application/json';
    
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
    console.log(`API Response Success: ${response.status} ${response.config.url}`);
    
    // Check if response is HTML instead of JSON
    if (isHtmlResponse(response.data, response.headers)) {
      console.error('Received HTML response instead of JSON', response.data);
      return Promise.reject(new Error('Invalid response format from server'));
    }
    
    // Additional safeguard for string responses - try to parse JSON if string
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse string response as JSON:', response.data);
        return Promise.reject(new Error('Invalid JSON response from server'));
      }
    }
    
    return response;
  },
  (error) => {
    // Network errors (no response)
    if (!error.response) {
      console.error('Network Error - Cannot connect to API server:', error.message);
      return Promise.reject(new Error('Cannot connect to the server. Using guest mode.'));
    }
    
    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('API Request Timeout:', error.message);
      return Promise.reject(new Error('Request timeout. Please check your internet connection and try again.'));
    }
    
    // Check if error response is HTML
    if (isHtmlResponse(error.response?.data, error.response?.headers)) {
      console.error('Received HTML error response instead of JSON', error.response.data);
      return Promise.reject(new Error('Invalid response format from server'));
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    console.error('API Response Error:', error.response?.status, errorMessage);
    return Promise.reject(error);
  }
);

export default api;
