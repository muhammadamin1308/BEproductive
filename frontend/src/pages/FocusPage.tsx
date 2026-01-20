import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useFocusStore } from '../store/useFocusStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const FocusPage = () => {
    const {
        timeLeft,
        isActive,
        activeTask,
        mode,
        startTimer,
        pauseTimer,
        resetTimer,
        skipTimer,
        setActiveTask,
    } = useFocusStore();
    const navigate = useNavigate();

    // Timer is now managed globally by FocusTimerManager
    // We just display the state here

    // Check if task is complete and redirect
    useEffect(() => {
        if (activeTask && activeTask.pomodorosCompleted >= activeTask.pomodorosTotal) {
            // Task is complete, redirect to today page
            setActiveTask(null);
            navigate('/');
        }
    }, [activeTask, navigate, setActiveTask]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggleTimer = () => {
        if (isActive) {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-primary-text mb-6">Focus Mode</h1>

            <div className="bg-surface rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-8 text-center transition-colors">
                <div className="w-56 h-56 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 mx-auto flex items-center justify-center mb-8 relative">
                    <div className="text-5xl font-bold text-primary-text tabular-nums tracking-tight">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="absolute -bottom-3 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-full">
                        {mode === 'POMODORO' ? 'Pomodoro' : mode === 'SHORT_BREAK' ? 'Short Break' : 'Long Break'}
                    </div>
                </div>

                <h2 className="text-lg font-medium text-primary-text mb-2">
                    {activeTask ? activeTask.title : "No active task"}
                </h2>
                <p className="text-secondary-text mb-8">
                    {activeTask ? "Stay focused, you got this!" : "Select a task from your Today list or just focus freely."}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleToggleTimer}
                        disabled={activeTask && activeTask.pomodorosCompleted >= activeTask.pomodorosTotal && mode === 'POMODORO'}
                        className="w-full py-4 px-6 bg-cta hover:brightness-110 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-cta/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        {isActive ? "Pause Timer" : "Start Timer"}
                    </button>

                    <div className="flex gap-3">
                        {mode !== 'POMODORO' && (
                            <button
                                onClick={skipTimer}
                                className="flex-1 py-3 px-6 text-secondary-text hover:text-primary-text hover:bg-gray-100 dark:hover:bg-white/5 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <SkipForward className="w-4 h-4" />
                                Skip Break
                            </button>
                        )}
                        {!isActive && timeLeft !== (mode === 'POMODORO' ? 25 * 60 : mode === 'SHORT_BREAK' ? 5 * 60 : 15 * 60) && (
                            <button
                                onClick={resetTimer}
                                className="flex-1 py-3 px-6 text-secondary-text hover:text-primary-text hover:bg-gray-100 dark:hover:bg-white/5 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
