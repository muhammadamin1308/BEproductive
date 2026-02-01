import { useState } from 'react';

interface TerminalInputProps {
    onSubmit: (data: {
        title: string;
        pomodoros: number;
        tags?: string;
    }) => void;
    isLoading?: boolean;
}

export const TerminalInput = ({ onSubmit, isLoading }: TerminalInputProps) => {
    const [title, setTitle] = useState('');
    const [pomodoros, setPomodoros] = useState(2);
    const [tags, setTags] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({ title, pomodoros, tags: tags || undefined });
        setTitle('');
        setTags('');
        setPomodoros(2);
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-tech p-1">
            {/* Terminal Header */}
            <div className="bg-background-light dark:bg-background-dark px-3 py-1 flex items-center justify-between border-b border-border-light dark:border-border-dark mb-1">
                <span className="text-xs font-bold uppercase text-text-muted-light dark:text-text-muted-dark">
                    Terminal Input
                </span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Main Input */}
                    <div className="flex items-start gap-2 text-lg">
                        <span className="text-primary font-bold mt-2">$</span>
                        <div className="w-full">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 p-2 font-mono text-text-main-light dark:text-text-main-dark placeholder-text-muted-light dark:placeholder-text-muted-dark text-lg outline-none"
                                placeholder="Enter new task directive..."
                            />
                            <div className="h-px bg-border-light dark:bg-border-dark w-full"></div>
                        </div>
                    </div>

                    {/* Options Row */}
                    <div className="pl-6 flex flex-wrap gap-4 items-center">
                        {/* Pomodoro Selector */}
                        <div className="flex flex-col gap-1 w-full md:w-auto">
                            <label className="text-[10px] uppercase font-bold text-text-muted-light dark:text-text-muted-dark">
                                Est. Pomodoros
                            </label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setPomodoros(num)}
                                        className={`w-8 h-8 flex items-center justify-center border text-sm font-bold transition-colors ${pomodoros === num
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-primary hover:text-white hover:border-primary'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags Input */}
                        <div className="flex flex-col gap-1 w-full md:w-auto flex-grow">
                            <label className="text-[10px] uppercase font-bold text-text-muted-light dark:text-text-muted-dark">
                                Tags (Optional)
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-3 py-1.5 text-sm font-mono focus:border-primary focus:ring-0 outline-none"
                                placeholder="--tag=development"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-end mt-4 md:mt-0">
                            <button
                                type="submit"
                                disabled={!title.trim() || isLoading}
                                className="bg-text-main-light dark:bg-white text-white dark:text-black px-6 py-2 text-sm font-bold uppercase hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Task
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
