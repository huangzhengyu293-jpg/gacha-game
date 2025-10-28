"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { useCallback, useMemo, useRef, useState } from "react";

export default function PacksToolbar() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [volOpen, setVolOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [category, setCategory] = useState<"all" | "official" | "community">("all");
  const [sort, setSort] = useState<"mostPopular" | "newest" | "priceHighToLow" | "priceLowToHigh">("mostPopular");
  const [volMin, setVolMin] = useState(1);
  const [volMax, setVolMax] = useState(5);
  const [price, setPrice] = useState<"allPrices" | "gte500" | "range250to500" | "range100to250" | "range50to100" | "range25to50" | "range5to25" | "lte5">("allPrices");
  const volTrackRef = useRef<HTMLSpanElement | null>(null);
  const draggingRef = useRef<null | "min" | "max">(null);

  const volFillStyle = useMemo(() => {
    const leftPct = ((volMin - 1) / 4) * 100;
    const rightPct = 100 - ((volMax - 1) / 4) * 100;
    return { left: `${leftPct}%`, right: `${rightPct}%` } as React.CSSProperties;
  }, [volMin, volMax]);

  const pMin = useMemo(() => ((volMin - 1) / 4) * 100, [volMin]);
  const pMax = useMemo(() => ((volMax - 1) / 4) * 100, [volMax]);
  const minThumbStyle = useMemo(() => ({
    position: 'absolute',
    left: `${pMin}%`,
    transform: 'translateX(-50%)',
  }) as React.CSSProperties, [pMin]);
  const maxThumbStyle = useMemo(() => ({
    position: 'absolute',
    left: `${pMax}%`,
    transform: 'translateX(-50%)',
  }) as React.CSSProperties, [pMax]);

  const volLabel = useMemo(() => {
    if (volMin === 1 && volMax === 5) return '';
    if (volMin === volMax) return String(volMin);
    return `${volMin}-${volMax}`;
  }, [volMin, volMax]);

  const setVolFromClientX = useCallback((thumb: "min" | "max", clientX: number) => {
    const track = volTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = x / rect.width;
    const value = 1 + Math.round(ratio * 4); // map to 1..5
    if (thumb === "min") {
      if (value <= volMax) {
        setVolMin(value);
      } else {
        // Cross over: move the other thumb and continue dragging as 'max'
        setVolMin(volMax);
        setVolMax(value);
        draggingRef.current = "max";
      }
    } else {
      if (value >= volMin) {
        setVolMax(value);
      } else {
        // Cross over: move the other thumb and continue dragging as 'min'
        setVolMax(volMin);
        setVolMin(value);
        draggingRef.current = "min";
      }
    }
  }, [volMin, volMax]);

  const onThumbMouseDown = useCallback((thumb: "min" | "max") => (e: React.MouseEvent) => {
    draggingRef.current = thumb;
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      setVolFromClientX(draggingRef.current, ev.clientX);
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    e.preventDefault();
    e.stopPropagation();
  }, [setVolFromClientX]);

  const onTrackMouseDown = useCallback((e: React.MouseEvent) => {
    const track = volTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const minX = ((volMin - 1) / 4) * rect.width;
    const maxX = ((volMax - 1) / 4) * rect.width;
    const nearest: "min" | "max" = Math.abs(clickX - minX) <= Math.abs(clickX - maxX) ? "min" : "max";
    setVolFromClientX(nearest, e.clientX);
    draggingRef.current = nearest;
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      setVolFromClientX(draggingRef.current, ev.clientX);
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [volMin, volMax, setVolFromClientX]);

  const handleSearch = useCallback(() => {
    // 输出当前所有筛选参数
    // eslint-disable-next-line no-console
    console.log("packs.search", { search, category, sort, volatility: [volMin, volMax], price });
  }, [search, category, sort, volMin, volMax, price]);

  const reset = useCallback(() => {
    setSearch("");
    setCategory("all");
    setSort("mostPopular");
    setVolMin(1);
    setVolMax(5);
    setPrice("allPrices");
  }, []);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <div className="flex w-full">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-white size-5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </div>
            <input className="flex border border-[#2A2B2E] focus:border-[#2A2B2E] px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 pl-10 font-semibold bg-[#1A1B1E] border-none w-full pr-28 h-10 rounded-md flex-1" placeholder={t("search")} enterKeyHint="search" value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ handleSearch(); } }} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button onClick={reset} className="text-blue-400 hover:text-blue-300 px-2 py-1 text-sm font-semibold">{t("reset")}</button>
              <button onClick={handleSearch} className="text-white bg-blue-500 hover:bg-blue-600 font-semibold rounded-md h-8 px-3">{t("search")}</button>
            </div>
          </div>
        </div>
        <Link href="/zh/packs/create" className="inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none h-10 px-6 whitespace-nowrap">
          <div className="size-5">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.00001 2.66675C9.00001 2.11446 8.55229 1.66675 8.00001 1.66675C7.44772 1.66675 7.00001 2.11446 7.00001 2.66675V7.00008L2.66667 7.00008C2.11439 7.00008 1.66667 7.4478 1.66667 8.00008C1.66667 8.55237 2.11439 9.00008 2.66667 9.00008H7.00001V13.3334C7.00001 13.8857 7.44772 14.3334 8.00001 14.3334C8.55229 14.3334 9.00001 13.8857 9.00001 13.3334V9.00008H13.3333C13.8856 9.00008 14.3333 8.55237 14.3333 8.00008C14.3333 7.4478 13.8856 7.00008 13.3333 7.00008H9.00001V2.66675Z" fill="currentColor"></path></svg>
          </div>
          <p>{t("createPack")}</p>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="relative">
          <button onClick={()=>{ setCategoryOpen(v=>!v); setSortOpen(false); setVolOpen(false); setPriceOpen(false); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#0B0C0E] border-[#1F2124] text-white hover:bg-[#111317] rounded-md w-full" type="button" aria-haspopup="menu" aria-expanded={categoryOpen}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package h-4 w-4"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg>
            <span>{ category === 'official' ? t('official') : category === 'community' ? t('community') : t('all') }</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 ml-auto"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          {categoryOpen ? (
            <div className="absolute left-0 right-0 mt-1 z-20">
              <div className="bg-[#0B0C0E] border border-[#1F2124] rounded-lg overflow-hidden shadow-lg p-0">
                <button onClick={()=>{ setCategory('all'); setCategoryOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">
                  {t('all')}
                </button>
                <button onClick={()=>{ setCategory('official'); setCategoryOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown size-5 mr-2 text-white"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>
                  {t('official')}
                </button>
                <button onClick={()=>{ setCategory('community'); setCategoryOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users size-5 mr-2 text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  {t('community')}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button onClick={()=>{ setSortOpen(v=>!v); setCategoryOpen(false); setVolOpen(false); setPriceOpen(false); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#0B0C0E] border-[#1F2124] text-white hover:bg-[#111317] rounded-md w-full" type="button" aria-haspopup="menu" aria-expanded={sortOpen}>
          <div className="h-4 w-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"><path d="M8.33333 6.66667H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M11.666 5V8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M17.5 13.3333H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M17.4993 6.66667H11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M6.66602 11.6667V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M6.66667 13.3333H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </div>
            <span className="truncate">{ sort === 'mostPopular' ? t('mostPopular') : sort === 'newest' ? t('newest') : sort === 'priceLowToHigh' ? t('priceLowToHigh') : t('priceHighToLow') }</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 ml-auto"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          {sortOpen ? (
            <div className="absolute left-0 right-0 mt-1 z-20">
              <div className="bg-[#0B0C0E] border border-[#1F2124] rounded-lg overflow-hidden shadow-lg p-0 w-56">
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ setSort('mostPopular'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('mostPopular')}</button>
                  <button onClick={()=>{ setSort('newest'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('newest')}</button>
                  <button onClick={()=>{ setSort('priceHighToLow'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('priceHighToLow')}</button>
                  <button onClick={()=>{ setSort('priceLowToHigh'); setSortOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('priceLowToHigh')}</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button onClick={()=>{ setVolOpen(v=>!v); setCategoryOpen(false); setSortOpen(false); setPriceOpen(false); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#0B0C0E] border-[#1F2124] text-white hover:bg-[#111317] rounded-md w-full" type="button" aria-haspopup="menu" aria-expanded={volOpen}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame h-4 w-4"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
            <span>{t("volatility")}</span>
            {volLabel ? <span className="text-gray-400 ml-1">{volLabel}</span> : null}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 ml-auto"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          {volOpen ? (
            <div className="absolute left-0 mt-1 z-20 w-80">
              <div className="bg-[#0B0C0E] border border-[#1F2124] rounded-lg overflow-hidden shadow-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('maximumVolatility')}</h3>
                  <p className="text-sm text-gray-400">{t('filterByRisk')}</p>
                </div>
                <div className="space-y-4">
                  <span className="relative flex touch-none select-none items-center w-full" onMouseDown={onTrackMouseDown}>
                    <span ref={volTrackRef} className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-800">
                      <span className="absolute h-full bg-blue-500" style={volFillStyle} />
                    </span>
                    <span style={minThumbStyle}>
                      <span role="slider" aria-label="Minimum" aria-valuemin={1} aria-valuemax={5} aria-valuenow={volMin} tabIndex={0} className="block h-5 w-5 rounded-full border-4 border-blue-600 bg-white shadow-lg cursor-grab active:cursor-grabbing" onKeyDown={(e)=>{ if(e.key==='ArrowLeft') setVolMin(Math.max(1, volMin-1)); if(e.key==='ArrowRight') setVolMin(Math.min(5, volMin+1)); }} onMouseDown={onThumbMouseDown('min')} />
                    </span>
                    <span style={maxThumbStyle}>
                      <span role="slider" aria-label="Maximum" aria-valuemin={1} aria-valuemax={5} aria-valuenow={volMax} tabIndex={0} className="block h-5 w-5 rounded-full border-4 border-blue-600 bg-white shadow-lg cursor-grab active:cursor-grabbing" onKeyDown={(e)=>{ if(e.key==='ArrowLeft') setVolMax(Math.max(1, volMax-1)); if(e.key==='ArrowRight') setVolMax(Math.min(5, volMax+1)); }} onMouseDown={onThumbMouseDown('max')} />
                    </span>
                  </span>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">{t('lowRisk')}</span><span className="text-gray-400">{t('highRisk')}</span></div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button onClick={()=>{ setPriceOpen(v=>!v); setCategoryOpen(false); setSortOpen(false); setVolOpen(false); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground py-2 h-10 px-4 bg-[#0B0C0E] border-[#1F2124] text-white hover:bg-[#111317] rounded-md w-full" type="button" aria-haspopup="menu" aria-expanded={priceOpen}>
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
            <div className="absolute left-0 mt-1 z-20 w-80">
              <div className="bg-[#0B0C0E] border border-[#1F2124] rounded-lg overflow-hidden shadow-lg p-0">
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ setPrice('allPrices'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('allPrices')}</button>
                </div>
                <div className="flex h-px bg-gray-600" />
                <div className="flex flex-col px-2 py-1.5 gap-1">
                  <button onClick={()=>{ setPrice('gte500'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('gte500')}</button>
                  <button onClick={()=>{ setPrice('range250to500'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('range250to500')}</button>
                  <button onClick={()=>{ setPrice('range100to250'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('range100to250')}</button>
                  <button onClick={()=>{ setPrice('range50to100'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('range50to100')}</button>
                  <button onClick={()=>{ setPrice('range25to50'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('range25to50')}</button>
                  <button onClick={()=>{ setPrice('range5to25'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('range5to25')}</button>
                  <button onClick={()=>{ setPrice('lte5'); setPriceOpen(false); }} className="relative flex select-none items-center gap-2 hover:bg-[#111317] px-3 py-2 text-base text-white font-semibold w-full text-left">{t('lte5')}</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


