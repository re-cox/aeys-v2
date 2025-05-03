import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// API İstemci
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// İstek interceptor'ı
apiClient.interceptors.request.use((config) => {
  // Tarayıcıda çalışıyorsa token'ı ekle
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// API metotları
export const api = {
  // Auth işlemleri
  auth: {
    login: async (data: { email: string; password: string }) => {
      const response = await apiClient.post("/auth/login", data);
      return response.data;
    },
    register: async (data: {
      email: string;
      password: string;
      name: string;
      surname: string;
    }) => {
      const response = await apiClient.post("/auth/register", data);
      return response.data;
    },
    me: async () => {
      const response = await apiClient.get("/auth/me");
      return response.data;
    },
    changePassword: async (data: { 
      currentPassword: string; 
      newPassword: string 
    }) => {
      const response = await apiClient.post("/auth/change-password", data);
      return response.data;
    },
  },

  // Departman işlemleri
  departments: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const response = await apiClient.get("/departments", { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/departments/${id}`);
      return response.data;
    },
    getHierarchy: async () => {
      const response = await apiClient.get("/departments/hierarchy");
      return response.data;
    },
    create: async (data: { name: string; description?: string; parentId?: string }) => {
      const response = await apiClient.post("/departments", data);
      return response.data;
    },
    update: async (id: string, data: { name?: string; description?: string; parentId?: string | null }) => {
      const response = await apiClient.put(`/departments/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/departments/${id}`);
      return response.data;
    },
  },

  // Personel işlemleri
  employees: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      departmentId?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const response = await apiClient.get("/employees", { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data;
    },
    create: async (data: {
      name: string;
      surname: string;
      email: string;
      phone?: string;
      position?: string;
      departmentId: string;
      managerId?: string;
      startDate: string;
      endDate?: string;
    }) => {
      const response = await apiClient.post("/employees", data);
      return response.data;
    },
    update: async (id: string, data: {
      name?: string;
      surname?: string;
      email?: string;
      phone?: string;
      position?: string;
      departmentId?: string;
      managerId?: string | null;
      startDate?: string;
      endDate?: string | null;
    }) => {
      const response = await apiClient.put(`/employees/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/employees/${id}`);
      return response.data;
    },
  },

  // Proje işlemleri
  projects: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      departmentId?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const response = await apiClient.get("/projects", { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/projects/${id}`);
      return response.data;
    },
    create: async (data: {
      name: string;
      description?: string;
      status: string;
      startDate: string;
      endDate?: string;
      budget?: number;
      departmentId: string;
      customerId?: string;
    }) => {
      const response = await apiClient.post("/projects", data);
      return response.data;
    },
    update: async (id: string, data: {
      name?: string;
      description?: string | null;
      status?: string;
      startDate?: string;
      endDate?: string | null;
      budget?: number | null;
      departmentId?: string;
      customerId?: string | null;
    }) => {
      const response = await apiClient.put(`/projects/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/projects/${id}`);
      return response.data;
    },
  },

  // Görev işlemleri
  tasks: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      priority?: string;
      projectId?: string;
      assigneeId?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const response = await apiClient.get("/tasks", { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/tasks/${id}`);
      return response.data;
    },
    create: async (data: {
      title: string;
      description?: string;
      status: string;
      priority: string;
      dueDate?: string;
      projectId: string;
      assigneeIds: string[];
    }) => {
      const response = await apiClient.post("/tasks", data);
      return response.data;
    },
    update: async (id: string, data: {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      projectId?: string;
      assigneeIds?: string[];
    }) => {
      const response = await apiClient.put(`/tasks/${id}`, data);
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      const response = await apiClient.patch(`/tasks/${id}/status`, { status });
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/tasks/${id}`);
      return response.data;
    },
  },

  // Müşteri işlemleri
  customers: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const response = await apiClient.get("/customers", { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/customers/${id}`);
      return response.data;
    },
    create: async (data: {
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      type: string;
      status: string;
    }) => {
      const response = await apiClient.post("/customers", data);
      return response.data;
    },
    update: async (id: string, data: {
      name?: string;
      contactPerson?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      type?: string;
      status?: string;
    }) => {
      const response = await apiClient.put(`/customers/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/customers/${id}`);
      return response.data;
    },
  },
};

export default api; 