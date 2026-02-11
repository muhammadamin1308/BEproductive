import { useEffect, useMemo, useState } from 'react';
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  isSameMonth,
  isWithinInterval,
  startOfDay,
} from 'date-fns';
import { DeadlineCard } from '../components/DeadlineCard';
import { Modal } from '../components/Modal';
import { useDeadlineStore } from '../store/useDeadlineStore';
import { Deadline, DeadlineFilter, DeadlineInput, DeadlineViewMode } from '../types/deadline';

interface DeadlineFormState {
  title: string;
  description: string;
  dueDate: string;
  priority: DeadlineInput['priority'];
}

const INITIAL_FORM_STATE: DeadlineFormState = {
  title: '',
  description: '',
  dueDate: '',
  priority: 2,
};

const FILTER_OPTIONS: Array<{ label: string; value: DeadlineFilter }> = [
  { label: 'ALL', value: 'all' },
  { label: 'UPCOMING', value: 'pending' },
  { label: 'OVERDUE', value: 'overdue' },
  { label: 'COMPLETED', value: 'completed' },
];

const formatToInputDate = (dateValue: string): string => format(new Date(dateValue), 'yyyy-MM-dd');

const toISODate = (dateInput: string): string => new Date(`${dateInput}T12:00:00`).toISOString();

const toPriorityValue = (value: string): DeadlineInput['priority'] => {
  const parsed = Number(value);
  if (parsed === 1 || parsed === 2 || parsed === 3) {
    return parsed;
  }
  return 2;
};

const getRelativeDayLabel = (dueDate: string): string => {
  const days = differenceInCalendarDays(startOfDay(new Date(dueDate)), startOfDay(new Date()));

  if (days === 0) return 'DUE TODAY';
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
};

