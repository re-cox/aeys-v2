import { PrismaClient, Customer } from '@prisma/client';
// Özel hata sınıfları yerine standart Error kullanılacak
// import { NotFoundError, BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

// Tip tanımlamaları güncellendi (Prisma şemasına göre)
type CustomerCreateData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
type CustomerUpdateData = Partial<CustomerCreateData>;

/**
 * Tüm müşterileri getirir.
 * @returns {Promise<Customer[]>} Müşteri listesi.
 */
export const getAllCustomers = async (): Promise<Customer[]> => {
    return prisma.customer.findMany();
};

/**
 * ID ile belirli bir müşteriyi getirir.
 * @param {string} id Müşteri ID'si.
 * @returns {Promise<Customer>} Müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa.
 */
export const getCustomerById = async (id: string): Promise<Customer> => {
    const customer = await prisma.customer.findUnique({
        where: { id },
    });
    if (!customer) {
        // NotFoundError yerine standart Error
        throw new Error('Müşteri bulunamadı'); 
    }
    return customer;
};

/**
 * Yeni bir müşteri oluşturur.
 * @param {CustomerCreateData} data Yeni müşteri verileri.
 * @returns {Promise<Customer>} Oluşturulan müşteri nesnesi.
 */
export const createCustomer = async (data: CustomerCreateData): Promise<Customer> => {
    // Gerekli alan kontrolü (name zorunlu)
    if (!data.name) {
        // BadRequestError yerine standart Error
        throw new Error('Firma adı zorunludur');
    }
    
    // E-posta benzersizlik kontrolü kaldırıldı (şemada @unique değil)
    /*
    const existingCustomer = await prisma.customer.findUnique({ where: { email: data.email } });
    if (existingCustomer) {
        throw new BadRequestError('Bu e-posta adresi zaten kullanılıyor');
    }
    */

    return prisma.customer.create({
        data,
    });
};

/**
 * Mevcut bir müşteriyi günceller.
 * @param {string} id Güncellenecek müşteri ID'si.
 * @param {CustomerUpdateData} data Güncelleme verileri.
 * @returns {Promise<Customer>} Güncellenen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa.
 */
export const updateCustomer = async (id: string, data: CustomerUpdateData): Promise<Customer> => {
    // Önce müşterinin var olup olmadığını kontrol et (getCustomerById Error fırlatır)
    await getCustomerById(id);

    // E-posta benzersizlik kontrolü kaldırıldı
    /*
    if (data.email) {
        const existingCustomer = await prisma.customer.findFirst({ 
            where: { 
                email: data.email,
                id: { not: id } 
            } 
        });
        if (existingCustomer) {
            throw new BadRequestError('Bu e-posta adresi başka bir müşteri tarafından kullanılıyor');
        }
    }
    */

    return prisma.customer.update({
        where: { id },
        data,
    });
};

/**
 * Bir müşteriyi siler.
 * @param {string} id Silinecek müşteri ID'si.
 * @returns {Promise<Customer>} Silinen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa.
 */
export const deleteCustomer = async (id: string): Promise<Customer> => {
    // Önce müşterinin var olup olmadığını kontrol et (getCustomerById Error fırlatır)
    await getCustomerById(id);

    return prisma.customer.delete({
        where: { id },
    });
}; 