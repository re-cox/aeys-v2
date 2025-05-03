import { Router, Request, Response, NextFunction } from 'express';
import { loginUser, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  loginUser(req, res).catch(next);
});

// GET /api/auth/me (Token gerektirir)
router.get('/me', 
  (req: Request, res: Response, next: NextFunction) => {
    protect(req, res, next).catch(next);
  }, 
  (req: Request, res: Response, next: NextFunction) => {
    getMe(req, res).catch(next);
  }
);

// Gerekirse buraya register, refresh token vb. rotalar eklenebilir

export default router; 