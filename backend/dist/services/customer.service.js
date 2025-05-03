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
 * Tüm müşterileri getirir.
 * @returns {Promise<Customer[]>} Müşteri listesi.
 */
const getAllCustomers = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.customer.findMany();
});
exports.getAllCustomers = getAllCustomers;
/**
 * ID ile belirli bir müşteriyi getirir.
 * @param {string} id Müşteri ID'si.
 * @returns {Promise<Customer>} Müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa.
 */
const getCustomerById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const customer = yield prisma.customer.findUnique({
        where: { id },
    });
    if (!customer) {
        // NotFoundError yerine standart Error
        throw new Error('Müşteri bulunamadı');
    }
    return customer;
});
exports.getCustomerById = getCustomerById;
/**
 * Yeni bir müşteri oluşturur.
 * @param {CustomerCreateData} data Yeni müşteri verileri.
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
 * @returns {Promise<Customer>} Güncellenen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa.
 */
const updateCustomer = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Önce müşterinin var olup olmadığını kontrol et (getCustomerById Error fırlatır)
    yield (0, exports.getCustomerById)(id);
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
 * @returns {Promise<Customer>} Silinen müşteri nesnesi.
 * @throws {Error} Müşteri bulunamazsa.
 */
const deleteCustomer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Önce müşterinin var olup olmadığını kontrol et (getCustomerById Error fırlatır)
    yield (0, exports.getCustomerById)(id);
    return prisma.customer.delete({
        where: { id },
    });
});
exports.deleteCustomer = deleteCustomer;
