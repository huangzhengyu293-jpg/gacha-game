'use client';

import React from 'react';
import { type CatalogItem, type DisplayProduct, toDisplayProductFromCatalog } from '../lib/catalogV2';
import ProductCard from '../packs/[id]/ProductCard';

interface PackContentsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: (DisplayProduct | CatalogItem)[];
}

function mixColors(color1: string, color2: string, ratio: number) {
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  };
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
  const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
  const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
  return rgbToHex(r, g, b);
}

function isCatalogItem(x: any): x is CatalogItem {
  return x && typeof x === 'object' && 'dropProbability' in x && 'qualityId' in x;
}

export default function PackContentsModal({ open, onClose, title, items }: PackContentsModalProps) {
  if (!open) return null;
  
  const normalized: DisplayProduct[] = items.map((it) => {
    if (isCatalogItem(it)) return toDisplayProductFromCatalog(it);
    return it as DisplayProduct;
  });
  
  return (
    <div data-state="open" className="fixed px-4 inset-0 z-50 bg-black/[0.48] overflow-y-auto flex justify-center items-start py-16" style={{ pointerEvents: 'auto', animation: 'modalFadeIn 180ms ease' }} onClick={onClose}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
      <div role="dialog" data-state="open" className="overflow-hidden z-50 grid w-full gap-4 p-6 shadow-lg rounded-lg relative max-w-4xl" data-component="PackContentsModal" tabIndex={-1} style={{ pointerEvents: 'auto', animation: 'modalZoomIn 180ms ease', backgroundColor: '#161A1D' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <h2 className="text-xl text-white font-bold leading-none tracking-tight text-left">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-2">
          {normalized.map((product) => (
            <ProductCard key={product.id} prod={product} compact />
          ))}
        </div>
        <button type="button" className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer" onClick={onClose} style={{ color: '#7A8084' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}


