import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../controllers/goal.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /goals - Get all goals (with optional level filter)
router.get('/', getGoals);

// GET /goals/:id - Get a specific goal
router.get('/:id', getGoal);

// POST /goals - Create a new goal
router.post('/', createGoal);

// PUT /goals/:id - Update a goal
router.put('/:id', updateGoal);

// DELETE /goals/:id - Delete a goal
router.delete('/:id', deleteGoal);

export default router;
