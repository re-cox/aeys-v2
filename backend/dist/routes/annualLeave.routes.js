"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const annualLeave_controller_1 = require("../controllers/annualLeave.controller");
// import { protect, authorize } from '../middleware/auth.middleware'; // Yetkilendirme eklenecek
const auth_middleware_1 = require("../middlewares/auth.middleware"); // Middleware dosyasının yolu düzeltildi ve protect import edildi
const router = (0, express_1.Router)();
console.log("--- annualLeave.routes.ts dosyası yüklendi ---"); // Test logu
// Rotalar
router.route('/')
    .get(auth_middleware_1.protect, annualLeave_controller_1.getAnnualLeaves) // protect eklendi
    .post(auth_middleware_1.protect, annualLeave_controller_1.createAnnualLeave); // protect eklendi
// İzin Detaylarını Güncelleme (Tarih, Sebep vb.)
router.route('/:id')
    // TODO: updateAnnualLeave için de protect ve muhtemelen yetki eklenmeli
    .put(auth_middleware_1.protect, annualLeave_controller_1.updateAnnualLeave); // protect eklendi
// .get(/* protect, */ getAnnualLeaveById) // Tekil izin getirme (varsa)
// .delete(/* protect, authorize('admin'), */ deleteAnnualLeave); // Silme (varsa)
// İzin Durumunu Güncelleme (Onay/Red)
router.route('/:id/status')
    // TODO: authorize('admin', 'manager') gibi yetkilendirme eklenmeli
    .put(auth_middleware_1.protect, annualLeave_controller_1.updateAnnualLeaveStatus); // protect aktif edildi
// Yeni Stats Rotası
// TODO: Bu rotaya erişimi kısıtlamak için authMiddleware ve authorize eklenmeli
// Örnek: router.get('/stats', authMiddleware, authorize(['admin', 'hr']), getAnnualLeaveStats);
// TODO: protect eklenmeli
router.get('/stats', auth_middleware_1.protect, annualLeave_controller_1.getAnnualLeaveStats); // protect eklendi
// TODO: Tekil izin getirme (GET /:id) ve silme (DELETE /:id) eklenebilir
// router.route('/:id')
//     .get(/* protect, */ getAnnualLeaveById)
//     .delete(/* protect, authorize('admin'), */ deleteAnnualLeave);
exports.default = router;
