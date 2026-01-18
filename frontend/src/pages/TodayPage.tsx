import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TaskCard } from '../components/TaskCard';
import { useAuthStore } from '../store/useAuthStore';
import { useFocusStore } from '../store/useFocusStore';
import { format } from 'date-fns';
import { api } from '../lib/axios';

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const TodayPage = () => {
    const navigate = useNavigate();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [pomodoros, setPomodoros] = useState(1);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const todayDate = getTodayDate();
    const displayDate = format(new Date(), 'EEEE, MMMM d');

    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks', todayDate],
        queryFn: async () => {
            const res = await api.get(`/tasks?date=${todayDate}`);
            return res.data;
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: async ({ title, pomodorosTotal }: { title: string; pomodorosTotal: number }) => {
            await api.post('/tasks', {
                title,
                date: todayDate,
                description: '', // Empty description initially
                pomodorosTotal: pomodorosTotal,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', todayDate] });
            setNewTaskTitle('');
            setPomodoros(2); // Reset to default
        },
    });

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        createTaskMutation.mutate({ title: newTaskTitle, pomodorosTotal: pomodoros });
    };

    if (isLoading) return <div className="p-10 text-center text-secondary-text">Loading today's plan...</div>;

    const incompleteTasks = tasks?.filter((t: any) => t.status !== 'DONE') || [];
    const canAddTask = incompleteTasks.length < 3;

    return (
        <div className="min-h-screen bg-primary-bg px-6 pt-12 pb-32">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-4xl font-bold text-primary-text mb-2 tracking-tight">Today</h1>
                    <div className="flex items-center gap-2 text-secondary-text font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-70">
                            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                        </svg>
                        {displayDate}
                    </div>
                </header>

                {/* Task List */}
                <div className="space-y-4 mb-8">
                    {tasks?.map((task: any) => (
                        <TaskCard key={task.id} task={task} />
                    ))}

                    {/* Add Task Button / Input */}
                    <form onSubmit={handleAddTask} className="w-full">
                        <div className="bg-surface rounded-2xl border border-secondary-accent p-4 shadow-soft">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Task title..."
                                className="w-full bg-transparent text-lg font-medium text-primary-text placeholder:text-secondary-text/60 outline-none mb-4"
                                autoFocus
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">Est. Pomodoros:</label>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                                        {[1, 2, 3, 4, 6, 8].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setPomodoros(num)}
                                                className={`w-8 h-8 rounded-md text-sm font-bold transition-all ${pomodoros === num ? 'bg-cta text-white shadow-sm' : 'text-secondary-text hover:bg-white/50 dark:hover:bg-white/10'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-cta text-white w-10 h-10 rounded-xl flex items-center justify-center hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    disabled={!newTaskTitle.trim()}
                                >
                                    +
                                </button>
                            </div>
                            <div className="mt-2 text-xs text-secondary-text text-right">
                                Total: {pomodoros * 25} min + breaks
                            </div>
                        </div>
                    </form>
                </div>

                {/* Global CTA - Start Focus Session */}
                <div className="fixed bottom-24 left-0 right-0 md:static md:mt-12 px-6 flex justify-center pointer-events-none">
                    <button
                        onClick={() => {
                            const todoTasks = tasks?.filter((t: any) => t.status !== 'DONE') || [];
                            if (todoTasks.length > 0) {
                                useFocusStore.getState().setActiveTask(todoTasks[0]);
                            }
                            useFocusStore.getState().startTimer();
                            navigate('/focus');
                        }}
                        className="pointer-events-auto bg-cta hover:bg-[#2c4850] text-white font-semibold text-lg py-4 px-8 rounded-xl w-full max-w-sm shadow-xl shadow-cta/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        Start Focus Session
                    </button>
                </div>
            </div>
        </div>
    );
};
