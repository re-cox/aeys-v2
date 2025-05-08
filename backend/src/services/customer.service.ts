import { PrismaClient, Customer } from '@prisma/client';
// Özel hata sınıfları yerine standart Error kullanılacak
// import { NotFoundError, BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

// Tip tanımlamaları güncellendi (Prisma şemasına göre)
type CustomerCreateData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
type CustomerUpdateData = Partial<CustomerCreateData>;

/**
 * Belirli bir kullanıcıya ait tüm müşterileri getirir.
 * @param {string} userId Kullanıcı ID'si.
 * @returns {Promise<Customer[]>} Müşteri listesi.
 */
export const getAllCustomers = async (userId: string): Promise<Customer[]> => {
    if (!userId) {
        throw new Error('Kullanıcı ID\'si gerekli.');
    }
    return prisma.customer.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * ID ile belirli bir müşteriyi getirir ve kullanıcının yetkisini kontrol eder.
 * @param {string} id Müşteri ID'si.
 * @param {string} userId Kullanıcı ID'si.
 * @returns {Promise<Customer>} Müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa veya kullanıcı yetkisizse.
 */
export const getCustomerById = async (id: string, userId: string): Promise<Customer> => {
    if (!userId) {
        throw new Error('Kullanıcı ID\'si gerekli.');
    }
    const customer = await prisma.customer.findUnique({
        where: { id: id },
    });
    if (!customer) {
        throw new Error('Müşteri bulunamadı');
    }
    // Güvenlik: Müşterinin bu kullanıcıya ait olup olmadığını kontrol et
    if (customer.userId !== userId) {
        throw new Error('Bu müşteri bilgisine erişim yetkiniz yok.'); // Yetkisiz erişim hatası
    }
    return customer;
};

/**
 * Yeni bir müşteri oluşturur.
 * @param {CustomerCreateData} data Yeni müşteri verileri (userId içermeli).
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
 * @param {string} userId İşlemi yapan kullanıcı ID'si.
 * @returns {Promise<Customer>} Güncellenen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa veya kullanıcı yetkisizse.
 */
export const updateCustomer = async (id: string, data: CustomerUpdateData, userId: string): Promise<Customer> => {
    // Önce müşterinin var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
    await getCustomerById(id, userId);

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
 * @param {string} userId İşlemi yapan kullanıcı ID'si.
 * @returns {Promise<Customer>} Silinen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa veya kullanıcı yetkisizse.
 */
export const deleteCustomer = async (id: string, userId: string): Promise<Customer> => {
    // Önce müşterinin var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
    await getCustomerById(id, userId);

    return prisma.customer.delete({
        where: { id },
    });
};