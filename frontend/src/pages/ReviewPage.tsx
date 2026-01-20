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
  }, [weekOffset, weekStartStr, weekEndStr]);

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
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-text mb-4">Weekly Review</h1>
        <div className="flex items-center justify-between bg-surface rounded-xl border border-gray-200 dark:border-white/10 p-3">
          <button
            onClick={fetchData}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-cta"
            title="Refresh"
          >
            ↻
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-primary-text"
            >
              ←
            </button>
            <span className="text-xs md:text-sm text-secondary-text px-2 whitespace-nowrap">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-primary-text"
            >
              →
            </button>
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-xs md:text-sm text-cta hover:bg-cta/10 rounded-lg transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </header>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 md:p-5 rounded-xl text-center border border-indigo-100 dark:border-indigo-900/50">
          <div className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
            {stats?.completedTasks || 0}
          </div>
          <div className="text-xs md:text-sm text-indigo-700 dark:text-indigo-300 font-medium">
            Tasks Done
          </div>
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 md:p-5 rounded-xl text-center border border-emerald-100 dark:border-emerald-900/50">
          <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            {stats?.completionRate || 0}%
          </div>
          <div className="text-xs md:text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Completion Rate
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 md:p-5 rounded-xl text-center border border-amber-100 dark:border-amber-900/50">
          <div className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
            {stats?.totalFocusHours || 0}h
          </div>
          <div className="text-xs md:text-sm text-amber-700 dark:text-amber-300 font-medium">
            Focus Time
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 md:p-5 rounded-xl text-center border border-purple-100 dark:border-purple-900/50">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {stats ? stats.totalSessions - stats.interruptedSessions : 0}
          </div>
          <div className="text-xs md:text-sm text-purple-700 dark:text-purple-300 font-medium">
            Focused Sessions
          </div>
        </div>
      </div>

      {/* Daily Progress Chart */}
      <div className="bg-surface rounded-xl border border-gray-200 dark:border-white/10 shadow-soft p-4 md:p-6 mb-6 md:mb-8">
        <h2 className="font-semibold text-primary-text mb-4 text-base md:text-lg">Daily Task Completion</h2>
        <div className="flex items-end justify-between gap-2 md:gap-3 h-48 md:h-56">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayStats = stats?.dailyStats[dateStr] || { completed: 0, total: 0 };
            const percentage = dayStats.total > 0 ? (dayStats.completed / dayStats.total) * 100 : 0;
            const height = percentage > 0 ? Math.max(percentage, 5) : 0;
            const isToday = dateStr === today;

            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="w-full bg-gray-100 dark:bg-white/5 rounded-t-lg relative overflow-hidden" style={{ height: '140px' }}>
                  {height > 0 && (
                    <div
                      className="absolute bottom-0 w-full bg-cta rounded-t-lg transition-all duration-300"
                      style={{ height: `${height}%` }}
                    />
                  )}
                </div>
                <div className="text-center w-full">
                  <div className={`text-xs font-medium whitespace-nowrap ${isToday ? 'text-cta' : 'text-primary-text'}`}>
                    {isToday ? (
                      <>
                        <span className="md:hidden">Today</span>
                        <span className="hidden md:inline">{format(day, 'EEE')} (today)</span>
                      </>
                    ) : (
                      format(day, 'EEE')
                    )}
                  </div>
                  <div className="text-xs text-secondary-text mt-0.5">
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
        <div className="bg-surface rounded-xl border border-gray-200 dark:border-white/10 shadow-soft p-6 mb-8">
          <h2 className="font-semibold text-primary-text mb-4">Focus Session Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-primary-text mb-1">
                {stats.totalSessions}
              </div>
              <div className="text-sm text-secondary-text">Total Sessions</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-primary-text mb-1">
                {Math.round((stats.totalFocusMinutes / stats.totalSessions) || 0)} min
              </div>
              <div className="text-sm text-secondary-text">Avg Session Length</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-primary-text mb-1">
                {stats.interruptedSessions}
              </div>
              <div className="text-sm text-secondary-text">Interruptions</div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Reflection */}
      <div className="bg-surface rounded-xl border border-gray-200 dark:border-white/10 shadow-soft p-6">
        <h2 className="font-semibold text-primary-text mb-4">Weekly Reflection</h2>
        <form onSubmit={handleSaveReflection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              What went well this week?
            </label>
            <textarea
              value={formData.wentWell}
              onChange={(e) => setFormData({ ...formData, wentWell: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/50 text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
              placeholder="I successfully completed..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Top 3 accomplishments
            </label>
            <textarea
              value={formData.accomplishments}
              onChange={(e) => setFormData({ ...formData, accomplishments: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/50 text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
              placeholder="1. &#10;2. &#10;3. "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              What could be improved?
            </label>
            <textarea
              value={formData.toImprove}
              onChange={(e) => setFormData({ ...formData, toImprove: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/50 text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
              placeholder="Next week I will..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Challenges faced
            </label>
            <textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/50 text-primary-text focus:ring-2 focus:ring-cta outline-none resize-none h-24 placeholder:text-secondary-text"
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
