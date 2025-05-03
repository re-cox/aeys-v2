import axios, { AxiosError } from 'axios';
import { Project } from '@/types/project';

const API_URL = '/api';
const TIMEOUT = 30000;

/**
 * Tüm projeleri getirir
 */
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    console.log('Fetching all projects...');
    const response = await axios.get(`${API_URL}/projects`, {
      timeout: TIMEOUT
    });
    
    // Successful response handling
    if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
      console.log(`Fetched ${response.data.data.length} projects`);
      return response.data.data;
    }
    
    // Legacy support - check if the response itself is an array
    if (Array.isArray(response.data)) {
      console.log(`Fetched ${response.data.length} projects (legacy format)`);
      return response.data;
    }
    
    // Handle other formats that might contain data
    if (response.data && response.data.data) {
      if (Array.isArray(response.data.data)) {
        console.log(`Fetched ${response.data.data.length} projects (alternative format)`);
        return response.data.data;
      } else {
        // If data exists but is not an array, wrap it
        console.log('Project data is not an array, converting to array format');
        return [response.data.data];
      }
    }
    
    // Invalid response format
    console.error('API proje dizisi döndürmedi:', response.data);
    throw new Error('API proje dizisi döndürmedi');
  } catch (error) {
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Proje veri hatası (Axios):', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message
      });
      
      // If we have data in the error response, try to use it
      if (axiosError.response?.data && (axiosError.response.data as any).data) {
        const data = (axiosError.response.data as any).data;
        if (Array.isArray(data)) {
          console.log('Recovered projects from error response');
          return data;
        }
      }
    } else {
      console.error('Proje veri hatası:', error);
    }
    
    throw new Error('Proje verileri alınamadı');
  }
}; 