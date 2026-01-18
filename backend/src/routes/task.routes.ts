import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getTasks, getTask, createTask, updateTaskStatus, updateTaskProgress, updateTask, deleteTask, reorderTasks } from '../controllers/task.controller';

const router = Router();

// Protect all task routes
router.use(authenticateToken);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.patch('/reorder', reorderTasks);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/progress', updateTaskProgress);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
