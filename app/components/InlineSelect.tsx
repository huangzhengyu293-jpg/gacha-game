'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export type InlineSelectOption = {
  label: React.ReactNode;
  value: string;
};

export default function InlineSelect({
  value,
  onChange,
  options,
  fullWidth = false,
  wrapperClassName,
  centerLabel = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: InlineSelectOption[];
  fullWidth?: boolean;
  wrapperClassName?: string;
  centerLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const found = options.find(o => o.value === value);
    return found ? found.label : null;
  }, [options, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <div
      className={[
        'relative',
        fullWidth ? 'w-full' : 'w-full sm:w-[208px] sm:min-w-[208px]',
        wrapperClassName || '',
      ].join(' ')}
      ref={ref}
    >
      <button
        type="button"
        aria-expanded={open}
        className={"flex h-10 items-center justify-between rounded-md px-3 py-2 w-full text-base font-bold cursor-pointer transition-colors " + (centerLabel ? 'relative' : '')}
        style={{ backgroundColor: hover ? '#34383C' : '#22272B', color: '#FFFFFF' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setOpen(v => !v)}
      >
        {centerLabel ? (
          <span
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'max-content',
              textAlign: 'center',
            }}
          >
            {selectedLabel}
          </span>
        ) : (
          <span style={{ pointerEvents: 'none' }}>{selectedLabel}</span>
        )}
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
          className="lucide lucide-chevron-down h-4 w-4"
          style={{ opacity: 0.5 }}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 mt-2 z-50 rounded-lg overflow-hidden shadow-lg w-full"
          style={{ backgroundColor: '#22272B' }}
        >
          <div className="flex flex-col p-1">
            {options.map(opt => (
              <button
                key={opt.value}
                className="flex items-center justify-between h-10 px-3 rounded-md text-base font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: hoveredValue === opt.value ? '#34383C' : '#22272B',
                  color: '#FFFFFF',
                }}
                onMouseEnter={() => setHoveredValue(opt.value)}
                onMouseLeave={() => setHoveredValue(prev => (prev === opt.value ? null : prev))}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


