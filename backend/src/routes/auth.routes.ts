import { Router } from 'express';
import { googleLogin, getMe, logout } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/google', googleLogin);
router.get('/me', authenticateToken, getMe);
router.post('/logout', logout);

export default router;
