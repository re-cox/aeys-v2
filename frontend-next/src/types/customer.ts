// CustomerStatus Enum'u
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LEAD = 'LEAD',
  POTENTIAL = 'POTENTIAL'
}

// Frontend'de kullanılacak temel Customer tipi
export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
};

// Yeni müşteri oluşturmak için veri tipi
export type NewCustomerData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

// Müşteri güncellemek için veri tipi (tüm alanlar opsiyonel)
export type UpdateCustomerData = Partial<NewCustomerData>; 