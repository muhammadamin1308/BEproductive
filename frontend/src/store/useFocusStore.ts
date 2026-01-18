import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/axios';

// Enhanced Task Interface
export interface Task {
  id: string;
  title: string;
  status: string; // 'TODO' | 'DONE' | 'SKIPPED'
  pomodorosTotal: number;
  pomodorosCompleted: number;
  createdAt?: string;
  // estimatedMinutes is deprecated in favor of pomodorosTotal * 25 + breaks
}

type FocusMode = 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';

interface FocusState {
  isActive: boolean;
  timeLeft: number; // in seconds
  activeTask: Task | null;
  mode: FocusMode;
  sessionsCompleted: number; // To track when to take a long break (e.g. after 4)

  // Actions
  setActiveTask: (task: Task) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void; // Finish current interval early
  tick: () => void;
  syncTaskProgress: () => Promise<void>; // Call API to update progress
}

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;
const POMODOROS_BEFORE_LONG_BREAK = 4;

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      isActive: false,
      timeLeft: POMODORO_TIME,
      activeTask: null,
      mode: 'POMODORO',
      sessionsCompleted: 0,

      setActiveTask: (task) => set({ activeTask: task, mode: 'POMODORO', timeLeft: POMODORO_TIME }),
      
      startTimer: () => set({ isActive: true }),
      
      pauseTimer: () => set({ isActive: false }),
      
      resetTimer: () => {
        const { mode } = get();
        let time = POMODORO_TIME;
        if (mode === 'SHORT_BREAK') time = SHORT_BREAK_TIME;
        if (mode === 'LONG_BREAK') time = LONG_BREAK_TIME;
        set({ isActive: false, timeLeft: time });
      },

      skipTimer: () => {
        // Treat as completed interval
        set({ timeLeft: 0 });
        get().tick(); // Trigger completion logic
      },
      
      tick: () => {
        const state = get();
        if (state.timeLeft <= 0) {
            // Timer Finished Logic
            const { mode, sessionsCompleted, activeTask } = state;
            
            if (mode === 'POMODORO') {
                // Finished a work session
                const newCompleted = sessionsCompleted + 1;
                
                // Update Backend
                state.syncTaskProgress();
                
                // Update local task state immediately for UI
                if (activeTask) {
                    set({ 
                        activeTask: { 
                            ...activeTask, 
                            pomodorosCompleted: activeTask.pomodorosCompleted + 1 
                        } 
                    });
                     // Check if task is done (optional auto-complete logic)
                     if (activeTask.pomodorosCompleted + 1 >= activeTask.pomodorosTotal) {
                         // We could mark as done or ask user. For now just continue cycle.
                     }
                }

                // Decide next mode
                if (newCompleted % POMODOROS_BEFORE_LONG_BREAK === 0) {
                    set({ mode: 'LONG_BREAK', timeLeft: LONG_BREAK_TIME, sessionsCompleted: newCompleted, isActive: false });
                } else {
                    set({ mode: 'SHORT_BREAK', timeLeft: SHORT_BREAK_TIME, sessionsCompleted: newCompleted, isActive: false });
                }
            } else {
                // Finished a break
                set({ mode: 'POMODORO', timeLeft: POMODORO_TIME, isActive: false });
            }
            return { timeLeft: 0 }; // Actually handled by the set above, but to be safe
        }
        set({ timeLeft: state.timeLeft - 1 });
      },

      syncTaskProgress: async () => {
          const task = get().activeTask;
          if (!task) return;
          try {
              await api.patch(`/tasks/${task.id}/progress`, {});
          } catch (e) {
              console.error("Failed to sync progress", e);
          }
      }
    }),
    {
      name: 'focus-storage',
    }
  )
);
