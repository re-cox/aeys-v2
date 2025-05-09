const express = require('express');
const router = express.Router();
const progressPaymentController = require('../controllers/progressPayment.controller');
const authMiddleware = require('../middlewares/auth');

// Hakediş router'larını tanımla
router.get('/', authMiddleware.authenticateToken, progressPaymentController.getAllProgressPayments);
router.post('/', authMiddleware.authenticateToken, progressPaymentController.createProgressPayment);
router.get('/:id', authMiddleware.authenticateToken, progressPaymentController.getProgressPaymentById);
router.put('/:id', authMiddleware.authenticateToken, progressPaymentController.updateProgressPayment);
router.delete('/:id', authMiddleware.authenticateToken, progressPaymentController.deleteProgressPayment);
router.put('/:id/status', authMiddleware.authenticateToken, progressPaymentController.updateProgressPaymentStatus);

// Döküman route'ları - express-fileupload ile
router.post('/:id/documents', authMiddleware.authenticateToken, progressPaymentController.uploadDocuments);
router.delete('/:progressPaymentId/documents/:documentId', authMiddleware.authenticateToken, progressPaymentController.deleteDocument);

// Finansal özet route'ları
router.get('/projects/:projectId/financial-summary', authMiddleware.authenticateToken, progressPaymentController.getProjectFinancialSummary);

module.exports = router; 