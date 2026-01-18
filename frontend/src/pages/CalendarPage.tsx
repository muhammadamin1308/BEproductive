import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View, SlotInfo } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import addDays from 'date-fns/addDays';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../lib/axios';

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

// Custom Event Component for styling
const EventComponent = ({ event }: { event: CalendarEvent }) => (
  <div className="h-full flex flex-col px-2 py-1 text-xs overflow-hidden">
    <span className="font-semibold text-white truncate">{event.title}</span>
    {event.start && event.end && (
      <span className="text-white/80 text-[10px]">
        {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
      </span>
    )}
  </div>
);

export const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
  });

  useEffect(() => {
    fetchTasks();
  }, [date, view]);

  const fetchTasks = async () => {
    try {
      // Calculate date range based on current view
      const startDate = startOfWeek(date);
      const endDate = addDays(startDate, 6);

      // For now, fetch tasks for each day in the week
      // In production, you'd want a backend endpoint that accepts date ranges
      const promises = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        promises.push(api.get(`/tasks?date=${dateStr}`));
      }

      const responses = await Promise.all(promises);
      const allTasks = responses.flatMap(r => r.data);

      // Map tasks to calendar events
      const mappedEvents = allTasks
        .filter((task: any) => task.startTime && task.endTime)
        .map((task: any) => {
          const [startHour, startMin] = task.startTime.split(':').map(Number);
          const [endHour, endMin] = task.endTime.split(':').map(Number);

          const taskDate = parse(task.date, 'yyyy-MM-dd', new Date());

          const startDate = new Date(taskDate);
          startDate.setHours(startHour, startMin, 0, 0);

          const endDate = new Date(taskDate);
          endDate.setHours(endHour, endMin, 0, 0);

          return {
            id: task.id,
            title: task.title,
            start: startDate,
            end: endDate,
            resource: task,
          };
        });

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
    }
  };

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const startTime = format(slotInfo.start, 'HH:mm');
    const endTime = format(slotInfo.end, 'HH:mm');
    const dateStr = format(slotInfo.start, 'yyyy-MM-dd');

    setFormData({
      title: '',
      date: dateStr,
      startTime,
      endTime,
    });
    setShowModal(true);
  }, []);

  const handleEventDrop = async ({ event, start, end }: any) => {
    // Optimistic update
    const updatedEvents = events.map(evt =>
      evt.id === event.id ? { ...evt, start, end } : evt
    );
    setEvents(updatedEvents);

    try {
      const startTime = format(start, 'HH:mm');
      const endTime = format(end, 'HH:mm');
      const dateStr = format(start, 'yyyy-MM-dd');

      await api.patch(`/tasks/${event.id}`, {
        startTime,
        endTime,
        date: dateStr,
      });
    } catch (error) {
      console.error('Failed to move event', error);
      fetchTasks(); // Revert on failure
    }
  };

  const handleEventResize = async ({ event, start, end }: any) => {
    // Optimistic update
    const updatedEvents = events.map(evt =>
      evt.id === event.id ? { ...evt, start, end } : evt
    );
    setEvents(updatedEvents);

    try {
      const startTime = format(start, 'HH:mm');
      const endTime = format(end, 'HH:mm');

      await api.patch(`/tasks/${event.id}`, {
        startTime,
        endTime,
      });
    } catch (error) {
      console.error('Failed to resize event', error);
      fetchTasks(); // Revert on failure
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...formData,
        pomodorosTotal: 1,
      });
      setShowModal(false);
      setFormData({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] p-4 max-w-7xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-text">Schedule</h1>
        <button
          onClick={() => {
            setFormData({
              title: '',
              date: format(new Date(), 'yyyy-MM-dd'),
              startTime: '09:00',
              endTime: '10:00',
            });
            setShowModal(true);
          }}
          className="bg-cta text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
        >
          + Add Event
        </button>
      </div>

      <div className="flex-1 bg-surface rounded-xl shadow-soft border border-slate-200 dark:border-white/10 overflow-hidden">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          resizable
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          components={{
            event: EventComponent,
          }}
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.DAY, Views.MONTH]}
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 6, 0, 0)}
          max={new Date(0, 0, 0, 23, 0, 0)}
          eventPropGetter={() => ({
            style: {
              backgroundColor: '#3b82f6',
              borderRadius: '6px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            },
          })}
        />
      </div>

      {/* Modal for creating new events */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-primary-text mb-4">New Event</h2>
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
                    className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-white/10 rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-white/10 rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-white/10 rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-white/10 rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-cta"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-primary-text hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cta text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom CSS to style react-big-calendar */}
      <style>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 16px 4px;
          font-weight: 600;
          color: var(--color-secondary-text);
          border-bottom: 2px solid var(--color-surface) !important;
          background: var(--color-background);
        }
        .rbc-today {
          background-color: rgba(59, 130, 246, 0.05);
        }
        .rbc-off-range-bg {
          background-color: var(--color-background);
          opacity: 0.5;
        }
        .rbc-time-content {
          border-top: 1px solid rgba(226, 232, 240, 0.3) !important;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid rgba(226, 232, 240, 0.2) !important;
          min-height: 60px;
        }
        .rbc-time-slot {
          border-top: 1px solid rgba(226, 232, 240, 0.1);
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid rgba(226, 232, 240, 0.1);
        }
        .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }
        .rbc-time-header-content {
          border-left: 1px solid rgba(226, 232, 240, 0.2);
        }
        .rbc-day-slot {
          background: var(--color-background);
        }
        .rbc-time-column {
          background: var(--color-surface);
        }
        .rbc-label {
          color: var(--color-secondary-text);
          font-size: 12px;
        }
        .rbc-event {
          padding: 2px 5px;
        }
        .rbc-event-label {
          font-size: 11px;
        }
        .rbc-toolbar {
          padding: 16px;
          background: var(--color-surface);
          border-radius: 12px 12px 0 0;
          margin-bottom: 0;
        }
        .rbc-toolbar button {
          color: var(--color-primary-text);
          border: 1px solid rgba(226, 232, 240, 0.3);
          padding: 8px 16px;
          border-radius: 8px;
          background: var(--color-background);
          font-weight: 500;
        }
        .rbc-toolbar button:hover {
          background: var(--color-surface);
        }
        .rbc-toolbar button.rbc-active {
          background: var(--color-cta);
          color: white;
          border-color: var(--color-cta);
        }
        .rbc-month-view, .rbc-time-view {
          border: none;
        }
        .dark .rbc-header {
          border-bottom: 2px solid rgba(255, 255, 255, 0.05) !important;
        }
        .dark .rbc-time-content {
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .dark .rbc-timeslot-group {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .dark .rbc-time-slot {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .dark .rbc-time-header-content {
          border-left: 1px solid rgba(255, 255, 255, 0.05);
        }
        .dark .rbc-toolbar button {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};
