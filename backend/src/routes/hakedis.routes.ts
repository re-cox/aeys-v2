import { Router } from 'express';
import * as progressPaymentController from '../controllers/progressPayment.controller';
// import { protect } from '../middleware/auth.middleware'; // İleride yetkilendirme eklenebilir

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Hakediş API çalışıyor!' });
});

// Hakedişler için ana endpointler
// GET /api/progress-payments -> Tüm hakedişleri listeler
router.get('/', progressPaymentController.getAllProgressPayments);

// GET /api/progress-payments/:id -> Belirli bir hakedişi getirir
router.get('/:id', progressPaymentController.getProgressPaymentById);

// POST /api/progress-payments -> Yeni hakediş oluşturur
router.post('/', progressPaymentController.createProgressPayment);

// PUT /api/progress-payments/:id -> Hakedişi günceller
router.put('/:id', progressPaymentController.updateProgressPayment);

// DELETE /api/progress-payments/:id -> Hakedişi siler
router.delete('/:id', progressPaymentController.deleteProgressPayment);

// PUT /api/progress-payments/:id/status -> Hakediş durumunu günceller
router.put('/:id/status', progressPaymentController.updateProgressPaymentStatus);

// GET /api/progress-payments/project/:projectId/summary -> Proje finansal özeti
router.get('/project/:projectId/summary', progressPaymentController.getProjectFinancialSummary);

export default router; 