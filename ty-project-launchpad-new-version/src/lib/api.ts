import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/api/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get<UserResponse>('/api/me');
    return response.data;
  },
};

export default api;
