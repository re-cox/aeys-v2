import { Router } from 'express';
import {
    getAnnualLeaves,
    createAnnualLeave,
    updateAnnualLeaveStatus,
    updateAnnualLeave,
    getAnnualLeaveStats
} from '../controllers/annualLeave.controller';
// import { protect, authorize } from '../middleware/auth.middleware'; // Yetkilendirme eklenecek
import { protect } from '../middlewares/auth.middleware'; // Middleware dosyasının yolu düzeltildi ve protect import edildi

const router = Router();

console.log("--- annualLeave.routes.ts dosyası yüklendi ---"); // Test logu

// Rotalar
router.route('/')
    .get(protect, getAnnualLeaves) // protect eklendi
    .post(protect, createAnnualLeave); // protect eklendi

// İzin Detaylarını Güncelleme (Tarih, Sebep vb.)
router.route('/:id')
    // TODO: updateAnnualLeave için de protect ve muhtemelen yetki eklenmeli
    .put(protect, updateAnnualLeave); // protect eklendi
    // .get(/* protect, */ getAnnualLeaveById) // Tekil izin getirme (varsa)
    // .delete(/* protect, authorize('admin'), */ deleteAnnualLeave); // Silme (varsa)

// İzin Durumunu Güncelleme (Onay/Red)
router.route('/:id/status')
    // TODO: authorize('admin', 'manager') gibi yetkilendirme eklenmeli
    .put(protect, updateAnnualLeaveStatus); // protect aktif edildi

// Yeni Stats Rotası
// TODO: Bu rotaya erişimi kısıtlamak için authMiddleware ve authorize eklenmeli
// Örnek: router.get('/stats', authMiddleware, authorize(['admin', 'hr']), getAnnualLeaveStats);
// TODO: protect eklenmeli
router.get('/stats', protect, getAnnualLeaveStats); // protect eklendi

// TODO: Tekil izin getirme (GET /:id) ve silme (DELETE /:id) eklenebilir
// router.route('/:id')
//     .get(/* protect, */ getAnnualLeaveById)
//     .delete(/* protect, authorize('admin'), */ deleteAnnualLeave);

export default router; 