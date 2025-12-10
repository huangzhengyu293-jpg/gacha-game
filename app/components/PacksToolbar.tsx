"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PacksToolbarProps {
  showCreateButton?: boolean;
  filters?: {
    search_type?: string;
    sort_type?: string;
    price_sort?: string;
    volatility?: string;
    price_min?: string;
    price_max?: string;
    name?: string;
  };
  onFilterChange?: (filters: {
    search_type?: string;
    sort_type?: string;
    price_sort?: string;
    volatility?: string;
    price_min?: string;
    price_max?: string;
    name?: string;
  }) => void;
  onReset?: () => void;
}

export default function PacksToolbar({ showCreateButton = true, filters, onFilterChange, onReset }: PacksToolbarProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [volOpen, setVolOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  
  // 从 filters 解析当前状态
  const category = useMemo((): "all" | "official" | "community" | "favorite" => {
    if (!filters?.search_type) return "all";
    if (filters.search_type === '1') return "official";
    if (filters.search_type === '2') return "community";
    if (filters.search_type === '3') return "favorite";
    return "all";
  }, [filters?.search_type]);
  
  const sort = useMemo((): "mostPopular" | "newest" | "priceHighToLow" | "priceLowToHigh" => {
    if (filters?.sort_type === '2') return "newest";
    if (filters?.sort_type === '1') return "mostPopular";
    if (filters?.price_sort === '1') return "priceHighToLow";
    if (filters?.price_sort === '2') return "priceLowToHigh";
    return "mostPopular";
  }, [filters?.sort_type, filters?.price_sort]);
  
  const volatility = useMemo((): "1" | "2" | "3" | "4" | "5" => {
    return (filters?.volatility || "1") as "1" | "2" | "3" | "4" | "5";
  }, [filters?.volatility]);
  
  const price = useMemo((): "allPrices" | "gte500" | "range250to500" | "range100to250" | "range50to100" | "range25to50" | "range5to25" | "lte5" => {
    if (!filters?.price_min && !filters?.price_max) return "allPrices";
    if (filters.price_min === '500' && !filters.price_max) return "gte500";
    if (!filters.price_min && filters.price_max === '5') return "lte5";
    if (filters.price_min === '5' && filters.price_max === '25') return "range5to25";
    if (filters.price_min === '25' && filters.price_max === '50') return "range25to50";
    if (filters.price_min === '50' && filters.price_max === '100') return "range50to100";
    if (filters.price_min === '100' && filters.price_max === '250') return "range100to250";
    if (filters.price_min === '250' && filters.price_max === '500') return "range250to500";
    return "allPrices";
  }, [filters?.price_min, filters?.price_max]);
  
  const categoryBtnRef = useRef<HTMLButtonElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const sortBtnRef = useRef<HTMLButtonElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const priceBtnRef = useRef<HTMLButtonElement | null>(null);
  const priceMenuRef = useRef<HTMLDivElement | null>(null);
  const volBtnRef = useRef<HTMLButtonElement | null>(null);
  const volMenuRef = useRef<HTMLDivElement | null>(null);
  const [categoryPos, setCategoryPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentFilters = filtersRef.current || {};
      if (currentFilters.name !== search) {
        onFilterChange?.({ ...currentFilters, name: search });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, onFilterChange]);

  const handleSearch = useCallback(() => {
    const newFilters: any = { ...filters };
    newFilters.name = search;
    onFilterChange?.(newFilters);
  }, [search, filters, onFilterChange]);

  // 设置类别
  const handleSetCategory = useCallback((newCategory: "all" | "official" | "community" | "favorite") => {
    const newFilters: any = {};
    
    // 保留其他筛选条件，但移除 search_type
    Object.keys(filters || {}).forEach(key => {
      if (key !== 'search_type') {
        newFilters[key] = (filters as any)[key];
      }
    });
    
    if (newCategory === 'official') {
      newFilters.search_type = '1';
    } else if (newCategory === 'community') {
      newFilters.search_type = '2';
    } else if (newCategory === 'favorite') {
      newFilters.search_type = '3';
    }
    // all 的话不传 search_type
    
    onFilterChange?.(newFilters);
  }, [filters, onFilterChange]);

  // 设置排序
  const handleSetSort = useCallback((newSort: "mostPopular" | "newest" | "priceHighToLow" | "priceLowToHigh") => {
    const newFilters: any = {};
    
    // 保留其他筛选条件，但移除 sort_type 和 price_sort
    Object.keys(filters || {}).forEach(key => {
      if (key !== 'sort_type' && key !== 'price_sort') {
        newFilters[key] = (filters as any)[key];
      }
    });
    
    if (newSort === 'newest') {
      newFilters.sort_type = '2';
    } else if (newSort === 'mostPopular') {
      newFilters.sort_type = '1';
    } else if (newSort === 'priceHighToLow') {
      newFilters.price_sort = '1';
    } else if (newSort === 'priceLowToHigh') {
      newFilters.price_sort = '2';
    }
    onFilterChange?.(newFilters);
  }, [filters, onFilterChange]);

  // 设置波动性
  const handleSetVolatility = useCallback((newVolatility: "1" | "2" | "3" | "4" | "5") => {
    const newFilters: any = {};
    
    // 保留其他筛选条件
    Object.keys(filters || {}).forEach(key => {
      newFilters[key] = (filters as any)[key];
    });
    
    newFilters.volatility = newVolatility;
    onFilterChange?.(newFilters);
  }, [filters, onFilterChange]);

  // 设置价格
  const handleSetPrice = useCallback((newPrice: "allPrices" | "gte500" | "range250to500" | "range100to250" | "range50to100" | "range25to50" | "range5to25" | "lte5") => {
    const newFilters: any = {};
    
    // 保留其他筛选条件，但移除 price_min 和 price_max
    Object.keys(filters || {}).forEach(key => {
      if (key !== 'price_min' && key !== 'price_max') {
        newFilters[key] = (filters as any)[key];
      }
    });
    
    if (newPrice === 'gte500') {
      newFilters.price_min = '500';
    } else if (newPrice === 'lte5') {
      newFilters.price_max = '5';
    } else if (newPrice === 'range5to25') {
      newFilters.price_min = '5';
      newFilters.price_max = '25';
    } else if (newPrice === 'range25to50') {
      newFilters.price_min = '25';
      newFilters.price_max = '50';
    } else if (newPrice === 'range50to100') {
      newFilters.price_min = '50';
      newFilters.price_max = '100';
    } else if (newPrice === 'range100to250') {
      newFilters.price_min = '100';
      newFilters.price_max = '250';
    } else if (newPrice === 'range250to500') {
      newFilters.price_min = '250';
      newFilters.price_max = '500';
    }
    // allPrices 的话不传 price_min 和 price_max
    
    onFilterChange?.(newFilters);
  }, [filters, onFilterChange]);

  const reset = useCallback(() => {
    setSearch("");
    onReset?.();
  }, [onReset]);

  const openCategoryMenu = useCallback(() => {
    setCategoryOpen((v) => {
      const next = !v;
      if (next) {
        const el = categoryBtnRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          setCategoryPos({ x: rect.left, y: rect.bottom + 4 });
        }
      }
      return next;
    });
    setSortOpen(false); setVolOpen(false); setPriceOpen(false);
  }, []);

  // 跟随窗口变化更新弹层位置
  const updateCategoryPos = useCallback(() => {
    if (!categoryOpen) return;
    const el = categoryBtnRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setCategoryPos({ x: rect.left, y: rect.bottom + 4 });
    }
  }, [categoryOpen]);

  useEffect(() => {
    if (!categoryOpen) return;
    const onScroll = () => updateCategoryPos();
    const onResize = () => updateCategoryPos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [categoryOpen, updateCategoryPos]);

  // 点击空白处关闭所有下拉
  useEffect(() => {
    if (!categoryOpen && !sortOpen && !priceOpen && !volOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const inside = (
        (categoryOpen && (categoryBtnRef.current?.contains(t) || categoryMenuRef.current?.contains(t))) ||
        (sortOpen && (sortBtnRef.current?.contains(t) || sortMenuRef.current?.contains(t))) ||
        (priceOpen && (priceBtnRef.current?.contains(t) || priceMenuRef.current?.contains(t))) ||
        (volOpen && (volBtnRef.current?.contains(t) || volMenuRef.current?.contains(t)))
      );
      if (!inside) {
        setCategoryOpen(false);
        setSortOpen(false);
        setPriceOpen(false);
        setVolOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [categoryOpen, sortOpen, priceOpen, volOpen]);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <div className="flex w-full">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-white size-5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </div>
            <input className="flex border border-[#2A2B2E] focus:border-[#2A2B2E] px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground text-white placeholder-[#7A8084] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 pl-10 font-semibold bg-[#22272B] border-none w-full pr-20 h-10 rounded-md flex-1" placeholder={t("search")} enterKeyHint="search" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button onClick={reset} className="px-2 py-1 text-sm font-semibold" style={{ color: '#4195DB' }}>{t("reset")}</button>
            </div>
          </div>
        </div>
        {/* {showCreateButton && (
          <Link href="/packs/create" className="inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none h-10 px-6 whitespace-nowrap">
            <div className="size-5">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.00001 2.66675C9.00001 2.11446 8.55229 1.66675 8.00001 1.66675C7.44772 1.66675 7.00001 2.11446 7.00001 2.66675V7.00008L2.66667 7.00008C2.11439 7.00008 1.66667 7.4478 1.66667 8.00008C1.66667 8.55237 2.11439 9.00008 2.66667 9.00008H7.00001V13.3334C7.00001 13.8857 7.44772 14.3334 8.00001 14.3334C8.55229 14.3334 9.00001 13.8857 9.00001 13.3334V9.00008H13.3333C13.8856 9.00008 14.3333 8.55237 14.3333 8.00008C14.3333 7.4478 13.8856 7.00008 13.3333 7.00008H9.00001V2.66675Z" fill="currentColor"></path></svg>
            </div>
            <p>{t("createPack")}</p>
          </Link>
        )} */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* 第一个选择器：全部、官方、社区、最喜欢 */}
        <div className="relative">
          <button ref={categoryBtnRef} onClick={openCategoryMenu} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#1D2125] border-[#22272B] text-white hover:bg-[#22272B] rounded-md w-full cursor-pointer" type="button" aria-haspopup="menu" aria-expanded={categoryOpen}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package h-4 w-4"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg>
            <span>{ category === 'official' ? t('official') : category === 'community' ? t('community') : category === 'favorite' ? t('favorite') : t('all') }</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 ml-auto"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          {categoryOpen ? (
            <div ref={categoryMenuRef} data-radix-popper-content-wrapper="" dir="ltr" style={{ position: 'fixed', left: 0, top: 0, transform: `translate(${categoryPos.x}px, ${categoryPos.y}px)`, minWidth: 'max-content', willChange: 'transform', zIndex: 50 } as React.CSSProperties}>
              <div data-side="bottom" data-align="start" role="menu" aria-orientation="vertical" data-state="open" data-radix-menu-content="" dir="ltr" className="z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin] w-48 bg-[#22272B] border-0 shadow-menu rounded-lg p-0" tabIndex={-1} data-orientation="vertical" style={{ outline: 'none' } as React.CSSProperties}>
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ handleSetCategory('all'); setCategoryOpen(false); }} role="menuitem" className="relative flex select-none items-center gap-2 outline-none transition-colors focus:bg-foreground/10 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-white font-semibold cursor-pointer hover:bg-[#34383C] px-3 py-2 rounded-lg text-base text-white" tabIndex={-1} data-orientation="vertical">
                    全部
                  </button>
                  <button onClick={()=>{ handleSetCategory('official'); setCategoryOpen(false); }} role="menuitem" className="relative flex select-none items-center gap-2 outline-none transition-colors focus:bg-foreground/10 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-white font-semibold cursor-pointer hover:bg-[#34383C] px-3 py-2 rounded-lg text-base text-white" tabIndex={-1} data-orientation="vertical">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown size-5 mr-2 text-white"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>
                    官方
                  </button>
                  <button onClick={()=>{ handleSetCategory('community'); setCategoryOpen(false); }} role="menuitem" className="relative flex select-none items-center gap-2 outline-none transition-colors focus:bg-foreground/10 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-white font-semibold cursor-pointer hover:bg-[#34383C] px-3 py-2 rounded-lg text-base text-white" tabIndex={-1} data-orientation="vertical">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users size-5 mr-2 text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    社区
                  </button>
                  <button onClick={()=>{ handleSetCategory('favorite'); setCategoryOpen(false); }} role="menuitem" className="relative flex select-none items-center gap-2 outline-none transition-colors focus:bg-foreground/10 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-white font-semibold cursor-pointer hover:bg-[#34383C] px-3 py-2 rounded-lg text-base text-white" tabIndex={-1} data-orientation="vertical">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star size-5 mr-2 text-white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    最喜欢
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 第二个选择器：最新/最受欢迎/价格高到低/价格低到高 */}
        <div className="relative">
          <button ref={sortBtnRef} onClick={()=>{ setSortOpen(v=>!v); setCategoryOpen(false); setVolOpen(false); setPriceOpen(false); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#1D2125] border-[#22272B] text-white hover:bg-[#22272B] rounded-md w-full cursor-pointer" type="button" aria-haspopup="menu" aria-expanded={sortOpen}>
          <div className="h-4 w-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"><path d="M8.33333 6.66667H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M11.666 5V8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M17.5 13.3333H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M17.4993 6.66667H11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M6.66602 11.6667V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M6.66667 13.3333H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </div>
            <span className="truncate">{ sort === 'mostPopular' ? t('mostPopular') : sort === 'newest' ? t('newest') : sort === 'priceLowToHigh' ? t('priceLowToHigh') : t('priceHighToLow') }</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 ml-auto"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          {sortOpen ? (
            <div className="absolute left-0 mt-1 z-20">
              <div ref={sortMenuRef} className="bg-[#22272B] border-0 rounded-lg overflow-hidden shadow-lg p-0 w-56">
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ handleSetSort('mostPopular'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('mostPopular')}</button>
                  <button onClick={()=>{ handleSetSort('newest'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('newest')}</button>
                  <button onClick={()=>{ handleSetSort('priceHighToLow'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('priceHighToLow')}</button>
                  <button onClick={()=>{ handleSetSort('priceLowToHigh'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('priceLowToHigh')}</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 第三个选择器：波动性 1-5（传统选择器） */}
        <div className="relative">
          <button ref={volBtnRef} onClick={()=>{ setVolOpen(v=>!v); setCategoryOpen(false); setSortOpen(false); setPriceOpen(false); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#1D2125] border-[#22272B] text-white hover:bg-[#22272B] rounded-md w-full cursor-pointer" type="button" aria-haspopup="menu" aria-expanded={volOpen}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame h-4 w-4"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
            <span>{t("volatility")}</span>
            <span className="ml-1" style={{ color: '#7A8084' }}>{volatility}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 ml-auto"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          {volOpen ? (
            <div className="absolute left-0 mt-1 z-20">
              <div ref={volMenuRef} className="bg-[#22272B] border-0 rounded-lg overflow-hidden shadow-lg p-0 w-56">
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ handleSetVolatility('1'); setVolOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">1</button>
                  <button onClick={()=>{ handleSetVolatility('2'); setVolOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">2</button>
                  <button onClick={()=>{ handleSetVolatility('3'); setVolOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">3</button>
                  <button onClick={()=>{ handleSetVolatility('4'); setVolOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">4</button>
                  <button onClick={()=>{ handleSetVolatility('5'); setVolOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">5</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 第四个选择器：价格区间 */}
        <div className="relative">
          <button ref={priceBtnRef} onClick={()=>{ setPriceOpen(v=>!v); setCategoryOpen(false); setSortOpen(false); setVolOpen(false); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#1D2125] border-[#22272B] text-white hover:bg-[#22272B] rounded-md w-full cursor-pointer" type="button" aria-haspopup="menu" aria-expanded={priceOpen}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up h-4 w-4"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            <span className="truncate">{
              price === 'allPrices' ? t('allPrices') :
              price === 'gte500' ? t('gte500') :
              price === 'range250to500' ? t('range250to500') :
              price === 'range100to250' ? t('range100to250') :
              price === 'range50to100' ? t('range50to100') :
              price === 'range25to50' ? t('range25to50') :
              price === 'range5to25' ? t('range5to25') :
              t('lte5')
            }</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 ml-auto"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          {priceOpen ? (
            <div className="absolute left-0 mt-1 z-20">
              <div ref={priceMenuRef} className="bg-[#22272B] border-0 rounded-lg overflow-hidden shadow-lg p-0 w-56">
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ handleSetPrice('allPrices'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('allPrices')}</button>
                </div>
                <div className="flex h-px bg-gray-600" />
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ handleSetPrice('gte500'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('gte500')}</button>
                  <button onClick={()=>{ handleSetPrice('range250to500'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('range250to500')}</button>
                  <button onClick={()=>{ handleSetPrice('range100to250'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('range100to250')}</button>
                  <button onClick={()=>{ handleSetPrice('range50to100'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('range50to100')}</button>
                  <button onClick={()=>{ handleSetPrice('range25to50'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('range25to50')}</button>
                  <button onClick={()=>{ handleSetPrice('range5to25'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('range5to25')}</button>
                  <button onClick={()=>{ handleSetPrice('lte5'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#34383C] px-3 py-2 text-base text-white font-semibold w-full text-left cursor-pointer rounded-lg">{t('lte5')}</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

