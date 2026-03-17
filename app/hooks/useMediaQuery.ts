'use client';

import { useState, useEffect } from 'react';

/**
 * Tailwind md 斷點 768px。用於判斷是否為 md 以上螢幕。
 */
export const MD_BREAKPOINT = 768;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** 是否為 md (768px) 以上螢幕 */
export function useIsMdOrLarger(): boolean {
  return useMediaQuery(`(min-width: ${MD_BREAKPOINT}px)`);
}
