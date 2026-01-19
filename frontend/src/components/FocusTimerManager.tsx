import { useEffect, useRef } from 'react';
import { useFocusStore } from '../store/useFocusStore';

export const FocusTimerManager = () => {
    const { isActive, tick, timeLeft, mode } = useFocusStore();
    const intervalRef = useRef<number | null>(null);

    // Timer Interval Logic
    useEffect(() => {
        if (isActive) {
            // Run immediately once to sync
            tick();
            intervalRef.current = window.setInterval(() => {
                tick();
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, tick]);

    // Document Title Logic
    useEffect(() => {
        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        if (isActive) {
            const modeLabel = mode === 'POMODORO' ? 'Focus' : 'Break';
            document.title = `${formatTime(timeLeft)} ${modeLabel}`;
        } else {
            document.title = 'BeProductive';
        }

        return () => {
            document.title = 'BePfixroductive';
        };
    }, [timeLeft, isActive, mode]);

    return null; // Headless component
};
