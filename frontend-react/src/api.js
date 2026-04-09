import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔒 SECURITY INTERCEPTOR: Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const owner = localStorage.getItem('owner');
    const customer = localStorage.getItem('customer_token');
    
    // ⚠️ Only attach header if NOT manually provided (e.g. during Step 2 registration)
    if (config.headers.Authorization) {
      return config;
    }

    if (owner) {
      const { token } = JSON.parse(owner);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (customer) {
      config.headers.Authorization = `Bearer ${customer}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