export const DeadlinesPage = () => {
  const {
    deadlines,
    loading,
    filter,
    searchQuery,
    error,
    fetchDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    toggleComplete,
    setFilter,
    setSearchQuery,
  } = useDeadlineStore();

  const [viewMode, setViewMode] = useState<DeadlineViewMode>('list');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Deadline | null>(null);
  const [softDeleteEnabled, setSoftDeleteEnabled] = useState(true);
  const [formState, setFormState] = useState<DeadlineFormState>(INITIAL_FORM_STATE);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDeadlines().catch(() => {
      setSystemMessage('SYSTEM_STATUS: DEADLINE_SYNC_FAILED');
    });
  }, [fetchDeadlines]);

  const filteredDeadlines = useMemo(() => {
    const loweredQuery = searchQuery.trim().toLowerCase();

    const byFilter = deadlines.filter((deadline) => {
      if (filter === 'all') return true;
      if (filter === 'pending') return deadline.status === 'PENDING';
      if (filter === 'completed') return deadline.status === 'COMPLETED';
      return deadline.status === 'OVERDUE';
    });

    const bySearch = byFilter.filter((deadline) => {
      if (!loweredQuery) return true;
      const searchable = `${deadline.title} ${deadline.description ?? ''}`.toLowerCase();
      return searchable.includes(loweredQuery);
    });

    return [...bySearch].sort((a, b) => {
      const statusWeight = (status: Deadline['status']): number => {
        if (status === 'PENDING') return 0;
        if (status === 'OVERDUE') return 1;
        return 2;
      };

      const weightA = statusWeight(a.status);
      const weightB = statusWeight(b.status);
      if (weightA !== weightB) {
        return weightA - weightB;
      }

      const dueA = new Date(a.dueDate).getTime();
      const dueB = new Date(b.dueDate).getTime();

      if (a.status === 'OVERDUE' && b.status === 'OVERDUE') {
        return dueB - dueA;
      }

      return dueA - dueB;
    });
  }, [deadlines, filter, searchQuery]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

    const overdueCount = deadlines.filter((deadline) => deadline.status === 'OVERDUE').length;
    const completedThisMonth = deadlines.filter(
      (deadline) =>
        deadline.status === 'COMPLETED' && isSameMonth(new Date(deadline.updatedAt), new Date()),
    ).length;
    const upcomingThisWeek = deadlines.filter(
      (deadline) =>
        deadline.status === 'PENDING' &&
        isWithinInterval(startOfDay(new Date(deadline.dueDate)), {
          start: today,
          end: endOfCurrentWeek,
        }),
    ).length;

    return {
      total: deadlines.length,
      overdue: overdueCount,
      completedThisMonth,
      upcomingThisWeek,
    };
  }, [deadlines]);

  const autoSystemStatus = useMemo(() => {
    const nextPending = [...deadlines]
      .filter((deadline) => deadline.status === 'PENDING')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    if (!nextPending) {
      return 'SYSTEM_STATUS: NO_PENDING_DEADLINES';
    }

    const days = differenceInCalendarDays(
      startOfDay(new Date(nextPending.dueDate)),
      startOfDay(new Date()),
    );

    if (days <= 2) {
      return 'SYSTEM_STATUS: DEADLINE_APPROACHING';
    }

    return 'SYSTEM_STATUS: TIMELINE_STABLE';
  }, [deadlines]);

  const currentSystemStatus = systemMessage ?? autoSystemStatus;

  const openCreateModal = () => {
    setEditingDeadline(null);
    setFormState(INITIAL_FORM_STATE);
    setIsFormModalOpen(true);
  };

  const openEditModal = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setFormState({
      title: deadline.title,
      description: deadline.description ?? '',
      dueDate: formatToInputDate(deadline.dueDate),
      priority: deadline.priority,
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingDeadline(null);
    setFormState(INITIAL_FORM_STATE);
  };

  const handleSaveDeadline = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.title.trim() || !formState.dueDate) {
      setSystemMessage('SYSTEM_STATUS: VALIDATION_FAILED');
      return;
    }

    const payload: DeadlineInput = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      dueDate: toISODate(formState.dueDate),
      priority: formState.priority,
    };

    try {
      if (editingDeadline) {
        await updateDeadline(editingDeadline.id, payload);
        setSystemMessage('SYSTEM_STATUS: DEADLINE_UPDATED');
      } else {
        await createDeadline(payload);
        setSystemMessage('SYSTEM_STATUS: DEADLINE_CREATED');
      }
      closeFormModal();
    } catch {
      setSystemMessage('SYSTEM_STATUS: SAVE_OPERATION_FAILED');
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      await toggleComplete(id);
      setSystemMessage('SYSTEM_STATUS: DEADLINE_STATE_UPDATED');
    } catch {
      setSystemMessage('SYSTEM_STATUS: STATE_UPDATE_FAILED');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    try {
      await deleteDeadline(deleteCandidate.id, { softDelete: softDeleteEnabled });
      setSystemMessage(
        softDeleteEnabled
          ? 'SYSTEM_STATUS: DEADLINE_SOFT_DELETED'
          : 'SYSTEM_STATUS: DEADLINE_HARD_DELETED',
      );
      setDeleteCandidate(null);
      setSoftDeleteEnabled(true);
    } catch {
      setSystemMessage('SYSTEM_STATUS: DELETE_OPERATION_FAILED');
    }
  };

  const handleExportUpcoming = () => {
    const upcoming = deadlines
      .filter((deadline) => deadline.status === 'PENDING')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (upcoming.length === 0) {
      setSystemMessage('SYSTEM_STATUS: NO_UPCOMING_DEADLINES_TO_EXPORT');
      return;
    }

    const escapeCsv = (value: string): string => `"${value.replace(/"/g, '""')}"`;

    const rows = [
      ['Title', 'Description', 'Due Date', 'Priority', 'Status', 'Relative Day'],
      ...upcoming.map((deadline) => [
        deadline.title,
        deadline.description ?? '',
        format(new Date(deadline.dueDate), 'dd.MM.yyyy'),
        String(deadline.priority),
        deadline.status,
        getRelativeDayLabel(deadline.dueDate),
      ]),
    ];

    const csvContent = rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `beproductive-upcoming-deadlines-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSystemMessage('SYSTEM_STATUS: EXPORT_COMPLETE');
  };

  const timelineDeadlines = [...filteredDeadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <main className="p-6 md:p-12 max-w-7xl mx-auto w-full relative">
      <div className="absolute inset-0 grid-bg-light dark:grid-bg-dark opacity-40 pointer-events-none z-0" />

      <div className="relative z-10">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-3 mb-5 text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
            <span>
              <span className="text-primary">{'>'}</span> ROOT / DEADLINES / OVERVIEW
            </span>
            <span className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {currentSystemStatus}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter text-text-main-light dark:text-text-main-dark">
                Deadlines Management
              </h1>
              <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
                Monitor critical dates and execution milestones
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportUpcoming}
                className="h-10 px-4 border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
              >
                <span className="material-icons text-sm">download</span>
                Export Upcoming
              </button>
              <button
                onClick={openCreateModal}
                className="h-10 px-4 bg-primary text-black hover:bg-opacity-90 transition-all hover:shadow-[0_0_15px_rgba(0,224,118,0.35)] text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
              >
                <span className="material-icons text-sm">add</span>
                Add Deadline
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 relative">
            <div className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">Total Deadlines</div>
            <div className="text-3xl font-bold text-text-main-light dark:text-text-main-dark">{stats.total}</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 relative">
            <div className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">Overdue</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-300">{stats.overdue}</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 relative">
            <div className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">Completed This Month</div>
            <div className="text-3xl font-bold text-primary">{stats.completedThisMonth}</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 relative">
            <div className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">Upcoming This Week</div>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-300">{stats.upcomingThisWeek}</div>
          </div>
        </section>

        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">
                Search Deadlines
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-primary">{'>'}</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title or note..."
                  className="w-full h-10 pl-8 pr-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`h-10 px-3 border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    filter === option.value
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`h-10 px-3 border text-[10px] font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary'
                }`}
              >
                <span className="material-icons text-sm">view_list</span>
                List
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`h-10 px-3 border text-[10px] font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-1 ${
                  viewMode === 'timeline'
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary'
                }`}
              >
                <span className="material-icons text-sm">timeline</span>
                Timeline
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 text-xs font-bold uppercase tracking-widest">
            SYSTEM_STATUS: {error}
          </div>
        )}

        {loading && deadlines.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-xs">
            <span className="text-primary">{'>'}</span> LOADING_DEADLINE_DATA...
          </div>
        ) : filteredDeadlines.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark p-10 text-center">
            <p className="text-text-muted-light dark:text-text-muted-dark text-sm uppercase tracking-widest">
              No deadlines found for current filters
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <section className="space-y-4">
            {filteredDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onEdit={openEditModal}
                onToggleComplete={handleToggleComplete}
                onDelete={setDeleteCandidate}
              />
            ))}
          </section>
        ) : (
          <section className="relative pl-10">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border-light dark:bg-border-dark" />
            <div className="space-y-6">
              {timelineDeadlines.map((deadline) => (
                <div key={deadline.id} className="relative">
                  <div className="absolute -left-10 top-8 w-4 h-4 border-2 border-primary bg-background-light dark:bg-background-dark" />
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
                    {format(new Date(deadline.dueDate), 'dd.MM.yyyy')} | {getRelativeDayLabel(deadline.dueDate)}
                  </div>
                  <DeadlineCard
                    deadline={deadline}
                    onEdit={openEditModal}
                    onToggleComplete={handleToggleComplete}
                    onDelete={setDeleteCandidate}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editingDeadline ? 'Edit Deadline' : 'Create Deadline'}
      >
        <form onSubmit={handleSaveDeadline} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">
              Title
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              required
              className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">
              Description / Notes
            </label>
            <textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formState.dueDate}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    dueDate: event.target.value,
                  }))
                }
                required
                className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-2">
                Priority
              </label>
              <select
                value={String(formState.priority)}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    priority: toPriorityValue(event.target.value),
                  }))
                }
                className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
              >
                <option value="1">P1 - HIGH</option>
                <option value="2">P2 - MEDIUM</option>
                <option value="3">P3 - LOW</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeFormModal}
              className="h-10 px-4 border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 bg-primary text-black hover:bg-opacity-90 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              {editingDeadline ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => {
          setDeleteCandidate(null);
          setSoftDeleteEnabled(true);
        }}
        title="Delete Deadline"
      >
        <div className="space-y-4">
          <div className="border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
              {'>'} CONFIRM_DELETE_SEQUENCE
            </p>
            <p className="mt-2 text-sm text-text-main-light dark:text-text-main-dark break-words">
              {deleteCandidate?.title}
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark cursor-pointer">
            <input
              type="checkbox"
              checked={softDeleteEnabled}
              onChange={(event) => setSoftDeleteEnabled(event.target.checked)}
              className="h-4 w-4 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primary focus:ring-primary"
            />
            Soft Delete (Recoverable)
          </label>

          <p className="text-xs text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
            {softDeleteEnabled
              ? 'SYSTEM_STATUS: RECORD_MARKED_AS_ARCHIVED'
              : 'SYSTEM_STATUS: RECORD_PERMANENTLY_REMOVED'}
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteCandidate(null);
                setSoftDeleteEnabled(true);
              }}
              className="h-10 px-4 border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={loading}
              className="h-10 px-4 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:border-red-500 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};
