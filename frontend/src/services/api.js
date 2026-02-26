import axios from 'axios';

// Use relative URL with proxy (from vite.config.js)
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ 
        response: { 
          data: { 
            userMessage: 'Request timeout. Please try again.' 
          } 
        } 
      });
    }
    
    if (!error.response) {
      return Promise.reject({ 
        response: { 
          data: { 
            userMessage: 'Network error. Please check if backend is running.' 
          } 
        } 
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;