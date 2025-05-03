import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Tüm rotalar için kimlik doğrulama gerekli
router.use(authenticate);

/**
 * @route GET /api/proposals
 * @desc Teklifleri listele
 * @access Private
 */
router.get('/', (req, res) => {
  // İleride implementasyon eklenecek
  res.status(200).json({ message: 'Teklif listesi' });
});

/**
 * @route POST /api/proposals
 * @desc Yeni teklif oluştur
 * @access Private
 */
router.post('/', (req, res) => {
  // İleride implementasyon eklenecek
  res.status(201).json({ message: 'Teklif oluşturuldu' });
});

export default router; 