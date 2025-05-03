import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Tüm rotalar için kimlik doğrulama gerekli
router.use(authenticate);

/**
 * @route GET /api/additional-works
 * @desc İlave işleri listele
 * @access Private
 */
router.get('/', (req, res) => {
  // İleride implementasyon eklenecek
  res.status(200).json({ message: 'İlave iş listesi' });
});

/**
 * @route POST /api/additional-works
 * @desc Yeni ilave iş oluştur
 * @access Private
 */
router.post('/', (req, res) => {
  // İleride implementasyon eklenecek
  res.status(201).json({ message: 'İlave iş oluşturuldu' });
});

export default router; 