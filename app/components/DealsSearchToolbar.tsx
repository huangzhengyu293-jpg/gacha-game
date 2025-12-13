'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { SearchFilters } from '../deals/page';
import { useI18n } from './I18nProvider';

interface Props {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function DealsSearchToolbar({ filters, onFiltersChange }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState(filters.name);
  const [minPrice, setMinPrice] = useState(`$${filters.priceMin}`);
  const [maxPrice, setMaxPrice] = useState(`$${filters.priceMax}`);
  const [sortKey, setSortKey] = useState<'asc' | 'desc'>(filters.priceSort === '1' ? 'desc' : 'asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  function parseCurrency(input: string): number {
    const cleaned = (input || '').toString().replace(/[^0-9.]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
  function formatCurrency(n: number, frac: number = 0): string {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: frac, maximumFractionDigits: frac });
  }

  const minVal = useMemo(() => clamp(parseCurrency(minPrice), 20, 350000), [minPrice]);
  const maxVal = useMemo(() => clamp(parseCurrency(maxPrice), 20, 350000), [maxPrice]);

  function onMinBlur() { setMinPrice(formatCurrency(clamp(parseCurrency(minPrice), 20, 350000))); }
  function onMaxBlur() { setMaxPrice(formatCurrency(clamp(parseCurrency(maxPrice), 20, 350000))); }

  const sortOptions: Array<{ key: 'asc' | 'desc'; label: string }> = useMemo(
    () => [
      { key: 'desc', label: t('sortPriceHighLow') },
      { key: 'asc', label: t('sortPriceLowHigh') },
    ],
    [t],
  );

  const sortLabel = useMemo(() => (sortKey === 'desc' ? t('sortPriceHighLow') : t('sortPriceLowHigh')), [sortKey, t]);

  useEffect(() => {
    const handleOutside = (ev: MouseEvent) => {
      if (!sortOpen) return;
      const target = ev.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [sortOpen]);

  // 当筛选条件变化时通知父组件
  useEffect(() => {
    onFiltersChange({
      name: query,
      priceSort: sortKey === 'desc' ? '1' : '2',
      priceMin: minVal,
      priceMax: maxVal,
    });
  }, [query, sortKey, minVal, maxVal, onFiltersChange]);

  useEffect(() => {
    setQuery(filters.name);
    setMinPrice(`$${filters.priceMin}`);
    setMaxPrice(`$${filters.priceMax}`);
    setSortKey(filters.priceSort === '1' ? 'desc' : 'asc');
  }, [filters.name, filters.priceMin, filters.priceMax, filters.priceSort]);

  const buttonHoverStyle = {
    backgroundColor: '#2A2D35',
    color: '#FFFFFF',
    cursor: 'pointer',
  } as const;
  const buttonActiveHoverStyle = {
    backgroundColor: '#34383C',
    color: '#FFFFFF',
    cursor: 'pointer',
  } as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {/* 搜索 */}
      <div className="col-span-2 lg:col-span-1">
        <div className="flex">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white size-4 pointer-events-none">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.2249 11.1723C9.21863 11.9739 7.94399 12.4529 6.55747 12.4529C3.30405 12.4529 0.666626 9.81548 0.666626 6.56205C0.666626 3.30863 3.30405 0.671204 6.55747 0.671204C9.81089 0.671204 12.4483 3.30863 12.4483 6.56205C12.4483 7.94857 11.9693 9.22321 11.1677 10.2295L14.8651 13.9269C15.1255 14.1873 15.1255 14.6094 14.8651 14.8697C14.6048 15.1301 14.1827 15.1301 13.9223 14.8697L10.2249 11.1723ZM1.99996 6.56205C1.99996 4.04501 4.04043 2.00454 6.55747 2.00454C9.07451 2.00454 11.115 4.04501 11.115 6.56205C11.115 7.78993 10.6294 8.90439 9.83981 9.72389L9.7193 9.8444C8.8998 10.634 7.78534 11.1196 6.55747 11.1196C4.04043 11.1196 1.99996 9.0791 1.99996 6.56205Z" fill="currentColor" stroke="currentColor" strokeMiterlimit="10" strokeLinecap="square"></path>
              </svg>
            </div>
            <input
              className="flex h-10 rounded-md border border-gray-600 focus:border-gray-600 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 pl-10 pr-10 font-semibold border-none w-full placeholder:text-[#7A8084]"
              style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
              placeholder={t('dealsSearchPlaceholder')}
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center"></div>
          </div>
        </div>
      </div>

      {/* 排序 */}
      <div className="col-span-2 lg:col-span-1" ref={sortRef as any}>
        <div className="relative">
          <button
            className="inline-flex items-center gap-2 whitespace-nowrap transition-colors interactive-focus relative text-white text-base ring-offset-background font-bold select-none h-10 rounded-md min-w-0 md:min-w-48 w-full flex-1 self-stretch px-4 justify-between"
            type="button"
            style={{ backgroundColor: '#22272B', cursor: 'pointer' }}
            onClick={() => setSortOpen((v) => !v)}
          >
            <p className="truncate font-semibold">{sortLabel}</p>
            <div className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-2 z-50 w-48 rounded-md p-1 shadow-md" style={{ backgroundColor: '#22272B', color: '#FFFFFF' }} role="menu">
              {sortOptions.map((opt) => {
                const checked = sortKey === opt.key;
                return (
                  <div
                    key={opt.key}
                    role="menuitem"
                    className="relative px-3 py-2 font-semibold rounded-sm cursor-pointer"
                    style={{ backgroundColor: hoveredKey === opt.key ? '#34383C' : 'transparent' }}
                    onMouseEnter={() => setHoveredKey(opt.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                  >
                    {checked && (
                      <span className="absolute flex h-3.5 w-3.5 items-center justify-center" style={{ right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-4 w-4">
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </span>
                    )}
                    {opt.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 价格区间 */}
      <div className="col-span-2 lg:col-span-2">
        <div className="flex gap-2">
          {/* 最低 */}
          <div className="relative flex flex-1 rounded-md items-center h-10" style={{ backgroundColor: '#22272B' }}>
            <div className="rounded-tl-md rounded-bl-md flex items-center h-full font-bold text-sm gap-2 px-3" style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}>
              <span>{t('minPrice')}</span>
            </div>
            <div className="flex flex-1 relative items-center">
              <input
                className="flex h-10 w-full focus:border-gray-600 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 border-0 font-semibold rounded-md placeholder:text-[#7A8084]"
                style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                value={formatCurrency(minVal)}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={onMinBlur}
              />
              <div className="hidden sm:flex absolute right-2 items-center gap-2 rounded" style={{ color: '#FFFFFF' }}>
                <button
                  className="px-2 py-1 text-xs font-bold rounded text-white"
                  style={{ backgroundColor: '#2A2D35', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
                  onClick={() => setMinPrice(formatCurrency(Math.max(20, Math.floor(parseCurrency(minPrice) / 2))))}
                >1/2x</button>
                <button
                  className="px-2 py-1 text-xs font-bold rounded text-white"
                  style={{ backgroundColor: '#2A2D35', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
                  onClick={() => setMinPrice(formatCurrency(Math.min(350000, Math.max(20, Math.floor(parseCurrency(minPrice) * 2)))))}
                >2x</button>
              </div>
            </div>
          </div>

          {/* 最高 */}
          <div className="relative flex flex-1 rounded-md items-center h-10" style={{ backgroundColor: '#22272B' }}>
            <div className="rounded-tl-md rounded-bl-md flex items-center h-full font-bold text-sm gap-2 px-3" style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}>
              <span>{t('maxPrice')}</span>
            </div>
            <div className="flex flex-1 relative items-center">
              <input
                className="flex h-10 w-full focus:border-gray-600 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 border-0 font-semibold rounded-md placeholder:text-[#7A8084]"
                style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                value={formatCurrency(maxVal)}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={onMaxBlur}
              />
              <div className="hidden sm:flex absolute right-2 items-center gap-2 rounded" style={{ color: '#FFFFFF' }}>
                <button
                  className="px-2 py-1 text-xs font-bold rounded text-white"
                  style={{ backgroundColor: '#2A2D35', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
                  onClick={() => setMaxPrice(formatCurrency(Math.max(20, Math.min(350000, Math.floor(parseCurrency(maxPrice) / 2)))))}
                >1/2x</button>
                <button
                  className="px-2 py-1 text-xs font-bold rounded text-white"
                  style={{ backgroundColor: '#2A2D35', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
                  onClick={() => setMaxPrice(formatCurrency(Math.min(350000, Math.max(20, Math.floor(parseCurrency(maxPrice) * 2)))))}
                >2x</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
