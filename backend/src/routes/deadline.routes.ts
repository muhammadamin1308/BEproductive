import { Router } from 'express';
import {
  createDeadline,
  deleteDeadline,
  getDeadline,
  getDeadlines,
  updateDeadline,
  updateDeadlineCompletion,
} from '../controllers/deadline.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getDeadlines);
router.get('/:id', getDeadline);
router.post('/', createDeadline);
router.patch('/:id', updateDeadline);
router.delete('/:id', deleteDeadline);
router.patch('/:id/complete', updateDeadlineCompletion);

export default router;
