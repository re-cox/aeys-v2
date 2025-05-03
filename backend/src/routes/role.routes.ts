import { Router } from 'express';
import { getRoles } from '../controllers/role.controller';
// import { authenticateToken, authorizeRoles } from '../middleware/auth'; // Gerekirse yetkilendirme eklenebilir

const router = Router();

// Tüm rolleri listele
router.get('/', /* authenticateToken, authorizeRoles(['ADMIN']), */ getRoles);

export default router; 