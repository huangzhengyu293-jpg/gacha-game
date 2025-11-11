import { useRef, useEffect } from 'react';

export function useSlotMachineAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/tick.mp3");
      audioRef.current.volume = 0.65;
      audioRef.current.preload = "auto";
      
      winAudioRef.current = new Audio("/basic_win.mp3");
      winAudioRef.current.volume = 0.5;
      winAudioRef.current.preload = "auto";
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (winAudioRef.current) {
        winAudioRef.current.pause();
        winAudioRef.current = null;
      }
    };
  }, []);

  const playTickSound = () => {
    if (audioRef.current) {
      try {
        const tickAudio = new Audio("/tick.mp3");
        tickAudio.volume = 0.65;
        tickAudio.play().catch(() => {
          // 忽略播放错误（可能是用户未交互）
        });
      } catch {
        // 忽略错误
      }
    }
  };

  const playWinSound = (duration: number) => {
    if (winAudioRef.current) {
      try {
        winAudioRef.current.currentTime = 0;
        const audioDuration = winAudioRef.current.duration;
        if (audioDuration > duration) {
          setTimeout(() => {
            if (winAudioRef.current) {
              winAudioRef.current.pause();
              winAudioRef.current.currentTime = 0;
            }
          }, duration * 1000);
        }
        winAudioRef.current.play().catch(() => {
          // 忽略播放错误
        });
      } catch {
        // 忽略错误
      }
    }
  };

  const stopWinSound = () => {
    if (winAudioRef.current) {
      try {
        winAudioRef.current.pause();
        winAudioRef.current.currentTime = 0;
      } catch {
        // 忽略错误
      }
    }
  };

  return {
    playTickSound,
    playWinSound,
    stopWinSound,
  };
}

