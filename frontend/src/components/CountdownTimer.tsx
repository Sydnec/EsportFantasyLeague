import { useState, useEffect } from 'react';

export function CountdownTimer({ targetDate, onExpired }: { targetDate: string; onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        onExpired?.();
        return;
      }

      setIsUrgent(diff < 5 * 60 * 1000);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');

      setTimeLeft(
        days > 0
          ? `${days} jour${days > 1 ? 's' : ''}`
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpired]);

  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '0.85rem',
        fontWeight: 600,
        color: isExpired ? 'var(--danger)' : isUrgent ? 'var(--warning)' : 'var(--accent-primary)',
        animation: isUrgent && !isExpired ? 'pulse 1s ease-in-out infinite' : undefined,
      }}
    >
      {isExpired ? '⏰ ' : '⏱ '}{timeLeft}
    </span>
  );
}
