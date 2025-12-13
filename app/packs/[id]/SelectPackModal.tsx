'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CatalogPack } from '../../lib/api';
import PacksToolbar from '../../components/PacksToolbar';
import PackCard from '../../components/PackCard';
import { usePacksFilters } from '../../hooks/usePacksFilters';

export default function SelectPackModal({
  open,
  onClose,
  selectedPackIds,
  onSelectionChange,
  maxPacks,
  minPacks,
  boxType = '1,2',
}: {
  open: boolean;
  onClose: () => void;
  selectedPackIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxPacks?: number;
  minPacks?: number;
  boxType?: '1' | '2'|'1,2'|"5";
}) {
  const effectiveMaxPacks = maxPacks === undefined ? (minPacks === 0 ? undefined : 6) : maxPacks;
  const effectiveMinPacks = minPacks === undefined ? 1 : minPacks;
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [hoverAddButtonId, setHoverAddButtonId] = useState<string | null>(null);
  
  // 使用筛选 hook
  const { filters, updateFilters, reset } = usePacksFilters({ type: boxType });
  
  const { data: boxListData, isLoading, error, refetch } = useQuery({
    queryKey: ['boxList', { ...filters, boxType }],
    queryFn: () => {
      // 确保至少传递默认参数
      const params = {
        sort_type: '1',
        volatility: '1',
        type: boxType,
        ...filters,
      };
      return api.getBoxList(params);
    },
    // 收藏列表不使用缓存，其他列表使用 30 秒缓存
    staleTime: filters.search_type === '3' ? 0 : 30_000,
    retry: 1,
  });
  
  const packs = useMemo(() => {
    if (boxListData?.code === 100000 && Array.isArray(boxListData.data)) {
      return boxListData.data.map((box: any) => ({
        id: String(box.id || box.box_id), // ✅ 统一转为字符串
        title: box.name || box.title || '',
        price: Number(box.bean || 0),
        image: box.cover || '',
        items: [],
      }));
    }
    return [] as CatalogPack[];
  }, [boxListData]);
  
  const isInitializingRef = useRef(false);
  const onSelectionChangeRef = useRef(onSelectionChange);
  
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // 初始化：只在打开弹窗时初始化一次
  const openedRef = useRef(false);
  const firstPackIdRef = useRef<string | null>(null);
  
  React.useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return;
    }
    
    if (openedRef.current) return;
    openedRef.current = true;
    
    // 记录第一个卡包ID（不能被删除）
    firstPackIdRef.current = selectedPackIds[0] || null;
    
    refetch();
    isInitializingRef.current = true;
    
    const next: Record<string, number> = {};
    selectedPackIds.forEach((id) => {
      next[id] = (next[id] || 0) + 1;
    });
    
    setQtyMap(next);
    
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 50);
  }, [open]);

  // PacksToolbar 内部管理搜索，这里不需要过滤
  const filtered: CatalogPack[] = packs;

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
  
  // 从 qtyMap 生成列表
  const generateListFromMap = (map: Record<string, number>): string[] => {
    const list: string[] = [];
    Object.entries(map).forEach(([id, count]) => {
      for (let i = 0; i < count; i++) {
        if (effectiveMaxPacks === undefined || list.length < effectiveMaxPacks) {
          list.push(id);
        }
      }
    });
    return list;
  };

  // qtyMap 变化时通知父组件
  useEffect(() => {
    if (isInitializingRef.current) return;
    const list = generateListFromMap(qtyMap);
    onSelectionChangeRef.current(list);
  }, [qtyMap]);

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
      if (curr <= 0) return prev;
      
      // 保护第一个卡包（使用打开弹窗时记录的第一个ID）
      if (id === firstPackIdRef.current && curr <= 1) {
        return prev;
      }
      
      return { ...prev, [id]: Math.max(0, curr - 1) };
    });
  };

  if (!open) return null;
  return (
    <div data-state="open" className="fixed px-4 inset-0 z-50 bg-black/[0.48] overflow-y-auto flex justify-center items-start py-16 mb-0" style={{ pointerEvents: 'auto', animation: 'modalFadeIn 180ms ease' }} onClick={onClose}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
      <style jsx global>{`
        .exchange-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .exchange-scroll::-webkit-scrollbar-track {
          background: #2c2c2c;
        }
        .exchange-scroll::-webkit-scrollbar-thumb {
          background: #9f9f9f;
          border-radius: 9999px;
        }
        .exchange-scroll::-webkit-scrollbar-button {
          background: #9f9f9f;
          height: 8px;
          width: 8px;
        }
        .exchange-scroll::-webkit-scrollbar-corner {
          background: #2c2c2c;
        }
        .exchange-scroll {
          scrollbar-color: #9f9f9f #2c2c2c;
          scrollbar-width: thin;
        }
      `}</style>
      <div role="dialog" aria-modal="true" className="overflow-hidden z-50 grid w-full gap-0 shadow-lg rounded-lg relative max-w-[896px]" data-component="SelectPackModal" tabIndex={-1} style={{ pointerEvents: 'auto', animation: 'modalZoomIn 180ms ease', backgroundColor: '#161A1D' }} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-xl text-white font-bold leading-none tracking-tight">选择礼包</h2>
          <button type="button" className="rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer" onClick={onClose} style={{ color: '#7A8084' }} aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>

        <div className="px-6">
          <PacksToolbar showCreateButton={false} filters={filters} onFilterChange={updateFilters} onReset={reset} />
        </div>

        <div className="px-6 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-[555px]">
              <p className="text-white">加载中...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[555px]">
              <p className="text-red-500">加载失败，请重试</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-[555px]">
              <p className="text-gray-400">暂无礼包</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-5 h-[555px] overflow-y-auto exchange-scroll">
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
          )}
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
