'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  content: string;
  trigger?: ReactNode;
  buttonClassName?: string;
  tooltipClassName?: string;
  showArrow?: boolean;
  usePortal?: boolean;
  sideOffsetPx?: number;
}

export default function InfoTooltip({
  content,
  trigger,
  buttonClassName,
  tooltipClassName,
  showArrow = true,
  usePortal = false,
  sideOffsetPx = 8,
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [portalPos, setPortalPos] = useState<{ left: number; top: number } | null>(null);

  const safeContent = useMemo(() => (typeof content === 'string' ? content : ''), [content]);

  useEffect(() => {
    if (!usePortal) return;
    if (!isVisible) return;
    if (typeof window === 'undefined') return;
    if (!btnRef.current) return;

    const compute = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      const baseLeft = rect.left + rect.width / 2;
      const baseTop = rect.top - sideOffsetPx;

      // Clamp after tooltip is mounted/measured
      const tipW = tooltipRef.current?.offsetWidth ?? 0;
      const padding = 8;
      const minLeft = padding + tipW / 2;
      const maxLeft = (window.innerWidth - padding) - tipW / 2;
      const clampedLeft = Number.isFinite(baseLeft)
        ? Math.min(Math.max(baseLeft, minLeft), maxLeft)
        : baseLeft;

      setPortalPos({ left: clampedLeft, top: baseTop });
    };

    // First paint + after tooltip ref has size
    const raf = window.requestAnimationFrame(compute);

    const onScrollOrResize = () => compute();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isVisible, sideOffsetPx, usePortal]);

  return (
    <div className="relative">
      <button
        className={
          buttonClassName ??
          "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold disabled:text-gray-400 select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px] hover:bg-gray-700 transition-opacity"
        }
        aria-label="info"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{ backgroundColor: 'transparent' }}
        ref={btnRef}
      >
        {trigger ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-info size-4"
          style={{ color: "#7A8084" }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        )}
      </button>
      {isVisible && !usePortal ? (
        <div
          className={
            tooltipClassName ??
            "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-sm rounded-md shadow-md z-50 whitespace-nowrap font-bold"
          }
          style={{ 
            pointerEvents: 'auto',
            backgroundColor: tooltipClassName ? undefined : '#22272b',
            borderColor: tooltipClassName ? undefined : '#34383C',
            borderWidth: tooltipClassName ? undefined : '1px',
            borderStyle: tooltipClassName ? undefined : 'solid',
            color: tooltipClassName ? undefined : '#FFFFFF'
          }}
        >
          {safeContent}
          {showArrow ? (
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1"
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: tooltipClassName ? "6px solid #0a0a0a" : "6px solid #22272b",
            }}
          />
          ) : null}
        </div>
      ) : null}

      {isVisible && usePortal && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={tooltipRef}
              className={
                tooltipClassName ??
                "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md whitespace-nowrap font-bold"
              }
              style={{
                position: 'fixed',
                left: portalPos?.left ?? 0,
                top: portalPos?.top ?? 0,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'auto',
                zIndex: 200,
                backgroundColor: tooltipClassName ? undefined : '#22272b',
                borderColor: tooltipClassName ? undefined : '#34383C',
                borderWidth: tooltipClassName ? undefined : '1px',
                borderStyle: tooltipClassName ? undefined : 'solid',
                color: tooltipClassName ? undefined : '#FFFFFF'
              }}
              role="tooltip"
            >
              {safeContent}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

