export const CalendarPage = () => {
    return (
        <div className="max-w-md mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-primary-text mb-6">Calendar</h1>

            <div className="bg-surface rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden mb-6">
                <div className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <span className="font-semibold text-primary-text">January 2024</span>
                    <div className="flex gap-2">
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-secondary-text">←</button>
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-secondary-text">→</button>
                    </div>
                </div>
                <div className="p-4 text-center text-secondary-text py-12">
                    Calendar View Placeholder
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="font-semibold text-primary-text">Upcoming</h2>
                <div className="bg-surface p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm flex gap-4">
                    <div className="text-center w-12">
                        <div className="text-xs text-secondary-text uppercase">Mon</div>
                        <div className="font-bold text-primary-text">18</div>
                    </div>
                    <div>
                        <h3 className="font-medium text-primary-text">Review Weekly Progress</h3>
                        <p className="text-sm text-secondary-text">10:00 AM</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
