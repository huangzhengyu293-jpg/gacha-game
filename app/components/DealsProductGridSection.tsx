'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DealsPaginationBar from './DealsPaginationBar';

export interface ProductItem {
  id: string;
  name: string;
  image: string;
  price: number; // USD
  percent: number; // 1..80
  subtitle?: string;
  description?: string;
  brand?: string;
  category?: string;
  badge?: string;
  rating?: number; // 1..5
}

function ProductCard({ p, onSelect, selected, onQuickView }: { p: ProductItem; onSelect?: (p: ProductItem) => void; selected?: boolean; onQuickView?: (p: ProductItem) => void; }) {
  const [hovered, setHovered] = useState(false);
  const bodyBg = hovered ? '#34383C' : '#22272B';
  const glowOpacity = hovered ? 0.9 : 0.4;
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

export default function DealsProductGridSection({ onSelectProduct, selectedId }: { onSelectProduct?: (p: ProductItem) => void; selectedId?: string }) {
  // 10 items for now; will be replaced by backend later
  const products: ProductItem[] = useMemo(() => ([
    {
      id: 'p1',
      name: 'Patek Philippe Nautilus "Tsavorite"',
      image: 'https://ik.imagekit.io/hr727kunx/products/cmbgtrk6e0000l90q9zfvj8sl_4878254__nuUcuawh9?tr=w-3840,c-at_max',
      price: 296700,
      percent: 12.34,
      subtitle: '18K 白金 / 自动上链',
      description: '祖母绿宝石点缀，经典鹦鹉螺线条，细腻抛光打磨，兼具运动与优雅。',
      brand: 'Patek Philippe',
      category: '手表',
      badge: 'new',
      rating: 4.9,
    },
    {
      id: 'p2',
      name: 'Rolex Submariner Date Black',
      image: 'https://ik.imagekit.io/hr727kunx/products/clx9sj9li0e6avt0rujn84efn_3494765__wvEd6x0CE?tr=w-3840,c-at_max',
      price: 13950,
      percent: 47.80,
      subtitle: '蚝式钢 / 陶瓷外圈',
      description: '专业潜水表血统，Cerachrom 陶瓷圈耐刮抗褪色，日常与水下都游刃有余。',
      brand: 'Rolex',
      category: '手表',
      badge: 'hot',
      rating: 4.8,
    },
    {
      id: 'p3',
      name: 'Audemars Piguet Royal Oak Blue',
      image: 'https://ik.imagekit.io/hr727kunx/products/cmgfhf9f70003jv0f7er3xd2i_7023932__ZEXymgSV1?tr=w-3840,c-at_max',
      price: 85900,
      percent: 22.15,
      subtitle: '精钢 / 蓝盘 “格纹”',
      description: '皇家橡树标志性八角表圈与“Tapisserie”格纹表盘，辨识度拉满。',
      brand: 'Audemars Piguet',
      category: '手表',
      badge: 'icon',
      rating: 4.7,
    },
    {
      id: 'p4',
      name: 'Richard Mille RM 011 Flyback',
      image: 'https://ik.imagekit.io/hr727kunx/products/cmbtzvnse0000ju0g32ipzs5k_9421879__aRi1D-0RN?tr=w-3840,c-at_max',
      price: 218000,
      percent: 5.25,
      subtitle: '钛合金 / 飞返计时',
      description: '赛车基因的高科技腕表，碳纤维与钛材质带来超轻佩戴体验。',
      brand: 'Richard Mille',
      category: '手表',
      badge: '限量',
      rating: 4.9,
    },
    {
      id: 'p5',
      name: 'Omega Speedmaster Moonwatch',
      image: 'https://ik.imagekit.io/hr727kunx/products/cmbik4l3d0000kv0ghfkrs31d_2021066__LG2uUje8-8?tr=w-3840,c-at_max',
      price: 7350,
      percent: 63.90,
      subtitle: '登月表 / 手动上链',
      description: '人类登月传奇同款血统，经典计时布局与复古尺度，致敬探索精神。',
      brand: 'Omega',
      category: '手表',
      badge: 'classic',
      rating: 4.6,
    },
    {
      id: 'p6',
      name: 'Cartier Santos Large',
      image: 'https://ik.imagekit.io/hr727kunx/products/cmbgtuxhc0000jx0m8z7t4fmm_5266610__MF9J_ygvx?tr=w-3840,c-at_max',
      price: 7450,
      percent: 33.33,
      subtitle: 'Santos / 快速更换表带',
      description: '方形飞行员表鼻祖，罗马数字与轨道刻度优雅对称，商务休闲皆宜。',
      brand: 'Cartier',
      category: '手表',
      badge: 'hot',
      rating: 4.5,
    },
    {
      id: 'p7',
      name: 'Vacheron Constantin Overseas Blue',
      image: 'https://ik.imagekit.io/hr727kunx/products/clu8pi7xw010xld14gtecbtqp_939678__Sb_t7_ZCz?tr=w-3840,c-at_max',
      price: 33900,
      percent: 78.50,
      subtitle: 'Overseas / 蓝盘三针',
      description: '马耳他十字表链结构，清澈蓝盘与细腻拉丝，旅行格调之选。',
      brand: 'Vacheron Constantin',
      category: '手表',
      badge: 'travel',
      rating: 4.7,
    }
  ]), []);

  // Pagination (kept simple for 10 items now)
  const [pageIndex, setPageIndex] = useState(0); // 0-based
  const pageSize = 10;
  const total = products.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, total);
  const visible = products.slice(start - 1, end);

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
        {visible.map((p) => (
          <ProductCard key={p.id} p={p} onSelect={onSelectProduct} selected={p.id === selectedId} onQuickView={openQuickView} />
        ))}
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

      {quickViewOpen && (
        <div className="fixed inset-0 z-50 px-4 py-16 overflow-y-auto flex justify-center items-start" style={{ backgroundColor: 'rgba(0,0,0,0.48)', pointerEvents: 'auto' }} onClick={closeQuickView}>
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg sm:max-w-3xl rounded-lg shadow-lg overflow-hidden grid gap-4 p-6"
            style={{
              backgroundColor: '#22272B',
              transform: animateIn ? 'scale(1)' : 'scale(0.95)',
              opacity: animateIn ? 1 : 0,
              transition: 'opacity 200ms ease, transform 200ms ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}>产品详情</h2>
            </div>
            <div>
              <div className="rounded-lg" style={{ backgroundColor: '#34383C', padding: 24 }}>
                <div className="h-[250px] flex justify-center">
                  <img alt={quickProduct?.name || 'product'} loading="lazy" decoding="async" src={quickProduct?.image || ''} style={{ color: 'transparent', objectFit: 'contain', height: '100%', width: 'auto' }} />
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-10">
                <div>
                  <p className="font-black text-lg" style={{ color: '#FFFFFF' }}>{quickProduct?.name}</p>
                  <p className="text-xl" style={{ color: '#FFFFFF' }}>{quickProduct ? `$${quickProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : ''}</p>
                </div>
                <div className="flex w-full" style={{ backgroundColor: '#4B5563', height: 1 }}></div>
                <p style={{ color: '#7A8084' }}>{quickProduct?.description || '产品详情将由后端提供。'}</p>
              </div>
            </div>
            <button type="button" className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center" onClick={closeQuickView} style={{ color: '#9CA3AF' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


