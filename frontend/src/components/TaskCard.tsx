import { useState, useRef, useEffect } from 'react';
import { Play, Check, MoreVertical, Trash2, Edit2, X, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFocusStore, Task } from '../store/useFocusStore';
import { cn } from '../lib/utils';
import { api } from '../lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
    task: {
        id: number;
        title: string;
        description?: string;
        status: string;
        estimatedMinutes?: number;
        pomodorosTotal: number;
        pomodorosCompleted: number;
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
    const menuRef = useRef<HTMLDivElement>(null);

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
        mutationFn: async () => {
            await api.delete(`/tasks/${task.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: async (data: { title: string; description: string; pomodorosTotal: number }) => {
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
                    updateTaskMutation.mutate({ title: editTitle, description: editDesc, pomodorosTotal: editPomodorosTotal });
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
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                {/* Custom Radio/Check */}
                <button
                    onClick={handleToggleStatus}
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
                    <h3 className={cn(
                        "font-medium text-lg leading-snug transition-colors pr-8",
                        isDone ? "text-secondary-text line-through" : "text-primary-text"
                    )}>
                        {task.title}
                    </h3>

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
                        <div className="flex items-center justify-between text-xs text-secondary-text font-medium">
                            <span>{task.pomodorosCompleted}/{task.pomodorosTotal} sessions</span>
                            <span>{Math.floor((task.pomodorosTotal * 30) / 60)}h {(task.pomodorosTotal * 30) % 60}m</span>
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
                        >
                            <Play className="w-5 h-5 fill-current" />
                        </button>
                    )}

                    {/* Menu Button */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                            className="p-2 text-secondary-text hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
                                        e.stopPropagation();
                                        if (confirm('Delete task?')) deleteTaskMutation.mutate();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
