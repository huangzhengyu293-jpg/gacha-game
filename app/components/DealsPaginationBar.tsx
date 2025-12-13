'use client';

import React from 'react';
import { useI18n } from './I18nProvider';

interface DealsPaginationBarProps {
  start?: number;
  end?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
  disabledPrev?: boolean;
  disabledNext?: boolean;
}

export default function DealsPaginationBar({
  start = 49,
  end = 96,
  total = 7718,
  onPrev,
  onNext,
  disabledPrev = false,
  disabledNext = false,
}: DealsPaginationBarProps) {
  const { t } = useI18n();
  const baseBtnStyle: React.CSSProperties = {
    backgroundColor: '#2A2D35',
    color: '#FFFFFF',
    cursor: 'pointer',
  };
  const disabledBtnStyle: React.CSSProperties = {
    backgroundColor: '#2A2D35',
    color: '#7A8084',
    cursor: 'default',
  };

  return (
    <div className="flex justify-between self-stretch gap-3 py-3">
      <div className="flex gap-2 items-center">
        <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
          {t('dealsRange')
            .replace('{start}', String(start))
            .replace('{end}', String(end))
            .replace('{total}', String(total))}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-7 px-4 text-sm !rounded-md font-bold"
          style={disabledPrev ? disabledBtnStyle : baseBtnStyle}
          onMouseEnter={(e) => { if (!disabledPrev) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onMouseLeave={(e) => { if (!disabledPrev) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
          onClick={() => { if (!disabledPrev) onPrev && onPrev(); }}
          disabled={disabledPrev}
        >{t('prevPage')}</button>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-7 px-4 text-sm !rounded-md font-bold"
          style={disabledNext ? disabledBtnStyle : baseBtnStyle}
          onMouseEnter={(e) => { if (!disabledNext) (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onMouseLeave={(e) => { if (!disabledNext) (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
          onClick={() => { if (!disabledNext) onNext && onNext(); }}
          disabled={disabledNext}
        >{t('nextPage')}</button>
      </div>
    </div>
  );
}


