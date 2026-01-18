import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getTasks, createTask, updateTaskStatus, updateTaskProgress, updateTask, deleteTask } from '../controllers/task.controller';

const router = Router();

// Protect all task routes
router.use(authenticateToken);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/progress', updateTaskProgress);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
