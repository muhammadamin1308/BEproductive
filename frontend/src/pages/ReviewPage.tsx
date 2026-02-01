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
      alert('Reflection saved successfully!');
      fetchData();
    } catch (error) {
      console.error('Error saving reflection:', error);
      alert('Failed to save reflection');
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
    <div className="p-6 md:p-12 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold uppercase mb-4 tracking-tighter text-text-main-light dark:text-text-main-dark">
          Weekly Review
        </h1>
        <div className="flex items-center justify-between bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-3 shadow-sm">
          <button
            onClick={fetchData}
            className="hover:text-primary transition-colors text-text-muted-light dark:text-text-muted-dark"
          >
            <span className="material-icons">refresh</span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="hover:text-primary transition-colors text-text-main-light dark:text-text-main-dark"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <span className="font-bold text-sm md:text-base tracking-widest uppercase text-text-main-light dark:text-text-main-dark">
              {format(weekStart, 'MMM dd').toUpperCase()} - {format(weekEnd, 'MMM dd, yyyy').toUpperCase()}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
              className="hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-text-main-light dark:text-text-main-dark"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 relative group hover:shadow-tech transition-all">
          <div className="absolute top-4 right-4 text-text-muted-light dark:text-text-muted-dark opacity-50">
            <span className="material-icons">check_circle</span>
          </div>
          <div className="text-xs uppercase text-text-muted-light dark:text-text-muted-dark mb-1 tracking-widest">
            Tasks Done
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
              {stats?.completedTasks || 0}
            </span>
            <span className="text-sm text-primary font-bold">TARGET MET</span>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 relative group hover:shadow-tech transition-all">
          <div className="absolute top-4 right-4 text-text-muted-light dark:text-text-muted-dark opacity-50">
            <span className="material-icons">pie_chart</span>
          </div>
          <div className="text-xs uppercase text-text-muted-light dark:text-text-muted-dark mb-1 tracking-widest">
            Completion Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
              {stats?.completionRate || 0}%
            </span>
            <span className="text-sm text-primary font-bold">+5%</span>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 relative group hover:shadow-tech transition-all">
          <div className="absolute top-4 right-4 text-text-muted-light dark:text-text-muted-dark opacity-50">
            <span className="material-icons">timelapse</span>
          </div>
          <div className="text-xs uppercase text-text-muted-light dark:text-text-muted-dark mb-1 tracking-widest">
            Focus Time
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
              {stats?.totalFocusHours || 0}
              <span className="text-2xl">h</span>
            </span>
            <span className="text-sm text-primary font-bold">OPTIMAL</span>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 relative group hover:shadow-tech transition-all">
          <div className="absolute top-4 right-4 text-text-muted-light dark:text-text-muted-dark opacity-50">
            <span className="material-icons">psychology</span>
          </div>
          <div className="text-xs uppercase text-text-muted-light dark:text-text-muted-dark mb-1 tracking-widest">
            Focused Sessions
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-text-main-light dark:text-text-main-dark">
              {focusedSessions}
            </span>
            <span className="text-sm text-text-muted-light dark:text-text-muted-dark font-mono">
              /50 GOAL
            </span>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 mb-8 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
          <span className="w-2 h-2 bg-primary inline-block"></span>
          Daily Activity
        </h3>
        <div className="flex items-end justify-between h-40 gap-2 md:gap-4">
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
                  className="w-full max-w-[40px] bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark h-full relative flex items-end"
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
        <h2 className="text-xl font-bold uppercase flex items-center gap-2 mb-6 border-b border-border-light dark:border-border-dark pb-2 text-text-main-light dark:text-text-main-dark">
          <span className="material-icons text-primary text-sm">edit_note</span>
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
        className="w-full bg-primary hover:bg-primary-dark text-black font-bold uppercase py-4 border border-black/10 shadow-tech transition-all flex items-center justify-center gap-2 group"
      >
        <span className="material-icons group-hover:rotate-180 transition-transform">save</span>
        Save Weekly Log
      </button>
    </div>
  );
};
