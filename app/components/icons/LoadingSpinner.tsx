'use client';

import React from 'react';

type LoadingSpinnerIconProps = {
  size?: number;
  trackColor?: string;
  indicatorColor?: string;
  strokeWidth?: number;
  className?: string;
};

export default function LoadingSpinnerIcon({
  size = 22,
  trackColor = 'rgba(255,255,255,0.3)',
  indicatorColor = '#FFFFFF',
  strokeWidth = 3,
  className = '',
}: LoadingSpinnerIconProps) {
  const dimension = typeof size === 'number' ? size : 22;
  const composedClassName = ['animate-spin', className].filter(Boolean).join(' ');

  return (
    <svg
      className={composedClassName}
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="loading"
    >
      <circle cx="12" cy="12" r="9" stroke={trackColor} strokeWidth={strokeWidth} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={indicatorColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

