import axios from 'axios';

// Railway Backend URL
const API_BASE_URL = 'https://taskflow-production-0501.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ================= AUTH =================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ================= PROJECTS =================
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),

  addMember: (id, userId) =>
    api.post(`/projects/${id}/members`, { userId }),

  removeMember: (id, userId) =>
    api.delete(`/projects/${id}/members/${userId}`),
};

// ================= TASKS =================
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),

  create: (data) => api.post('/tasks', data),

  update: (id, data) =>
    api.put(`/tasks/${id}`, data),

  updateStatus: (id, status) =>
    api.patch(`/tasks/${id}/status`, { status }),

  delete: (id) => api.delete(`/tasks/${id}`),

  addComment: (id, text) =>
    api.post(`/tasks/${id}/comments`, { text }),
};

// ================= USERS =================
export const userAPI = {
  getAll: () => api.get('/users'),

  updateRole: (id, role) =>
    api.put(`/users/${id}/role`, { role }),

  delete: (id) => api.delete(`/users/${id}`),
};

// ================= DASHBOARD =================
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;