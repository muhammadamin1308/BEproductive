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

    // Check if task is complete and redirect
    useEffect(() => {
        if (activeTask && activeTask.pomodorosCompleted >= activeTask.pomodorosTotal) {
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

    // Calculate progress for SVG ring
    const totalSeconds = mode === 'POMODORO' ? 25 * 60 : mode === 'SHORT_BREAK' ? 5 * 60 : 15 * 60;
    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
    const circumference = 2 * Math.PI * 48; // radius is 48%
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Session info
    const currentSession = activeTask ? activeTask.pomodorosCompleted + 1 : 1;
    const totalSessions = activeTask?.pomodorosTotal || 4;
    const totalTimeMinutes = totalSessions * 25 + (totalSessions - 1) * 5;
    const totalTimeHours = Math.floor(totalTimeMinutes / 60);
    const totalTimeMins = totalTimeMinutes % 60;

    // Estimated finish time
    const now = new Date();
    const remainingMinutes = (totalSessions - currentSession + 1) * 25 + (totalSessions - currentSession) * 5;
    const estFinish = new Date(now.getTime() + remainingMinutes * 60000);
    const estFinishStr = `${estFinish.getHours().toString().padStart(2, '0')}:${estFinish.getMinutes().toString().padStart(2, '0')}`;

    const getModeLabel = () => {
        switch (mode) {
            case 'SHORT_BREAK':
                return 'Short Break';
            case 'LONG_BREAK':
                return 'Long Break';
            default:
                return 'Pomodoro';
        }
    };

    return (
        <main className="flex-grow flex flex-col relative min-h-[calc(100vh-120px)]">
            {/* Grid Background */}
            <div className="absolute inset-0 grid-bg-light dark:grid-bg-dark opacity-40 pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col items-center justify-center flex-grow w-full max-w-4xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="w-full flex justify-between items-center mb-8 font-mono text-xs text-text-muted-light dark:text-text-muted-dark border-b border-border-light dark:border-border-dark pb-2">
                    <div>
                        <span className="text-primary">{'>'}</span> ROOT / FOCUS_MODE / ACTIVE_SESSION
                    </div>
                    <div className="hidden sm:block">
                        MEM: 45% | CPU: 12% | LATENCY: 14ms
                    </div>
                </div>

                {/* Timer Card */}
                <div className="w-full max-w-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-lg dark:shadow-none p-8 md:p-12 relative overflow-hidden group">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>

                    {/* Timer Display */}
                    <div className="flex justify-center mb-8 relative">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    className="text-gray-200 dark:text-gray-800"
                                    cx="50%"
                                    cy="50%"
                                    fill="transparent"
                                    r="48%"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <circle
                                    className="text-primary transition-all duration-1000 ease-linear"
                                    cx="50%"
                                    cy="50%"
                                    fill="transparent"
                                    r="48%"
                                    stroke="currentColor"
                                    strokeDasharray={`${circumference}`}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeWidth="4"
                                />
                            </svg>
                            <div className="absolute text-center flex flex-col items-center">
                                <div className="text-6xl md:text-7xl font-bold text-text-main-light dark:text-text-main-dark tracking-tighter tabular-nums">
                                    {formatTime(timeLeft)}
                                </div>
                                <div className={`mt-2 px-3 py-1 text-xs font-mono uppercase tracking-widest rounded-full border ${mode === 'POMODORO'
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    }`}>
                                    {getModeLabel()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Task Info */}
                    <div className="text-center space-y-4 mb-10">
                        <h2 className="text-2xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
                            {activeTask ? activeTask.title : 'No active task'}
                        </h2>
                        <div className="flex items-center justify-center gap-2 font-mono text-sm text-text-muted-light dark:text-text-muted-dark">
                            <span className="text-primary">{'>'}</span>
                            <span>SYSTEM_STATUS: STAY_FOCUSED_YOU_GOT_THIS</span>
                            <span className="w-2 h-4 bg-primary animate-pulse inline-block align-middle ml-1"></span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleToggleTimer}
                            disabled={!!(activeTask && activeTask.pomodorosCompleted >= activeTask.pomodorosTotal && mode === 'POMODORO')}
                            className="w-full py-4 bg-primary hover:bg-opacity-90 text-black font-bold uppercase tracking-widest transition-all transform active:scale-[0.98] border-2 border-transparent hover:shadow-[0_0_15px_rgba(0,224,84,0.4)] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-icons group-hover:animate-pulse">
                                {isActive ? 'pause' : 'play_arrow'}
                            </span>
                            {isActive ? 'PAUSE TIMER' : 'RESUME TIMER'}
                        </button>

                        {mode !== 'POMODORO' && (
                            <button
                                onClick={skipTimer}
                                className="w-full py-3 bg-transparent text-text-muted-light dark:text-text-muted-dark font-mono font-medium text-sm uppercase tracking-wider border border-border-light dark:border-border-dark hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group"
                            >
                                <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">
                                    skip_next
                                </span>
                                SKIP BREAK
                            </button>
                        )}

                        {!isActive && timeLeft !== totalSeconds && (
                            <button
                                onClick={resetTimer}
                                className="w-full py-3 bg-transparent text-text-muted-light dark:text-text-muted-dark font-mono font-medium text-sm uppercase tracking-wider border border-border-light dark:border-border-dark hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-sm">refresh</span>
                                RESET
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-lg">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-3">
                        <div className="text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark uppercase mb-1">
                            Session
                        </div>
                        <div className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                            {String(currentSession).padStart(2, '0')}/{String(totalSessions).padStart(2, '0')}
                        </div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-3">
                        <div className="text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark uppercase mb-1">
                            Total Time
                        </div>
                        <div className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                            {totalTimeHours > 0 ? `${totalTimeHours}h ${totalTimeMins}m` : `${totalTimeMins}m`}
                        </div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-3">
                        <div className="text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark uppercase mb-1">
                            Est. Finish
                        </div>
                        <div className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                            {estFinishStr}
                        </div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-3 flex flex-col justify-between group cursor-pointer hover:border-primary transition-colors">
                        <div className="text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark uppercase mb-1">
                            Mode
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                                STRICT
                            </div>
                            <span className="material-icons text-sm text-text-muted-light dark:text-text-muted-dark group-hover:text-primary">
                                tune
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};
