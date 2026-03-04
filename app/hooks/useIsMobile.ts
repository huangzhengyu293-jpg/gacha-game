'use client';

import { useState, useEffect } from 'react';

/**
 * 手机端宽度上限（px）。仅宽度 < 此值视为「手机端」。
 * 使用 640 的目的：平板（竖屏约 768、横屏约 1024）不会被算成手机端，
 * 横屏平板会采用桌面 UI。
 */
export const MOBILE_MAX_WIDTH = 640;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_MAX_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}
