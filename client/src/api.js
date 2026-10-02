import axios from 'axios';

// In dev: Vite proxy handles /api → localhost:5000
// In prod: VITE_API_URL points to the Render backend (auto-appends /api if omitted)
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dp_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updatePreferences: (data) => api.patch('/auth/preferences', data),
};

// ── Tasks ──────────────────────────────────────────────────
export const tasksAPI = {
  list: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  updateStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ── Commitments ────────────────────────────────────────────
export const commitmentsAPI = {
  list: (params) => api.get('/commitments', { params }),
  create: (data) => api.post('/commitments', data),
  update: (id, data) => api.patch(`/commitments/${id}`, data),
  delete: (id) => api.delete(`/commitments/${id}`),
};

// ── Schedules ──────────────────────────────────────────────
export const schedulesAPI = {
  get: (date) => api.get('/schedules', { params: { date } }),
  history: (date) => api.get('/schedules/history', { params: { date } }),
  generate: (date) => api.post('/schedules/generate', { date }),
  commit: (date) => api.post('/schedules/commit', { date }),
  reschedule: (date) => api.post('/schedules/reschedule', { date }),
  updateBlock: (scheduleId, blockId, data) => api.patch(`/schedules/${scheduleId}/blocks/${blockId}`, data),
  logEvent: (data) => api.post('/schedules/log-event', data),
  getLogs: (date) => api.get('/schedules/logs', { params: { date } }),
  getProgress: (date) => api.get('/schedules/progress', { params: { date } }),
};

// ── Agent ──────────────────────────────────────────────────
export const agentAPI = {
  chat: (message, date) => api.post('/agent/chat', { message, date }),
  history: (date) => api.get('/agent/history', { params: { date } }),
  clearHistory: (date) => api.delete('/agent/history', { params: { date } }),
};

export default api;
