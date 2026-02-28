import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

type DeadlineStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';

const VALID_STATUSES: DeadlineStatus[] = ['PENDING', 'COMPLETED', 'OVERDUE'];

const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseDateInput = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const normalizeStatusInput = (value: unknown): DeadlineStatus | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.toUpperCase();
  if (VALID_STATUSES.includes(normalized as DeadlineStatus)) {
    return normalized as DeadlineStatus;
  }

  return null;
};

const resolveDerivedStatus = (dueDate: Date, currentStatus: DeadlineStatus): DeadlineStatus => {
  if (currentStatus === 'COMPLETED') {
    return 'COMPLETED';
  }

  return dueDate < getStartOfToday() ? 'OVERDUE' : 'PENDING';
};

const syncDeadlineStatusesForUser = async (userId: string): Promise<void> => {
  const today = getStartOfToday();

  await prisma.deadline.updateMany({
    where: {
      userId,
      deletedAt: null,
      status: 'PENDING',
      dueDate: {
        lt: today,
      },
    },
    data: {
      status: 'OVERDUE',
    },
  });

  await prisma.deadline.updateMany({
    where: {
      userId,
      deletedAt: null,
      status: 'OVERDUE',
      dueDate: {
        gte: today,
      },
    },
    data: {
      status: 'PENDING',
    },
  });
};

const parseSoftDeleteFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized !== 'false' && normalized !== '0' && normalized !== 'no';
  }

  return true;
};

const getUserId = (req: AuthRequest): string | null => req.user?.id ?? null;

// GET /deadlines
export const getDeadlines = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await syncDeadlineStatusesForUser(userId);

    const where: Prisma.DeadlineWhereInput = {
      userId,
      deletedAt: null,
    };

    const { status, startDate, endDate } = req.query;
    const searchQuery = typeof req.query.search === 'string' ? req.query.search : typeof req.query.q === 'string' ? req.query.q : undefined;

    if (typeof status === 'string' && status.trim() && status.toUpperCase() !== 'ALL') {
      const normalizedStatus = status.toUpperCase();
      if (normalizedStatus === 'UPCOMING') {
        where.status = 'PENDING';
      } else {
        const parsedStatus = normalizeStatusInput(normalizedStatus);
        if (!parsedStatus) {
          return res.status(400).json({ error: 'Invalid status filter' });
        }
        where.status = parsedStatus;
      }
    }

    if (typeof startDate === 'string' || typeof endDate === 'string') {
      const dueDateFilter: Prisma.DateTimeFilter = {};

      if (typeof startDate === 'string') {
        const parsedStart = parseDateInput(startDate);
        if (!parsedStart) {
          return res.status(400).json({ error: 'Invalid startDate. Use ISO format.' });
        }
        dueDateFilter.gte = parsedStart;
      }

      if (typeof endDate === 'string') {
        const parsedEnd = parseDateInput(endDate);
        if (!parsedEnd) {
          return res.status(400).json({ error: 'Invalid endDate. Use ISO format.' });
        }
        dueDateFilter.lte = parsedEnd;
      }

      where.dueDate = dueDateFilter;
    }

    if (searchQuery && searchQuery.trim()) {
      const searchValue = searchQuery.trim();
      where.OR = [
        {
          title: {
            contains: searchValue,
          },
        },
        {
          description: {
            contains: searchValue,
          },
        },
      ];
    }

    const deadlines = await prisma.deadline.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json(deadlines);
  } catch (error) {
    console.error('Get deadlines error:', error);
    return res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
};

// GET /deadlines/:id
export const getDeadline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const deadlineId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const deadline = await prisma.deadline.findFirst({
      where: {
        id: deadlineId,
        userId,
        deletedAt: null,
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    if (deadline.status !== 'COMPLETED') {
      const correctedStatus = resolveDerivedStatus(deadline.dueDate, deadline.status as DeadlineStatus);
      if (correctedStatus !== deadline.status) {
        const updatedDeadline = await prisma.deadline.update({
          where: { id: deadline.id },
          data: { status: correctedStatus },
        });
        return res.json(updatedDeadline);
      }
    }

    return res.json(deadline);
  } catch (error) {
    console.error('Get deadline error:', error);
    return res.status(500).json({ error: 'Failed to fetch deadline' });
  }
};

// POST /deadlines
export const createDeadline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const rawDescription = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const parsedDueDate = parseDateInput(req.body.dueDate);
    const requestedPriority = req.body.priority === undefined ? 2 : Number(req.body.priority);

    if (!rawTitle) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!parsedDueDate) {
      return res.status(400).json({ error: 'Valid dueDate is required' });
    }

    if (!Number.isInteger(requestedPriority) || requestedPriority < 1 || requestedPriority > 3) {
      return res.status(400).json({ error: 'Priority must be an integer between 1 and 3' });
    }

    const initialStatus = resolveDerivedStatus(parsedDueDate, 'PENDING');

    const deadline = await prisma.deadline.create({
      data: {
        userId,
        title: rawTitle,
        description: rawDescription || null,
        dueDate: parsedDueDate,
        priority: requestedPriority,
        status: initialStatus,
      },
    });

    return res.status(201).json(deadline);
  } catch (error) {
    console.error('Create deadline error:', error);
    return res.status(500).json({ error: 'Failed to create deadline' });
  }
};

