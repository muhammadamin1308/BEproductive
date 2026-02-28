import { useState, useRef, useEffect } from 'react';
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { cn } from '../lib/utils';
import { Deadline } from '../types/deadline';

interface DeadlineCardProps {
  deadline: Deadline;
  onView: (deadline: Deadline) => void;
  onEdit: (deadline: Deadline) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (deadline: Deadline) => void;
}

const PRIORITY_LABELS: Record<Deadline['priority'], string> = {
  1: 'P1 High',
  2: 'P2 Medium',
  3: 'P3 Low',
};

const getDaysRemainingLabel = (deadline: Deadline): string => {
  if (deadline.status === 'COMPLETED') return 'Completed';

  const daysRemaining = differenceInCalendarDays(
    startOfDay(new Date(deadline.dueDate)),
    startOfDay(new Date()),
  );

  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining > 0) return daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`;

  const overdueDays = Math.abs(daysRemaining);
  return overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
};

export const DeadlineCard = ({ deadline, onView, onEdit, onToggleComplete, onDelete }: DeadlineCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDate = format(new Date(deadline.dueDate), 'dd.MM.yyyy');
  const daysLabel = getDaysRemainingLabel(deadline);
  const isDone = deadline.status === 'COMPLETED';
  const isOverdue = deadline.status === 'OVERDUE';

  return (
    <article
      className={cn(
        'group relative bg-surface-light dark:bg-surface-dark border transition-all',
        isOverdue
          ? 'border-l-4 border-l-red-500 border-t-border-light border-r-border-light border-b-border-light dark:border-t-border-dark dark:border-r-border-dark dark:border-b-border-dark'
          : !isDone
            ? 'border-l-4 border-l-primary border-t-border-light border-r-border-light border-b-border-light dark:border-t-border-dark dark:border-r-border-dark dark:border-b-border-dark'
            : 'border-border-light dark:border-border-dark',
        isDone && 'opacity-60',
      )}
    >
      <div className="flex items-stretch">
        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Deadline Info */}
            <div className="flex-1 min-w-0">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-2">
                {isOverdue && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 font-bold uppercase">
                    Overdue
                  </span>
                )}
                {!isDone && !isOverdue && (
                  <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark">
                    Upcoming
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase bg-primary/10 text-primary">
                    Done
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark">
                  {PRIORITY_LABELS[deadline.priority]}
                </span>
              </div>

              {/* Title */}
              <h3
                className={cn(
                  'font-bold text-lg leading-tight mb-1 truncate',
                  isDone
                    ? 'text-text-muted-light dark:text-text-muted-dark line-through'
                    : 'text-text-main-light dark:text-text-main-dark',
                )}
                title={deadline.title}
              >
                {deadline.title}
              </h3>

              {/* Description */}
              {deadline.description?.trim() && (
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-3 line-clamp-1 break-words">
                  {deadline.description}
                </p>
              )}

              {/* Date & countdown */}
              <div className="flex items-center gap-4">
                <div className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center gap-1">
                  <span className="material-icons text-sm">event</span>
                  <span>{formattedDate}</span>
                </div>
                <span
                  className={cn(
                    'text-xs font-mono',
                    isOverdue
                      ? 'text-red-500'
                      : 'text-text-muted-light dark:text-text-muted-dark',
                  )}
                >
                  {daysLabel}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Toggle Status */}
              <button
                onClick={() => onToggleComplete(deadline.id)}
                className={cn(
                  'p-2 border transition-colors',
                  isDone
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary',
                )}
                title={isDone ? 'Mark as pending' : 'Mark as complete'}
              >
                <span className="material-icons text-lg">
                  {isDone ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </button>

              {/* Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark border border-border-light dark:border-border-dark hover:border-primary transition-colors"
                  aria-label="Deadline options"
                >
                  <span className="material-icons text-lg">more_vert</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-lg z-50">
                    <button
                      onClick={() => {
                        onView(deadline);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark flex items-center gap-2 font-mono uppercase"
                    >
                      <span className="material-icons text-sm">visibility</span>
                      View
                    </button>
                    <button
                      onClick={() => {
                        onEdit(deadline);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark flex items-center gap-2 font-mono uppercase"
                    >
                      <span className="material-icons text-sm">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(deadline);
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
    </article>
  );
};
