import axios, { AxiosRequestConfig } from 'axios';

// Retry mekanizması
export async function apiRequestWithRetry<T>(
  config: AxiosRequestConfig,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (retries <= 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    console.log(`API isteği yeniden deneniyor. Kalan: ${retries-1}`);
    
    return apiRequestWithRetry<T>(config, retries - 1, delay * 2);
  }
} 