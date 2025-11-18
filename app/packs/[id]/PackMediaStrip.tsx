'use client';

import React, { useMemo, useState, useEffect } from 'react';
import SelectPackModal from './SelectPackModal';
import { toDisplayProductFromCatalog } from '../../lib/catalogV2';
import type { CatalogItem, DisplayProduct } from '../../lib/catalogV2';
import type { CatalogPack } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import ProductCard from './ProductCard';

export default function PackMediaStrip({ primaryPackId, primaryImageUrl, title }: { primaryPackId?: string; primaryImageUrl: string; title: string }) {
  const dashed = "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='rgb(90 94 98)' stroke-width='1' stroke-dasharray='4%25%2c 4%25' stroke-dashoffset='5' stroke-linecap='square'/%3e%3c/svg%3e\")";
  const [hoverAdd, setHoverAdd] = useState(false);
  const [hoverAddIdx, setHoverAddIdx] = useState<number | null>(null);
  const [hoverDelIdx, setHoverDelIdx] = useState<number | null>(null);
  const [isSlotMachineSpinning, setIsSlotMachineSpinning] = useState<boolean>(false);
  // 统一以 packId 存储当前 1..6 槽位
  const [slotPackIds, setSlotPackIds] = useState<string[]>(() => {
    if (primaryPackId) return [primaryPackId];
    // 退化：无法拿到 id 时，只能空数组，占位渲染会使用 dashed
    return [];
  });
  const [selectOpen, setSelectOpen] = useState(false);
  const maxTiles = 6;
  
  // 将slotPackIds暴露给全局，供老虎机组件使用
  useEffect(() => {
    (window as any).__slotPackIds = slotPackIds;
  }, [slotPackIds]);

  const { data: packs = [] as CatalogPack[] } = (useQuery as any)({ queryKey: ['packs'], queryFn: api.getPacks, staleTime: 30_000 });
  const packMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const p of packs) m[p.id] = p;
    return m;
  }, [packs]);
  const remainingPlaceholders = Math.max(0, maxTiles - slotPackIds.length);
  const slotUrls = useMemo(() => {
    return slotPackIds.map((id) => {
      const pack = packMap[id];
      return pack ? pack.image : '';
    });
  }, [slotPackIds, packMap]);

  // 底部详情仅渲染每个 packId 的第一份（去重），顺序按首次出现
  const uniqueDetailsPackIds = useMemo(() => {
    const seen = new Set<string>();
    const res: string[] = [];
    for (const id of slotPackIds) {
      if (!seen.has(id)) {
        seen.add(id);
        res.push(id);
      }
    }
    return res;
  }, [slotPackIds]);

  useEffect(() => {
    const interval = setInterval(() => {
      const spinning = (window as any).__isSlotMachineSpinning || false;
      setIsSlotMachineSpinning(spinning);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  function addSamePackId(id: string) {
    if (slotPackIds.length >= maxTiles || isSlotMachineSpinning) return;
    setSlotPackIds(prev => [...prev, id]);
  }
  function removeAt(index: number) {
    if (index === 0 || isSlotMachineSpinning) return;
    setSlotPackIds(prev => prev.filter((_, i) => i !== index));
  }
  function openSelect() {
    if (isSlotMachineSpinning) return;
    setSelectOpen(true);
  }
  return (
    <div className="flex self-center w-full max-w-screen-xl px-4 flex-col gap-10">
      <div className="flex items-center justify-center p-4 lg:pl-8 rounded-lg" style={{ backgroundColor: '#22272B' }}>
        <div className="flex flex-col justify-center xl:w-full xl:flex-row gap-3 items-center">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {slotPackIds.map((id, idx) => {
              const url = slotUrls[idx] || primaryImageUrl;
              return (
              <div
                key={id + '-' + idx}
                className="group rounded-lg size-24 lg:size-32 shrink-0 cursor-pointer overflow-hidden border border-white/5 py-2 relative"
                onClick={() => openSelect()}
              >
                <img
                  alt={title}
                  loading="lazy"
                  width={128}
                  height={128}
                  decoding="async"
                  className="w-full h-full object-contain"
                  style={{ color: 'transparent' }}
                  srcSet={`${url.replace('w-256', 'w-128')} 1x, ${url} 2x`}
                  src={url}
                />
                {idx === 0 ? (
                  <div className="absolute top-1 right-1 flex flex-col gap-1">
                    {slotPackIds.length < maxTiles ? (
                      <button
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
                        type="button"
                        aria-label="add"
                        disabled={isSlotMachineSpinning}
                        onMouseEnter={() => !isSlotMachineSpinning && setHoverAdd(true)}
                        onMouseLeave={() => setHoverAdd(false)}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isSlotMachineSpinning) addSamePackId(slotPackIds[0]); 
                        }}
                        style={{
                          backgroundColor: hoverAdd && !isSlotMachineSpinning ? '#5A5E62' : '#34383C',
                          cursor: isSlotMachineSpinning ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus size-5 text-white">
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="absolute top-1 right-1 flex flex-col gap-1">
                    {/* delete */}
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
                      type="button"
                      aria-label="delete"
                      disabled={isSlotMachineSpinning}
                      onMouseEnter={() => !isSlotMachineSpinning && setHoverDelIdx(idx)}
                      onMouseLeave={() => setHoverDelIdx(null)}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!isSlotMachineSpinning) removeAt(idx); 
                      }}
                      style={{
                        backgroundColor: hoverDelIdx === idx && !isSlotMachineSpinning ? '#5A5E62' : '#34383C',
                        cursor: isSlotMachineSpinning ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="size-5 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                          <path d="M3.3335 5.83325H16.6668" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M15 5.83325V16.0416C15 16.7708 14.2857 17.4999 13.5714 17.4999H6.42857C5.71429 17.4999 5 16.7708 5 16.0416V5.83325" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M7.5 5.83333V4.16667C7.5 3.33333 8.125 2.5 8.75 2.5H11.25C11.875 2.5 12.5 3.33333 12.5 4.16667V5.83333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                    </button>
                    {/* add duplicate of this slot */}
                    {slotPackIds.length < maxTiles ? (
                      <button
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
                        type="button"
                        aria-label="add"
                        disabled={isSlotMachineSpinning}
                        onMouseEnter={() => !isSlotMachineSpinning && setHoverAddIdx(idx)}
                        onMouseLeave={() => setHoverAddIdx(null)}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isSlotMachineSpinning) addSamePackId(id); 
                        }}
                        style={{
                          backgroundColor: hoverAddIdx === idx && !isSlotMachineSpinning ? '#5A5E62' : '#34383C',
                          cursor: isSlotMachineSpinning ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus size-5 text-white">
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            )})}
            {Array.from({ length: remainingPlaceholders }).map((_, i) => (
              <div
                key={`ph-${i}`}
                className="rounded-lg size-24 lg:size-32 text-gray-500 flex items-center justify-center shrink-0 cursor-pointer"
                style={{ backgroundImage: dashed }}
                onClick={() => { if (!isSlotMachineSpinning) openSelect(); }}
              >
                <div className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 动态详情区：复用页面现有样式，仅渲染每个 packId 的一块（去重后顺序与格子一致） */}
      {uniqueDetailsPackIds.map((id, blockIdx) => {
        const pack = packMap[id];
        if (!pack) return null;
        const items: DisplayProduct[] = (pack.items || []).map((it: CatalogItem) => toDisplayProductFromCatalog(it));
        return (
          <div key={`${id}-${blockIdx}`} className="flex gap-8 w-full max-w-[1280px] mx-auto">
            <div className="flex-1 w-full min-w-0">
              <div className="self-stretch items-stretch space-y-3">
                <div className="flex items-center gap-4 py-3 flex-1 z-10 relative">
                  <div className="relative h-14 w-9" style={{ zIndex: 1 }}>
                    <img
                      alt={pack.title}
                      loading="lazy"
                      decoding="async"
                      src={pack.image}
                      style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent' }}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-extrabold" style={{ color: '#FAFAFA' }}>
                        {pack.title} - ${pack.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative bg-transparent font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10 transition-opacity duration-100 ease-in-out"
                        aria-label="favorite"
                        style={{ color: '#7A8084' }}
                      >
                        <div className="flex justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </div>
                      </button>
                    </div>
                    <span className="font-semibold" style={{ color: '#7A8084' }}>{items.length} 个物品</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {items.map(prod => (
                    <ProductCard key={prod.id} prod={prod} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <SelectPackModal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        selectedPackIds={slotPackIds}
        onSelectionChange={(ids) => {
          // 约束：最多六个，最少一个
          const arr = ids.slice(0, maxTiles);
          setSlotPackIds(arr.length > 0 ? arr : (primaryPackId ? [primaryPackId] : []));
        }}
      />
    </div>
  );
}


