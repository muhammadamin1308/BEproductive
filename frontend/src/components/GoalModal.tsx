import React from 'react';

type GoalLevel = 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  level: GoalLevel;
  parentGoalId: string | null;
  createdAt: string;
  category: string | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
}

interface GoalFormData {
  title: string;
  description: string;
  level: GoalLevel;
  category: string;
  targetValue: string;
  currentValue: string;
  unit: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingGoal: Goal | null;
  formData: GoalFormData;
  setFormData: (data: GoalFormData) => void;
}

export const GoalModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingGoal,
  formData,
  setFormData,
}: GoalModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black/50 flex items-center justify-center p-4 z-50">
      <div className=" mt-8 md:mt-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark mb-4 uppercase tracking-wide">
          {editingGoal ? 'Edit Goal' : 'New Goal'}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as GoalLevel })}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
              >
                <option value="WEEK">Weekly</option>
                <option value="MONTH">Monthly</option>
                <option value="QUARTER">Quarterly</option>
                <option value="YEAR">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
              >
                <option value="PERSONAL">Personal</option>
                <option value="FINANCE">Finance</option>
                <option value="HEALTH">Health</option>
                <option value="SKILL">Skill</option>
                <option value="CAREER">Career</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                  Target Value
                </label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
                  placeholder="e.g. Books"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                Current Progress
              </label>
              <input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors uppercase text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-black uppercase text-sm font-bold hover:opacity-90 transition-opacity"
            >
              {editingGoal ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
