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
const client_1 = require("@prisma/client"); // CustomerStatus eklendi
/**
 * Tüm müşterileri getiren controller fonksiyonu.
 * @param {Request} req Express request nesnesi.
 * @param {Response} res Express response nesnesi.
 * @returns {Promise<void>} Promise
 */
const getAllCustomersHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('getAllCustomersHandler çağrıldı');
        const customers = yield (0, customer_service_1.getAllCustomers)();
        // Yanıtta tüm alanları gönder (Prisma modeli ile aynı)
        // Frontend tarafı artık bu tam modeli bekliyor olmalı (veya type'ı güncellenmeli)
        console.log(`${customers.length} müşteri başarıyla alındı`);
        res.json(customers);
    }
    catch (error) {
        console.error('Müşteri listesi alınırken hata oluştu:', error);
        res.status(500).json({
            message: 'Müşteri listesi alınırken bir hata oluştu',
            error: error.message
        });
    }
});
exports.getAllCustomersHandler = getAllCustomersHandler;
/**
 * ID'ye göre bir müşteriyi getiren controller fonksiyonu.
 * @param {Request} req Express request nesnesi.
 * @param {Response} res Express response nesnesi.
 * @returns {Promise<void>} Promise
 */
const getCustomerByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const customer = yield (0, customer_service_1.getCustomerById)(id);
        // Yanıtta tüm alanları gönder (Prisma modeli ile aynı)
        res.json(customer);
    }
    catch (error) {
        if (error.message === 'Müşteri bulunamadı') {
            res.status(404).json({ message: 'Müşteri bulunamadı' });
        }
        else {
            console.error('Müşteri getirilirken hata oluştu:', error);
            res.status(500).json({
                message: 'Müşteri getirilirken bir hata oluştu',
                error: error.message
            });
        }
    }
});
exports.getCustomerByIdHandler = getCustomerByIdHandler;
/**
 * Yeni bir müşteri oluşturan controller fonksiyonu.
 * @param {Request} req Express request nesnesi.
 * @param {Response} res Express response nesnesi.
 * @returns {Promise<void>} Promise
 */
const createCustomerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Müşteri oluşturma isteği alındı:', req.body);
        // Frontend'den gelen tüm ilgili alanları al
        const { name, // Frontend 'name' göndermeli (veya companyName -> name eşleşmesi yapılmalı)
        contactName, contactTitle, email, phone, address, city, district, postalCode, country, taxId, // Frontend 'taxId' göndermeli (veya taxNumber -> taxId eşleşmesi)
        taxOffice, website, notes, status // Frontend CustomerStatus enum değerini göndermeli
         } = req.body;
        // Gerekli alan kontrolü
        if (!name) {
            res.status(400).json({ message: 'Firma adı (name) zorunludur' });
            return;
        }
        // Status değerini doğrula (isteğe bağlı ama önerilir)
        const isValidStatus = status ? Object.values(client_1.CustomerStatus).includes(status) : true; // null veya undefined ise geçerli kabul et (default ACTIVE olacak)
        if (!isValidStatus) {
            res.status(400).json({ message: 'Geçersiz müşteri durumu (status) değeri.' });
            return;
        }
        // Servise gönderilecek veri nesnesi
        const customerData = {
            name,
            contactName: contactName || null,
            contactTitle: contactTitle || null,
            email: email || null,
            phone: phone || null,
            address: address || null,
            city: city || null,
            district: district || null,
            postalCode: postalCode || null,
            country: country || null,
            taxId: taxId || null,
            taxOffice: taxOffice || null,
            website: website || null,
            notes: notes || null,
            status: status ? status : client_1.CustomerStatus.ACTIVE // status yoksa default ACTIVE
        };
        const customer = yield (0, customer_service_1.createCustomer)(customerData);
        console.log('Müşteri başarıyla oluşturuldu:', customer);
        // Yanıtta tüm alanları gönder (Prisma modeli ile aynı)
        res.status(201).json(customer);
    }
    catch (error) {
        console.error('Müşteri oluşturulurken hata oluştu:', error);
        // Prisma veya servis katmanından gelen hataları işle
        if (error.message.includes('Unique constraint failed')) { // Prisma unique hatası örneği
            res.status(400).json({ message: 'Bu bilgilerle kayıtlı başka bir müşteri var (örn: email veya taxId).' });
        }
        // Servis katmanı özel hataları (varsa)
        // else if ((error as YourCustomError).isBadRequest) { ... }
        else {
            res.status(500).json({
                message: 'Müşteri oluşturulurken bir hata oluştu',
                error: error.message
            });
        }
    }
});
exports.createCustomerHandler = createCustomerHandler;
/**
 * Bir müşteriyi güncelleyen controller fonksiyonu.
 * @param {Request} req Express request nesnesi.
 * @param {Response} res Express response nesnesi.
 * @returns {Promise<void>} Promise
 */
const updateCustomerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        // Güncellenecek alanları dinamik olarak al
        const updateData = {};
        const allowedFields = [
            'name', 'contactName', 'contactTitle', 'email', 'phone', 'address',
            'city', 'district', 'postalCode', 'country', 'taxId', 'taxOffice',
            'website', 'notes', 'status'
        ];
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                // Status için enum kontrolü
                if (key === 'status') {
                    const isValidStatus = Object.values(client_1.CustomerStatus).includes(req.body[key]);
                    if (!isValidStatus) {
                        return res.status(400).json({ message: `Geçersiz müşteri durumu (status) değeri: ${req.body[key]}` });
                    }
                }
                // Null gönderilmesine izin vermek için kontrol
                updateData[key] = req.body[key];
            }
        }
        // Güncellenecek veri yoksa hata döndür
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ message: 'Güncellenecek veri bulunamadı.' });
            return;
        }
        const customer = yield (0, customer_service_1.updateCustomer)(id, updateData);
        // Yanıtta tüm alanları gönder (Prisma modeli ile aynı)
        res.json(customer);
    }
    catch (error) {
        if (error.message === 'Müşteri bulunamadı') {
            res.status(404).json({ message: 'Müşteri bulunamadı' });
        }
        else if (error.message.includes('Unique constraint failed')) { // Prisma unique hatası örneği
            res.status(400).json({ message: 'Bu bilgilerle kayıtlı başka bir müşteri var (örn: email veya taxId).' });
        }
        // Diğer potansiyel hatalar
        else {
            console.error('Müşteri güncellenirken hata oluştu:', error);
            res.status(500).json({
                message: 'Müşteri güncellenirken bir hata oluştu',
                error: error.message
            });
        }
    }
});
exports.updateCustomerHandler = updateCustomerHandler;
/**
 * Bir müşteriyi silen controller fonksiyonu.
 * @param {Request} req Express request nesnesi.
 * @param {Response} res Express response nesnesi.
 * @returns {Promise<void>} Promise
 */
const deleteCustomerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield (0, customer_service_1.deleteCustomer)(id);
        res.status(204).send();
    }
    catch (error) {
        if (error.message === 'Müşteri bulunamadı') {
            res.status(404).json({ message: 'Müşteri bulunamadı' });
        }
        else {
            console.error('Müşteri silinirken hata oluştu:', error);
            res.status(500).json({
                message: 'Müşteri silinirken bir hata oluştu',
                error: error.message
            });
        }
    }
});
exports.deleteCustomerHandler = deleteCustomerHandler;
