
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskCard } from '../components/TaskCard';
import { useAuthStore } from '../store/useAuthStore';
import { format } from 'date-fns';
import { api } from '../lib/axios';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { StatsCard } from '../components/StatsCard';
import { TerminalInput } from '../components/TerminalInput';

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const TodayPage = () => {
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
        mutationFn: async ({ title, pomodorosTotal }: { title: string; pomodorosTotal: number }) => {
            await api.post('/tasks', {
                title,
                date: todayDate,
                description: '',
                pomodorosTotal: pomodorosTotal,
                startTime: null,
                endTime: null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', todayDate] });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (taskIds: string[]) => {
            await api.patch('/tasks/reorder', { taskIds });
        },
    });

    const handleAddTask = (data: { title: string; pomodoros: number; tags?: string }) => {
        createTaskMutation.mutate({
            title: data.title,
            pomodorosTotal: data.pomodoros,
        });
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
    const completedPomodoros = tasks?.reduce((sum: number, task: any) => sum + task.pomodorosCompleted, 0) || 0;
    const totalMinutes = totalPomodoros * 25;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const focusTimeText = hours > 0 ? `${hours}h` : `${minutes}m`;
    const focusTimeSuffix = hours > 0 ? ` ${minutes}m` : '';
    const efficiency = totalPomodoros > 0 ? Math.round((completedPomodoros / totalPomodoros) * 100) : 0;

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
                <h1 className="text-4xl md:text-5xl font-bold uppercase mb-2 tracking-tighter text-text-main-light dark:text-text-main-dark">
                    My Dashboard
                </h1>
                <p className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
                    <span className="text-primary">{'>'}</span>
                    EXEC_DATE: {displayDate}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatsCard
                    title="Tasks Completed"
                    value={completedTasks}
                    suffix={`/${totalTasks}`}
                    icon="check_circle"
                    progress={{ current: completedTasks, total: Math.max(totalTasks, 1) }}
                />
                <StatsCard
                    title="Focus Time"
                    value={focusTimeText}
                    suffix={focusTimeSuffix}
                    icon="timelapse"
                    trend={{ value: '+15% VS YESTERDAY', positive: true }}
                />
                <StatsCard
                    title="Efficiency"
                    value={`${efficiency}%`}
                    icon="bolt"
                    variant="highlight"
                />
            </div>

            {/* Active Processes Section */}
            <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-border-light dark:border-border-dark pb-2 mb-6">
                    <h2 className="text-xl font-bold uppercase flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
                        <span className="material-icons text-primary text-sm">dns</span>
                        Active Processes
                    </h2>
                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark uppercase">
                        Sort: Priority_High
                    </span>
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

            {/* Terminal Input */}
            <div className="mt-12">
                <TerminalInput
                    onSubmit={handleAddTask}
                    isLoading={createTaskMutation.isPending}
                />
            </div>
        </div>
    );
};
