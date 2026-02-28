import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

interface DailyStats {
  [date: string]: { completed: number; total: number };
}

interface WeeklyStats {
  dailyStats: DailyStats;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  efficiency: number;
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
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [_reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const [formData, setFormData] = useState({
    wentWell: '',
    toImprove: '',
    accomplishments: '',
    challenges: '',
  });

  const currentDate = addDays(new Date(), weekOffset * 7);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();
  }, [weekOffset, weekStartStr, weekEndStr]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const statsRes = await api.get('/reflections/stats', {
        params: { startDate: weekStartStr, endDate: weekEndStr },
      });
      setStats(statsRes.data);

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
      showToast('Reflection saved successfully');
      fetchData();
    } catch (error) {
      console.error('Error saving reflection:', error);
      showToast('Failed to save reflection');
    }
  };

  if (loading) {
    return (
      <div className="p-12 max-w-5xl mx-auto">
        <div className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
          <span className="text-primary">{'>'}</span>
          LOADING_REVIEW_DATA...
        </div>
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = format(new Date(), 'yyyy-MM-dd');
  const focusedSessions = stats ? stats.totalSessions - stats.interruptedSessions : 0;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold uppercase mb-2 tracking-tighter text-text-main-light dark:text-text-main-dark">
            Weekly Review
          </h1>
          <p className="text-text-muted-light dark:text-text-muted-dark text-sm flex items-center">
            <span className="mr-2 text-primary">{'>'}</span>
            Reflect, analyze, and improve.
          </p>
        </div>
        <div className="flex items-center border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <button
            onClick={fetchData}
            className="h-9 px-3 border-r border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
          >
            <span className="material-icons text-base">refresh</span>
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="h-9 px-3 border-r border-border-light dark:border-border-dark hover:text-primary transition-colors text-text-main-light dark:text-text-main-dark"
          >
            <span className="material-icons text-base">chevron_left</span>
          </button>
          <span className="h-9 px-4 font-bold text-[10px] tracking-widest uppercase text-text-main-light dark:text-text-main-dark inline-flex items-center">
            {format(weekStart, 'MMM dd').toUpperCase()} – {format(weekEnd, 'MMM dd, yyyy').toUpperCase()}
          </span>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="h-9 px-3 border-l border-border-light dark:border-border-dark hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-text-main-light dark:text-text-main-dark"
          >
            <span className="material-icons text-base">chevron_right</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border-light dark:border-border-dark mb-12 bg-surface-light dark:bg-surface-dark">
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark relative group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">Tasks Done</span>
            <span className="material-icons text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors text-lg">check_circle</span>
          </div>
          <div className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">{stats?.completedTasks || 0}</div>
        </div>

        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark relative group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">Efficiency</span>
            <span className="material-icons text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors text-lg">pie_chart</span>
          </div>
          <div className="text-5xl font-bold text-primary">{stats?.efficiency || 0}%</div>
        </div>

        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark relative group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">Focus Time</span>
            <span className="material-icons text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors text-lg">timelapse</span>
          </div>
          <div className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
            {stats?.totalFocusHours || 0}<span className="text-2xl">h</span>
          </div>
        </div>

        <div className="p-6 md:p-8 relative group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">Focused Sessions</span>
            <span className="material-icons text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors text-lg">psychology</span>
          </div>
          <div className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
            {focusedSessions}
            <span className="text-sm text-text-muted-light dark:text-text-muted-dark font-bold ml-1">/ {user?.weeklySessionGoal || 50}</span>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 mb-8">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-text-main-light dark:text-text-main-dark border-b border-border-light dark:border-border-dark pb-2">
          <span className="material-icons text-base">bar_chart</span>
          Daily Activity
        </h3>
        <div className="flex items-end justify-between h-52 gap-2 md:gap-4">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayStats = stats?.dailyStats[dateStr] || { completed: 0, total: 0 };
            const percentage =
              dayStats.total > 0 ? (dayStats.completed / dayStats.total) * 100 : 0;
            const height = percentage > 0 ? Math.max(percentage, 5) : 0;
            const isToday = dateStr === today;

            return (
              <div
                key={dateStr}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div
                  className="w-full max-w-[60px] bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark h-full relative flex items-end"
                  style={{ height: '140px' }}
                >
                  {height > 0 && (
                    <div
                      className={`w-full transition-all ${isToday
                        ? 'bg-primary opacity-80 group-hover:opacity-100'
                        : 'bg-text-muted-light dark:bg-text-muted-dark opacity-20 group-hover:opacity-40'
                        }`}
                      style={{ height: `${height}%` }}
                    ></div>
                  )}
                  <div
                    className={`absolute -top-6 w-full text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity ${isToday ? 'font-bold text-primary' : ''
                      }`}
                  >
                    {Math.round(percentage)}%
                  </div>
                </div>
                <span
                  className={`text-[10px] md:text-xs uppercase font-bold ${isToday
                    ? 'text-primary'
                    : 'text-text-muted-light dark:text-text-muted-dark'
                    }`}
                >
                  {format(day, 'EEE')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Reflection */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-border-light dark:border-border-dark pb-2 text-text-main-light dark:text-text-main-dark">
          <span className="material-icons text-base">edit_note</span>
          Weekly Reflection
        </h2>
        <form onSubmit={handleSaveReflection} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-text-main-light dark:text-text-main-dark mb-2">
              What went well this week?
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-primary select-none pointer-events-none font-bold">
                {'>'}
              </div>
              <textarea
                value={formData.wentWell}
                onChange={(e) => setFormData({ ...formData, wentWell: e.target.value })}
                className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-3 pl-8 text-sm font-mono focus:border-primary focus:ring-0 focus:outline-none min-h-[100px] text-text-main-light dark:text-text-main-dark placeholder-text-muted-light resize-none"
                placeholder="I successfully completed..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-text-main-light dark:text-text-main-dark mb-2">
              Top 3 Accomplishments
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-text-muted-light select-none pointer-events-none font-bold text-xs leading-relaxed">
                1.<br />2.<br />3.
              </div>
              <textarea
                value={formData.accomplishments}
                onChange={(e) =>
                  setFormData({ ...formData, accomplishments: e.target.value })
                }
                className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-3 pl-8 text-sm font-mono focus:border-primary focus:ring-0 focus:outline-none min-h-[100px] leading-relaxed text-text-main-light dark:text-text-main-dark resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-text-main-light dark:text-text-main-dark mb-2">
              What could be improved?
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-primary select-none pointer-events-none font-bold">
                {'>'}
              </div>
              <textarea
                value={formData.toImprove}
                onChange={(e) => setFormData({ ...formData, toImprove: e.target.value })}
                className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-3 pl-8 text-sm font-mono focus:border-primary focus:ring-0 focus:outline-none min-h-[100px] text-text-main-light dark:text-text-main-dark placeholder-text-muted-light resize-none"
                placeholder="Next week I will..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-text-main-light dark:text-text-main-dark mb-2">
              Challenges Faced
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-primary select-none pointer-events-none font-bold">
                {'>'}
              </div>
              <textarea
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-3 pl-8 text-sm font-mono focus:border-primary focus:ring-0 focus:outline-none min-h-[100px] text-text-main-light dark:text-text-main-dark placeholder-text-muted-light resize-none"
                placeholder="I struggled with..."
              />
            </div>
          </div>
        </form>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveReflection}
        className="w-full h-11 bg-primary hover:bg-primary-dark text-black font-bold uppercase text-[10px] tracking-widest transition-all hover:shadow-[0_0_12px_rgba(0,224,118,0.3)] flex items-center justify-center gap-2"
      >
        <span className="material-icons text-sm">save</span>
        Save Weekly Log
      </button>
    </div>
  );
};
