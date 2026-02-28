
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskCard } from '../components/TaskCard';
import { useAuthStore } from '../store/useAuthStore';
import { format } from 'date-fns';
import { api } from '../lib/axios';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { StatsCard } from '../components/StatsCard';
import { Modal } from '../components/Modal';
import { useToastStore } from '../store/useToastStore';

const getTodayDate = () => new Date().toISOString().split('T')[0];

interface TaskFormState {
    title: string;
    description: string;
    pomodoros: number;
    isRecurring: boolean;
    recurrencePattern: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'CUSTOM';
    daysOfWeek: number[];
}

const INITIAL_TASK_FORM: TaskFormState = {
    title: '',
    description: '',
    pomodoros: 1,
    isRecurring: false,
    recurrencePattern: 'DAILY',
    daysOfWeek: [],
};

const POMODORO_OPTIONS = [1, 2, 3, 4, 6, 8];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TodayPage = () => {
    useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);
    const todayDate = getTodayDate();
    const displayDate = format(new Date(), 'EEEE, MMMM d');
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState<TaskFormState>(INITIAL_TASK_FORM);

    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks', todayDate],
        queryFn: async () => {
            const res = await api.get(`/tasks?date=${todayDate}`);
            return res.data;
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: async ({ title, description, pomodorosTotal }: { title: string; description: string; pomodorosTotal: number }) => {
            await api.post('/tasks', {
                title,
                date: todayDate,
                description,
                pomodorosTotal,
                startTime: null,
                endTime: null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', todayDate] });
            showToast('Task created');
        },
        onError: () => {
            showToast('Failed to create task');
        }
    });

    const createRecurringMutation = useMutation({
        mutationFn: async ({ title, description, pomodorosTotal, recurrencePattern, daysOfWeek }: {
            title: string; description: string; pomodorosTotal: number;
            recurrencePattern: string; daysOfWeek: number[];
        }) => {
            await api.post('/recurring-tasks', {
                title,
                description: description || undefined,
                pomodorosTotal,
                recurrencePattern,
                daysOfWeek: recurrencePattern === 'CUSTOM' ? daysOfWeek : undefined,
            });
        },
        onSuccess: () => {
            showToast('Recurring task created');
        },
        onError: () => {
            showToast('Failed to create recurring task');
        }
    });

    const reorderMutation = useMutation({
        mutationFn: async (taskIds: string[]) => {
            await api.patch('/tasks/reorder', { taskIds });
        },
        onError: () => {
            showToast('Failed to reorder tasks');
        }
    });

    const openAddTaskModal = () => {
        setTaskForm(INITIAL_TASK_FORM);
        setIsAddTaskModalOpen(true);
    };

    const closeAddTaskModal = () => {
        setIsAddTaskModalOpen(false);
        setTaskForm(INITIAL_TASK_FORM);
    };

    const handleAddTaskSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!taskForm.title.trim()) {
            showToast('Title is required');
            return;
        }
        if (taskForm.isRecurring) {
            if (taskForm.recurrencePattern === 'CUSTOM' && taskForm.daysOfWeek.length === 0) {
                showToast('Select at least one day');
                return;
            }
            createRecurringMutation.mutate(
                {
                    title: taskForm.title.trim(),
                    description: taskForm.description,
                    pomodorosTotal: taskForm.pomodoros,
                    recurrencePattern: taskForm.recurrencePattern,
                    daysOfWeek: taskForm.daysOfWeek,
                },
                { onSuccess: closeAddTaskModal },
            );
        } else {
            createTaskMutation.mutate(
                { title: taskForm.title.trim(), description: taskForm.description, pomodorosTotal: taskForm.pomodoros },
                { onSuccess: closeAddTaskModal },
            );
        }
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

    // Calculate stats
    const completedTasks = tasks?.filter((t: any) => t.status === 'DONE').length || 0;
    const totalTasks = tasks?.length || 0;
    const totalPomodoros = tasks?.reduce((sum: number, task: any) => sum + task.pomodorosTotal, 0) || 0;
    const totalMinutes = totalPomodoros * 25;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const focusTimeText = hours > 0 ? `${hours}h` : `${minutes}m`;
    const focusTimeSuffix = hours > 0 ? ` ${minutes}m` : '';

    if (isLoading) {
        return (
            <div className="p-12 max-w-7xl mx-auto">
                <div className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
                    <span className="text-primary">{'>'}</span>
                    LOADING_PROCESSES...
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold uppercase mb-2 tracking-tighter text-text-main-light dark:text-text-main-dark">
                            Today
                        </h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
                            <span className="text-primary">{'>'}</span>
                            {displayDate}
                        </p>
                    </div>
                    <button
                        onClick={openAddTaskModal}
                        className="h-9 px-4 bg-primary text-black hover:bg-primary-dark transition-all hover:shadow-[0_0_12px_rgba(0,224,118,0.3)] text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                    >
                        <span className="material-icons text-sm">add</span>
                        New Task
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-light dark:bg-border-dark mb-12">
                <StatsCard
                    title="Tasks Completed"
                    value={completedTasks}
                    suffix={`/${totalTasks}`}
                    icon="check_circle"
                    progress={{ current: completedTasks, total: Math.max(totalTasks, 1) }}
                    className="border-0 hover:border-0"
                />
                <StatsCard
                    title="Estimated Focus Time"
                    value={focusTimeText}
                    suffix={focusTimeSuffix}
                    icon="timelapse"
                    className="border-0 hover:border-0"
                />

            </div>

            {/* Active Processes Section */}
            <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-border-light dark:border-border-dark pb-2 mb-6">
                    <h2 className="text-xl font-bold uppercase flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
                        <span className="material-icons text-primary text-sm">dns</span>
                        Active Tasks
                    </h2>
                </div>

                {/* Task List */}
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={tasks?.map((t: any) => t.id) || []} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {tasks?.map((task: any, index: number) => (
                                <TaskCard key={task.id} task={task} isFirst={index === 0} />
                            ))}

                            {tasks?.length === 0 && (
                                <div className="bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark p-8 text-center">
                                    <p className="text-text-muted-light dark:text-text-muted-dark">
                                        No active processes. Add a task below to get started.
                                    </p>
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* ─── Add Task Modal ─── */}
            <Modal isOpen={isAddTaskModalOpen} onClose={closeAddTaskModal} title="New Task">
                <form onSubmit={handleAddTaskSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
                            Title
                        </label>
                        <input
                            type="text"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                            required
                            placeholder="e.g. Review pull requests"
                            className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light/40 dark:placeholder:text-text-muted-dark/40 focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
                            Notes <span className="text-text-muted-light/50 dark:text-text-muted-dark/50">(optional)</span>
                        </label>
                        <textarea
                            value={taskForm.description}
                            onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    {/* Pomodoros */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
                            Pomodoros
                        </label>
                        <div className="flex gap-2">
                            {POMODORO_OPTIONS.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setTaskForm((prev) => ({ ...prev, pomodoros: n }))}
                                    className={`h-9 w-9 text-xs font-bold border transition-colors ${
                                        taskForm.pomodoros === n
                                            ? 'bg-primary text-black border-primary'
                                            : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recurring toggle */}
                    <div className="border-t border-border-light dark:border-border-dark pt-4">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={taskForm.isRecurring}
                                onChange={(e) => setTaskForm((prev) => ({ ...prev, isRecurring: e.target.checked }))}
                                className="h-4 w-4 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primary focus:ring-primary"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
                                Recurring task
                            </span>
                        </label>
                    </div>

                    {/* Recurring options */}
                    {taskForm.isRecurring && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
                                    Pattern
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {(['DAILY', 'WEEKDAYS', 'WEEKLY', 'CUSTOM'] as const).map((pattern) => (
                                        <button
                                            key={pattern}
                                            type="button"
                                            onClick={() => setTaskForm((prev) => ({ ...prev, recurrencePattern: pattern }))}
                                            className={`h-8 px-3 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                                                taskForm.recurrencePattern === pattern
                                                    ? 'bg-primary text-black border-primary'
                                                    : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary'
                                            }`}
                                        >
                                            {pattern}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {taskForm.recurrencePattern === 'CUSTOM' && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
                                        Days
                                    </label>
                                    <div className="flex gap-1.5">
                                        {DAY_LABELS.map((day, i) => {
                                            const dayNum = i + 1;
                                            const selected = taskForm.daysOfWeek.includes(dayNum);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() =>
                                                        setTaskForm((prev) => ({
                                                            ...prev,
                                                            daysOfWeek: selected
                                                                ? prev.daysOfWeek.filter((d) => d !== dayNum)
                                                                : [...prev.daysOfWeek, dayNum],
                                                        }))
                                                    }
                                                    className={`h-8 w-9 text-[10px] font-bold border transition-colors ${
                                                        selected
                                                            ? 'bg-primary text-black border-primary'
                                                            : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-3 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeAddTaskModal}
                            className="h-9 px-4 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTaskMutation.isPending || createRecurringMutation.isPending}
                            className="h-9 px-5 bg-primary text-black hover:bg-primary-dark transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
