"use client";

import { useCallback, useEffect } from "react";

export function useWinSound() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initWinAudio = async () => {
      if (!(window as any).__audioContext) {
        (window as any).__audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (!(window as any).__winAudioBuffer) {
        try {
          const response = await fetch('/win.wav');
          const arrayBuffer = await response.arrayBuffer();
          const ctx = (window as any).__audioContext;
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          (window as any).__winAudioBuffer = audioBuffer;
        } catch {
          // ignore load errors; celebration can fallback silently
        }
      }
    };

    initWinAudio();
  }, []);

  return useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const ctx = (window as any).__audioContext;
    const buffer = (window as any).__winAudioBuffer;
    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  }, []);
}

