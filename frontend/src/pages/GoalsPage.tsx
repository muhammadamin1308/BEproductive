import { useState, useEffect } from 'react';
import { api } from '../lib/axios';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  level: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK';
  parentGoalId: string | null;
  createdAt: string;
}

export const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'MONTH' as Goal['level'],
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/goals');
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, formData);
      } else {
        await api.post('/goals', formData);
      }
      setShowModal(false);
      setEditingGoal(null);
      setFormData({ title: '', description: '', level: 'MONTH' });
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      level: goal.level,
    });
    setShowModal(true);
  };

  const handleNewGoal = (level?: Goal['level']) => {
    setEditingGoal(null);
    setFormData({ title: '', description: '', level: level || 'MONTH' });
    setShowModal(true);
  };

  const yearlyGoals = goals.filter((g) => g.level === 'YEAR');
  const monthlyGoals = goals.filter((g) => g.level === 'MONTH');
  const activeGoals = goals.length;
  const completionRate = 85; // Placeholder - would need backend support

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
        <div className="text-right text-[10px] leading-tight font-bold tracking-wider text-text-muted-light dark:text-text-muted-dark">
          <div className="mb-1">
            SYSTEM STATUS: <span className="text-primary">ONLINE</span>
          </div>
          <div>LAST SYNC: {new Date().toLocaleTimeString()}</div>
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
            5
          </div>
        </div>
      </div>

      {/* Yearly Goals Section */}
      <section className="mb-12">
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
      </section>

      {/* Monthly Focus Section */}
      <section className="mb-12">
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
      </section>

      {/* Create New Goal CTA */}
      <section
        onClick={() => handleNewGoal()}
        className="border border-dashed border-text-muted-light dark:border-text-muted-dark p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
      >
        <span className="material-icons text-3xl mb-4 text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors">
          add_task
        </span>
        <h3 className="text-lg font-bold uppercase tracking-[0.2em] mb-2 text-text-main-light dark:text-text-main-dark">
          Create A New Goal
        </h3>
        <p className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
          Define your next milestone
        </p>
      </section>

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
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingGoal(null);
                    setFormData({ title: '', description: '', level: 'MONTH' });
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
        </div>
      )}
    </div>
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

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 hover:border-primary transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark">
            ID: {String(index).padStart(2, '0')}
          </span>
          <span className="inline-block bg-text-main-light dark:bg-white text-white dark:text-black text-[10px] px-1.5 py-0.5 font-bold uppercase w-fit">
            {categoryLabels[goal.level]}
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
      {/* Placeholder progress - would need backend support */}
      <div className="flex justify-between items-end text-[10px] font-bold mb-2 uppercase tracking-wider">
        <span className="text-text-muted-light dark:text-text-muted-dark">Progress</span>
        <div>
          <span className="text-lg text-text-main-light dark:text-text-main-dark">0</span>{' '}
          <span className="text-text-muted-light dark:text-text-muted-dark">/ 100%</span>
        </div>
      </div>
      <div className="w-full bg-border-light dark:bg-border-dark h-1.5 relative">
        <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '0%' }}></div>
      </div>
      <div className="text-right mt-1 text-[10px] font-bold text-primary">0%</div>
    </div>
  );
};
