'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LogoIcon } from './icons/Logo';

interface DealsRightPanelProps {
  percent?: number;
  product?: { name: string; image: string; price: number } | null;
  inactive?: boolean;
  originalPrice?: number; // 商品原价 (steam.bean)
  rate?: number; // 系数
}

export default function DealsRightPanel({ percent = 35.04, product = null, inactive = false, originalPrice = 0, rate = 1 }: DealsRightPanelProps) {
  // 计算：商品金额 / 转动花费金额
  // 商品金额 = 商品原价 = originalPrice
  // 转动花费金额 = spinPrice = 百分比 × 商品原价 × 系数 = product.price
  // 比值 = 商品金额 / 转动花费金额 = originalPrice / spinPrice
  const multiplier = useMemo(() => {
    if (inactive || !product || originalPrice <= 0 || product.price <= 0) return 0;
    return originalPrice / product.price;
  }, [product, inactive, originalPrice]);

  const fixedPriceLabel = product ? ('$' + product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '$0.00';

  // Quick view modal state (reusing grid style)
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const openQuickView = () => { if (!inactive && product) { setQuickViewOpen(true); } };
  const closeQuickView = () => { setAnimateIn(false); setTimeout(() => setQuickViewOpen(false), 200); };

  useEffect(() => {
    if (!quickViewOpen) return;
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [quickViewOpen]);

  // Lock background scroll when modal open
  useEffect(() => {
    if (!quickViewOpen) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [quickViewOpen]);

  return (
    <div className="col-span-1 relative hidden lg:flex order-3 overflow-hidden min-w-0 h-full">
      {!inactive && product && (
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus text-base font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 z-10 absolute top-2 right-2"
          aria-label="view details"
          style={{ backgroundColor: '#2A2D35', color: '#FFFFFF', cursor: 'pointer' }}
          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = '#2A2D35'; }}
          onClick={openQuickView}
        >
          <div className="size-4 flex justify-center">
            <svg viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.2015 15.9999C8.17738 16.0075 6.19172 15.4472 4.47046 14.3825C2.74883 13.3179 1.36052 11.7915 0.463115 9.97718C-0.15429 8.73041 -0.15429 7.26686 0.463115 6.02009C1.67464 3.59605 3.74642 1.71115 6.27399 0.733299C8.80128 -0.244433 11.6026 -0.244433 14.1295 0.733299C16.657 1.71103 18.7288 3.59601 19.9404 6.02009C20.5578 7.26686 20.5578 8.73041 19.9404 9.97718C19.043 11.7915 17.6547 13.3179 15.9331 14.3825C14.2116 15.4471 12.2259 16.0075 10.202 15.9999H10.2015ZM2.19045 6.87906C1.83288 7.58259 1.83288 8.41472 2.19045 9.11825C2.91884 10.6182 4.0588 11.8802 5.47715 12.7569C6.89566 13.6336 8.53407 14.0888 10.2014 14.0695C11.8687 14.0888 13.5072 13.6336 14.9256 12.7569C16.344 11.8802 17.4839 10.6182 18.2123 9.11825C18.5699 8.41472 18.5699 7.58259 18.2123 6.87906C17.4839 5.37911 16.344 4.11716 14.9256 3.24044C13.5071 2.36372 11.8687 1.90855 10.2014 1.92778C8.53403 1.90855 6.89562 2.36372 5.47715 3.24044C4.0588 4.11716 2.91884 5.37911 2.19045 6.87906ZM10.2005 11.859C9.1766 11.859 8.19469 11.4523 7.47064 10.7283C6.7466 10.0042 6.3399 9.02232 6.3399 7.99838C6.3399 6.97445 6.7466 5.99254 7.47064 5.2685C8.19469 4.54445 9.1766 4.13776 10.2005 4.13776C11.2245 4.13776 12.2064 4.54445 12.9304 5.2685C13.6545 5.99254 14.0612 6.97445 14.0612 9.02232C14.0612 10.0042 13.6545 10.7283 12.9304 10.7283C12.2064 11.4523 11.2245 11.859 10.2005 11.859Z" fill="currentColor"></path>
            </svg>
          </div>
        </button>
      )}

      <div className="w-full">
        <div className="p-0 lg:p-6 order-2 lg:order-1 overflow-hidden min-w-0 rounded-md flex flex-col items-center justify-center w-full h-full" style={{ backgroundColor: '#22272B' }}>
          <div className="flex w-full h-full items-center justify-center px-10">
            <div className="flex relative w-full h-full items-center justify-center">
              {(!inactive && product?.image) ? (
                <img
                  alt={product?.name || ''}
                  loading="lazy"
                  decoding="async"
                  src={product.image}
                  style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent' }}
                />
              ) : (
                <div className="size-48" aria-hidden style={{ color: '#34383C' }}>
                  <LogoIcon className="h-full w-full" color="#34383C" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col w-full items-start justify-between mt-auto gap-2">
            <p className="text-sm font-black w-full text-white">{inactive ? '选择下面的产品开始' : (product?.name || '')}</p>
            <div className="flex justify-between w-full overflow-hidden">
              <p className="text-lg font-black" style={{ color: '#7A8084' }}>{fixedPriceLabel}</p>
              <p className="text-lg font-black text-yellow-500">x{inactive ? '0.00' : multiplier.toFixed(2)}</p>
            </div>
          </div>
        </div>
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
                  <img alt={product?.name || 'product'} loading="lazy" decoding="async" src={product?.image || ''} style={{ color: 'transparent', objectFit: 'contain', height: '100%', width: 'auto' }} />
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-10">
                <div>
                  <p className="font-black text-lg" style={{ color: '#FFFFFF' }}>{product?.name || ''}</p>
                  <p className="text-xl" style={{ color: '#FFFFFF' }}>{product ? `$${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : ''}</p>
                </div>
                <div className="flex w-full" style={{ backgroundColor: '#4B5563', height: 1 }}></div>
                <p style={{ color: '#7A8084' }}>产品详情将由后端提供。</p>
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


