import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

interface DailyStats {
  [date: string]: { completed: number; total: number };
}

interface WeeklyStats {
  dailyStats: DailyStats;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalFocusMinutes: number;
  totalFocusHours: number;
  interruptedSessions: number;
  totalSessions: number;
}

interface Reflection {
  id: string;
  weekStartDate: string;
  wentWell: string | null;
  toImprove: string | null;
  accomplishments: string | null;
  challenges: string | null;
  createdAt: string;
}

export const ReviewPage = () => {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  
  const [formData, setFormData] = useState({
    wentWell: '',
    toImprove: '',
    accomplishments: '',
    challenges: '',
  });

  const currentDate = addDays(new Date(), weekOffset * 7);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();
  }, [weekOffset]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch weekly stats
      const statsRes = await api.get('/reflections/stats', {
        params: { startDate: weekStartStr, endDate: weekEndStr },
      });
      setStats(statsRes.data);

      // Fetch reflection for this week
      const reflectionRes = await api.get('/reflections', {
        params: { weekStartDate: weekStartStr },
      });
      
      if (reflectionRes.data) {
        setReflection(reflectionRes.data);
        setFormData({
          wentWell: reflectionRes.data.wentWell || '',
          toImprove: reflectionRes.data.toImprove || '',
          accomplishments: reflectionRes.data.accomplishments || '',
          challenges: reflectionRes.data.challenges || '',
        });
      } else {
        setReflection(null);
        setFormData({
          wentWell: '',
          toImprove: '',
          accomplishments: '',
          challenges: '',
        });
      }
    } catch (error) {
      console.error('Error fetching review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reflections', {
        weekStartDate: weekStartStr,
        ...formData,
      });
      alert('Reflection saved successfully!');
      fetchData();
    } catch (error) {
      console.error('Error saving reflection:', error);
      alert('Failed to save reflection');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-secondary-text">Loading review data...</div>
      </div>
    );
  }

  // Generate days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-text">Weekly Review</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-2 hover:bg-surface rounded-lg transition-colors text-primary-text"
          >
            ←
          </button>
          <span className="text-sm text-secondary-text min-w-[200px] text-center">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="p-2 hover:bg-surface rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-primary-text"
          >
            →
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-2 px-3 py-1 text-sm text-cta hover:opacity-80 transition-opacity"
            >
              Current Week
            </button>
          )}
        </div>
      </header>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
            {stats?.completedTasks || 0}
          </div>
          <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
            Tasks Done
          </div>
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-center">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            {stats?.completionRate || 0}%
          </div>
          <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Completion Rate
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center">
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
            {stats?.totalFocusHours || 0}h
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            Focus Time
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {stats ? stats.totalSessions - stats.interruptedSessions : 0}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">
            Focused Sessions
          </div>
        </div>
      </div>

      {/* Daily Progress Chart */}
      <div className="bg-surface rounded-xl border border-slate-200 dark:border-white/10 shadow-soft p-6 mb-8">
        <h2 className="font-semibold text-primary-text mb-4">Daily Task Completion</h2>
        <div className="flex items-end justify-between gap-2 h-48">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayStats = stats?.dailyStats[dateStr] || { completed: 0, total: 0 };
            const percentage = dayStats.total > 0 ? (dayStats.completed / dayStats.total) * 100 : 0;
            const height = percentage > 0 ? Math.max(percentage, 5) : 0;

            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-100 dark:bg-white/5 rounded-t-lg relative" style={{ height: '150px' }}>
                  {height > 0 && (
                    <div
                      className="absolute bottom-0 w-full bg-cta rounded-t-lg transition-all"
                      style={{ height: `${height}%` }}
                    />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-primary-text">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-xs text-secondary-text">
                    {dayStats.completed}/{dayStats.total}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus Session Analytics */}
      {stats && stats.totalSessions > 0 && (
        <div className="bg-surface rounded-xl border border-slate-200 dark:border-white/10 shadow-soft p-6 mb-8">
          <h2 className="font-semibold text-primary-text mb-4">Focus Session Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-primary-text mb-1">
                {stats.totalSessions}
              </div>
              <div className="text-sm text-secondary-text">Total Sessions</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-primary-text mb-1">
                {Math.round((stats.totalFocusMinutes / stats.totalSessions) || 0)} min
              </div>
              <div className="text-sm text-secondary-text">Avg Session Length</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-primary-text mb-1">
                {stats.interruptedSessions}
              </div>
              <div className="text-sm text-secondary-text">Interruptions</div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Reflection */}
      <div className="bg-surface rounded-xl border border-slate-200 dark:border-white/10 shadow-soft p-6">
        <h2 className="font-semibold text-primary-text mb-4">Weekly Reflection</h2>
        <form onSubmit={handleSaveReflection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              🎉 What went well this week?
            </label>
            <textarea
              value={formData.wentWell}
              onChange={(e) => setFormData({ ...formData, wentWell: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-background text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
              placeholder="I successfully completed..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              🎯 Top 3 accomplishments
            </label>
            <textarea
              value={formData.accomplishments}
              onChange={(e) => setFormData({ ...formData, accomplishments: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-background text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
              placeholder="1. &#10;2. &#10;3. "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              💪 What could be improved?
            </label>
            <textarea
              value={formData.toImprove}
              onChange={(e) => setFormData({ ...formData, toImprove: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-background text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
              placeholder="Next week I will..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              🚧 Challenges faced
            </label>
            <textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-background text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
              placeholder="I struggled with..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cta text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            {reflection ? 'Update Reflection' : 'Save Reflection'}
          </button>
        </form>
      </div>
    </div>
  );
};
