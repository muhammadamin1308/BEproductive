export type DeadlineStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';
export type DeadlineFilter = 'all' | 'pending' | 'completed' | 'overdue';
export type DeadlineViewMode = 'list' | 'timeline';

export interface Deadline {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: 1 | 2 | 3;
  status: DeadlineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeadlineInput {
  title: string;
  description?: string;
  dueDate: string;
  priority: 1 | 2 | 3;
}
