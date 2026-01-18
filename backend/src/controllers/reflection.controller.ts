import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

// GET /reflections?weekStartDate=YYYY-MM-DD
export const getReflection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { weekStartDate } = req.query;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!weekStartDate) return res.status(400).json({ error: 'weekStartDate required' });

    const reflection = await prisma.reflection.findFirst({
      where: {
        userId,
        weekStartDate: String(weekStartDate),
      },
    });

    res.json(reflection || null);
  } catch (error) {
    console.error('Get reflection error:', error);
    res.status(500).json({ error: 'Failed to fetch reflection' });
  }
};

// GET /reflections/history
export const getReflectionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const reflections = await prisma.reflection.findMany({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
      take: 10, // Last 10 weeks
    });

    res.json(reflections);
  } catch (error) {
    console.error('Get reflection history error:', error);
    res.status(500).json({ error: 'Failed to fetch reflection history' });
  }
};

// POST /reflections
export const saveReflection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { weekStartDate, wentWell, toImprove, accomplishments, challenges } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!weekStartDate) return res.status(400).json({ error: 'weekStartDate required' });

    // Upsert: create if doesn't exist, update if it does
    const reflection = await prisma.reflection.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate,
        },
      },
      update: {
        wentWell,
        toImprove,
        accomplishments,
        challenges,
      },
      create: {
        userId,
        weekStartDate,
        wentWell,
        toImprove,
        accomplishments,
        challenges,
      },
    });

    res.json(reflection);
  } catch (error) {
    console.error('Save reflection error:', error);
    res.status(500).json({ error: 'Failed to save reflection' });
  }
};

// GET /reflections/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export const getWeeklyStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }

    // Get all tasks for the week
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        date: {
          gte: String(startDate),
          lte: String(endDate),
        },
      },
      include: {
        focusSessions: true,
      },
    });

    // Calculate daily stats
    const dailyStats: { [key: string]: { completed: number; total: number } } = {};
    
    tasks.forEach(task => {
      if (!dailyStats[task.date]) {
        dailyStats[task.date] = { completed: 0, total: 0 };
      }
      dailyStats[task.date].total++;
      if (task.status === 'DONE') {
        dailyStats[task.date].completed++;
      }
    });

    // Calculate focus time (in minutes)
    let totalFocusMinutes = 0;
    let interruptedSessions = 0;
    
    tasks.forEach(task => {
      task.focusSessions.forEach(session => {
        if (session.endTime) {
          const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000;
          totalFocusMinutes += duration;
        }
        if (session.interruptionReason) {
          interruptedSessions++;
        }
      });
    });

    // Overall stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      dailyStats,
      totalTasks,
      completedTasks,
      completionRate,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalFocusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
      interruptedSessions,
      totalSessions: tasks.reduce((sum, t) => sum + t.focusSessions.length, 0),
    });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
};
