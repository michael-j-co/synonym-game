import { useCallback, useEffect, useRef, useState } from 'react';

type CountdownConfig = {
  durationMs: number;
  onExpired?: () => void;
  tickMs?: number;
};

export function useCountdown({
  durationMs,
  onExpired,
  tickMs = 100,
}: CountdownConfig) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setRemainingMs(durationMs);
    setIsActive(false);
  }, [clearTimer, durationMs]);

  const stop = useCallback(() => {
    clearTimer();
    setIsActive(false);
  }, [clearTimer]);

  const start = useCallback(() => {
    if (timerRef.current !== null) {
      return;
    }
    setIsActive(true);
    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      setRemainingMs((prev) => {
        const elapsed = Date.now() - startedAt;
        const next = Math.max(durationMs - elapsed, 0);
        if (next === 0) {
          stop();
          onExpired?.();
        }
        return next;
      });
    }, tickMs);
  }, [durationMs, onExpired, stop, tickMs]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    remainingMs,
    isActive,
    start,
    stop,
    reset,
  };
}
