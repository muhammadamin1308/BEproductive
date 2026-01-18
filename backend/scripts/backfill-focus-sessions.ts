import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillFocusSessions() {
  try {
    console.log('Starting backfill of FocusSession records...');

    // Find all tasks with completed pomodoros
    const tasks = await prisma.task.findMany({
      where: {
        pomodorosCompleted: {
          gt: 0,
        },
      },
      include: {
        focusSessions: true,
      },
    });

    console.log(`Found ${tasks.length} tasks with completed pomodoros`);

    for (const task of tasks) {
      const existingSessionsCount = task.focusSessions.length;
      const completedCount = task.pomodorosCompleted;
      const sessionsToCreate = completedCount - existingSessionsCount;

      if (sessionsToCreate > 0) {
        console.log(`Task "${task.title}" (ID: ${task.id}): ${completedCount} pomodoros, ${existingSessionsCount} sessions. Creating ${sessionsToCreate} sessions...`);

        // Create missing FocusSession records
        // We'll space them out evenly throughout the task's day
        const taskDate = new Date(task.date + 'T09:00:00'); // Start at 9 AM
        
        for (let i = 0; i < sessionsToCreate; i++) {
          const startTime = new Date(taskDate.getTime() + (i * 30 * 60 * 1000)); // 30 minutes apart (25 min session + 5 min break)
          const endTime = new Date(startTime.getTime() + 25 * 60 * 1000); // 25 minutes duration

          await prisma.focusSession.create({
            data: {
              taskId: task.id,
              startTime: startTime,
              endTime: endTime,
            },
          });
        }

        console.log(`  ✓ Created ${sessionsToCreate} sessions`);
      } else {
        console.log(`Task "${task.title}": Already has correct number of sessions`);
      }
    }

    console.log('\n✅ Backfill complete!');
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillFocusSessions();
