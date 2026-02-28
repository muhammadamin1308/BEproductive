import { useEffect, useMemo, useState, useRef } from 'react';
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
import { Deadline, DeadlineFilter, DeadlineInput } from '../types/deadline';

interface DeadlineFormState {
  title: string;
  description: string;
  dueDate: string;
  priority: DeadlineInput['priority'];
}

import { useToastStore } from '../store/useToastStore';

const INITIAL_FORM_STATE: DeadlineFormState = {
  title: '',
  description: '',
  dueDate: '',
  priority: 2,
};

const FILTER_OPTIONS: Array<{ label: string; value: DeadlineFilter; icon: string }> = [
  { label: 'All', value: 'all', icon: 'apps' },
  { label: 'Upcoming', value: 'pending', icon: 'schedule' },
  { label: 'Overdue', value: 'overdue', icon: 'warning' },
  { label: 'Done', value: 'completed', icon: 'check_circle' },
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

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [viewingDeadline, setViewingDeadline] = useState<Deadline | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Deadline | null>(null);
  const [softDeleteEnabled, setSoftDeleteEnabled] = useState(true);
  const [formState, setFormState] = useState<DeadlineFormState>(INITIAL_FORM_STATE);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDeadlines().catch(() => {
      showToast('Sync failed — check connection');
    });
  }, [fetchDeadlines, showToast]);

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
      showToast('Title and due date are required');
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
        showToast('Deadline updated');
      } else {
        await createDeadline(payload);
        showToast('Deadline created');
      }
      closeFormModal();
    } catch {
      showToast('Save failed — try again');
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      await toggleComplete(id);
    } catch {
      showToast('Status update failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    try {
      await deleteDeadline(deleteCandidate.id, { softDelete: softDeleteEnabled });
      showToast(softDeleteEnabled ? 'Deadline archived' : 'Deadline deleted');
      setDeleteCandidate(null);
      setSoftDeleteEnabled(true);
    } catch {
      showToast('Delete failed');
    }
  };

  const handleExportUpcoming = () => {
    const upcoming = deadlines
      .filter((deadline) => deadline.status === 'PENDING')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (upcoming.length === 0) {
      showToast('No upcoming deadlines to export');
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

    showToast('Export complete');
  };



  const filterCounts: Record<DeadlineFilter, number> = useMemo(() => ({
    all: deadlines.length,
    pending: deadlines.filter((d) => d.status === 'PENDING').length,
    overdue: deadlines.filter((d) => d.status === 'OVERDUE').length,
    completed: deadlines.filter((d) => d.status === 'COMPLETED').length,
  }), [deadlines]);

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto w-full relative">
      <div className="relative z-10">
        {/* ─── Header ─── */}
        <header className="mb-10">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
                <h1 className="text-4xl md:text-5xl font-bold uppercase mb-2 tracking-tighter text-text-main-light dark:text-text-main-dark">
                    Deadlines
                </h1>
                <p className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
                    <span className="text-primary">{'>'}</span>
                    Critical dates & execution milestones
                </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilterDropdown((v) => !v)}
                  className="h-9 px-4 border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-primary transition-all text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                >
                  <span className="material-icons text-sm">filter_list</span>
                  Filter
                  {filter !== 'all' && (
                    <span className="ml-1 bg-primary text-black text-[9px] font-bold px-1 rounded-sm">
                      {FILTER_OPTIONS.find((o) => o.value === filter)?.label}
                    </span>
                  )}
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 top-11 z-50 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-xl p-4 min-w-[180px]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-3">Show Status</p>
                    {FILTER_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer py-1 group">
                        <input
                          type="radio"
                          name="deadline-filter"
                          checked={filter === option.value}
                          onChange={() => { setFilter(option.value); setShowFilterDropdown(false); }}
                          className="accent-primary w-3 h-3"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors flex-1">
                          {option.label}
                        </span>
                        <span className="text-[9px] tabular-nums text-text-muted-light dark:text-text-muted-dark">
                          {filterCounts[option.value]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleExportUpcoming}
                className="h-9 px-3 border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
              >
                <span className="material-icons text-sm">download</span>
                Export
              </button>
              <button
                onClick={openCreateModal}
                className="h-9 px-4 bg-primary text-black hover:bg-primary-dark transition-all hover:shadow-[0_0_12px_rgba(0,224,118,0.3)] text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
              >
                <span className="material-icons text-sm">add</span>
                New Deadline
              </button>
            </div>
          </div>
        </header>

        {/* ─── Stats bar — single row, no individual borders ─── */}
        <section className="grid grid-cols-3 gap-px bg-border-light dark:bg-border-dark mb-8">
          <div className="bg-surface-light dark:bg-surface-dark px-5 py-4">
            <div className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Total</div>
            <div className="text-2xl font-bold text-text-main-light dark:text-text-main-dark tabular-nums">{stats.total}</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark px-5 py-4">
            <div className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Overdue</div>
            <div className={`text-2xl font-bold tabular-nums ${stats.overdue > 0 ? 'text-red-500 dark:text-red-400' : 'text-text-muted-light dark:text-text-muted-dark'}`}>{stats.overdue}</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark px-5 py-4">
            <div className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Completed / Month</div>
            <div className="text-2xl font-bold text-primary tabular-nums">{stats.completedThisMonth}</div>
          </div>
        </section>

        {/* ─── Toolbar: Search ─── */}
        <section className="mb-8">
          <div className="flex-1 min-w-0 relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-primary text-xs">{'>'}</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search deadlines..."
              className="w-full h-9 pl-7 pr-3 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark text-sm text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light/50 dark:placeholder:text-text-muted-dark/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </section>

        {/* ─── Error ─── */}
        {error && (
          <div className="mb-6 border-l-2 border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-4 py-3 text-xs font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        {/* ─── Content ─── */}
        {loading && deadlines.length === 0 ? (
          <div className="py-16 text-center text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-xs">
            <span className="text-primary">{'>'}</span> Loading deadlines...
          </div>
        ) : filteredDeadlines.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-icons text-3xl text-text-muted-light/30 dark:text-text-muted-dark/30 mb-3 block">event_busy</span>
            <p className="text-text-muted-light dark:text-text-muted-dark text-xs uppercase tracking-widest">
              No deadlines match current filters
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            {filteredDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onView={setViewingDeadline}
                onEdit={openEditModal}
                onToggleComplete={handleToggleComplete}
                onDelete={setDeleteCandidate}
              />
            ))}
          </section>
        )}
      </div>

      {/* ─── View Deadline Modal ─── */}
      <Modal
        isOpen={Boolean(viewingDeadline)}
        onClose={() => setViewingDeadline(null)}
        title="Deadline Details"
      >
        {viewingDeadline && (
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Title</div>
              <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark break-words">{viewingDeadline.title}</p>
            </div>

            {viewingDeadline.description?.trim() && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Notes</div>
                <p className="text-sm text-text-main-light dark:text-text-main-dark break-words whitespace-pre-wrap">{viewingDeadline.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Due Date</div>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">{format(new Date(viewingDeadline.dueDate), 'dd.MM.yyyy')}</p>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Priority</div>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">
                  {viewingDeadline.priority === 1 ? 'P1 — High' : viewingDeadline.priority === 2 ? 'P2 — Medium' : 'P3 — Low'}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Status</div>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">{viewingDeadline.status}</p>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1">Created</div>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">{format(new Date(viewingDeadline.createdAt), 'dd.MM.yyyy')}</p>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  openEditModal(viewingDeadline);
                  setViewingDeadline(null);
                }}
                className="h-9 px-4 border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
              >
                <span className="material-icons text-sm">edit</span>
                Edit
              </button>
              <button
                type="button"
                onClick={() => setViewingDeadline(null)}
                className="h-9 px-4 bg-primary text-black hover:bg-primary-dark transition-all text-[10px] font-bold uppercase tracking-widest"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Create / Edit Modal ─── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editingDeadline ? 'Edit Deadline' : 'New Deadline'}
      >
        <form onSubmit={handleSaveDeadline} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
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
              placeholder="e.g. Submit final report"
              className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light/40 dark:placeholder:text-text-muted-dark/40 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
              Notes <span className="text-text-muted-light/50 dark:text-text-muted-dark/50">(optional)</span>
            </label>
            <textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
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
                <option value="1">P1 — High</option>
                <option value="2">P2 — Medium</option>
                <option value="3">P3 — Low</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeFormModal}
              className="h-9 px-4 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 bg-primary text-black hover:bg-primary-dark transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {editingDeadline ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => {
          setDeleteCandidate(null);
          setSoftDeleteEnabled(true);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-5">
          <div className="border-l-2 border-red-500 pl-3 py-1">
            <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark break-words">
              {deleteCandidate?.title}
            </p>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-text-muted-light dark:text-text-muted-dark cursor-pointer select-none">
            <input
              type="checkbox"
              checked={softDeleteEnabled}
              onChange={(event) => setSoftDeleteEnabled(event.target.checked)}
              className="h-4 w-4 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primary focus:ring-primary"
            />
            <span className="uppercase tracking-widest font-bold">Soft delete</span>
            <span className="text-text-muted-light/50 dark:text-text-muted-dark/50">— recoverable</span>
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteCandidate(null);
                setSoftDeleteEnabled(true);
              }}
              className="h-9 px-4 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={loading}
              className="h-9 px-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {softDeleteEnabled ? 'Archive' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};
