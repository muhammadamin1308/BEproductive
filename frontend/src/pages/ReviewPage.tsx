import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Modal } from '../components/Modal';

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

const EMPTY_FORM = { wentWell: '', toImprove: '', accomplishments: '', challenges: '' };

export const ReviewPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const currentDate = addDays(new Date(), weekOffset * 7);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  useEffect(() => {
    fetchStats();
  }, [weekOffset, weekStartStr, weekEndStr]);

  useEffect(() => {
    fetchAllReflections();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/reflections/stats', {
        params: { startDate: weekStartStr, endDate: weekEndStr },
      });
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReflections = async () => {
    try {
      const res = await api.get('/reflections/all');
      setAllReflections(Array.isArray(res.data) ? res.data : []);
    } catch {
      // fallback: fetch current week only
      try {
        const res = await api.get('/reflections', { params: { weekStartDate: weekStartStr } });
        if (res.data) setAllReflections([res.data]);
      } catch { /* silent */ }
    }
  };

  const openNewModal = () => {
    setEditingReflection(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (r: Reflection) => {
    setEditingReflection(r);
    setFormData({
      wentWell: r.wentWell || '',
      toImprove: r.toImprove || '',
      accomplishments: r.accomplishments || '',
      challenges: r.challenges || '',
    });
    setShowModal(true);
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reflections', {
        weekStartDate: editingReflection?.weekStartDate ?? weekStartStr,
        ...formData,
      });
      showToast(editingReflection ? 'Reflection updated' : 'Reflection saved');
      setShowModal(false);
      fetchAllReflections();
    } catch (error) {
      console.error('Error saving reflection:', error);
      showToast('Failed to save reflection');
    }
  };

  if (loading && allReflections.length === 0) {
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
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
            <button
              onClick={fetchStats}
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
          <button
            onClick={openNewModal}
            className="h-9 px-4 bg-primary text-black hover:bg-primary-dark transition-all hover:shadow-[0_0_12px_rgba(0,224,118,0.3)] text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
          >
            <span className="material-icons text-sm">edit_note</span>
            New Reflection
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
            const percentage = dayStats.total > 0 ? (dayStats.completed / dayStats.total) * 100 : 0;
            const height = percentage > 0 ? Math.max(percentage, 5) : 0;
            const isToday = dateStr === today;
            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div
                  className="w-full max-w-[60px] bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark h-full relative flex items-end"
                  style={{ height: '140px' }}
                >
                  {height > 0 && (
                    <div
                      className={`w-full transition-all ${isToday ? 'bg-primary opacity-80 group-hover:opacity-100' : 'bg-text-muted-light dark:bg-text-muted-dark opacity-20 group-hover:opacity-40'}`}
                      style={{ height: `${height}%` }}
                    />
                  )}
                  <div className={`absolute -top-6 w-full text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity ${isToday ? 'font-bold text-primary' : ''}`}>
                    {Math.round(percentage)}%
                  </div>
                </div>
                <span className={`text-[10px] md:text-xs uppercase font-bold ${isToday ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                  {format(day, 'EEE')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reflection Logs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6 border-b border-border-light dark:border-border-dark pb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
            <span className="material-icons text-base">edit_note</span>
            Reflection Logs
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark font-bold">
            {allReflections.length} {allReflections.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {allReflections.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-icons text-3xl text-text-muted-light/30 dark:text-text-muted-dark/30 mb-3 block">edit_off</span>
            <p className="text-text-muted-light dark:text-text-muted-dark text-xs uppercase tracking-widest mb-4">
              No reflections yet
            </p>
            <button
              onClick={openNewModal}
              className="h-9 px-4 border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
            >
              <span className="material-icons text-sm">add</span>
              Write your first reflection
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {allReflections.map((r) => {
              const isExpanded = expandedId === r.id;
              const wStart = new Date(r.weekStartDate);
              const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
              return (
                <div
                  key={r.id}
                  className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary transition-colors"
                >
                  {/* Card header — always visible */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-icons text-primary text-base">edit_note</span>
                      <div>
                        <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-wide">
                          Week of {format(wStart, 'MMM dd')} – {format(wEnd, 'MMM dd, yyyy')}
                        </p>
                        <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mt-0.5">
                          Saved {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(r); }}
                        className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors p-1"
                        title="Edit"
                      >
                        <span className="material-icons text-sm">edit</span>
                      </button>
                      <span className={`material-icons text-sm text-text-muted-light dark:text-text-muted-dark transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="border-t border-border-light dark:border-border-dark px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { label: 'What went well', value: r.wentWell, icon: 'thumb_up' },
                        { label: 'Top accomplishments', value: r.accomplishments, icon: 'emoji_events' },
                        { label: 'What to improve', value: r.toImprove, icon: 'trending_up' },
                        { label: 'Challenges faced', value: r.challenges, icon: 'report_problem' },
                      ].map(({ label, value, icon }) => (
                        <div key={label}>
                          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark">
                            <span className="material-icons text-[14px]">{icon}</span>
                            {label}
                          </div>
                          <p className="text-sm text-text-main-light dark:text-text-main-dark font-mono whitespace-pre-wrap leading-relaxed">
                            {value?.trim() || <span className="text-text-muted-light/50 dark:text-text-muted-dark/50 italic">—</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reflection Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingReflection ? 'Edit Reflection' : 'New Reflection'}
      >
        <form onSubmit={handleSaveReflection} className="space-y-5">
          {[
            { key: 'wentWell', label: 'What went well this week?', placeholder: 'I successfully completed...' },
            { key: 'accomplishments', label: 'Top 3 Accomplishments', placeholder: '1.\n2.\n3.' },
            { key: 'toImprove', label: 'What could be improved?', placeholder: 'Next week I will...' },
            { key: 'challenges', label: 'Challenges Faced', placeholder: 'I struggled with...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1.5">
                {label}
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-primary select-none pointer-events-none font-bold text-sm">{'>'}</div>
                <textarea
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  rows={3}
                  placeholder={placeholder}
                  className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-3 pl-8 text-sm font-mono focus:border-primary focus:ring-0 focus:outline-none text-text-main-light dark:text-text-main-dark resize-none"
                />
              </div>
            </div>
          ))}
          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="h-9 px-4 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 bg-primary text-black hover:bg-primary-dark transition-all text-[10px] font-bold uppercase tracking-widest"
            >
              {editingReflection ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

