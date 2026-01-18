import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getGoals = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { level } = req.query;

    const where: any = { userId };
    if (level) {
      where.level = level;
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        subGoals: true,
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        parentGoal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate progress for each goal based on tasks
    const goalsWithProgress = goals.map(goal => {
      const totalTasks = goal.tasks.length;
      const completedTasks = goal.tasks.filter(task => task.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...goal,
        progress,
        totalTasks,
        completedTasks,
      };
    });

    res.json(goalsWithProgress);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const getGoal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subGoals: true,
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        parentGoal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Calculate progress
    const totalTasks = goal.tasks.length;
    const completedTasks = goal.tasks.filter((task: { status: string }) => task.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...goal,
      progress,
      totalTasks,
      completedTasks,
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, description, level, parentGoalId } = req.body;

    if (!title || !level) {
      return res.status(400).json({ error: 'Title and level are required' });
    }

    // Validate level
    const validLevels = ['YEAR', 'QUARTER', 'MONTH', 'WEEK'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    // If parentGoalId is provided, verify it exists and belongs to user
    if (parentGoalId) {
      const parentGoal = await prisma.goal.findFirst({
        where: {
          id: parentGoalId,
          userId,
        },
      });

      if (!parentGoal) {
        return res.status(404).json({ error: 'Parent goal not found' });
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description: description || null,
        level,
        parentGoalId: parentGoalId || null,
      },
      include: {
        subGoals: true,
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        parentGoal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
    });

    // Calculate progress for new goal (will be 0)
    const progress = 0;
    const totalTasks = 0;
    const completedTasks = 0;

    res.status(201).json({
      ...goal,
      progress,
      totalTasks,
      completedTasks,
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { title, description, level, parentGoalId } = req.body;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Validate level if provided
    if (level) {
      const validLevels = ['YEAR', 'QUARTER', 'MONTH', 'WEEK'];
      if (!validLevels.includes(level)) {
        return res.status(400).json({ error: 'Invalid level' });
      }
    }

    // If parentGoalId is provided, verify it exists and belongs to user
    if (parentGoalId !== undefined) {
      if (parentGoalId === null) {
        // Allow setting parentGoalId to null
      } else {
        const parentGoal = await prisma.goal.findFirst({
          where: {
            id: parentGoalId,
            userId,
          },
        });

        if (!parentGoal) {
          return res.status(404).json({ error: 'Parent goal not found' });
        }

        // Prevent circular reference
        if (parentGoalId === id) {
          return res.status(400).json({ error: 'Goal cannot be its own parent' });
        }
      }
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(level && { level }),
        ...(parentGoalId !== undefined && { parentGoalId }),
      },
      include: {
        subGoals: true,
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        parentGoal: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
    });

    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subGoals: true,
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Optionally, you might want to handle sub-goals and tasks
    // For now, we'll delete the goal and its tasks will have goalId set to null
    await prisma.goal.delete({
      where: { id },
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};