// PATCH /deadlines/:id
export const updateDeadline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const deadlineId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingDeadline = await prisma.deadline.findFirst({
      where: {
        id: deadlineId,
        userId,
        deletedAt: null,
      },
    });

    if (!existingDeadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    const updateData: Prisma.DeadlineUpdateInput = {};

    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      updateData.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      if (req.body.description === null) {
        updateData.description = null;
      } else if (typeof req.body.description === 'string') {
        const description = req.body.description.trim();
        updateData.description = description || null;
      } else {
        return res.status(400).json({ error: 'Description must be a string or null' });
      }
    }

    if (req.body.dueDate !== undefined) {
      const parsedDueDate = parseDateInput(req.body.dueDate);
      if (!parsedDueDate) {
        return res.status(400).json({ error: 'Invalid dueDate. Use ISO format.' });
      }
      updateData.dueDate = parsedDueDate;
    }

    if (req.body.priority !== undefined) {
      const parsedPriority = Number(req.body.priority);
      if (!Number.isInteger(parsedPriority) || parsedPriority < 1 || parsedPriority > 3) {
        return res.status(400).json({ error: 'Priority must be an integer between 1 and 3' });
      }
      updateData.priority = parsedPriority;
    }

    const requestedStatus = req.body.status !== undefined ? normalizeStatusInput(req.body.status) : null;

    if (req.body.status !== undefined && !requestedStatus) {
      return res.status(400).json({ error: 'Invalid status. Use PENDING, COMPLETED, or OVERDUE.' });
    }

    const effectiveDueDate = updateData.dueDate instanceof Date ? updateData.dueDate : existingDeadline.dueDate;
    const currentStatus = requestedStatus ?? (existingDeadline.status as DeadlineStatus);
    const nextStatus = resolveDerivedStatus(effectiveDueDate, currentStatus);
    updateData.status = nextStatus;

    const updatedDeadline = await prisma.deadline.update({
      where: { id: deadlineId },
      data: updateData,
    });

    return res.json(updatedDeadline);
  } catch (error) {
    console.error('Update deadline error:', error);
    return res.status(500).json({ error: 'Failed to update deadline' });
  }
};

// DELETE /deadlines/:id
export const deleteDeadline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const deadlineId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const softDelete = parseSoftDeleteFlag(req.body?.softDelete ?? req.query.softDelete);

    if (softDelete) {
      const result = await prisma.deadline.updateMany({
        where: {
          id: deadlineId,
          userId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      if (result.count === 0) {
        return res.status(404).json({ error: 'Deadline not found' });
      }

      return res.json({ message: 'Deadline soft deleted', softDeleted: true });
    }

    const result = await prisma.deadline.deleteMany({
      where: {
        id: deadlineId,
        userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    return res.json({ message: 'Deadline deleted', softDeleted: false });
  } catch (error) {
    console.error('Delete deadline error:', error);
    return res.status(500).json({ error: 'Failed to delete deadline' });
  }
};

// PATCH /deadlines/:id/complete
export const updateDeadlineCompletion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const deadlineId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const deadline = await prisma.deadline.findFirst({
      where: {
        id: deadlineId,
        userId,
        deletedAt: null,
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    const shouldComplete = req.body?.completed === undefined ? true : Boolean(req.body.completed);
    const nextStatus: DeadlineStatus = shouldComplete
      ? 'COMPLETED'
      : resolveDerivedStatus(deadline.dueDate, 'PENDING');

    const updatedDeadline = await prisma.deadline.update({
      where: { id: deadline.id },
      data: {
        status: nextStatus,
      },
    });

    return res.json(updatedDeadline);
  } catch (error) {
    console.error('Toggle deadline completion error:', error);
    return res.status(500).json({ error: 'Failed to update deadline completion' });
  }
};
