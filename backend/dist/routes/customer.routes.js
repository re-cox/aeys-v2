"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // Kimlik doğrulama middleware'i
// import { authorizeRole } from '../middlewares/roleMiddleware'; // Gerekirse rol bazlı yetkilendirme
const router = (0, express_1.Router)();
// Middleware'i her route'a ayrı ayrı uygula
// router.use(authenticateToken); // Kaldırıldı
// GET /api/customers - Tüm müşterileri getir
// Opsiyonel: Sadece belirli roller erişebilsin (örn. admin, manager)
// router.get('/', authorizeRole(['ADMIN', 'MANAGER']), getAllCustomersHandler);
// authenticateToken geçici olarak kaldırıldı
router.get('/', /* authenticateToken, */ customer_controller_1.getAllCustomersHandler);
// GET /api/customers/:id - Belirli bir müşteriyi getir
router.get('/:id', auth_middleware_1.authenticateToken, customer_controller_1.getCustomerByIdHandler);
// POST /api/customers - Yeni müşteri oluştur
// Opsiyonel: Sadece belirli roller oluşturabilsin
// router.post('/', authorizeRole(['ADMIN', 'SALES']), createCustomerHandler);
router.post('/', auth_middleware_1.authenticateToken, customer_controller_1.createCustomerHandler);
// PUT /api/customers/:id - Müşteriyi güncelle
// Opsiyonel: Sadece belirli roller güncelleyebilsin
// router.put('/:id', authorizeRole(['ADMIN', 'SALES']), updateCustomerHandler);
router.put('/:id', auth_middleware_1.authenticateToken, customer_controller_1.updateCustomerHandler);
// DELETE /api/customers/:id - Müşteriyi sil
// Opsiyonel: Sadece belirli roller silebilirsin (örn. admin)
// router.delete('/:id', authorizeRole(['ADMIN']), deleteCustomerHandler);
router.delete('/:id', auth_middleware_1.authenticateToken, customer_controller_1.deleteCustomerHandler);
exports.default = router;
