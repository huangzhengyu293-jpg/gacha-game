import { useEffect, useState, type RefObject } from 'react';

type Breakpoints = {
  base: number;
  sm: number;
  md: number;
  lg: number;
};

const DEFAULT_BREAKPOINTS: Breakpoints = {
  base: 2,
  sm: 3,
  md: 4,
  lg: 5,
};

function getColumnCount(width: number, bp: Breakpoints) {
  // Tailwind 預設斷點：sm=640, md=768, lg=1024
  if (width >= 1024) return bp.lg;
  if (width >= 768) return bp.md;
  if (width >= 640) return bp.sm;
  return bp.base;
}

export function useResponsiveGridColumns<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  breakpoints: Partial<Breakpoints> = {},
) {
  const bp: Breakpoints = { ...DEFAULT_BREAKPOINTS, ...breakpoints };
  const [columns, setColumns] = useState<number>(bp.base);

  useEffect(() => {
    const apply = () => {
      // 以 Tailwind 斷點的「視窗寬度」為主，避免彈窗/滾動容器寬度量測異常導致欄數一直卡在 2
      const width =
        typeof window !== 'undefined'
          ? window.innerWidth
          : containerRef.current?.getBoundingClientRect().width ?? 0;
      setColumns((prev) => {
        const next = getColumnCount(width, bp);
        return prev === next ? prev : next;
      });
    };

    apply();

    if (typeof window === 'undefined') return;

    const onResize = () => apply();
    window.addEventListener('resize', onResize);

    const el = containerRef.current;
    if (typeof ResizeObserver === 'undefined' || !el) {
      return () => window.removeEventListener('resize', onResize);
    }

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [containerRef, bp.base, bp.sm, bp.md, bp.lg]);

  return columns;
}


