export const GoalsPage = () => {
    return (
        <div className="max-w-md mx-auto px-4 py-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-primary-text">My Goals</h1>
                <button className="text-cta font-medium text-sm hover:opacity-80 transition-opacity">+ New Goal</button>
            </header>

            <div className="space-y-6">
                {['Yearly', 'Quarterly', 'Monthly'].map((period) => (
                    <section key={period}>
                        <h2 className="text-xs font-bold text-secondary-text uppercase tracking-widest mb-3">{period}</h2>
                        <div className="space-y-3">
                            <div className="bg-surface p-5 rounded-xl border border-slate-100 dark:border-white/5 shadow-soft hover:shadow-md transition-all cursor-pointer group">
                                <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full mb-4 overflow-hidden">
                                    <div className="h-full bg-cta w-1/3 rounded-full" />
                                </div>
                                <h3 className="font-semibold text-primary-text group-hover:text-cta transition-colors">Launch MVP</h3>
                                <p className="text-sm text-secondary-text mt-1">33% completed</p>
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};
