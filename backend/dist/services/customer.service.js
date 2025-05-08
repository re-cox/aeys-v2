"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const client_1 = require("@prisma/client");
// Özel hata sınıfları yerine standart Error kullanılacak
// import { NotFoundError, BadRequestError } from '../utils/errors';
const prisma = new client_1.PrismaClient();
/**
 * Belirli bir kullanıcıya ait tüm müşterileri getirir.
 * @param {string} userId Kullanıcı ID'si.
 * @returns {Promise<Customer[]>} Müşteri listesi.
 */
const getAllCustomers = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new Error('Kullanıcı ID\'si gerekli.');
    }
    return prisma.customer.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' }
    });
});
exports.getAllCustomers = getAllCustomers;
/**
 * ID ile belirli bir müşteriyi getirir ve kullanıcının yetkisini kontrol eder.
 * @param {string} id Müşteri ID'si.
 * @param {string} userId Kullanıcı ID'si.
 * @returns {Promise<Customer>} Müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa veya kullanıcı yetkisizse.
 */
const getCustomerById = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new Error('Kullanıcı ID\'si gerekli.');
    }
    const customer = yield prisma.customer.findUnique({
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
});
exports.getCustomerById = getCustomerById;
/**
 * Yeni bir müşteri oluşturur.
 * @param {CustomerCreateData} data Yeni müşteri verileri (userId içermeli).
 * @returns {Promise<Customer>} Oluşturulan müşteri nesnesi.
 */
const createCustomer = (data) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.createCustomer = createCustomer;
/**
 * Mevcut bir müşteriyi günceller.
 * @param {string} id Güncellenecek müşteri ID'si.
 * @param {CustomerUpdateData} data Güncelleme verileri.
 * @param {string} userId İşlemi yapan kullanıcı ID'si.
 * @returns {Promise<Customer>} Güncellenen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa veya kullanıcı yetkisizse.
 */
const updateCustomer = (id, data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Önce müşterinin var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
    yield (0, exports.getCustomerById)(id, userId);
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
});
exports.updateCustomer = updateCustomer;
/**
 * Bir müşteriyi siler.
 * @param {string} id Silinecek müşteri ID'si.
 * @param {string} userId İşlemi yapan kullanıcı ID'si.
 * @returns {Promise<Customer>} Silinen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa veya kullanıcı yetkisizse.
 */
const deleteCustomer = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Önce müşterinin var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
    yield (0, exports.getCustomerById)(id, userId);
    return prisma.customer.delete({
        where: { id },
    });
});
exports.deleteCustomer = deleteCustomer;
