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
  const [selectedLevel, setSelectedLevel] = useState<Goal['level']>('MONTH');
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

  const handleNewGoal = () => {
    setEditingGoal(null);
    setFormData({ title: '', description: '', level: selectedLevel });
    setShowModal(true);
  };

  const levelLabels = {
    YEAR: 'Yearly',
    QUARTER: 'Quarterly',
    MONTH: 'Monthly',
    WEEK: 'Weekly',
  };

  const filteredGoals = goals.filter(g => g.level === selectedLevel);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center text-secondary-text">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-text">My Goals</h1>
        <button 
          onClick={handleNewGoal}
          className="text-cta font-medium text-sm hover:opacity-80 transition-opacity"
        >
          + New Goal
        </button>
      </header>

      {/* Dropdown to select level */}
      <div className="mb-6">
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value as Goal['level'])}
          className="w-full px-4 py-3.5 bg-surface border-2 border-gray-200 dark:border-white/10 rounded-xl text-primary-text text-base font-semibold shadow-soft hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cta focus:border-cta transition-all appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%2364748b' d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem'
          }}
        >
          <option value="YEAR">Yearly Goals</option>
          <option value="QUARTER">Quarterly Goals</option>
          <option value="MONTH">Monthly Goals</option>
          <option value="WEEK">Weekly Goals</option>
        </select>
      </div>

      {/* Display goals for selected level */}
      <div className="space-y-3">
        {filteredGoals.length > 0 ? (
          filteredGoals.map((goal) => (
            <div 
              key={goal.id}
              className="bg-surface p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-soft hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="font-semibold text-primary-text text-lg">
                    {goal.title}
                  </h2>
                  {goal.description && (
                    <p className="text-sm text-secondary-text mt-2">{goal.description}</p>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="text-xs text-cta hover:underline font-medium px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-xs text-red-500 hover:underline font-medium px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-secondary-text mb-4">No {levelLabels[selectedLevel].toLowerCase()} goals yet</p>
            <button
              onClick={handleNewGoal}
              className="text-cta hover:opacity-80 transition-opacity"
            >
              Create your first {levelLabels[selectedLevel].toLowerCase()} goal
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-primary-text mb-4">
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-gray-200 dark:border-white/10 rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-gray-200 dark:border-white/10 rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as Goal['level'] })}
                    className="w-full px-3 py-2 bg-background border border-gray-200 dark:border-white/10 rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
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
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-primary-text hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cta text-white rounded-lg hover:opacity-90 transition-opacity"
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
