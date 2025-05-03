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

// Tüm hakedişleri getir (opsiyonel projectId filtresi ile)
router.get('/', getAllProgressPayments);

// Belirli bir hakediş detayını getir
router.get('/:id', getProgressPaymentById);

// Yeni hakediş oluştur
router.post('/', createProgressPayment);

// Hakediş güncelle
router.put('/:id', updateProgressPayment);

// Hakediş sil
router.delete('/:id', deleteProgressPayment);

// Hakediş durumunu güncelle
router.put('/:id/status', updateProgressPaymentStatus);

// Proje finansal özetini getir
router.get('/projects/:id/financial-summary', getProjectFinancialSummary);

export default router;