import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Clock, Repeat } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { useAuthStore } from '../store/useAuthStore';
import { format } from 'date-fns';
import { api } from '../lib/axios';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Modal } from '../components/Modal';

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const TodayPage = () => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [pomodoros, setPomodoros] = useState(1);
    const [showTimeFields, setShowTimeFields] = useState(false);
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringPattern, setRecurringPattern] = useState<'DAILY' | 'WEEKDAYS' | 'CUSTOM'>('DAILY');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    useAuthStore((state) => state.user);
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
        mutationFn: async ({ title, description, pomodorosTotal, startTime, endTime, isRecurring, recurringPattern, selectedDays }: { title: string; description: string; pomodorosTotal: number; startTime?: string; endTime?: string; isRecurring?: boolean; recurringPattern?: string; selectedDays?: number[] }) => {
            if (isRecurring) {
                let pattern = recurringPattern || 'DAILY';
                let daysOfWeek = null;
                
                if (pattern === 'CUSTOM' && selectedDays && selectedDays.length > 0) {
                    daysOfWeek = JSON.stringify(selectedDays);
                }
                
                // Create recurring task
                await api.post('/recurring-tasks', {
                    title,
                    description: description || '',
                    recurrencePattern: pattern,
                    daysOfWeek,
                    startTime: startTime || null,
                    endTime: endTime || null,
                    pomodorosTotal: pomodorosTotal,
                    priority: 1,
                    isActive: true,
                });
            } else {
                // Create one-time task
                await api.post('/tasks', {
                    title,
                    date: todayDate,
                    description: description || '',
                    pomodorosTotal: pomodorosTotal,
                    startTime: startTime || null,
                    endTime: endTime || null,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', todayDate] });
            setNewTaskTitle('');
            setNewTaskDescription('');
            setPomodoros(1);
            setStartTime('');
            setEndTime('');
            setShowTimeFields(false);
            setShowAddTaskForm(false);
            setIsRecurring(false);
            setRecurringPattern('DAILY');
            setSelectedDays([]);
            setShowRecurringModal(false);
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (taskIds: string[]) => {
            await api.patch('/tasks/reorder', { taskIds });
        },
    });

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        if (isRecurring && recurringPattern === 'CUSTOM' && selectedDays.length === 0) {
            setShowRecurringModal(true);
            return;
        }
        createTaskMutation.mutate({ 
            title: newTaskTitle,
            description: newTaskDescription,
            pomodorosTotal: pomodoros,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            isRecurring,
            recurringPattern,
            selectedDays,
        });
    };

    const toggleDay = (day: number) => {
        setSelectedDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = tasks.findIndex((t: any) => t.id === active.id);
        const newIndex = tasks.findIndex((t: any) => t.id === over.id);

        const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);

        // Optimistic update
        queryClient.setQueryData(['tasks', todayDate], reorderedTasks);

        // Persist to backend
        reorderMutation.mutate(reorderedTasks.map((t: any) => t.id));
    };

    if (isLoading) return <div className="p-10 text-center text-secondary-text">Loading today's plan...</div>;
    
    // Calculate total estimated time (each pomodoro = 25 minutes)
    const totalPomodoros = tasks?.reduce((sum: number, task: any) => sum + task.pomodorosTotal, 0) || 0;
    const totalMinutes = totalPomodoros * 25;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const estimatedTimeText = hours > 0 
        ? `${hours}h ${minutes}m` 
        : `${minutes}m`;

    return (
        <div className="min-h-screen bg-primary-bg px-6 pt-4 md:pt-12 pb-32">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-primary-text mb-2">Today</h1>
                    <p className="text-lg text-secondary-text">{displayDate}</p>
                </header>

                {/* Estimated Time Summary */}
                {tasks && tasks.length > 0 && (
                    <div className="mb-6 bg-surface rounded-xl border border-slate-200 dark:border-white/10 p-5 shadow-soft">
                        <div className="flex items-center gap-3 mb-1">
                            <Clock className="w-5 h-5 text-cta" />
                            <span className="text-sm font-medium text-secondary-text">Estimated Time</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold text-cta">{estimatedTimeText}</span>
                            <span className="text-sm text-secondary-text">· {totalPomodoros} pomodoros</span>
                        </div>
                    </div>
                )}

                {/* Task List */}
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={tasks?.map((t: any) => t.id) || []} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4 mb-8">
                            {tasks?.map((task: any) => (
                                <TaskCard key={task.id} task={task} />
                            ))}

                            {/* Add Task Form (Toggleable) */}
                            {showAddTaskForm ? (
                                <form onSubmit={handleAddTask} className="w-full">
                                    <div className="bg-surface rounded-2xl border border-secondary-accent p-4 shadow-soft">
                                        <input
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="Task title..."
                                            className="w-full bg-slate-50 dark:bg-white/5 px-4 py-2.5 rounded-lg text-lg font-medium text-primary-text placeholder:text-secondary-text/60 outline-none mb-3 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-cta"
                                            autoFocus
                                        />
                                        
                                        <textarea
                                            value={newTaskDescription}
                                            onChange={(e) => setNewTaskDescription(e.target.value)}
                                            placeholder="Description (optional)..."
                                            rows={2}
                                            className="w-full bg-slate-50 dark:bg-white/5 px-4 py-2.5 rounded-lg text-sm text-primary-text placeholder:text-secondary-text/60 outline-none mb-4 resize-none border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-cta"
                                        />
                                        
                                        {/* Time Fields (Toggleable) */}
                                        {showTimeFields ? (
                                            <div className="flex items-center gap-3 mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-lg">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-secondary-text mb-1.5">Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-secondary-text mb-1.5">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowTimeFields(false);
                                                        setStartTime('');
                                                        setEndTime('');
                                                    }}
                                                    className="mt-5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowTimeFields(true)}
                                                className="flex items-center gap-2 px-3 py-2 mb-4 text-sm text-secondary-text hover:text-primary-text bg-slate-100 dark:bg-white/5 rounded-lg transition-colors"
                                            >
                                                <Clock className="w-4 h-4" />
                                                Add time
                                            </button>
                                        )}

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider mb-2">Est. Pomodoros:</label>
                                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                                                    {[1, 2, 3, 4, 6, 8].map((num) => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setPomodoros(num)}
                                                            className={`w-10 h-10 rounded-md text-sm font-bold transition-all ${pomodoros === num ? 'bg-cta text-white shadow-sm' : 'text-secondary-text hover:bg-white/50 dark:hover:bg-white/10'}`}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="mt-2 text-xs text-secondary-text">
                                                    Total: {pomodoros * 25} min + breaks
                                                </div>
                                            </div>

                                            {/* Recurring Task Options */}
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isRecurring}
                                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-300 text-cta focus:ring-cta"
                                                    />
                                                    <span className="text-sm font-medium text-primary-text flex items-center gap-1">
                                                        <Repeat className="w-4 h-4" />
                                                        Repeat this task
                                                    </span>
                                                </label>
                                                
                                                {isRecurring && (
                                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg space-y-3">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRecurringPattern('DAILY');
                                                                    setSelectedDays([]);
                                                                }}
                                                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                                    recurringPattern === 'DAILY'
                                                                        ? 'bg-cta text-white shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-secondary-text hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
                                                                }`}
                                                            >
                                                                Daily
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRecurringPattern('WEEKDAYS');
                                                                    setSelectedDays([]);
                                                                }}
                                                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                                    recurringPattern === 'WEEKDAYS'
                                                                        ? 'bg-cta text-white shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-secondary-text hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
                                                                }`}
                                                            >
                                                                Weekdays
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRecurringPattern('CUSTOM');
                                                                }}
                                                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                                    recurringPattern === 'CUSTOM'
                                                                        ? 'bg-cta text-white shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-secondary-text hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
                                                                }`}
                                                            >
                                                                Custom
                                                            </button>
                                                        </div>
                                                        
                                                        {recurringPattern === 'CUSTOM' && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-secondary-text mb-2">Select days:</label>
                                                                <div className="flex gap-1.5">
                                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            type="button"
                                                                            onClick={() => toggleDay(idx)}
                                                                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                                                                                selectedDays.includes(idx)
                                                                                    ? 'bg-cta text-white shadow-sm'
                                                                                    : 'bg-white dark:bg-slate-800 text-secondary-text hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
                                                                            }`}
                                                                            title={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]}
                                                                        >
                                                                            {day}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    type="submit"
                                                    className="flex-1 bg-cta text-white py-3 rounded-xl font-semibold hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                                    disabled={!newTaskTitle.trim()}
                                                >
                                                    Add Task
                                                </button>
                                            </div>
                                        </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddTaskForm(false);
                                            setNewTaskTitle('');
                                            setNewTaskDescription('');
                                            setStartTime('');
                                            setEndTime('');
                                            setShowTimeFields(false);
                                            setPomodoros(1);
                                            setIsRecurring(false);
                                            setRecurringPattern('DAILY');
                                            setSelectedDays([]);
                                        }}
                                        className="mt-3 w-full text-sm text-secondary-text hover:text-red-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                            ) : (
                                <button
                                    onClick={() => setShowAddTaskForm(true)}
                                    className="w-full bg-cta hover:bg-[#2c4850] text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-xl shadow-cta/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Add Task
                                </button>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* Recurring Days Selection Modal */}
                <Modal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} title="Select Days">
                    <p className="text-secondary-text mb-4">Please select at least one day for your recurring task.</p>
                    <button
                        onClick={() => setShowRecurringModal(false)}
                        className="w-full bg-cta text-white py-3 rounded-xl font-semibold hover:brightness-110 transition-all"
                    >
                        OK
                    </button>
                </Modal>
            </div>
        </div>
    );
};
