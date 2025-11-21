import { useState, useCallback } from 'react';

export interface PacksFilters {
  search_type?: string;
  sort_type?: string;
  price_sort?: string;
  volatility?: string;
  price_min?: string;
  price_max?: string;
}

export function usePacksFilters(defaults?: Partial<PacksFilters>) {
  const [filters, setFilters] = useState<PacksFilters>({
    sort_type: '1', // 默认：最受欢迎
    volatility: '1', // 默认：1
    ...defaults,
  });

  const updateFilters = useCallback((newFilters: PacksFilters) => {
    // 过滤掉 undefined 的值，只保留有效参数
    const cleanedFilters: PacksFilters = {};
    Object.keys(newFilters).forEach(key => {
      const value = (newFilters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        (cleanedFilters as any)[key] = value;
      }
    });
    setFilters(cleanedFilters);
  }, []);

  const reset = useCallback(() => {
    setFilters({
      sort_type: '1',
      volatility: '1',
    });
  }, []);

  return {
    filters,
    updateFilters,
    reset,
  };
}

