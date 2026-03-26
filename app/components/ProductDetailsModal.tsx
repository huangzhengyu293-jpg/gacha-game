'use client';

import React from 'react';
import { useI18n } from './I18nProvider';

export default function ProductDetailsModal({
  open,
  onClose,
  name,
  image,
  price,
  description,
  probability,
  probabilityDisplay,
  animateIn,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  image: string;
  price: number;
  description?: string;
  probability?: number;
  probabilityDisplay?: string;
  animateIn?: boolean;
}) {
  const { t } = useI18n();
  if (!open) return null;
  const showAnim = animateIn ?? true;
  const safeName = name?.trim?.() ? name : '--';
  const priceNum = Number(price);
  const showPrice = Number.isFinite(priceNum) && priceNum > 0;
  const hasDescription = typeof description === 'string' && description.trim().length > 0;
  const outcomePercent = probabilityDisplay ?? (typeof probability === 'number' && Number.isFinite(probability)
    ? ((probability * 100)).toFixed(4)
    : null);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', pointerEvents: 'auto', width: '100vw', height: '100vh', left: 0, top: 0 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg sm:max-w-3xl rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: '#22272B',
          transform: showAnim ? 'scale(1)' : 'scale(0.95)',
          opacity: showAnim ? 1 : 0,
          transition: 'opacity 200ms ease, transform 200ms ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 p-4 sm:p-6 pb-4">
          <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}>{t('productDetailsTitle')}</h2>
          <button type="button" className="rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer shrink-0" onClick={onClose} style={{ color: '#9CA3AF' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <span className="sr-only">{t('close')}</span>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto exchange-scroll p-4 sm:p-6 pt-0">
          <div className="rounded-lg" style={{ backgroundColor: '#34383C', padding: 24 }}>
            <div className="h-[250px] flex justify-center">
              {image ? (
                <img
                  alt={safeName || 'product'}
                  loading="lazy"
                  decoding="async"
                  src={image}
                  style={{ color: 'transparent', objectFit: 'contain', height: '100%', width: 'auto' }}
                />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-10">
            <div>
              <p className="font-black text-lg" style={{ color: '#FFFFFF' }}>{safeName}</p>
              {showPrice ? (
                <p className="text-xl" style={{ color: '#FFFFFF' }}>
                  {`$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
                </p>
              ) : null}
            </div>
            {hasDescription ? (
              <>
                <div className="flex w-full bg-gray-600 h-[1px]" />
                <p className="text-base" style={{ color: '#FFFFFF' }}>{description}</p>
              </>
            ) : null}
            {outcomePercent != null && outcomePercent !== '' ? (
              <div>
                <p className="font-bold" style={{ color: '#FFFFFF' }}>Outcome</p>
                <p className="text-base" style={{ color: '#FFFFFF' }}>{outcomePercent}%</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}


