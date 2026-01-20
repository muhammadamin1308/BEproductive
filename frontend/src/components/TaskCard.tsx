import { useState, useRef, useEffect } from 'react';
import { Play, Check, MoreVertical, Trash2, Edit2, X, GripVertical, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFocusStore, Task } from '../store/useFocusStore';
import { cn } from '../lib/utils';
import { api } from '../lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal } from './Modal';

interface TaskCardProps {
    task: {
        id: number;
        title: string;
        description?: string;
        status: string;
        estimatedMinutes?: number;
        pomodorosTotal: number;
        pomodorosCompleted: number;
        recurringTaskId?: string | null;
        startTime?: string | null;
        endTime?: string | null;
    };
}

export const TaskCard = ({ task }: TaskCardProps) => {
    const navigate = useNavigate();
    const { setActiveTask, startTimer } = useFocusStore();
    const queryClient = useQueryClient();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDesc, setEditDesc] = useState(task.description || '');
    const [editPomodorosTotal, setEditPomodorosTotal] = useState(task.pomodorosTotal);
    const [editStartTime, setEditStartTime] = useState(task.startTime || '');
    const [editEndTime, setEditEndTime] = useState(task.endTime || '');
    const [isEditingRecurring, setIsEditingRecurring] = useState(!!task.recurringTaskId);
    const [editRecurringPattern, setEditRecurringPattern] = useState<'DAILY' | 'WEEKDAYS' | 'CUSTOM'>('DAILY');
    const [editSelectedDays, setEditSelectedDays] = useState<number[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleEditDay = (day: number) => {
        setEditSelectedDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const deleteTaskMutation = useMutation({
        mutationFn: async (deleteAll?: boolean) => {
            if (deleteAll && task.recurringTaskId) {
                // Delete the recurring task (will cascade delete all instances)
                await api.delete(`/recurring-tasks/${task.recurringTaskId}`);
            } else {
                // Delete just this instance
                await api.delete(`/tasks/${task.id}`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: async (data: { title: string; description: string; pomodorosTotal: number; startTime?: string; endTime?: string }) => {
            await api.patch(`/tasks/${task.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsEditing(false);
            setIsMenuOpen(false);
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async () => {
            const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
            await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const handleStartFocus = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveTask(task as unknown as Task);
        startTimer();
        navigate('/focus');
    };

    const handleToggleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleStatusMutation.mutate();
    };

    const isDone = task.status === 'DONE';

    if (isEditing) {
        return (
            <div className="bg-surface p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-md">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    updateTaskMutation.mutate({ 
                        title: editTitle, 
                        description: editDesc, 
                        pomodorosTotal: editPomodorosTotal,
                        startTime: editStartTime || undefined,
                        endTime: editEndTime || undefined
                    });
                }}>
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-transparent font-medium text-lg text-primary-text outline-none mb-2"
                        autoFocus
                    />
                    <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Add a description..."
                        className="w-full bg-slate-50 dark:bg-black/20 rounded-lg p-3 text-sm text-secondary-text outline-none resize-none h-20 mb-3"
                    />

                    {/* Time Fields */}
                    <div className="flex items-center gap-3 mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-secondary-text mb-1.5">Start Time</label>
                            <input
                                type="time"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-secondary-text mb-1.5">End Time</label>
                            <input
                                type="time"
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                            />
                        </div>
                    </div>

                    {/* Pomodoro Editor */}
                    <div className="flex items-center gap-2 mb-4">
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">Est. Pomodoros:</label>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                            {[1, 2, 3, 4, 6, 8].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setEditPomodorosTotal(num)}
                                    className={`w-6 h-6 rounded text-xs font-bold transition-all ${editPomodorosTotal === num ? 'bg-cta text-white shadow-sm' : 'text-secondary-text hover:bg-white/50 dark:hover:bg-white/10'}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recurring Task Options */}
                    {task.recurringTaskId && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Repeat className="w-4 h-4 text-cta" />
                                <span className="text-sm font-medium text-primary-text">Recurring Task</span>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                    Note: Changes to this task will only affect this instance. To edit the recurring pattern, delete and recreate the recurring task.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-secondary-text hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:brightness-110"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative bg-surface p-5 rounded-2xl border transition-all duration-300",
                isDone
                    ? "border-slate-100 dark:border-white/5 opacity-60 bg-slate-50 dark:bg-white/5"
                    : "border-slate-100 dark:border-white/10 shadow-soft hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/30"
            )}
        >
            <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 p-1 text-secondary-text/40 hover:text-secondary-text cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Drag to reorder task"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                {/* Custom Radio/Check */}
                <button
                    onClick={handleToggleStatus}
                    aria-label={isDone ? 'Mark task as incomplete' : 'Mark task as complete'}
                    className={cn(
                        "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                        isDone
                            ? "bg-slate-200 border-slate-200 dark:bg-white/20 dark:border-transparent text-slate-500"
                            : "border-slate-200 dark:border-white/20 text-transparent hover:border-indigo-400"
                    )}
                >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </button>

                <div className="flex-1 min-w-0">
                    <h2 className={cn(
                        "font-medium text-lg leading-snug transition-colors pr-8",
                        isDone ? "text-secondary-text line-through" : "text-primary-text"
                    )}>
                        {task.title}
                    </h2>

                    {task.description && (
                        <p className="text-sm text-secondary-text mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex flex-col gap-2 mt-3">
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cta transition-all duration-500 ease-out"
                                style={{ width: `${Math.min((task.pomodorosCompleted / task.pomodorosTotal) * 100, 100)}%` }}
                            />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-secondary-text font-medium">{task.pomodorosCompleted}/{task.pomodorosTotal} sessions</span>
                            <span className="text-secondary-text">{Math.floor((task.pomodorosTotal * 25) / 60)}h {(task.pomodorosTotal * 25) % 60}m</span>
                        </div>
                    </div>
                </div>

                {/* Wrapper for Actions */}
                <div className="flex items-start gap-1">
                    {/* Start Focus Button (Only visible on hover/group-focus for non-done tasks) */}
                    {!isDone && (
                        <button
                            onClick={handleStartFocus}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-cta hover:bg-cta/10 rounded-lg transition-all duration-300"
                            title="Start Focus"
                            aria-label="Start focus session for this task"
                        >
                            <Play className="w-5 h-5 fill-current" />
                        </button>
                    )}

                    {/* Menu Button */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                            className="p-2 text-secondary-text hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Task options"
                            aria-expanded={isMenuOpen}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-primary-text hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        setShowDeleteModal(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete{task.recurringTaskId ? ' (recurring)' : ''}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Task">
                {task.recurringTaskId ? (
                    <>
                        <p className="text-secondary-text mb-6">This is a recurring task. What would you like to delete?</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    deleteTaskMutation.mutate(false);
                                    setShowDeleteModal(false);
                                }}
                                className="w-full bg-slate-100 dark:bg-white/5 text-primary-text py-3 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                            >
                                Delete Only This Task
                            </button>
                            <button
                                onClick={() => {
                                    deleteTaskMutation.mutate(true);
                                    setShowDeleteModal(false);
                                }}
                                className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all"
                            >
                                Delete All Recurring Tasks
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="w-full text-secondary-text py-2 hover:text-primary-text transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-secondary-text mb-6">Are you sure you want to delete this task?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 bg-slate-100 dark:bg-white/5 text-primary-text py-3 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteTaskMutation.mutate(false);
                                    setShowDeleteModal(false);
                                }}
                                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};
