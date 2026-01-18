import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

// GET /recurring-tasks
export const getRecurringTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const recurringTasks = await prisma.recurringTask.findMany({
      where: { userId },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(recurringTasks);
  } catch (error) {
    console.error('Get recurring tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring tasks' });
  }
};

// GET /recurring-tasks/:id
export const getRecurringTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = String(req.params.id);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const recurringTask = await prisma.recurringTask.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
    });

    if (!recurringTask) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    res.json(recurringTask);
  } catch (error) {
    console.error('Get recurring task error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring task' });
  }
};

// POST /recurring-tasks
export const createRecurringTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      description,
      recurrencePattern,
      daysOfWeek,
      startTime,
      endTime,
      priority,
      pomodorosTotal,
      goalId,
    } = req.body;

    if (!title || !recurrencePattern) {
      return res.status(400).json({ error: 'Title and recurrence pattern required' });
    }

    const recurringTask = await prisma.recurringTask.create({
      data: {
        userId,
        title,
        description: description || null,
        recurrencePattern,
        daysOfWeek: daysOfWeek || null,
        startTime: startTime || null,
        endTime: endTime || null,
        priority: priority || 1,
        pomodorosTotal: pomodorosTotal || 1,
        goalId: goalId || null,
        isActive: true,
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
    });

    res.status(201).json(recurringTask);
  } catch (error) {
    console.error('Create recurring task error:', error);
    res.status(500).json({ error: 'Failed to create recurring task' });
  }
};

// PATCH /recurring-tasks/:id
export const updateRecurringTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = String(req.params.id);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const existingTask = await prisma.recurringTask.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    const {
      title,
      description,
      recurrencePattern,
      daysOfWeek,
      startTime,
      endTime,
      priority,
      pomodorosTotal,
      goalId,
      isActive,
    } = req.body;

    const updatedTask = await prisma.recurringTask.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(recurrencePattern !== undefined && { recurrencePattern }),
        ...(daysOfWeek !== undefined && { daysOfWeek }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(priority !== undefined && { priority }),
        ...(pomodorosTotal !== undefined && { pomodorosTotal }),
        ...(goalId !== undefined && { goalId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update recurring task error:', error);
    res.status(500).json({ error: 'Failed to update recurring task' });
  }
};

// DELETE /recurring-tasks/:id
export const deleteRecurringTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = String(req.params.id);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const existingTask = await prisma.recurringTask.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    await prisma.recurringTask.delete({
      where: { id },
    });

    res.json({ message: 'Recurring task deleted successfully' });
  } catch (error) {
    console.error('Delete recurring task error:', error);
    res.status(500).json({ error: 'Failed to delete recurring task' });
  }
};

// Helper function to check if a recurring task should appear on a given date
export function shouldTaskAppearOnDate(
  recurringTask: any,
  dateStr: string
): boolean {
  if (!recurringTask.isActive) return false;

  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  switch (recurringTask.recurrencePattern) {
    case 'DAILY':
      return true;

    case 'WEEKDAYS':
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday

    case 'WEEKLY':
      // For weekly, we could use the day the task was created, but let's default to the same day each week
      // This is simplified - you might want to add a specific day field
      return true;

    case 'CUSTOM':
      if (!recurringTask.daysOfWeek) return false;
      try {
        const days = JSON.parse(recurringTask.daysOfWeek);
        return Array.isArray(days) && days.includes(dayOfWeek);
      } catch {
        return false;
      }

    default:
      return false;
  }
}
