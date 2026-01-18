export const ReviewPage = () => {
    return (
        <div className="max-w-md mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-primary-text mb-6">Review</h1>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">12</div>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Tasks Done</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">85%</div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Focus Score</div>
                </div>
            </div>

            <h2 className="font-semibold text-primary-text mb-4">Daily Reflection</h2>
            <div className="bg-surface p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">What went well today?</label>
                    <textarea
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-primary-text focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 placeholder:text-secondary-text"
                        placeholder="I focused on..."
                    />
                </div>
                <button className="w-full py-2.5 bg-primary-text text-surface font-medium rounded-lg hover:opacity-90 transition-opacity">
                    Save Review
                </button>
            </div>
        </div>
    );
};
