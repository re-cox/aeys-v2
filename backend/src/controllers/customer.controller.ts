import { Request, Response } from 'express';
import {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} from '../services/customer.service';
import { Customer, CustomerStatus } from '@prisma/client'; // CustomerStatus eklendi

/**
 * @description Tüm müşterileri getirir.
 */
export const getAllCustomersHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return; // Return void
        }

        const customers = await getAllCustomers(userId); // userId'yi servis katmanına ilet
        res.json(customers);
    } catch (error: any) {
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
};

/**
 * @description Belirli bir müşteriyi ID ile getirir.
 */
export const getCustomerByIdHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = req.user?.id;
        const customerId = req.params.id;

        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return; // Return void
        }
        if (!customerId) {
            res.status(400).json({ message: "Müşteri ID'si gerekli." });
            return; // Return void
        }

        const customer = await getCustomerById(customerId, userId); // userId'yi servis katmanına ilet
        
        // Yanıtta tüm alanları gönder (Prisma modeli ile aynı)
        res.json(customer);
    } catch (error: any) {
        console.error(`Müşteri ${req.params.id} getirilirken hata:`, error);
        
        let statusCode = 500;
        let message = 'Müşteri getirilirken bir sunucu hatası oluştu.';

        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
            message = error.message;
        } else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        }

        res.status(statusCode).json({ message });
    }
};

/**
 * @description Yeni bir müşteri oluşturur.
 */
export const createCustomerHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = req.user?.id;
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
        const newCustomer = await createCustomer(customerData);

        res.status(201).json(newCustomer); // Başarılı oluşturma sonrası 201 Created
    } catch (error: any) {
        console.error('Müşteri oluşturulurken hata:', error);
        
        let statusCode = 500;
        let message = 'Müşteri oluşturulurken bir sunucu hatası oluştu.';

        // Prisma'nın unique constraint hatası (örneğin email zaten var)
        if (error.code === 'P2002') { 
            statusCode = 409; // Conflict
            // Hangi alanın unique olduğunu belirleyip daha spesifik mesaj verilebilir
            message = 'Bu bilgilere sahip bir müşteri zaten mevcut.'; 
        } else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        } else if (error.name === 'ValidationError') { // Eğer Zod gibi bir validasyon kütüphanesi kullanılırsa
             statusCode = 400;
             message = error.message; // Validasyon hatası mesajı
        }

        res.status(statusCode).json({ message });
    }
};

/**
 * @description Mevcut bir müşteriyi günceller.
 */
export const updateCustomerHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = req.user?.id;
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

        const updatedCustomer = await updateCustomer(customerId, updateData, userId); // userId'yi servis katmanına ilet
        res.json(updatedCustomer);
    } catch (error: any) {
        console.error(`Müşteri ${req.params.id} güncellenirken hata:`, error);
        
        let statusCode = 500;
        let message = 'Müşteri güncellenirken bir sunucu hatası oluştu.';

        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
            message = error.message;
        } else if (error.code === 'P2002') { 
            statusCode = 409;
            message = 'Güncellemeye çalıştığınız bilgiler başka bir müşteriyle çakışıyor.'; 
        } else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        } else if (error.name === 'ValidationError') { 
             statusCode = 400;
             message = error.message;
        }
        
        res.status(statusCode).json({ message });
    }
};

/**
 * @description Bir müşteriyi siler.
 */
export const deleteCustomerHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user protect middleware'i tarafından eklenmeli
        const userId = req.user?.id;
        const customerId = req.params.id;
        if (!userId) {
            res.status(401).json({ message: 'Yetkisiz erişim. Kullanıcı ID bulunamadı.' });
            return;
        }
        if (!customerId) {
            res.status(400).json({ message: "Müşteri ID'si gerekli." });
            return;
        }

        await deleteCustomer(customerId, userId); // userId'yi servis katmanına ilet
        
        res.status(204).send(); // Başarılı silme sonrası 204 No Content döndür
    } catch (error: any) {
        console.error(`Müşteri ${req.params.id} silinirken hata:`, error);
        
        let statusCode = 500;
        let message = 'Müşteri silinirken bir sunucu hatası oluştu.';

        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
            message = error.message;
        } else if (error.message.includes('Kullanıcı ID')) {
            statusCode = 400;
            message = error.message;
        }

        res.status(statusCode).json({ message });
    }
};