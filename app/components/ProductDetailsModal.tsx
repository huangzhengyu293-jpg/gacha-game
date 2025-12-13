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
  animateIn,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  image: string;
  price: number;
  description?: string;
  animateIn?: boolean;
}) {
  const { t } = useI18n();
  if (!open) return null;
  const showAnim = animateIn ?? true;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', pointerEvents: 'auto', width: '100vw', height: '100vh', left: 0, top: 0 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg sm:max-w-3xl rounded-lg shadow-lg overflow-hidden grid gap-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#22272B',
          transform: showAnim ? 'scale(1)' : 'scale(0.95)',
          opacity: showAnim ? 1 : 0,
          transition: 'opacity 200ms ease, transform 200ms ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}>{t('productDetailsTitle')}</h2>
        </div>
        <div>
          <div className="rounded-lg" style={{ backgroundColor: '#34383C', padding: 24 }}>
            <div className="h-[250px] flex justify-center">
              <img alt={name || 'product'} loading="lazy" decoding="async" src={image || ''} style={{ color: 'transparent', objectFit: 'contain', height: '100%', width: 'auto' }} />
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-10">
            <div>
              <p className="font-black text-lg" style={{ color: '#FFFFFF' }}>{name}</p>
              <p className="text-xl" style={{ color: '#FFFFFF' }}>{`$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}</p>
            </div>
            <div className="flex w-full" style={{ backgroundColor: '#4B5563', height: 1 }}></div>
            <p style={{ color: '#7A8084' }}>{description || t('productDescFallback')}</p>
          </div>
        </div>
        <button type="button" className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer" onClick={onClose} style={{ color: '#9CA3AF' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span className="sr-only">{t('close')}</span>
        </button>
      </div>
    </div>
  );
}


