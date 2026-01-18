import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getReflection,
  getReflectionHistory,
  saveReflection,
  getWeeklyStats,
} from '../controllers/reflection.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getReflection);
router.get('/history', getReflectionHistory);
router.get('/stats', getWeeklyStats);
router.post('/', saveReflection);

export default router;
