"use client";

import { useCallback, useEffect } from "react";

type GlobalAudioWindow = Window &
  typeof globalThis & {
    __audioContext?: AudioContext;
    __tickAudioBuffer?: AudioBuffer;
    __basicWinAudioBuffer?: AudioBuffer;
    __specialWinAudioBuffer?: AudioBuffer;
  };

async function ensureAudioContext(win: GlobalAudioWindow) {
  if (!win.__audioContext) {
    win.__audioContext = new (win.AudioContext || (win as any).webkitAudioContext)();
  }
  return win.__audioContext!;
}

async function loadBuffer(win: GlobalAudioWindow, key: keyof GlobalAudioWindow, url: string) {
  const ctx = await ensureAudioContext(win);
  if (win[key]) return;
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    win[key] = audioBuffer as any;
  } catch {
    // ignore load errors
  }
}

export function useBattleAudio() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as GlobalAudioWindow;
    loadBuffer(win, '__tickAudioBuffer', '/tick.mp3');
    loadBuffer(win, '__basicWinAudioBuffer', '/basic_win.mp3');
    loadBuffer(win, '__specialWinAudioBuffer', '/special_win.mp3');
  }, []);

  const playBuffer = useCallback((bufferKey: keyof GlobalAudioWindow) => {
    if (typeof window === 'undefined') return;
    const win = window as GlobalAudioWindow;
    const ctx = win.__audioContext;
    const buffer = win[bufferKey] as AudioBuffer | undefined;
    if (!ctx || !buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }, []);

  const playTickSound = useCallback(() => playBuffer('__tickAudioBuffer'), [playBuffer]);
  const playBasicWinSound = useCallback(() => playBuffer('__basicWinAudioBuffer'), [playBuffer]);
  const playSpecialWinSound = useCallback(() => playBuffer('__specialWinAudioBuffer'), [playBuffer]);

  return {
    playTickSound,
    playBasicWinSound,
    playSpecialWinSound,
  };
}

