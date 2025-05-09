import express from 'express';
import { 
  getAllProgressPayments, 
  getProgressPaymentById, 
  createProgressPayment,
  updateProgressPayment,
  deleteProgressPayment,
  updateProgressPaymentStatus,
  getProjectFinancialSummary
} from '../controllers/progressPayment.controller';

const router = express.Router();

// Önce özel rotalar

// Proje finansal özetini getir
router.get('/projects/:projectId/financial-summary', getProjectFinancialSummary);

// Hakediş durumu güncelle
router.put('/:id/status', updateProgressPaymentStatus);

// Sonra genel rotalar

// Tüm hakedişleri getir (opsiyonel projectId filtresi ile)
router.get('/', getAllProgressPayments);

// Yeni hakediş oluştur
router.post('/', createProgressPayment);

// En son ID parametresi içeren basit rotalar

// Hakediş güncelle
router.put('/:id', updateProgressPayment);

// Hakediş sil
router.delete('/:id', deleteProgressPayment);

// Belirli bir hakediş getir (en sona koyuyoruz çünkü :id tüm path'leri yakalayabilir)
router.get('/:id', getProgressPaymentById);

export default router;