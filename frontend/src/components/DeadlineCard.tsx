import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { Deadline } from '../types/deadline';

interface DeadlineCardProps {
  deadline: Deadline;
  onEdit: (deadline: Deadline) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (deadline: Deadline) => void;
}

const STATUS_STYLES: Record<Deadline['status'], string> = {
  COMPLETED: 'bg-primary/10 text-primary border-primary/20',
  OVERDUE: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  PENDING: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};

const PRIORITY_STYLES: Record<Deadline['priority'], string> = {
  1: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  2: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  3: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

const PRIORITY_LABELS: Record<Deadline['priority'], string> = {
  1: 'P1 HIGH',
  2: 'P2 MEDIUM',
  3: 'P3 LOW',
};

const getDaysRemainingLabel = (deadline: Deadline): string => {
  if (deadline.status === 'COMPLETED') {
    return 'COMPLETED';
  }

  const daysRemaining = differenceInCalendarDays(
    startOfDay(new Date(deadline.dueDate)),
    startOfDay(new Date()),
  );

  if (daysRemaining === 0) {
    return 'DUE TODAY';
  }

  if (daysRemaining > 0) {
    return daysRemaining === 1 ? '1 DAY LEFT' : `${daysRemaining} DAYS LEFT`;
  }

  const overdueDays = Math.abs(daysRemaining);
  return overdueDays === 1 ? '1 DAY OVERDUE' : `${overdueDays} DAYS OVERDUE`;
};

const getSystemStatus = (deadline: Deadline): string => {
  if (deadline.status === 'COMPLETED') {
    return 'SYSTEM_STATUS: DEADLINE_COMPLETE';
  }

  const daysRemaining = differenceInCalendarDays(
    startOfDay(new Date(deadline.dueDate)),
    startOfDay(new Date()),
  );

  if (daysRemaining < 0) {
    return 'SYSTEM_STATUS: DEADLINE_MISSED';
  }

  if (daysRemaining <= 2) {
    return 'SYSTEM_STATUS: DEADLINE_APPROACHING';
  }

  return 'SYSTEM_STATUS: ON_TRACK';
};

export const DeadlineCard = ({ deadline, onEdit, onToggleComplete, onDelete }: DeadlineCardProps) => {
  const formattedDate = format(new Date(deadline.dueDate), 'dd.MM.yyyy');
  const daysRemainingLabel = getDaysRemainingLabel(deadline);
  const statusLabel = deadline.status === 'PENDING' ? 'UPCOMING' : deadline.status;

  return (
    <article className="relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-5 pt-12 transition-colors hover:border-primary overflow-hidden">
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

      <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-widest border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark uppercase">
        <span className="material-icons text-xs text-primary">event</span>
        {formattedDate}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold uppercase tracking-wide text-text-main-light dark:text-text-main-dark leading-tight break-words">
            {deadline.title}
          </h3>
          <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed break-words">
            {deadline.description?.trim() || 'NO NOTES ATTACHED'}
          </p>
        </div>

        <span className={`shrink-0 text-[10px] font-bold tracking-widest uppercase px-2 py-1 border ${PRIORITY_STYLES[deadline.priority]}`}>
          {PRIORITY_LABELS[deadline.priority]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${STATUS_STYLES[deadline.status]}`}>
          {statusLabel}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${STATUS_STYLES[deadline.status]}`}>
          <span className="inline-flex items-center gap-1">
            <span className="material-icons text-xs">schedule</span>
            {daysRemainingLabel}
          </span>
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
          {getSystemStatus(deadline)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(deadline)}
            className="h-8 px-3 border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
          >
            <span className="material-icons text-sm">edit</span>
            EDIT
          </button>
          <button
            onClick={() => onToggleComplete(deadline.id)}
            className="h-8 px-3 border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
          >
            <span className="material-icons text-sm">
              {deadline.status === 'COMPLETED' ? 'radio_button_unchecked' : 'task_alt'}
            </span>
            {deadline.status === 'COMPLETED' ? 'UNDO' : 'COMPLETE'}
          </button>
          <button
            onClick={() => onDelete(deadline)}
            className="h-8 px-3 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:border-red-500 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
          >
            <span className="material-icons text-sm">delete</span>
            DELETE
          </button>
        </div>
      </div>
    </article>
  );
};
