"use client";

import { useCallback, useRef } from "react";

export type AddBattleRoundCasePriceSliderProps = {
  domainMin: number;
  domainMax: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatLabel: (n: number) => string;
  ariaMinLabel: string;
  ariaMaxLabel: string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function AddBattleRoundCasePriceSlider({
  domainMin,
  domainMax,
  valueMin,
  valueMax,
  onChange,
  formatLabel,
  ariaMinLabel,
  ariaMaxLabel,
}: AddBattleRoundCasePriceSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"min" | "max" | null>(null);

  const span = domainMax - domainMin;
  const safeSpan = span <= 0 ? 1 : span;
  const minGap = Math.max(safeSpan * 0.002, 0.01);

  const toPct = (v: number) => ((v - domainMin) / safeSpan) * 100;

  const pctMin = clamp(toPct(valueMin), 0, 100);
  const pctMax = clamp(toPct(valueMax), 0, 100);

  const setFromClientX = useCallback(
    (clientX: number, which: "min" | "max") => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = r.width > 0 ? r.width : 1;
      const pct = clamp(((clientX - r.left) / w) * 100, 0, 100);
      const raw = domainMin + (pct / 100) * safeSpan;
      if (which === "min") {
        const hi = roundMoney(clamp(valueMax - minGap, domainMin, domainMax));
        const next = roundMoney(clamp(raw, domainMin, hi));
        onChange(next, valueMax);
      } else {
        const lo = roundMoney(clamp(valueMin + minGap, domainMin, domainMax));
        const next = roundMoney(clamp(raw, lo, domainMax));
        onChange(valueMin, next);
      }
    },
    [domainMin, domainMax, valueMin, valueMax, minGap, onChange, safeSpan],
  );

  const startDrag = (which: "min" | "max") => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = which;
    (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX, which);
    const onMove = (evt: PointerEvent) => {
      const w = dragRef.current;
      if (!w) return;
      setFromClientX(evt.clientX, w);
    };
    const onUp = (evt: PointerEvent) => {
      try {
        (e.currentTarget as HTMLButtonElement).releasePointerCapture?.(evt.pointerId);
      } catch {
        /* ignore */
      }
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const trackBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = r.width > 0 ? r.width : 1;
    const pct = clamp(((e.clientX - r.left) / w) * 100, 0, 100);
    const raw = domainMin + (pct / 100) * safeSpan;
    const mid = (valueMin + valueMax) / 2;
    if (raw < mid) {
      const hi = roundMoney(clamp(valueMax - minGap, domainMin, domainMax));
      const next = roundMoney(clamp(raw, domainMin, hi));
      onChange(next, valueMax);
    } else {
      const lo = roundMoney(clamp(valueMin + minGap, domainMin, domainMax));
      const next = roundMoney(clamp(raw, lo, domainMax));
      onChange(valueMin, next);
    }
  };

  return (
    <div className="relative w-full">
      <div
        ref={trackRef}
        role="presentation"
        className="relative h-9 w-full cursor-pointer"
        onMouseDown={trackBackgroundClick}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-[7px] bg-[#2E3244]" />
        <div
          className="pointer-events-none absolute top-1/2 z-[1] h-0.5 -translate-y-1/2 rounded-[7px] bg-gold-400"
          style={{ left: `${pctMin}%`, width: `${Math.max(pctMax - pctMin, 0)}%` }}
        />
        <button
          type="button"
          aria-label={ariaMinLabel}
          onPointerDown={startDrag("min")}
          className="absolute top-1/2 z-[2] mt-px h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 touch-none transition-transform duration-150 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
          style={{ left: `${pctMin}%` }}
        >
          <span className="pointer-events-none absolute -bottom-3.5 left-1/2 w-max min-w-[3rem] -translate-x-1/2 whitespace-nowrap text-10px font-semibold text-navy-400">
            {formatLabel(valueMin)}
          </span>
          <span className="m-0 flex h-full w-full items-center justify-center rounded-full bg-gold-400 shadow-sm" />
        </button>
        <button
          type="button"
          aria-label={ariaMaxLabel}
          onPointerDown={startDrag("max")}
          className="absolute top-1/2 z-[2] mt-px h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 touch-none transition-transform duration-150 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
          style={{ left: `${pctMax}%` }}
        >
          <span className="pointer-events-none absolute -top-3.5 left-1/2 w-max min-w-[3rem] -translate-x-1/2 whitespace-nowrap text-right text-10px font-semibold text-navy-400">
            {formatLabel(valueMax)}
          </span>
          <span className="m-0 flex h-full w-full items-center justify-center rounded-full bg-gold-400 shadow-sm" />
        </button>
      </div>
    </div>
  );
}
