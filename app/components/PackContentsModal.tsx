'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { type CatalogItem, type DisplayProduct, toDisplayProductFromCatalog, getQualityFromLv } from '../lib/catalogV2';
import ProductCard from '../packs/[id]/ProductCard';
import { useI18n } from './I18nProvider';

interface PackContentsModalProps {
  open: boolean;
  onClose: () => void;
  packId: string | null;
}


function mapAwardsToCatalog(awards: any[]): CatalogItem[] {
  return (awards || []).map((award: any, idx: number) => {
    const item = award?.awards || {};
    const lv = Number(award?.lv ?? item?.lv ?? 0);
    const quality = getQualityFromLv(lv);
    return {
      id: String(item?.id ?? `award-${idx}`),
      name: item?.name || '',
      description: item?.item_name || item?.description || '',
      image: item?.cover || '',
      price: Number(item?.bean ?? award?.bean ?? 0) || 0,
      dropProbability: Number(award?.bili ?? item?.bili ?? 0) || 0,
      qualityId: quality.qualityId as CatalogItem['qualityId'],
      lv: lv || 0,
    };
  });
}

export default function PackContentsModal({ open, onClose, packId }: PackContentsModalProps) {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['pack-contents-modal', packId, open],
    enabled: open && !!packId,
    queryFn: async () => {
      if (!packId) return undefined;
      return api.getBoxDetail(packId);
    },
    staleTime: 30_000,
  });
  

  const modalData = useMemo(() => {
    if (!data || data.code !== 100000 || !data.data) return null;
    const box = data.data;
    const items = mapAwardsToCatalog(box.awards || []);
    const price = Number(box.bean ?? 0);
    const priceText = Number.isFinite(price) ? ` - $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
    return {
      title: `${box.name || box.title || ''}${priceText}`,
      items,
    };
  }, [data]);


  if (!open) return null;
  const normalized: DisplayProduct[] = modalData ? modalData.items.map((it) => toDisplayProductFromCatalog(it)) : [];

  return (
    <div data-state="open" className="fixed px-4 inset-0 z-50 bg-black/[0.48] overflow-y-auto flex justify-center items-start py-16" style={{ pointerEvents: 'auto', animation: 'modalFadeIn 180ms ease' }} onClick={onClose}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
      <div role="dialog" data-state="open" className="overflow-hidden z-50 grid w-full gap-4 p-6 shadow-lg rounded-lg relative max-w-4xl" data-component="PackContentsModal" tabIndex={-1} style={{ pointerEvents: 'auto', animation: 'modalZoomIn 180ms ease', backgroundColor: '#161A1D' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <h2 className="text-xl text-white font-bold leading-none tracking-tight text-left">{modalData?.title || t('packContents')}</h2>
        </div>
        {isLoading || !modalData ? (
          <div className="flex items-center justify-center w-full py-10">
            <p
              className="text-base font-semibold"
              style={{ color: '#FFFFFF', fontFamily: 'Urbanist, sans-serif' }}
            >
              {t('loading')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-2">
            {normalized.map((product) => (
              <ProductCard key={product.id} prod={product} compact />
            ))}
          </div>
        )}
        <button type="button" className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer" onClick={onClose} style={{ color: '#7A8084' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          <span className="sr-only">{t('close')}</span>
        </button>
      </div>
    </div>
  );
}


