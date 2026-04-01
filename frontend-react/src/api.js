import axios from 'axios';

const api = axios.create({
  // Automatically uses VITE_API_URL in production (e.g., from Vercel), fallback to localhost for development
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
