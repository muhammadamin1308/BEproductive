

interface StatsCardProps {
    title: string;
    value: string | number;
    suffix?: string;
    icon?: string;
    trend?: {
        value: string;
        positive?: boolean;
    };
    progress?: {
        current: number;
        total: number;
    };
    variant?: 'default' | 'highlight';
}

export const StatsCard = ({
    title,
    value,
    suffix,
    icon,
    trend,
    progress,
    variant = 'default',
}: StatsCardProps) => {
    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 relative group hover:shadow-tech transition-all">
            {/* Icon */}
            {icon && (
                <div className="absolute top-4 right-4 text-text-muted-light dark:text-text-muted-dark">
                    <span className="material-icons">{icon}</span>
                </div>
            )}

            {/* Label */}
            <div className="text-xs uppercase text-text-muted-light dark:text-text-muted-dark mb-2 tracking-widest">
                {title}
            </div>

            {/* Value */}
            <div
                className={`text-5xl font-bold ${variant === 'highlight'
                    ? 'text-primary'
                    : 'text-text-main-light dark:text-text-main-dark'
                    }`}
            >
                {value}
                {suffix && (
                    <span className="text-xl text-text-muted-light dark:text-text-muted-dark font-normal">
                        {suffix}
                    </span>
                )}
            </div>

            {/* Trend */}
            {trend && (
                <div
                    className={`mt-4 flex gap-1 text-xs font-bold ${trend.positive !== false ? 'text-primary' : 'text-red-500'
                        }`}
                >
                    <span className="material-icons text-sm">
                        {trend.positive !== false ? 'trending_up' : 'trending_down'}
                    </span>
                    {trend.value}
                </div>
            )}

            {/* Progress Bar */}
            {progress && (
                <div className="mt-4">
                    <div className="w-full bg-background-light dark:bg-background-dark h-1">
                        <div
                            className="bg-primary h-1 transition-all"
                            style={{
                                width: `${Math.min((progress.current / progress.total) * 100, 100)}%`,
                            }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};
