import axios from 'axios';
import { apiClient, handleApiError } from './api';
import { Customer, NewCustomerData, UpdateCustomerData } from '@/types/customer';
import { toast } from 'sonner';

/**
 * Tüm müşterileri API'den getirir.
 * @returns Customer[] türünde müşteri dizisi
 */
export async function getAllCustomers(): Promise<Customer[]> {
  const context = 'Müşteriler Getirilirken';
  try {
    const response = await apiClient.get('/customers');
    return response.data as Customer[];
  } catch (error) {
    handleApiError(error, context);
    return [];
  }
}

/**
 * Belirli bir müşteriyi ID ile getirir.
 * @param customerId Getirilecek müşterinin ID'si
 * @returns Customer nesnesi veya null (bulunamazsa)
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const context = `Müşteri Getirilirken (ID: ${customerId})`;
  try {
    const response = await apiClient.get(`/customers/${customerId}`);
    return response.data as Customer;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`${context}: Müşteri bulunamadı`);
      return null;
    }
    handleApiError(error, context);
    return null;
  }
}

/**
 * Yeni bir müşteri oluşturur.
 * @param customerData Yeni müşterinin verileri (NewCustomerData)
 * @returns Oluşturulan müşteri (Customer) veya null (hata durumunda)
 */
export async function createCustomer(customerData: NewCustomerData): Promise<Customer | null> {
  const context = 'Müşteri Oluşturulurken';
  try {
    const response = await apiClient.post('/customers', customerData);
    toast.success("Müşteri başarıyla oluşturuldu!");
    return response.data as Customer;
  } catch (error) {
    handleApiError(error, context);
    return null;
  }
}

/**
 * Mevcut bir müşteriyi günceller.
 * @param customerId Güncellenecek müşterinin ID'si
 * @param customerData Güncelleme verileri (UpdateCustomerData)
 * @returns Güncellenen müşteri (Customer) veya null (hata durumunda)
 */
export async function updateCustomer(customerId: string, customerData: UpdateCustomerData): Promise<Customer | null> {
  const context = `Müşteri Güncellenirken (ID: ${customerId})`;
  try {
    const response = await apiClient.put(`/customers/${customerId}`, customerData);
    toast.success("Müşteri başarıyla güncellendi!");
    return response.data as Customer;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`${context}: Güncellenecek müşteri bulunamadı`);
      toast.error("Güncellenecek müşteri bulunamadı.");
      return null;
    }
    handleApiError(error, context);
    return null;
  }
}

/**
 * Bir müşteriyi siler.
 * @param customerId Silinecek müşterinin ID'si
 * @returns boolean İşlemin başarılı olup olmadığını belirtir
 */
export async function deleteCustomer(customerId: string): Promise<boolean> {
  const context = `Müşteri Silinirken (ID: ${customerId})`;
  try {
    await apiClient.delete(`/customers/${customerId}`);
    toast.success("Müşteri başarıyla silindi.");
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`${context}: Silinecek müşteri bulunamadı`);
      toast.error("Silinecek müşteri bulunamadı.");
      return false;
    }
    handleApiError(error, context);
    return false;
  }
} 