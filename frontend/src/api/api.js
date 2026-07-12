import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) => api.post("/auth/login", { username, password }),
  forgotPassword: (username) => api.post("/auth/forgot-password", { username }),
  resetPasswordOtp: (data) => api.post("/auth/reset-password-otp", data),
};

export const employeeApi = {
  list: (params) => api.get("/employees", { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post("/employees", data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
  departments: () => api.get("/employees/departments"),
  registerLogin: (data) => api.post("/auth/register-employee-login", data),
};

export const attendanceApi = {
  mark: (data) => api.post("/attendance", data),
  list: (params) => api.get("/attendance", { params }),
  summary: (params) => api.get("/attendance/summary", { params }),
  history: (employeeId) => api.get(`/attendance/employee/${employeeId}`),
  me: () => api.get("/attendance/me"),
  exportCsvUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/attendance/export${query ? `?${query}` : ""}`;
  },
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};

export default api;