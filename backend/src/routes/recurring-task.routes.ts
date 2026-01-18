import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getRecurringTasks,
  getRecurringTask,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
} from '../controllers/recurring-task.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getRecurringTasks);
router.get('/:id', getRecurringTask);
router.post('/', createRecurringTask);
router.patch('/:id', updateRecurringTask);
router.delete('/:id', deleteRecurringTask);

export default router;
