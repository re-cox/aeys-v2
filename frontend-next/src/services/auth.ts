import api from './api';
import axios from 'axios';

export type Employee = {
  id: string;
  name: string;
  surname: string;
  email: string;
  position: string;
  departmentId: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  address?: string;
};

export type LoginResponse = {
  employee: Employee;
  token: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Authenticate user with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  
  // Store token and user in localStorage
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.employee));
  
  return response.data;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<Employee> => {
  try {
    const response = await api.get<{ success: boolean, employee: Employee }>('/auth/me');
    
    if (!response.data || !response.data.employee) {
      throw new Error('Invalid response format');
    }
    
    // Güncel kullanıcı bilgilerini localStorage'a kaydet
    localStorage.setItem('user', JSON.stringify(response.data.employee));
    
    return response.data.employee;
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata:', error);
    
    // Token geçersizse veya kullanıcı bilgileri alınamazsa oturumu kapat
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    throw error;
  }
};

/**
 * Check if user is logged in
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Logout user
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}; 