'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DealsPaginationBar from './DealsPaginationBar';
import ProductDetailsModal from './ProductDetailsModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { SearchFilters } from '../deals/page';

export interface ProductItem {
  id: string;
  steamId?: string | number;
  name: string;
  image: string;
  price: number; // USD (原价 steam.bean)
  percent: number; // 1..80
  originalPrice?: number; // 商品原价 (steam.bean)
  rate?: number; // 系数
  subtitle?: string;
  description?: string;
  brand?: string;
  category?: string;
  badge?: string;
  rating?: number; // 1..5
}

function ProductCard({ p, onSelect, selected, onQuickView }: { p: ProductItem; onSelect?: (p: ProductItem) => void; selected?: boolean; onQuickView?: (p: ProductItem) => void; }) {
  const [hovered, setHovered] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const compute = () => {
      if (typeof window === 'undefined') return;
      setIsSmall(window.innerWidth < 640);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  const effectiveHover = isSmall ? true : hovered;
  const bodyBg = effectiveHover ? '#34383C' : '#22272B';
  const glowOpacity = effectiveHover ? 0.9 : 0.4;
  const borderColor = selected ? '#FFFFFF' : '#2A2D35';

  return (
    <div
      className="relative border rounded-lg overflow-hidden h-40 sm:h-44 md:h-48 border-solid cursor-pointer"
      style={{ borderColor, borderWidth: 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect && onSelect(p)}
    >
      <button
        aria-label="view details"
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
        style={{ backgroundColor: '#2A2D35', color: '#7A8084' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7A8084'; }}
        onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(p); }}
      >
        <div className="size-4 flex justify-center">
          <svg viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.2015 15.9999C8.17738 16.0075 6.19172 15.4472 4.47046 14.3825C2.74883 13.3179 1.36052 11.7915 0.463115 9.97718C-0.15429 8.73041 -0.15429 7.26686 0.463115 6.02009C1.67464 3.59605 3.74642 1.71115 6.27399 0.733299C8.80128 -0.244433 11.6026 -0.244433 14.1295 0.733299C16.657 1.71103 18.7288 3.59601 19.9404 6.02009C20.5578 7.26686 20.5578 8.73041 19.9404 9.97718C19.043 11.7915 17.6547 13.3179 15.9331 14.3825C14.2116 15.4471 12.2259 16.0075 10.202 15.9999H10.2015ZM2.19045 6.87906C1.83288 7.58259 1.83288 8.41472 2.19045 9.11825C2.91884 10.6182 4.0588 11.8802 5.47715 12.7569C6.89566 13.6336 8.53407 14.0888 10.2014 14.0695C11.8687 14.0888 13.5072 13.6336 14.9256 12.7569C16.344 11.8802 17.4839 10.6182 18.2123 9.11825C18.5699 8.41472 18.5699 7.58259 18.2123 6.87906C17.4839 5.37911 16.344 4.11716 14.9256 3.24044C13.5071 2.36372 11.8687 1.90855 10.2014 1.92778C8.53403 1.90855 6.89562 2.36372 5.47715 3.24044C4.0588 4.11716 2.91884 5.37911 2.19045 6.87906ZM10.2005 11.859C9.1766 11.859 8.19469 11.4523 7.47064 10.7283C6.7466 10.0042 6.3399 9.02232 6.3399 7.99838C6.3399 6.97445 6.7466 5.99254 7.47064 5.2685C8.19469 4.54445 9.1766 4.13776 10.2005 4.13776C11.2245 4.13776 12.2064 4.54445 12.9304 5.2685C13.6545 5.99254 14.0612 6.97445 14.0612 9.02232C14.0612 10.0042 13.6545 10.7283 12.9304 10.7283C12.2064 11.4523 11.2245 11.859 10.2005 11.859Z" fill="currentColor"></path>
          </svg>
        </div>
      </button>

      <div className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden p-4" style={{ boxSizing: 'border-box', backgroundColor: bodyBg }}>
        <div className="h-6"></div>
        <div className="relative flex-1 flex w-full justify-center items-center">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width: '66%', aspectRatio: '1 / 1', filter: 'blur(25px)', backgroundColor: '#34383C', opacity: glowOpacity }}
          ></div>
          <img
            alt={p.name}
            src={p.image}
            loading="lazy"
            decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', color: 'transparent', zIndex: 1 }}
          />
        </div>
        <div className="flex flex-col w-full gap-0.5">
          <p className="font-bold truncate max-w-full text-center text-base" style={{ color: '#FFFFFF' }}>{p.name}</p>
          <div className="flex justify-center">
            <p className="font-extrabold text-base" style={{ color: '#7A8084' }}>
              {'$'}{p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DealsProductGridSection({ filters, onSelectProduct, selectedId, preselectSteamId, onPreselectMatch }: { filters: SearchFilters; onSelectProduct?: (p: ProductItem) => void; selectedId?: string; preselectSteamId?: string | null; onPreselectMatch?: (p: ProductItem) => void; }) {
  const { data: products = [] as ProductItem[] } = useQuery({
    queryKey: ['lucky-list', filters],
    queryFn: async () => {
      const result = await api.getLuckyList({
        name: filters.name,
        price_sort: filters.priceSort,
        price_min: filters.priceMin,
        price_max: filters.priceMax,
      });
      
      console.log('💎 商品列表数据:', result);
      
      // 将后端返回的数据映射为ProductItem格式
      // 数据结构：
      // - 商品id: item.id
      // - 商品名: item.steam.name
      // - 商品图片: item.steam.cover
      // - 价格: item.steam.bean
      // - 用户转动获取金额: item.steam.bean × item.rate × 1%
      if (result.data && Array.isArray(result.data)) {
        return result.data.map((item: any) => {
          const steamBean = item.steam?.bean || 0;
          const rate = item.rate || 1;
          const probability = 0.01; // 1%
          const userEarnings = steamBean * rate * probability;
          
          return {
            id: item.id || String(Math.random()),
            steamId: item.steam_id ?? item.steam?.id ?? item.id,
            name: item.steam?.name || 'Unknown',
            image: item.steam?.cover || '',
            price: steamBean, // 原价
            originalPrice: steamBean, // 保存原价
            rate: rate, // 保存系数
            percent: 1, // 默认1%概率
            description: item.description || '',
            subtitle: `转动获取: ¥${userEarnings.toFixed(2)}`,
            brand: item.brand || '',
            category: item.category || 'catalog',
            badge: item.badge || '',
            rating: item.rating || 0,
          } as ProductItem;
        });
      }
      
      return [];
    },
    staleTime: 60_000,
  });

  // Pagination (kept simple for 10 items now)
  const [pageIndex, setPageIndex] = useState(0); // 0-based
  const pageSize = 10;
  const total = products.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, total);
  const visible = products.slice(start - 1, end);

  // 预选中：用 steamId 匹配
  useEffect(() => {
    if (!preselectSteamId || !products.length) return;
    const target = products.find((p) => String(p.steamId ?? '') === String(preselectSteamId));
    if (target && onPreselectMatch) {
      onPreselectMatch(target);
    }
    // 仅在首次匹配时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectSteamId, products]);

  const disabledPrev = pageIndex <= 0;
  const disabledNext = end >= total;

  // Quick view modal state
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [quickProduct, setQuickProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    if (quickViewOpen) {
      const id = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(id);
    } else {
      setAnimateIn(false);
    }
  }, [quickViewOpen]);

  function openQuickView(p: ProductItem) {
    setQuickProduct(p);
    setQuickViewOpen(true);
  }
  function closeQuickView() {
    setAnimateIn(false);
    setTimeout(() => { setQuickViewOpen(false); setQuickProduct(null); }, 200);
  }

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!quickViewOpen) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [quickViewOpen]);

  return (
    <div className="mt-6 pb-8">
      <div className="mb-4">
        <DealsPaginationBar
          start={start}
          end={end}
          total={total}
          disabledPrev={disabledPrev}
          disabledNext={disabledNext}
          onPrev={() => { if (!disabledPrev) setPageIndex((i) => Math.max(0, i - 1)); }}
          onNext={() => { if (!disabledNext) setPageIndex((i) => i + 1); }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {visible.map((p: ProductItem) => {
          const matched = selectedId === p.id || (preselectSteamId && String(preselectSteamId) === String(p.steamId ?? ''));
          return (
            <ProductCard key={p.id} p={p} onSelect={onSelectProduct} selected={matched} onQuickView={openQuickView} />
          );
        })}
      </div>

      <div className="mt-4">
        <DealsPaginationBar
          start={start}
          end={end}
          total={total}
          disabledPrev={disabledPrev}
          disabledNext={disabledNext}
          onPrev={() => { if (!disabledPrev) setPageIndex((i) => Math.max(0, i - 1)); }}
          onNext={() => { if (!disabledNext) setPageIndex((i) => i + 1); }}
        />
      </div>

      <ProductDetailsModal
        open={quickViewOpen && !!quickProduct}
        onClose={closeQuickView}
        name={quickProduct?.name || ''}
        image={quickProduct?.image || ''}
        price={quickProduct?.price || 0}
        description={quickProduct?.description}
        animateIn={animateIn}
      />
    </div>
  );
}


