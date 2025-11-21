'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  duration?: number; // 倒计时总时长（毫秒），默认 3000
}

export default function Countdown({ duration = 3000 }: CountdownProps) {
  const [remaining, setRemaining] = useState(duration);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, duration - elapsed);
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(intervalId);
      }
    }, 16); // 约 60fps

    return () => clearInterval(intervalId);
  }, [duration, startTime]);

  const countdown = Math.ceil(remaining / 1000);
  const displayNumber = countdown > 0 ? countdown : 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-9xl font-bold text-white animate-pulse">
        {displayNumber}
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div className="text-sm text-gray-400">
          Remaining: {remaining.toFixed(0)}ms
        </div>
      )}
    </div>
  );
}


