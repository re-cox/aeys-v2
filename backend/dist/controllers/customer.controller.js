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
exports.deleteCustomerHandler = exports.updateCustomerHandler = exports.createCustomerHandler = exports.getCustomerByIdHandler = exports.getAllCustomersHandler = void 0;
const customer_service_1 = require("../services/customer.service");
/**
 * @description Tüm müşterileri getirir.
 */
const getAllCustomersHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return; // Return void
        }
        const customers = yield (0, customer_service_1.getAllCustomers)(userId); // userId'yi servis katmanına ilet
        res.json(customers);
    }
    catch (error) {
        console.error('Müşteriler getirilirken hata:', error);
        // Genel hata mesajı
        let statusCode = 500;
        let message = 'Müşteriler getirilirken bir sunucu hatası oluştu.';
        // Özel hata mesajları (örneğin, servis katmanından gelen)
        if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        }
        res.status(statusCode).json({ message });
    }
});
exports.getAllCustomersHandler = getAllCustomersHandler;
/**
 * @description Belirli bir müşteriyi ID ile getirir.
 */
const getCustomerByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const customerId = req.params.id;
        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return; // Return void
        }
        if (!customerId) {
            res.status(400).json({ message: "Müşteri ID'si gerekli." });
            return; // Return void
        }
        const customer = yield (0, customer_service_1.getCustomerById)(customerId, userId); // userId'yi servis katmanına ilet
        // Yanıtta tüm alanları gönder (Prisma modeli ile aynı)
        res.json(customer);
    }
    catch (error) {
        console.error(`Müşteri ${req.params.id} getirilirken hata:`, error);
        let statusCode = 500;
        let message = 'Müşteri getirilirken bir sunucu hatası oluştu.';
        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
            message = error.message;
        }
        else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        }
        res.status(statusCode).json({ message });
    }
});
exports.getCustomerByIdHandler = getCustomerByIdHandler;
/**
 * @description Yeni bir müşteri oluşturur.
 */
const createCustomerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return;
        }
        // Body'den gelen veriyi doğrula
        const customerData = req.body;
        // TODO: Gelen verinin validasyonunu ekle (Zod önerilir)
        if (!customerData.name) {
            res.status(400).json({ message: 'Müşteri adı zorunludur.' });
            return;
        }
        // Servis çağrısını düzelt: createCustomer sadece customerData almalı (userId'yi otomatik olarak alacak şekilde güncellenmeli veya ayrı bir parametre olmalı)
        // Varsayım: customer.service.ts'deki createCustomer güncellendi ve userId'yi kendisi alıyor veya data içinde bekliyor.
        // Eğer createCustomer hala 2 parametre bekliyorsa (data, userId), çağrı şöyle olmalı:
        // const newCustomer = await createCustomer(customerData, userId);
        // Şimdilik tek parametre ile çağırıyoruz, servis katmanının userId'yi ele aldığını varsayıyoruz.
        const newCustomer = yield (0, customer_service_1.createCustomer)(customerData);
        res.status(201).json(newCustomer); // Başarılı oluşturma sonrası 201 Created
    }
    catch (error) {
        console.error('Müşteri oluşturulurken hata:', error);
        let statusCode = 500;
        let message = 'Müşteri oluşturulurken bir sunucu hatası oluştu.';
        // Prisma'nın unique constraint hatası (örneğin email zaten var)
        if (error.code === 'P2002') {
            statusCode = 409; // Conflict
            // Hangi alanın unique olduğunu belirleyip daha spesifik mesaj verilebilir
            message = 'Bu bilgilere sahip bir müşteri zaten mevcut.';
        }
        else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        }
        else if (error.name === 'ValidationError') { // Eğer Zod gibi bir validasyon kütüphanesi kullanılırsa
            statusCode = 400;
            message = error.message; // Validasyon hatası mesajı
        }
        res.status(statusCode).json({ message });
    }
});
exports.createCustomerHandler = createCustomerHandler;
/**
 * @description Mevcut bir müşteriyi günceller.
 */
const updateCustomerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const customerId = req.params.id;
        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return;
        }
        if (!customerId) {
            res.status(400).json({ message: "Müşteri ID'si gerekli." });
            return;
        }
        // Body'den gelen veriyi doğrula
        const updateData = req.body;
        // TODO: Gelen güncelleme verisinin validasyonunu ekle
        const updatedCustomer = yield (0, customer_service_1.updateCustomer)(customerId, updateData, userId); // userId'yi servis katmanına ilet
        res.json(updatedCustomer);
    }
    catch (error) {
        console.error(`Müşteri ${req.params.id} güncellenirken hata:`, error);
        let statusCode = 500;
        let message = 'Müşteri güncellenirken bir sunucu hatası oluştu.';
        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
            message = error.message;
        }
        else if (error.code === 'P2002') {
            statusCode = 409;
            message = 'Güncellemeye çalıştığınız bilgiler başka bir müşteriyle çakışıyor.';
        }
        else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        }
        else if (error.name === 'ValidationError') {
            statusCode = 400;
            message = error.message;
        }
        res.status(statusCode).json({ message });
    }
});
exports.updateCustomerHandler = updateCustomerHandler;
/**
 * @description Bir müşteriyi siler.
 */
const deleteCustomerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const customerId = req.params.id;
        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return;
        }
        if (!customerId) {
            res.status(400).json({ message: "Müşteri ID'si gerekli." });
            return;
        }
        yield (0, customer_service_1.deleteCustomer)(customerId, userId); // userId'yi servis katmanına ilet
        res.status(204).send(); // Başarılı silme sonrası 204 No Content döndür
    }
    catch (error) {
        console.error(`Müşteri ${req.params.id} silinirken hata:`, error);
        let statusCode = 500;
        let message = 'Müşteri silinirken bir sunucu hatası oluştu.';
        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
            message = error.message;
        }
        else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        }
        res.status(statusCode).json({ message });
    }
});
exports.deleteCustomerHandler = deleteCustomerHandler;
