import { create } from 'zustand';
import { api } from '../lib/axios';
import { Deadline, DeadlineFilter, DeadlineInput, DeadlineStatus } from '../types/deadline';

interface DeleteDeadlineOptions {
  softDelete?: boolean;
}

interface DeadlineStore {
  deadlines: Deadline[];
  loading: boolean;
  filter: DeadlineFilter;
  searchQuery: string;
  error: string | null;

  fetchDeadlines: () => Promise<void>;
  createDeadline: (data: DeadlineInput) => Promise<void>;
  updateDeadline: (id: string, data: Partial<DeadlineInput>) => Promise<void>;
  deleteDeadline: (id: string, options?: DeleteDeadlineOptions) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  setFilter: (filter: DeadlineFilter) => void;
  setSearchQuery: (query: string) => void;
}

const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const inferStatus = (deadline: Deadline): DeadlineStatus => {
  if (deadline.status === 'COMPLETED') {
    return 'COMPLETED';
  }

  return new Date(deadline.dueDate) < getStartOfToday() ? 'OVERDUE' : 'PENDING';
};

const normalizePriority = (value: number): 1 | 2 | 3 => {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }

  return 2;
};

const normalizeDeadline = (deadline: Deadline): Deadline => ({
  ...deadline,
  priority: normalizePriority(Number(deadline.priority)),
  status: inferStatus(deadline),
});

const sortDeadlines = (deadlines: Deadline[]): Deadline[] => {
  const toBucket = (status: DeadlineStatus): number => {
    if (status === 'PENDING') return 0;
    if (status === 'OVERDUE') return 1;
    return 2;
  };

  return [...deadlines].sort((a, b) => {
    const statusWeight = toBucket(a.status) - toBucket(b.status);
    if (statusWeight !== 0) {
      return statusWeight;
    }

    const dueA = new Date(a.dueDate).getTime();
    const dueB = new Date(b.dueDate).getTime();

    if (a.status === 'OVERDUE' && b.status === 'OVERDUE') {
      return dueB - dueA;
    }

    if (dueA !== dueB) {
      return dueA - dueB;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) {
      return response.data.error;
    }
  }

  return 'Unexpected deadline operation failure';
};

export const useDeadlineStore = create<DeadlineStore>((set, get) => ({
  deadlines: [],
  loading: false,
  filter: 'all',
  searchQuery: '',
  error: null,

  fetchDeadlines: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<Deadline[]>('/deadlines');
      const normalized = res.data.map(normalizeDeadline);
      set({ deadlines: sortDeadlines(normalized) });
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createDeadline: async (data) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        ...data,
        description: data.description?.trim() || undefined,
      };
      const res = await api.post<Deadline>('/deadlines', payload);

      set((state) => ({
        deadlines: sortDeadlines([normalizeDeadline(res.data), ...state.deadlines]),
      }));
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateDeadline: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        ...data,
        description: data.description?.trim() || undefined,
      };
      const res = await api.patch<Deadline>(`/deadlines/${id}`, payload);

      set((state) => ({
        deadlines: sortDeadlines(
          state.deadlines.map((deadline) =>
            deadline.id === id ? normalizeDeadline(res.data) : deadline,
          ),
        ),
      }));
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteDeadline: async (id, options) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/deadlines/${id}`, {
        data: {
          softDelete: options?.softDelete ?? true,
        },
      });

      set((state) => ({
        deadlines: state.deadlines.filter((deadline) => deadline.id !== id),
      }));
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  toggleComplete: async (id) => {
    const target = get().deadlines.find((deadline) => deadline.id === id);
    if (!target) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const shouldComplete = target.status !== 'COMPLETED';
      const res = await api.patch<Deadline>(`/deadlines/${id}/complete`, {
        completed: shouldComplete,
      });

      set((state) => ({
        deadlines: sortDeadlines(
          state.deadlines.map((deadline) =>
            deadline.id === id ? normalizeDeadline(res.data) : deadline,
          ),
        ),
      }));
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
