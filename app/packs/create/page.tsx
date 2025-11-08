'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { packImageVariants, PackImageVariant } from '../../lib/catalogV2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import ProductDetailsModal from '../../components/ProductDetailsModal';
import { useToast } from '../../components/ToastProvider';

function formatCurrency(num: number) {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CreatePackPage() {
  const { show } = useToast();
  const [items, setItems] = useState<Array<{ id: string; name: string; description?: string; image: string; price: number; dropProbability: number; qualityId: string }>>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [query, setQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0); // 0-based
  const pageSize = 24;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [probMap, setProbMap] = useState<Record<string, number>>({});
  const [detailsItemId, setDetailsItemId] = useState<string | null>(null);
  const [lteValue, setLteValue] = useState<number>(700000);
  const [packName, setPackName] = useState<string>('');
  const [commissionPct, setCommissionPct] = useState<number>(0.5);
  const [commissionOpen, setCommissionOpen] = useState<boolean>(false);
  const commissionOptions = useMemo(() => [0.5, 1.0, 1.5, 2.0, 2.5, 3.0], []);
  const commissionRef = useRef<HTMLDivElement | null>(null);
  const [selectedPackImageId, setSelectedPackImageId] = useState<string>(packImageVariants[0]?.id ?? 'version1');
  // toast 在需要时统一调用
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: itemsData = [], isLoading: productsLoading } = useQuery({ queryKey: ['products'], queryFn: api.getProducts, staleTime: 60_000 });
  useEffect(() => { setItems(itemsData); setLoadingItems(productsLoading); }, [itemsData, productsLoading]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q));
  }, [query, items]);

  const total = filtered.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);
  const visible = filtered.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  const disabledPrev = pageIndex <= 0;
  const disabledNext = end >= total;
 
  const itemMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; description?: string; image: string; price: number; dropProbability: number; qualityId: string }>();
    for (const it of items) map.set(it.id, it);
    return map;
  }, [items]);
  const selectedItems = useMemo(() => selectedIds.map(id => itemMap.get(id)).filter(Boolean) as { id: string; name: string; description?: string; image: string; price: number; dropProbability: number; qualityId: string }[], [selectedIds, itemMap]);
  const totalProb = useMemo(() => selectedIds.reduce((acc, id) => acc + (probMap[id] ?? 0), 0), [selectedIds, probMap]);
  const detailsItem = detailsItemId ? itemMap.get(detailsItemId) ?? null : null;
  const barColor = totalProb < 100 ? '#4299E1' : (totalProb === 100 ? '#68D391' : '#E53E3E');

  // Calibrate a pricing ratio from the given example:
  // $550,000 item at 1% probability => pack price $6,145.26
  // Expected value: 550000 * 0.01 = 5500; ratio = 6145.26 / 5500 ≈ 1.11732
  const HOUSE_RATIO = 6145.26 / (550000 * 0.01);
  const expectedValue = useMemo(() => selectedItems.reduce((sum, it) => sum + (it.price * ((probMap[it.id] ?? 0) / 100)), 0), [selectedItems, probMap]);
  const packPriceUsd = expectedValue * HOUSE_RATIO;
  const commissionRevenue = packPriceUsd * (commissionPct / 100);
  const selectedPackImage = useMemo(() => packImageVariants.find(p => p.id === selectedPackImageId) ?? packImageVariants[0], [selectedPackImageId]);

  // close commission dropdown on outside click
  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (!commissionOpen) return;
      const target = e.target as Node;
      if (commissionRef.current && !commissionRef.current.contains(target)) {
        setCommissionOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [commissionOpen]);

  // LTE amount input helpers (min=0.01, max=700000)
  const clampLte = (v: number) => Math.min(700000, Math.max(0.01, v));
  const setMinLte = () => setLteValue(0.01);
  const halfLte = () => setLteValue(v => clampLte(v / 2));
  const doubleLte = () => setLteValue(v => clampLte(v * 2));
  const setMaxLte = () => setLteValue(700000);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(x => x !== id) : [...prev, id];
      setProbMap(pm => {
        const nextPm = { ...pm };
        if (isSelected) {
          delete nextPm[id];
        } else if (nextPm[id] == null) {
          nextPm[id] = 1.0;
        }
        return nextPm;
      });
      return next;
    });
  }

  function formatPercent(v: number) {
    return v.toFixed(4);
  }
  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
  function incProb(id: string) {
    setProbMap(pm => {
      const v = pm[id] ?? 0;
      const nv = clamp(v + 1, 0.0001, 99.9999);
      return { ...pm, [id]: +nv.toFixed(4) };
    });
  }
  function decProb(id: string) {
    setProbMap(pm => {
      const v = pm[id] ?? 0;
      const nv = clamp(v - 1, 0.0001, 99.9999);
      return { ...pm, [id]: +nv.toFixed(4) };
    });
  }
  function setProbFromInput(id: string, raw: string) {
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    setProbMap(pm => {
      const nv = clamp(num, 0.0001, 99.9999);
      return { ...pm, [id]: +nv.toFixed(4) };
    });
  }

  return (
    <div className="flex flex-col flex-1 items-stretch relative">
      <div className="flex justify-center">
        <div className="max-w-screen-xl flex-1 ps-4 pe-4">
          <div className="flex flex-col w-full gap-6 pb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* 左侧：步骤1 + 搜索/价格 + 商品网格 */}
              <div className="w-full md:w-0 h-[700px] max-h-[700px] flex flex-1 rounded-lg p-6 flex-col gap-6" style={{ backgroundColor: '#22272B' }}>
                {/* 标题 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-md w-8 h-8 justify-center" style={{ backgroundColor: '#161A1D' }}>
                    <span className="font-black text-lg" style={{ color: '#FAFAFA' }}>1</span>
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>选择物品</h3>
                  <span className="text-sm font-bold" style={{ color: '#7A8084' }}>(最多 50 个物品)</span>
                </div>

                {/* 搜索 + 价格 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* 搜索 */}
                  <div className="flex w-full">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white size-4 pointer-events-none">
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M10.2249 11.1723C9.21863 11.9739 7.94399 12.4529 6.55747 12.4529C3.30405 12.4529 0.666626 9.81548 0.666626 6.56205C0.666626 3.30863 3.30405 0.671204 6.55747 0.671204C9.81089 0.671204 12.4483 3.30863 12.4483 6.56205C12.4483 7.94857 11.9693 9.22321 11.1677 10.2295L14.8651 13.9269C15.1255 14.1873 15.1255 14.6094 14.8651 14.8697C14.6048 15.1301 14.1827 15.1301 13.9223 14.8697L10.2249 11.1723ZM1.99996 6.56205C1.99996 4.04501 4.04043 2.00454 6.55747 2.00454C9.07451 2.00454 11.115 4.04501 11.115 6.56205C11.115 7.78993 10.6294 8.90439 9.83981 9.72389L9.7193 9.8444C8.8998 10.634 7.78534 11.1196 6.55747 11.1196C4.04043 11.1196 1.99996 9.0791 1.99996 6.56205Z" fill="currentColor" stroke="currentColor" strokeMiterlimit="10" strokeLinecap="square"></path>
                        </svg>
                      </div>
                      <input
                        className="flex h-10 rounded-md border border-gray-600 focus:border-gray-600 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 pl-10 pr-10 font-semibold border-none w-full placeholder-[#7A8084]"
                        placeholder="搜索"
                        enterKeyHint="search"
                        value={query}
                        onChange={(e) => { setPageIndex(0); setQuery(e.target.value); }}
                        style={{ backgroundColor: '#1D2125', color: '#FAFAFA', caretColor: '#FAFAFA' }}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center"></div>
                    </div>
                  </div>

                  {/* 价格输入（展示样式） */}
                  <div className="relative flex bg-gray-800 rounded-md items-center justify-between h-10">
                    <div className="rounded-tl-md rounded-bl-md flex items-center h-full font-bold text-sm gap-2 px-3" style={{ backgroundColor: '#34383C', color: '#FAFAFA' }}>
                      <span style={{ color: '#FAFAFA' }}>LTE</span>
                    </div>
                    <div className="flex relative flex-1">
                      <input
                        className="flex h-10 w-full border-gray-600 focus:border-gray-600 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 border-0 font-semibold pr-32 rounded-md"
                        value={`$${formatCurrency(lteValue)}`}
                        readOnly
                        style={{ backgroundColor: '#1D2125', color: '#FAFAFA', caretColor: '#FAFAFA' }}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button onClick={setMinLte} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-sm !rounded-md font-bold px-2 h-7 cursor-pointer bg-[#34383C] text-white hover:bg-[#5A5E62]">最小</button>
                        <button onClick={halfLte} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-sm !rounded-md font-bold px-2 h-7 md:hidden lg:block cursor-pointer bg-[#34383C] text-white hover:bg-[#5A5E62]">1/2x</button>
                        <button onClick={doubleLte} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-sm !rounded-md font-bold px-2 h-7 md:hidden lg:block cursor-pointer bg-[#34383C] text-white hover:bg-[#5A5E62]">2x</button>
                        <button onClick={setMaxLte} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-sm !rounded-md font-bold px-2 h-7 cursor-pointer bg-[#34383C] text-white hover:bg-[#5A5E62]">最大</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 顶部分页信息 + 网格 + 底部分页信息（整体可滚） */}
                <div className="overflow-scroll w-full no-scrollbar max-h-full h-full self-stretch z-10">
                <div className="flex justify-between self-stretch gap-3 py-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-bold" style={{ color: '#FAFAFA' }}>显示 {start} - {end} 共 {total}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-7 px-4 text-sm !rounded-md ${disabledPrev ? 'cursor-default text-[#7A8084]' : 'cursor-pointer text-white hover:bg-[#5A5E62]'}`}
                      disabled={disabledPrev}
                      onClick={() => !disabledPrev && setPageIndex(i => Math.max(0, i - 1))}
                      style={{ backgroundColor: '#34383C' }}
                    >
                      上一页
                    </button>
                    <button
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-7 px-4 text-sm !rounded-md ${disabledNext ? 'cursor-default text-[#7A8084]' : 'cursor-pointer text-white hover:bg-[#5A5E62]'}`}
                      style={{ backgroundColor: '#34383C' }}
                      disabled={disabledNext}
                      onClick={() => !disabledNext && setPageIndex(i => i + 1)}
                    >
                      下一页
                    </button>
                  </div>
                </div>

                {/* 商品网格（使用你的商品数据 catalogItems） */}
                <div className="w-full space-y-6 z-10">
                  <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full py-4">
                    {visible.map((prod) => (
                      <div
                        key={prod.id}
                        className="relative transition cursor-pointer rounded-lg pb-[100%] border-2 border-solid"
                        style={{
                          backgroundColor: '#292F34',
                          borderColor: selectedIds.includes(prod.id) ? '#FFFFFF' : 'transparent'
                        }}
                        onMouseEnter={(e)=>{
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.backgroundColor = '#34383C';
                          if (!selectedIds.includes(prod.id)) el.style.borderColor = '#292F34';
                        }}
                        onMouseLeave={(e)=>{
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.backgroundColor = '#292F34';
                          el.style.borderColor = selectedIds.includes(prod.id) ? '#FFFFFF' : 'transparent';
                        }}
                      >
                        {/* 眼睛按钮（仅展示样式） */}
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 absolute top-2 left-2 z-10 cursor-pointer bg-[#34383C] hover:bg-[#5A5E62]" aria-label="view details" onClick={()=>setDetailsItemId(prod.id)}>
                          <div className="size-4 flex justify-center">
                            <svg viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M10.2015 15.9999C8.17738 16.0075 6.19172 15.4472 4.47046 14.3825C2.74883 13.3179 1.36052 11.7915 0.463115 9.97718C-0.15429 8.73041 -0.15429 7.26686 0.463115 6.02009C1.67464 3.59605 3.74642 1.71115 6.27399 0.733299C8.80128 -0.244433 11.6026 -0.244433 14.1295 0.733299C16.657 1.71103 18.7288 3.59601 19.9404 6.02009C20.5578 7.26686 20.5578 8.73041 19.9404 9.97718C19.043 11.7915 17.6547 13.3179 15.9331 14.3825C14.2116 15.4471 12.2259 16.0075 10.202 15.9999H10.2015ZM2.19045 6.87906C1.83288 7.58259 1.83288 8.41472 2.19045 9.11825C2.91884 10.6182 4.0588 11.8802 5.47715 12.7569C6.89566 13.6336 8.53407 14.0888 10.2014 14.0695C11.8687 14.0888 13.5072 13.6336 14.9256 12.7569C16.344 11.8802 17.4839 10.6182 18.2123 9.11825C18.5699 8.41472 18.5699 7.58259 18.2123 6.87906C17.4839 5.37911 16.344 4.11716 14.9256 3.24044C13.5071 2.36372 11.8687 1.90855 10.2014 1.92778C8.53403 1.90855 6.89562 2.36372 5.47715 3.24044C4.0588 4.11716 2.91884 5.37911 2.19045 6.87906ZM10.2005 11.859C9.1766 11.859 8.19469 11.4523 7.47064 10.7283C6.7466 10.0042 6.3399 9.02232 6.3399 7.99838C6.3399 6.97445 6.7466 5.99254 7.47064 5.2685C8.19469 4.54445 9.1766 4.13776 10.2005 4.13776C11.2245 4.13776 12.2064 4.54445 12.9304 5.2685C13.6545 5.99254 14.0612 6.97445 14.0612 7.99838C14.0612 9.02232 13.6545 10.0042 12.9304 10.7283C12.2064 11.4523 11.2245 11.859 10.2005 11.859Z" fill="currentColor"></path></svg>
                          </div>
                        </button>
                        {/* 可点击区域 */}
                        <button className="absolute inset-0 top-0 left-0 w-full h-full" tabIndex={0} onClick={() => toggleSelect(prod.id)}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center justify-center h-full w-full p-6">
                              <div className="relative flex items-center justify-center w-24 h-24">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  alt={prod.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="object-contain pointer-events-none"
                                  sizes="(min-width: 0px) 100px"
                                  src={`${prod.image}?tr=w-3840,c-at_max`}
                                  style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }}
                                />
                              </div>
                              <div className="flex flex-col items-center space-y-0 max-w-full">
                                <span className="text-sm font-bold truncate max-w-full" style={{ color: '#7A8084' }}>{prod.name}</span>
                                <span className="text-sm font-extrabold" style={{ color: '#FAFAFA' }}>${formatCurrency(prod.price)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 底部分页信息 */}
                <div className="flex justify-between self-stretch gap-3 py-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-bold" style={{ color: '#FAFAFA' }}>显示 {start} - {end} 共 {total}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-7 px-4 text-sm !rounded-md ${disabledPrev ? 'cursor-default text-[#7A8084]' : 'cursor-pointer text-white hover:bg-[#5A5E62]'}`}
                      disabled={disabledPrev}
                      onClick={() => !disabledPrev && setPageIndex(i => Math.max(0, i - 1))}
                      style={{ backgroundColor: '#34383C' }}
                    >
                      上一页
                    </button>
                    <button
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-7 px-4 text-sm !rounded-md ${disabledNext ? 'cursor-default text-[#7A8084]' : 'cursor-pointer text-white hover:bg-[#5A5E62]'}`}
                      style={{ backgroundColor: '#34383C' }}
                      disabled={disabledNext}
                      onClick={() => !disabledNext && setPageIndex(i => i + 1)}
                    >
                      下一页
                    </button>
                  </div>
                </div>
                </div>
              </div>

              {/* 右侧：步骤2 概率与价格 */}
              <div className="w-full md:w-[340px] rounded-lg flex flex-col p-6 gap-6 h-[700px]" style={{ backgroundColor: '#22272B' }}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-md w-8 h-8 justify-center" style={{ backgroundColor: '#161A1D' }}>
                      <span className="font-black text-lg" style={{ color: '#FAFAFA' }}>2</span>
                    </div>
                    <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>设置掉落概率</h3>
                  </div>
                  <div className="flex justify-between items-center relative">
                    <span className="text-sm font-bold" style={{ color: '#7A8084' }}>总和必须为 100%</span>
                    <span className="text-sm font-bold" style={{ color: '#FAFAFA' }}>{formatPercent(totalProb)}%</span>
                    <div className="absolute -left-9 bottom-0 w-6 h-6 flex-none rounded-full" style={{ backgroundColor: '#1D2125' }}></div>
                    <div className="absolute -right-9 bottom-0 w-6 h-6 flex-none rounded-full" style={{ backgroundColor: '#1D2125' }}></div>
                  </div>
                  <div className="w-full max-w-xl rounded-md overflow-hidden" style={{ backgroundColor: '#5A5E62' }}>
                    <div className="relative h-6 bg-blue-400 rounded-md progress-bar animated" style={{ width: `${Math.max(0, Math.min(100, totalProb))}%`, backgroundColor: barColor }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 overflow-scroll no-scrollbar h-full">
                  {/* 已选卡片列表 */}
                  {selectedItems.map(item => (
                    <div key={item.id} data-component="SelectedProduct" className="relative rounded-lg flex flex-col p-4" tabIndex={0} style={{ backgroundColor: '#292F34' }}>
                      {/* view details */}
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 z-10 absolute top-3 left-3 cursor-pointer bg-[#34383C] hover:bg-[#5A5E62]" aria-label="view details" onClick={()=>setDetailsItemId(item.id)}>
                        <div className="size-4 flex justify-center">
                          <svg viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M10.2015 15.9999C8.17738 16.0075 6.19172 15.4472 4.47046 14.3825C2.74883 13.3179 1.36052 11.7915 0.463115 9.97718C-0.15429 8.73041 -0.15429 7.26686 0.463115 6.02009C1.67464 3.59605 3.74642 1.71115 6.27399 0.733299C8.80128 -0.244433 11.6026 -0.244433 14.1295 0.733299C16.657 1.71103 18.7288 3.59601 19.9404 6.02009C20.5578 7.26686 20.5578 8.73041 19.9404 9.97718C19.043 11.7915 17.6547 13.3179 15.9331 14.3825C14.2116 15.4471 12.2259 16.0075 10.202 15.9999H10.2015ZM2.19045 6.87906C1.83288 7.58259 1.83288 8.41472 2.19045 9.11825C2.91884 10.6182 4.0588 11.8802 5.47715 12.7569C6.89566 13.6336 8.53407 14.0888 10.2014 14.0695C11.8687 14.0888 13.5072 13.6336 14.9256 12.7569C16.344 11.8802 17.4839 10.6182 18.2123 9.11825C18.5699 8.41472 18.5699 7.58259 18.2123 6.87906C17.4839 5.37911 16.344 4.11716 14.9256 3.24044C13.5071 2.36372 11.8687 1.90855 10.2014 1.92778C8.53403 1.90855 6.89562 2.36372 5.47715 3.24044C4.0588 4.11716 2.91884 5.37911 2.19045 6.87906ZM10.2005 11.859C9.1766 11.859 8.19469 11.4523 7.47064 10.7283C6.7466 10.0042 6.3399 9.02232 6.3399 7.99838C6.3399 6.97445 6.7466 5.99254 7.47064 5.2685C8.19469 4.54445 9.1766 4.13776 10.2005 4.13776C11.2245 4.13776 12.2064 4.54445 12.9304 5.2685C13.6545 5.99254 14.0612 6.97445 14.0612 7.99838C14.0612 9.02232 13.6545 10.0042 12.9304 10.7283C12.2064 11.4523 11.2245 11.859 10.2005 11.859Z" fill="currentColor"></path></svg>
                        </div>
                      </button>
                      {/* remove */}
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 absolute top-3 right-3 self-end flex-none cursor-pointer bg-[#34383C] hover:bg-[#5A5E62]" aria-label="Remove product" onClick={()=>toggleSelect(item.id)}>
                        <div className="size-4">
                          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="currentColor"></path></svg>
                        </div>
                      </button>
                      {/* center content */}
                      <div className="flex flex-col items-center justify-center h-full w-full p-6">
                        <div className="relative flex items-center justify-center w-24 h-24">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={item.name} loading="lazy" decoding="async" className="object-contain pointer-events-none" sizes="(min-width: 0px) 100px" src={`${item.image}?tr=w-3840,c-at_max`} style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }} />
                        </div>
                        <div className="flex flex-col items-center space-y-0 max-w-full">
                          <span className="text-sm font-bold truncate max-w-full" style={{ color: '#7A8084' }}>{item.name}</span>
                          <span className="text-sm font-extrabold" style={{ color: '#FAFAFA' }}>${formatCurrency(item.price)}</span>
                        </div>
                      </div>
                      {/* bottom controls */}
                      <div className="relative flex w-full" style={{ backgroundColor: '#1D2125' }}>
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10">
                          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 cursor-pointer bg-[#34383C] hover:bg-[#5A5E62]" aria-label="Decrement" onClick={()=>decProb(item.id)}>
                            <div className="size-3 flex justify-center">
                              <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M0.351473 8.61827C0.585787 8.38395 0.892894 8.2668 1.2 8.2668C1.50711 8.2668 3.6 8.2668 3.6 8.2668L4.8 1.4668C4.8 0.804055 5.33726 0.266797 6 0.266797C6.66274 0.266797 7.2 0.804056 7.2 1.4668L8.4 8.2668C8.4 8.2668 10.4929 8.2668 10.8 8.2668C11.1071 8.2668 11.4142 8.38395 11.6485 8.61827C12.1172 9.0869 12.1172 9.8467 11.6485 10.3153L6.84853 15.1153C6.3799 15.584 5.6201 15.584 5.15147 15.1153L0.351473 10.3153C-0.117157 9.8467 -0.117156 9.0869 0.351473 8.61827Z" fill="currentColor"></path></svg>
                            </div>
                          </button>
                        </div>
                        <input className="flex h-10 rounded-md border-gray-600 focus:border-gray-600 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 w-full font-bold text-center border-0" min={0.0001} max={99.9999} step={0.0001} type="number" value={formatPercent(probMap[item.id] ?? 1.0)} onChange={(e)=>setProbFromInput(item.id, e.target.value)} style={{ backgroundColor: '#1D2125', color: '#FAFAFA', caretColor: '#FAFAFA' }} />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
                          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 cursor-pointer bg-[#34383C] hover:bg-[#5A5E62]" aria-label="Increment" onClick={()=>incProb(item.id)}>
                            <div className="size-3 flex justify-center">
                              <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M11.6485 6.84853C11.4142 7.08284 11.1071 7.2 10.8 7.2C10.4929 7.2 8.4 7.2 8.4 7.2L7.2 14C7.2 14.6627 6.66274 15.2 6 15.2C5.33726 15.2 4.8 14.6627 4.8 14L3.6 7.2C3.6 7.2 1.50711 7.2 1.2 7.2C0.892894 7.2 0.585787 7.08284 0.351471 6.84853C-0.117157 6.3799 -0.117157 5.6201 0.351472 5.15147L5.15147 0.351472C5.6201 -0.117157 6.3799 -0.117157 6.84853 0.351472L11.6485 5.15147C12.1172 5.6201 12.1172 6.3799 11.6485 6.84853Z" fill="currentColor"></path></svg>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* 未达2个时仍显示提示 */}
                  {selectedItems.length < 2 && (
                    <div className="flex flex-1 h-full w-full pb-2 rounded-md" style={{ backgroundColor: '#1D2125' }}>
                      <div className="flex flex-col h-full w-full pb-2 justify-center px-6">
                        <span className="text-lg font-bold text-center" style={{ color: '#7A8084' }}>至少选择两个产品</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between ">
                  <span className="text-sm font-bold" style={{ color: '#7A8084' }}>计算出的礼包价格</span>
                  <span className="text-sm font-bold" style={{ color: '#FAFAFA' }}>${formatCurrency(packPriceUsd)}</span>
                </div>
              </div>
              {/* 详情弹窗 */}
              {detailsItem && (
                <ProductDetailsModal
                  open={!!detailsItem}
                  onClose={()=>setDetailsItemId(null)}
                  name={detailsItem.name}
                  image={`${detailsItem.image}?tr=w-1024,c-at_max`}
                  price={detailsItem.price}
                  description={detailsItem.description}
                />
              )}
            </div>

            {/* Step 3 & 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Step 3: Name your pack */}
              <div className="flex flex-1 rounded-lg p-6 flex-col gap-6 col-span-1" style={{ backgroundColor: '#22272B' }}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-md w-8 h-8 justify-center" style={{ backgroundColor: '#161A1D' }}>
                    <span className="font-black text-lg" style={{ color: '#FAFAFA' }}>3</span>
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>命名您的礼包</h3>
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-bold leading-6" htmlFor="packName" style={{ color: '#FAFAFA' }}>礼包名称</label>
                    <span className="text-sm font-bold" style={{ color: '#7A8084' }}>(最多 20 个字符)</span>
                  </div>
                  <div className="my-2">
                    <input
                      id="packName"
                      name="packName"
                      maxLength={20}
                      placeholder="礼包名称"
                      value={packName}
                      onChange={(e)=>setPackName(e.target.value)}
                      className="flex h-10 w-full rounded-md px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium interactive-focus !-outline-offset-1 border-0"
                      style={{ backgroundColor: '#1D2125', color: '#FAFAFA', caretColor: '#FAFAFA', borderColor: '#34383C' }}
                    />
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#7A8084' }}>您的礼包名称不能包含特殊字符、淫秽内容或冒犯性内容。</span>
                </div>
              </div>

              {/* Step 4: Commission */}
              <div className="flex flex-1 rounded-lg p-6 flex-col gap-6 col-span-1" style={{ backgroundColor: '#22272B' }}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-md w-8 h-8 justify-center" style={{ backgroundColor: '#161A1D' }}>
                    <span className="font-black text-lg" style={{ color: '#FAFAFA' }}>4</span>
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>设置礼包佣金</h3>
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-bold leading-6" htmlFor="commission" style={{ color: '#FAFAFA' }}>佣金</label>
                    <span className="text-sm font-bold" style={{ color: '#7A8084' }}>(0.5% to 3.0%)</span>
                  </div>
                  <div className="my-2" ref={commissionRef}>
                    <div className="relative">
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded={commissionOpen}
                        aria-controls="commission-listbox"
                        className="flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm interactive-focus !-outline-offset-1 cursor-pointer"
                        style={{ backgroundColor: '#1D2125', color: '#FAFAFA', border: '1px solid #34383C' }}
                        onClick={()=>setCommissionOpen(o=>!o)}
                      >
                        <span style={{ pointerEvents: 'none' }}>{commissionPct.toFixed(1)}%</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </button>
                      {commissionOpen && (
                        <div id="commission-listbox" className="absolute left-0 right-0 mt-1 z-50 rounded-md shadow-lg border" style={{ backgroundColor: '#1D2125', borderColor: '#34383C' }}>
                          <ul className="max-h-60 overflow-auto no-scrollbar py-0">
                            {commissionOptions.map((v) => (
                              <li key={v} className="">
                                <button
                                  type="button"
                                  className={`w-full text-left px-3 py-2 text-sm cursor-pointer ${commissionPct === v ? 'font-bold' : ''}`}
                                  style={{ backgroundColor: '#1D2125', color: '#FAFAFA' }}
                                  onMouseEnter={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                                  onMouseLeave={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1D2125'; }}
                                  onClick={()=>{ setCommissionPct(v); setCommissionOpen(false); }}
                                >
                                  {v.toFixed(1)}%
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                       )}
                     </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#7A8084' }}>每个开启的礼包您将获得 ${formatCurrency(commissionRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Step 5: 选择礼包图片 */}
            <div className="max-h-full min-h-[500px] flex flex-1 rounded-lg p-6 flex-col gap-6" style={{ backgroundColor: '#22272B' }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-md w-8 h-8 justify-center" style={{ backgroundColor: '#161A1D' }}>
                  <span className="font-black text-lg" style={{ color: '#FAFAFA' }}>5</span>
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>选择礼包图片</h3>
              </div>
              <div className="flex items-start gap-10 pl-4 sm:pl-16 pr-4">
                {/* 左侧预览（小屏隐藏） */}
                <div className="hidden sm:flex w-[340px]">
                  <div className="relative aspect-[339/515] w-full h-full" style={{ backgroundColor: '#1D2125' }}>
                    {/* 预览使用选中图片 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Pack Preview"
                      src={`${selectedPackImage?.image}?w=1024`}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', color: 'transparent' }}
                    />
                    {/* 名称覆盖在图片上（底部居中）*/}
                    <div className="absolute left-0 right-0 flex items-start justify-center pointer-events-none" style={{ top: 40 }}>
                      <span
                        className="font-black text-center px-3"
                        style={{ color: '#FAFAFA', textShadow: '0 2px 6px rgba(0,0,0,0.8)', fontSize: '24px', lineHeight: '28px', wordBreak: 'break-word', maxWidth: '90%' }}
                      >
                        {packName || ''}
                      </span>
                    </div>
                  </div>
                </div>
                {/* 右侧图片选择网格（使用你自己的礼包图片数组 packImageVariants）*/}
                <div className="flex flex-wrap gap-4 overflow-scroll w-full no-scrollbar max-h-[380px]">
                  {packImageVariants.map((variant) => {
                    const isSelected = variant.id === selectedPackImageId;
                    return (
                      <button
                        key={variant.id}
                        className="rounded-md relative aspect-[339/515] h-full w-[calc(50%-8px)] sm:w-[100px] border-2 border-solid"
                        style={{ borderColor: isSelected ? '#FFFFFF' : '#1D2125', backgroundColor: '#22272B' }}
                        tabIndex={0}
                        onClick={() => setSelectedPackImageId(variant.id)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt="Pack"
                          loading="lazy"
                          decoding="async"
                          style={{ position: 'absolute', height: '100%', width: '100%', left: 0, top: 0, right: 0, bottom: 0, color: 'transparent', objectFit: 'contain' }}
                          sizes="200px"
                          src={`${variant.image}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 创建礼包按钮 */}
            <div className="flex justify-center mt-6">
              <button
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-14 px-8 cursor-pointer bg-[#4299E1] hover:bg-[#3182ce] text-white"
                onClick={async () => {
                  try {
                    if (packPriceUsd > 10000) {
                      show({ title: '糟糕，出错了。', description: '最终礼包价格必须低于 10,000 美元。', variant: 'error' });
                      return;
                    }
                    const itemsWithProb = selectedItems.map((it) => ({
                      ...it,
                      dropProbability: (probMap[it.id] ?? 1.0) / 100,
                    }));
                    const title = packName?.trim() || '未命名礼包';
                    const image = `${selectedPackImage?.image}`;
                    const price = packPriceUsd;
                    const created = await api.createPack({ title, image, price, items: itemsWithProb as any });
                    await queryClient.invalidateQueries({ queryKey: ['packs'] });
                    show({ title: '创建成功', description: `“${title}” 已添加到礼包列表。`, variant: 'success' });
                    router.push(`/packs?toast=created&name=${encodeURIComponent(title)}`);
                  } catch (e) {
                    console.error(e);
                    show({ title: '糟糕，出错了。', description: '创建失败', variant: 'error' });
                  }
                }}
              >
                创建礼包
              </button>
            </div>

 
          </div>
        </div>
      </div>
    </div>
  );
}


