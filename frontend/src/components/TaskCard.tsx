import { useState, useRef, useEffect } from 'react';
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
    isFirst?: boolean;
}

export const TaskCard = ({ task, isFirst = false }: TaskCardProps) => {
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
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
                await api.delete(`/recurring-tasks/${task.recurringTaskId}`);
            } else {
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
    const progressPercent = Math.min((task.pomodorosCompleted / task.pomodorosTotal) * 100, 100);
    const taskId = `ID: ${String(task.id).slice(0, 4).toUpperCase()}`;

    if (isEditing) {
        return (
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6">
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
                        className="w-full bg-transparent font-bold text-lg text-text-main-light dark:text-text-main-dark outline-none mb-3 border-b border-border-light dark:border-border-dark pb-2 focus:border-primary"
                        autoFocus
                    />
                    <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Add a description..."
                        className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-3 text-sm text-text-main-light dark:text-text-main-dark outline-none resize-none h-20 mb-4 focus:border-primary"
                    />

                    {/* Time Fields */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-1">Start Time</label>
                            <input
                                type="time"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-1">End Time</label>
                            <input
                                type="time"
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Pomodoro Editor */}
                    <div className="flex items-center gap-2 mb-4">
                        <label className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Est. Pomodoros:</label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 6, 8].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setEditPomodorosTotal(num)}
                                    className={`w-7 h-7 text-xs font-bold transition-all border ${editPomodorosTotal === num
                                            ? 'bg-primary text-black border-primary'
                                            : 'bg-background-light dark:bg-background-dark text-text-muted-light dark:text-text-muted-dark border-border-light dark:border-border-dark hover:border-primary'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recurring Task Info */}
                    {task.recurringTaskId && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                            <p className="text-xs text-yellow-700 dark:text-yellow-200 flex items-center gap-2">
                                <span className="material-icons text-sm">repeat</span>
                                Changes to this task will only affect this instance.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark border border-border-light dark:border-border-dark text-sm font-bold uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-black text-sm font-bold uppercase hover:opacity-90"
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
                "group relative bg-surface-light dark:bg-surface-dark border transition-all",
                isFirst && !isDone
                    ? "border-l-4 border-l-primary border-t-border-light border-r-border-light border-b-border-light dark:border-t-border-dark dark:border-r-border-dark dark:border-b-border-dark"
                    : "border-border-light dark:border-border-dark",
                isDone && "opacity-60"
            )}
        >
            <div className="flex items-stretch">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="px-3 flex items-center text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark cursor-grab active:cursor-grabbing border-r border-border-light dark:border-border-dark"
                    aria-label="Drag to reorder task"
                >
                    <span className="material-icons text-sm">drag_indicator</span>
                </button>

                {/* Main Content */}
                <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark">
                                    {taskId}
                                </span>
                                {isFirst && !isDone && (
                                    <span className="bg-text-main-light dark:bg-white text-white dark:text-black text-[10px] px-1.5 py-0.5 font-bold uppercase">
                                        Current
                                    </span>
                                )}
                                {!isFirst && !isDone && (
                                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark">
                                        Queue
                                    </span>
                                )}
                                {isDone && (
                                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase bg-primary/10 text-primary">
                                        Done
                                    </span>
                                )}
                                {task.recurringTaskId && (
                                    <span className="material-icons text-sm text-text-muted-light dark:text-text-muted-dark">
                                        repeat
                                    </span>
                                )}
                            </div>

                            <h2 className={cn(
                                "font-bold text-lg leading-tight mb-1",
                                isDone ? "text-text-muted-light dark:text-text-muted-dark line-through" : "text-text-main-light dark:text-text-main-dark"
                            )}>
                                {task.title}
                            </h2>

                            {task.description && (
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-3 line-clamp-1">
                                    {task.description}
                                </p>
                            )}

                            {/* Time display */}
                            {(task.startTime || task.endTime) && (
                                <div className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center gap-1 mb-3">
                                    <span className="material-icons text-sm">schedule</span>
                                    {task.startTime && <span>{task.startTime}</span>}
                                    {task.startTime && task.endTime && <span>-</span>}
                                    {task.endTime && <span>{task.endTime}</span>}
                                </div>
                            )}

                            {/* Progress */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 max-w-[200px]">
                                    <div className="h-1 w-full bg-border-light dark:bg-border-dark">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-text-muted-light dark:text-text-muted-dark">
                                    {task.pomodorosCompleted}/{task.pomodorosTotal} SESSIONS
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Toggle Status */}
                            <button
                                onClick={handleToggleStatus}
                                className={cn(
                                    "p-2 border transition-colors",
                                    isDone
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary"
                                )}
                                title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                                <span className="material-icons text-lg">
                                    {isDone ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                            </button>

                            {/* Start Focus */}
                            {!isDone && (
                                <button
                                    onClick={handleStartFocus}
                                    className="p-2 bg-primary text-black hover:opacity-90 transition-opacity"
                                    title="Start Focus"
                                >
                                    <span className="material-icons text-lg">play_arrow</span>
                                </button>
                            )}

                            {/* Menu */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                    className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark border border-border-light dark:border-border-dark hover:border-primary transition-colors"
                                    aria-label="Task options"
                                >
                                    <span className="material-icons text-lg">more_vert</span>
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-lg z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsEditing(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark flex items-center gap-2 font-mono uppercase"
                                        >
                                            <span className="material-icons text-sm">edit</span>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDeleteModal(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-mono uppercase"
                                        >
                                            <span className="material-icons text-sm">delete</span>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Task">
                {task.recurringTaskId ? (
                    <>
                        <p className="text-text-muted-light dark:text-text-muted-dark mb-6 text-sm">This is a recurring task. What would you like to delete?</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    deleteTaskMutation.mutate(false);
                                    setShowDeleteModal(false);
                                }}
                                className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark py-3 font-bold uppercase text-sm hover:border-primary transition-colors"
                            >
                                Delete Only This Task
                            </button>
                            <button
                                onClick={() => {
                                    deleteTaskMutation.mutate(true);
                                    setShowDeleteModal(false);
                                }}
                                className="w-full bg-red-500 text-white py-3 font-bold uppercase text-sm hover:bg-red-600 transition-all"
                            >
                                Delete All Recurring Tasks
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="w-full text-text-muted-light dark:text-text-muted-dark py-2 hover:text-text-main-light dark:hover:text-text-main-dark transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-text-muted-light dark:text-text-muted-dark mb-6 text-sm">Are you sure you want to delete this task?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark py-3 font-bold uppercase text-sm hover:border-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteTaskMutation.mutate(false);
                                    setShowDeleteModal(false);
                                }}
                                className="flex-1 bg-red-500 text-white py-3 font-bold uppercase text-sm hover:bg-red-600 transition-all"
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
