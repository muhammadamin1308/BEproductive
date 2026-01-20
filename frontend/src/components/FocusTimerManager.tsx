import { useEffect, useRef } from 'react';
import { useFocusStore } from '../store/useFocusStore';

export const FocusTimerManager = () => {
    const { isActive, tick, timeLeft, mode } = useFocusStore();
    const intervalRef = useRef<number | null>(null);
    const prevTimeLeftRef = useRef(timeLeft);
    const prevModeRef = useRef(mode);
    const prevIsActiveRef = useRef(isActive);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize AudioContext
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Play start sound effect
    const playStartSound = () => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    };

    // Play completion sound effect
    const playCompletionSound = () => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    };

    // Speak announcement using Web Speech API
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Send browser notification
    const sendNotification = (title: string, body: string, icon?: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: icon || '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: 'pomodoro-timer',
                requireInteraction: false,
                silent: false,
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Focus window when notification clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    };

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

    // Play start sound when timer starts
    useEffect(() => {
        const prevIsActive = prevIsActiveRef.current;
        
        // Timer just started (inactive -> active)
        if (!prevIsActive && isActive && mode === 'POMODORO') {
            playStartSound();
        }

        prevIsActiveRef.current = isActive;
    }, [isActive, mode]);

    // Voice Notifications - Detect mode changes
    useEffect(() => {
        const prevMode = prevModeRef.current;
        const prevTimeLeft = prevTimeLeftRef.current;

        // Timer completed - mode changed
        if (prevMode !== mode && prevTimeLeft <= 1) {
            playCompletionSound();

            if (mode === 'SHORT_BREAK') {
                const message = 'Great work! Time for a short break.';
                speak(message);
                sendNotification('Pomodoro Complete!', message);
            } else if (mode === 'LONG_BREAK') {
                const message = 'Awesome! You earned a long break.';
                speak(message);
                sendNotification('Pomodoro Complete! 🏆', message);
            } else if (mode === 'POMODORO') {
                const message = 'Break is over. Time to focus!';
                speak(message);
                sendNotification('Break Complete', message);
            }
        }

        prevModeRef.current = mode;
        prevTimeLeftRef.current = timeLeft;
    }, [mode, timeLeft]);

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
            document.title = 'BeProductive';
        };
    }, [timeLeft, isActive, mode]);

    return null; // Headless component
};
