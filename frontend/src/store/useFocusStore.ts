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
  endTime: number | null; // Timestamp when timer ends
  activeTask: Task | null;
  mode: FocusMode;
  sessionsCompleted: number; // To track when to check long break

  // Actions
  setActiveTask: (task: Task) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  tick: () => void;
  syncTaskProgress: () => Promise<void>;
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
      endTime: null,
      activeTask: null,
      mode: 'POMODORO',
      sessionsCompleted: 0,

      setActiveTask: (task) => set({ activeTask: task, mode: 'POMODORO', timeLeft: POMODORO_TIME, endTime: null, isActive: false }),
      
      startTimer: () => {
        const { timeLeft } = get();
        set({ isActive: true, endTime: Date.now() + timeLeft * 1000 });
      },
      
      pauseTimer: () => set({ isActive: false, endTime: null }),
      
      resetTimer: () => {
        const { mode } = get();
        let time = POMODORO_TIME;
        if (mode === 'SHORT_BREAK') time = SHORT_BREAK_TIME;
        if (mode === 'LONG_BREAK') time = LONG_BREAK_TIME;
        set({ isActive: false, timeLeft: time, endTime: null });
      },

      skipTimer: () => {
        set({ timeLeft: 0, endTime: null });
        get().tick(); 
      },
      
      tick: () => {
        const state = get();
        
        // Calculate timeLeft based on endTime if active
        let newTimeLeft = state.timeLeft;
        if (state.isActive && state.endTime) {
            const secondsLeft = Math.ceil((state.endTime - Date.now()) / 1000);
            newTimeLeft = Math.max(0, secondsLeft);
            set({ timeLeft: newTimeLeft });
        } else if (state.isActive && !state.endTime) {
            // Recovery if something weird happened (e.g. rehydration without endTime)
             set({ endTime: Date.now() + state.timeLeft * 1000 });
        }

        if (newTimeLeft <= 0) {
            // Timer Finished Logic
            const { mode, sessionsCompleted, activeTask } = state;
            
            if (mode === 'POMODORO') {
                // Finished a work session
                const newCompleted = sessionsCompleted + 1;
                
                // Update Backend
                state.syncTaskProgress();
                
                // Update local task state
                if (activeTask) {
                    set({ 
                        activeTask: { 
                            ...activeTask, 
                            pomodorosCompleted: activeTask.pomodorosCompleted + 1 
                        } 
                    });
                }

                // Decide next mode
                if (newCompleted % POMODOROS_BEFORE_LONG_BREAK === 0) {
                    set({ mode: 'LONG_BREAK', timeLeft: LONG_BREAK_TIME, sessionsCompleted: newCompleted, isActive: false, endTime: null });
                } else {
                    set({ mode: 'SHORT_BREAK', timeLeft: SHORT_BREAK_TIME, sessionsCompleted: newCompleted, isActive: false, endTime: null });
                }
            } else {
                // Finished a break
                set({ mode: 'POMODORO', timeLeft: POMODORO_TIME, isActive: false, endTime: null });
            }
        }
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
