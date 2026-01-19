import { Play, Pause, RotateCcw } from 'lucide-react';
import { useFocusStore } from '../store/useFocusStore';

export const FocusPage = () => {
    const {
        timeLeft,
        isActive,
        activeTask,
        startTimer,
        pauseTimer,
        resetTimer,
    } = useFocusStore();

    // Timer is now managed globally by FocusTimerManager
    // We just display the state here

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

            <div className="bg-surface rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 p-8 text-center transition-colors">
                <div className="w-56 h-56 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 mx-auto flex items-center justify-center mb-8 relative">
                    <div className="text-5xl font-bold text-primary-text tabular-nums tracking-tight">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="absolute -bottom-3 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-full">
                        Pomodoro
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
                        className="w-full py-4 px-6 bg-cta hover:brightness-110 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-cta/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                        {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        {isActive ? "Pause Timer" : "Start Timer"}
                    </button>

                    {!isActive && timeLeft !== 25 * 60 && (
                        <button
                            onClick={resetTimer}
                            className="w-full py-3 px-6 text-secondary-text hover:text-primary-text hover:bg-slate-100 dark:hover:bg-white/5 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
