import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any; // Populated by auth middleware
}

// GET /tasks?date=YYYY-MM-DD
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        date: String(date),
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// PATCH /tasks/reorder
export const reorderTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { taskIds } = req.body; // Array of IDs in new order

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!Array.isArray(taskIds)) return res.status(400).json({ error: 'Invalid taskIds' });

    // Use transaction to update all orders
    await prisma.$transaction(
      taskIds.map((id: string, index: number) => 
        prisma.task.updateMany({
            where: { id, userId }, // Ensure user owns the task
            data: { order: index }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
};

// POST /tasks
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, date, pomodorosTotal, startTime, endTime } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        date,
        startTime,
        endTime,
        status: 'TODO',
        pomodorosTotal: pomodorosTotal || 1, // Default to 1 if not provided
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// PATCH /tasks/:id/status
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body; // 'TODO', 'DONE'

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const task = await prisma.task.updateMany({
      where: { id: String(id), userId },
      data: { status },
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

// PATCH /tasks/:id/progress
export const updateTaskProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    // We increment by 1
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const taskId = String(id);

    // First get the task to check if we should verify user ownership strictly or just rely on updateMany. 
    // updateMany returns count, doesn't return the record. 
    // Let's use update with where clause including userId if possible? 
    // Prisma update requires unique identifier. 'id' is unique globaly, but we should check userId.
    // Standard pattern: 
    const existingTask = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        pomodorosCompleted: { increment: 1 } 
      },
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

// PATCH /tasks/:id
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, description, pomodorosTotal, startTime, endTime, date } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const task = await prisma.task.updateMany({
      where: { id: String(id), userId },
      data: { 
        title, 
        description, 
        pomodorosTotal,
        startTime,
        endTime,
        date
      },
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// DELETE /tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Note: We should delete related FocusSessions first or use cascade delete in schema
    // Ideally we would update schema to: focusSessions FocusSession[] @relation(onDelete: Cascade)
    
    // For now, let's try to delete. If it fails due to FK constraint, we'll know.
    const deleted = await prisma.task.deleteMany({
      where: { id: String(id), userId },
    });

    if (deleted.count === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error("Delete task, likely FK constraint:", error);
    res.status(500).json({ error: 'Failed to delete task. It might have active sessions.' });
  }
};
