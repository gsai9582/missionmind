import axios from 'axios';

// 1. If VITE_API_URL is explicitly configured, use it
// 2. If running in production browser on a remote domain (same-origin/reverse proxy), default to '/api'
// 3. Otherwise default to local backend 'http://localhost:3001/api'
let rawUrl = import.meta.env.VITE_API_URL;

if (!rawUrl) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    rawUrl = '/api';
  } else {
    rawUrl = 'http://localhost:3001/api';
  }
}

const API_URL = rawUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
});

// Automatically inject JWT token into authorization header if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export { API_URL };
