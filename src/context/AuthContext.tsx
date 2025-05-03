'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Employee {
  id: string;
  name: string;
  surname: string;
  email: string;
  position?: string;
  departmentId?: string;
  profilePictureUrl?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  employee: Employee | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  employee: null,
  login: async () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  // API temel URL'i
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  console.log('[AuthContext] Effective API Base URL:', API_BASE_URL);

  // İlk yükleme sırasında localStorage'dan token kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Token geçerliliğini kontrol et
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          setToken(storedToken);
          setEmployee(data.employee);
          setIsAuthenticated(true);
        } else {
          // Token geçersiz veya süresi dolmuş
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [API_BASE_URL]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setEmployee(data.employee);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setEmployee(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    token,
    employee,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 