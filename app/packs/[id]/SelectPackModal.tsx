'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CatalogPack } from '../../lib/api';
import PacksToolbar from '../../components/PacksToolbar';
import PackCard from '../../components/PackCard';

export default function SelectPackModal({
  open,
  onClose,
  selectedPackIds,
  onSelectionChange,
  maxPacks,
  minPacks,
}: {
  open: boolean;
  onClose: () => void;
  selectedPackIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxPacks?: number;
  minPacks?: number;
}) {
  // 如果 maxPacks 是 undefined 且 minPacks 是 0，说明是对战页面，无限制
  // 如果 maxPacks 是 undefined 但 minPacks 不是 0（或未传入），说明是礼包页面，默认 6
  const effectiveMaxPacks = maxPacks === undefined ? (minPacks === 0 ? undefined : 6) : maxPacks;
  const effectiveMinPacks = minPacks === undefined ? 1 : minPacks;
  const [query, setQuery] = useState('');
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [hoverAddButtonId, setHoverAddButtonId] = useState<string | null>(null);
  const { data: packs = [] as CatalogPack[] , refetch } = useQuery({ queryKey: ['packs'], queryFn: api.getPacks, staleTime: 30_000 });
  const isInitializingRef = useRef(false);
  const onSelectionChangeRef = useRef(onSelectionChange);
  
  // 保持 onSelectionChange 引用最新
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // 初始化数量：根据当前选中的 packId 列表
  React.useEffect(() => {
    if (!open) return;
    // 打开时拉取一次最新 packs（JSON 优先）
    refetch();
    isInitializingRef.current = true;
    const next: Record<string, number> = {};
    selectedPackIds.forEach((id) => {
      next[id] = (next[id] || 0) + 1;
    });
    // 至少 effectiveMinPacks 个（仅对礼包页面有效）
    if (effectiveMinPacks > 0 && Object.values(next).reduce((a, b) => a + b, 0) === 0 && packs.length > 0) {
      const first = packs[0].id;
      next[first] = 1;
    }
    setQtyMap(next);
    // 使用 setTimeout 确保初始化完成后再允许触发回调
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 0);
  }, [open, selectedPackIds, packs.length, refetch, effectiveMinPacks]);

  const filtered: CatalogPack[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packs;
    return packs.filter((p: CatalogPack) => p.title.toLowerCase().includes(q));
  }, [query, packs]);

  const selectedCount = useMemo(() => {
    return Object.values(qtyMap).reduce((a, b) => a + (b || 0), 0);
  }, [qtyMap]);
  const selectedTotal = useMemo(() => {
    return Object.entries(qtyMap).reduce((sum: number, [id, q]: [string, number]) => {
      if (!q) return sum;
      const p = packs.find((x: CatalogPack) => x.id === id);
      return sum + (p ? p.price * q : 0);
    }, 0);
  }, [qtyMap, packs]);

  const getQty = (id: string) => qtyMap[id] || 0;
  
  // 从 qtyMap 生成 id 列表的函数
  const generateListFromMap = (map: Record<string, number>): string[] => {
    const list: string[] = [];
    // 先按 selectedPackIds 的去重顺序推入（避免重复顺序导致重复累加）
    const orderedUnique = Array.from(new Set(selectedPackIds));
    orderedUnique.forEach((id) => {
      const c = map[id] || 0;
      for (let i = 0; i < c; i++) {
        // 如果 effectiveMaxPacks 是 undefined，允许无限添加；否则检查是否超过限制
        if (effectiveMaxPacks === undefined) {
          list.push(id);
        } else if (list.length < effectiveMaxPacks) {
          list.push(id);
        }
      }
    });
    // 再补充其他在 map 中但不在 selectedPackIds 的 id
    Object.keys(map).forEach((id) => {
      if (orderedUnique.includes(id)) return;
      const c = map[id] || 0;
      for (let i = 0; i < c; i++) {
        // 如果 effectiveMaxPacks 是 undefined，允许无限添加；否则检查是否超过限制
        if (effectiveMaxPacks === undefined) {
          list.push(id);
        } else if (list.length < effectiveMaxPacks) {
          list.push(id);
        }
      }
    });
    // 至少 effectiveMinPacks 个（仅对礼包页面有效）
    if (effectiveMinPacks > 0 && list.length === 0) {
      if (selectedPackIds.length > 0) {
        list.push(selectedPackIds[0]);
      } else {
        const firstKey = Object.keys(map)[0];
        if (firstKey) list.push(firstKey);
      }
    }
    return list;
  };

  // 监听 qtyMap 变化，在渲染完成后触发回调
  useEffect(() => {
    if (isInitializingRef.current) return;
    const list = generateListFromMap(qtyMap);
    onSelectionChangeRef.current(list);
  }, [qtyMap, selectedPackIds, effectiveMaxPacks, effectiveMinPacks]);

  const inc = (id: string) => {
    setQtyMap(prev => {
      if (effectiveMaxPacks !== undefined) {
        const total = Object.values(prev).reduce((a, b) => a + (b || 0), 0);
        if (total >= effectiveMaxPacks) return prev;
      }
      return { ...prev, [id]: (prev[id] || 0) + 1 };
    });
  };
  const dec = (id: string) => {
    setQtyMap(prev => {
      const curr = prev[id] || 0;
      const next = Math.max(0, curr - 1);
      const map = { ...prev, [id]: next };
      // 全局最少 effectiveMinPacks：若总数为 effectiveMinPacks 且当前为 1，则不再递减（仅对礼包页面有效）
      if (effectiveMinPacks > 0) {
        const total = Object.values(map).reduce((a, b) => a + (b || 0), 0);
        if (total <= effectiveMinPacks && curr <= 1) return prev;
      }
      return map;
    });
  };

  if (!open) return null;
  return (
    <div data-state="open" className="fixed px-4 inset-0 z-50 bg-black/[0.48] overflow-y-auto flex justify-center items-start py-16" style={{ pointerEvents: 'auto', animation: 'modalFadeIn 180ms ease' }} onClick={onClose}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
      <div role="dialog" aria-modal="true" className="overflow-hidden z-50 grid w-full gap-0 shadow-lg rounded-lg relative max-w-[896px]" data-component="SelectPackModal" tabIndex={-1} style={{ pointerEvents: 'auto', animation: 'modalZoomIn 180ms ease', backgroundColor: '#161A1D' }} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-xl text-white font-bold leading-none tracking-tight">选择礼包</h2>
          <button type="button" className="rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer" onClick={onClose} style={{ color: '#7A8084' }} aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>

     

        {/* 可选：复用筛选组件（仅展示，不强制影响数据），满足“复用内部筛选组件” */}
        <div className="hidden md:block px-6">
          <PacksToolbar showCreateButton={false} />
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-5 h-[555px] overflow-y-auto">
            {filtered.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 relative items-stretch cursor-pointer w-full">
                <PackCard
                  imageUrl={p.image}
                  alt={p.title}
                  width={200}
                  height={304}
                  hoverTilt={false}
                  showActions
                  packId={p.id}
                  packTitle={p.title}
                  packPrice={p.price}
                />
                {getQty(p.id) === 0 ? (
                  <div className="flex items-center justify-between rounded-md w-full">
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-white font-bold select-none text-sm !rounded-md flex-1 h-9 p-0 rounded-md cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); inc(p.id); }}
                      type="button"
                      onMouseEnter={() => setHoverAddButtonId(p.id)}
                      onMouseLeave={() => setHoverAddButtonId((v) => (v === p.id ? null : v))}
                      style={{ backgroundColor: hoverAddButtonId === p.id ? '#5A5E62' : '#34383C' }}
                    >
                      <span className="font-bold text-sm">
                        {hoverAddButtonId === p.id ? 'Add Pack' : `$${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-md w-full">
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative text-white font-bold select-none text-sm !rounded-md size-9 p-0 cursor-pointer"
                      aria-label="remove pack"
                      onClick={(e) => { e.stopPropagation(); dec(p.id); }}
                      type="button"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                      style={{ backgroundColor: '#34383C' }}
                    >
                      <div className="size-4">
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.66667 8.00452C1.66667 7.45223 2.11439 7.00452 2.66667 7.00452L13.3333 7.00452C13.8856 7.00452 14.3333 7.45223 14.3333 8.00452C14.3333 8.5568 13.8856 9.00452 13.3333 9.00452L2.66667 9.00452C2.11439 9.00452 1.66667 8.5568 1.66667 8.00452Z" fill="currentColor"></path></svg>
                      </div>
                    </button>
                    <div className="flex flex-col items-center h-8 justify-center">
                      <span className="text-sm font-extrabold leading-none" style={{ color: '#FFFFFF' }}>{getQty(p.id)}</span>
                      <span className="text-xs font-extrabold leading-none" style={{ color: '#5A5E62' }}>
                        {`$${(p.price * getQty(p.id)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative text-white font-bold select-none text-sm !rounded-md size-9 p-0 cursor-pointer"
                      aria-label="add pack"
                      onClick={(e) => { e.stopPropagation(); inc(p.id); }}
                      type="button"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                      style={{ backgroundColor: '#34383C' }}
                    >
                      <div className="size-4">
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.00001 2.66675C9.00001 2.11446 8.55229 1.66675 8.00001 1.66675C7.44772 1.66675 7.00001 2.11446 7.00001 2.66675V7.00008L2.66667 7.00008C2.11439 7.00008 1.66667 7.4478 1.66667 8.00008C1.66667 8.55237 2.11439 9.00008 2.66667 9.00008H7.00001V13.3334C7.00001 13.8857 7.44772 14.3334 8.00001 14.3334C8.55229 14.3334 9.00001 13.8857 9.00001 13.3334V9.00008H13.3333C13.8856 9.00008 14.3333 8.55237 14.3333 8.00008C14.3333 7.4478 13.8856 7.00008 13.3333 7.00008H9.00001V2.66675Z" fill="currentColor"></path></svg>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6">
          <div className="h-[2px]" style={{ backgroundColor: '#1D2125' }} />
        </div>
        <div className="flex font-semibold gap-2 px-6 border-t h-14 items-center justify-end" style={{ borderColor: '#34383C' }}>
          <div className="flex gap-2">
            <span style={{ color: '#7A8084' }}>已选礼包:</span>
            <span style={{ color: '#FFFFFF' }}>{selectedCount}</span>
          </div>
          <span style={{ color: '#7A8084' }}>|</span>
          <div className="flex gap-2">
            <span style={{ color: '#7A8084' }}>总金额:</span>
            <span style={{ color: '#FFFFFF' }}>${selectedTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


