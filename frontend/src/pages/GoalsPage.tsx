import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  level: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK';
  parentGoalId: string | null;
  createdAt: string;
  category: string | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
}

export const GoalsPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [completionRate, setCompletionRate] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [visibleLevels, setVisibleLevels] = useState<Set<Goal['level']>>(new Set(['YEAR', 'QUARTER', 'MONTH', 'WEEK']));
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'MONTH' as Goal['level'],
    category: 'PERSONAL',
    targetValue: '',
    currentValue: '0',
    unit: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/goals');
      setGoals(response.data);
      
      // Calculate completion rate from goals data
      const goalsWithTargets = response.data.filter((g: Goal) => g.targetValue);
      if (goalsWithTargets.length > 0) {
        const avgProgress = goalsWithTargets.reduce((sum: number, g: Goal) => {
          return sum + Math.min(100, ((g.currentValue || 0) / (g.targetValue || 1)) * 100);
        }, 0) / goalsWithTargets.length;
        setCompletionRate(Math.round(avgProgress));
      } else {
        setCompletionRate(0);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        targetValue: formData.targetValue ? parseFloat(formData.targetValue) : null,
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : 0,
      };

      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, payload);
      } else {
        await api.post('/goals', payload);
      }
      setShowModal(false);

      setEditingGoal(null);
      setFormData({ title: '', description: '', level: 'MONTH', category: 'PERSONAL', targetValue: '', currentValue: '0', unit: '' });
      fetchGoals();
      showToast(editingGoal ? 'Goal updated' : 'Goal created');
    } catch (error) {
      console.error('Error saving goal:', error);
      showToast('Failed to save goal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
      showToast('Goal deleted');
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast('Failed to delete goal');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      level: goal.level,
      category: goal.category || 'PERSONAL',
      targetValue: goal.targetValue?.toString() || '',
      currentValue: goal.currentValue?.toString() || '0',
      unit: goal.unit || '',
    });
    setShowModal(true);
  };

  const handleNewGoal = (level?: Goal['level']) => {
    setEditingGoal(null);
    setFormData({ title: '', description: '', level: level || 'MONTH', category: 'PERSONAL', targetValue: '', currentValue: '0', unit: '' });
    setShowModal(true);
  };

  const yearlyGoals = goals.filter((g) => g.level === 'YEAR');
  const quarterlyGoals = goals.filter((g) => g.level === 'QUARTER');
  const monthlyGoals = goals.filter((g) => g.level === 'MONTH');
  const weeklyGoals = goals.filter((g) => g.level === 'WEEK');
  const activeGoals = goals.length;

  if (loading) {
    return (
      <div className="p-12 max-w-7xl mx-auto">
        <div className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
          <span className="text-primary">{'>'}</span>
          LOADING_GOALS...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tighter uppercase text-text-main-light dark:text-text-main-dark">
            My Goals
          </h1>
          <p className="text-text-muted-light dark:text-text-muted-dark text-sm flex items-center">
            <span className="mr-2 text-primary">{'>'}</span>
            Track your progress and achieve your dreams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className="h-9 px-4 border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:border-primary transition-all text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
            >
              <span className="material-icons text-sm">filter_list</span>
              Filter
              {visibleLevels.size < 4 && (
                <span className="ml-1 bg-primary text-black text-[9px] font-bold px-1 rounded-sm">{visibleLevels.size}</span>
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-11 z-50 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-xl p-4 min-w-[160px]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-3">Show Periods</p>
                {(['YEAR', 'QUARTER', 'MONTH', 'WEEK'] as Goal['level'][]).map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer py-1 group">
                    <input
                      type="checkbox"
                      checked={visibleLevels.has(level)}
                      onChange={() => {
                        setVisibleLevels((prev) => {
                          const next = new Set(prev);
                          next.has(level) ? next.delete(level) : next.add(level);
                          return next;
                        });
                      }}
                      className="accent-primary w-3 h-3"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">
                      {level === 'YEAR' ? 'Yearly' : level === 'QUARTER' ? 'Quarterly' : level === 'MONTH' ? 'Monthly' : 'Weekly'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => handleNewGoal()}
            className="h-9 px-4 bg-primary text-black hover:bg-primary-dark transition-all hover:shadow-[0_0_12px_rgba(0,224,118,0.3)] text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
          >
            <span className="material-icons text-sm">add</span>
            New Goal
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border-light dark:border-border-dark mb-12 bg-surface-light dark:bg-surface-dark">
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark relative group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">
              Active Goals
            </span>
            <span className="material-icons text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors text-lg">
              flag
            </span>
          </div>
          <div className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
            {activeGoals}
          </div>
        </div>
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark relative group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">
              Completion Rate
            </span>
            <span className="material-icons text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors text-lg">
              analytics
            </span>
          </div>
          <div className="text-5xl font-bold text-primary">{completionRate}%</div>
        </div>
        <div className="p-6 md:p-8 relative group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">
              Day Streak
            </span>
            <span className="material-icons text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors text-lg">
              bolt
            </span>
          </div>
          <div className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
            {user?.currentStreak || 0}
          </div>
        </div>
      </div>

      {/* Yearly Goals Section */}
      {visibleLevels.has('YEAR') && <section className="mb-12">
        <div className="flex items-center justify-between mb-6 border-b border-border-light dark:border-border-dark pb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
            <span className="material-icons text-base">calendar_today</span>
            Yearly Goals
          </h2>
          <button
            onClick={() => handleNewGoal('YEAR')}
            className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {yearlyGoals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={idx + 1}
              onEdit={() => handleEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
          {yearlyGoals.length === 0 && (
            <div className="col-span-2 bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark p-8 text-center">
              <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                No yearly goals yet.{' '}
                <button
                  onClick={() => handleNewGoal('YEAR')}
                  className="text-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            </div>
          )}
        </div>
      </section>}

      {/* Quarterly Goals Section */}
      {visibleLevels.has('QUARTER') && <section className="mb-12">
        <div className="flex items-center justify-between mb-6 border-b border-border-light dark:border-border-dark pb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
            <span className="material-icons text-base">pie_chart</span>
            Quarterly Goals
          </h2>
          <button
            onClick={() => handleNewGoal('QUARTER')}
            className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quarterlyGoals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={idx + 1}
              onEdit={() => handleEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
          {quarterlyGoals.length === 0 && (
            <div className="col-span-2 bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark p-8 text-center">
              <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                No quarterly goals yet.{' '}
                <button
                  onClick={() => handleNewGoal('QUARTER')}
                  className="text-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            </div>
          )}
        </div>
      </section>}

      {/* Monthly Focus Section */}
      {visibleLevels.has('MONTH') && <section className="mb-12">
        <div className="flex items-center justify-between mb-6 border-b border-border-light dark:border-border-dark pb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
            <span className="material-icons text-base">schedule</span>
            Monthly Focus
          </h2>
          <button
            onClick={() => handleNewGoal('MONTH')}
            className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {monthlyGoals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={idx + 1}
              onEdit={() => handleEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
          {monthlyGoals.length === 0 && (
            <div className="col-span-2 bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark p-8 text-center">
              <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                No monthly goals yet.{' '}
                <button
                  onClick={() => handleNewGoal('MONTH')}
                  className="text-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            </div>
          )}
        </div>
      </section>}

      {/* Weekly Goals Section */}
      {visibleLevels.has('WEEK') && <section className="mb-12">
        <div className="flex items-center justify-between mb-6 border-b border-border-light dark:border-border-dark pb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
            <span className="material-icons text-base">view_week</span>
            Weekly Goals
          </h2>
          <button
            onClick={() => handleNewGoal('WEEK')}
            className="text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {weeklyGoals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={idx + 1}
              onEdit={() => handleEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
          {weeklyGoals.length === 0 && (
            <div className="col-span-2 bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark p-8 text-center">
              <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                No weekly goals yet.{' '}
                <button
                  onClick={() => handleNewGoal('WEEK')}
                  className="text-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            </div>
          )}
        </div>
      </section>}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark mb-4 uppercase tracking-wide">
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as Goal['level'],
                      })
                    }
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
                  onClick={() => {
                    setShowModal(false);
                    setEditingGoal(null);
                    setFormData({ title: '', description: '', level: 'MONTH', category: 'PERSONAL', targetValue: '', currentValue: '0', unit: '' });
                  }}
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
        </div >
      )}
    </div >
  );
};

// Goal Card Component
const GoalCard = ({
  goal,
  index,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const categoryLabels: { [key: string]: string } = {
    YEAR: 'Personal',
    QUARTER: 'Career',
    MONTH: 'Health',
    WEEK: 'Skill',
  };

  // Calculate progress
  let progressPercentage = 0;
  if (goal.targetValue) {
    progressPercentage = Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100));
  } else {
    // Fallback for task-based progress (if backend calculated it)
    // But we don't have that field in interface yet explicitly, although backend sends it. 
    // We can assume if no targetValue, we show 0 or handle task count if available.
    progressPercentage = 0;
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 hover:border-primary transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark">
            ID: {String(index).padStart(2, '0')}
          </span>
          <span className="inline-block bg-black text-white text-[10px] px-1.5 py-0.5 font-bold uppercase w-fit">
            {goal.category || categoryLabels[goal.level] || 'GENERAL'}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={onEdit}
            className="text-text-muted-light dark:text-text-muted-dark hover:text-primary p-1"
          >
            <span className="material-icons text-sm">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 p-1"
          >
            <span className="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 text-text-main-light dark:text-text-main-dark">
        {goal.title}
      </h3>
      {goal.description && (
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-8">
          {goal.description}
        </p>
      )}
      {/* Progress Display */}
      <div className="flex justify-between items-end text-[10px] font-bold mb-2 uppercase tracking-wider">
        <span className="text-text-muted-light dark:text-text-muted-dark">
          {goal.targetValue ? `${goal.currentValue || 0} / ${goal.targetValue} ${goal.unit || ''}` : 'Progress'}
        </span>
        <div>
          <span className="text-lg text-text-main-light dark:text-text-main-dark">{progressPercentage}</span>{' '}
          <span className="text-text-muted-light dark:text-text-muted-dark">/ 100%</span>
        </div>
      </div>
      <div className="w-full bg-border-light dark:bg-border-dark h-1.5 relative">
        <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      <div className="text-right mt-1 text-[10px] font-bold text-primary">{progressPercentage}%</div>
    </div>
  );
};
