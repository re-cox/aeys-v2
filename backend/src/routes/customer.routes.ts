import { Router } from 'express';
import {
    getAllCustomersHandler,
    getCustomerByIdHandler,
    createCustomerHandler,
    updateCustomerHandler,
    deleteCustomerHandler
} from '../controllers/customer.controller';
import { authenticateToken } from '../middlewares/auth.middleware'; // Kimlik doğrulama middleware'i
// import { authorizeRole } from '../middlewares/roleMiddleware'; // Gerekirse rol bazlı yetkilendirme

const router = Router();

// Middleware'i her route'a ayrı ayrı uygula
// router.use(authenticateToken); // Kaldırıldı

// GET /api/customers - Tüm müşterileri getir
// Opsiyonel: Sadece belirli roller erişebilsin (örn. admin, manager)
// router.get('/', authorizeRole(['ADMIN', 'MANAGER']), getAllCustomersHandler);
// authenticateToken geçici olarak kaldırıldı
router.get('/', /* authenticateToken, */ getAllCustomersHandler);

// GET /api/customers/:id - Belirli bir müşteriyi getir
router.get('/:id', authenticateToken, getCustomerByIdHandler);

// POST /api/customers - Yeni müşteri oluştur
// Opsiyonel: Sadece belirli roller oluşturabilsin
// router.post('/', authorizeRole(['ADMIN', 'SALES']), createCustomerHandler);
router.post('/', authenticateToken, createCustomerHandler);

// PUT /api/customers/:id - Müşteriyi güncelle
// Opsiyonel: Sadece belirli roller güncelleyebilsin
// router.put('/:id', authorizeRole(['ADMIN', 'SALES']), updateCustomerHandler);
router.put('/:id', authenticateToken, updateCustomerHandler);

// DELETE /api/customers/:id - Müşteriyi sil
// Opsiyonel: Sadece belirli roller silebilirsin (örn. admin)
// router.delete('/:id', authorizeRole(['ADMIN']), deleteCustomerHandler);
router.delete('/:id', authenticateToken, deleteCustomerHandler);

export default router; 