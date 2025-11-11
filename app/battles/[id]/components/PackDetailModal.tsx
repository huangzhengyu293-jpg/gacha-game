'use client';

import type { PackItem } from '../types';

interface PackDetailModalProps {
  pack: PackItem;
  onClose: () => void;
}

export default function PackDetailModal({ pack, onClose }: PackDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 px-4 py-16 overflow-y-auto flex justify-center items-start"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)', pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-lg shadow-lg overflow-hidden grid gap-4 p-6"
        style={{ backgroundColor: '#22272B' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-white">{pack.name}</h2>
        </div>
        <div className="rounded-lg" style={{ backgroundColor: '#34383C', padding: 24 }}>
          <div className="h-[400px] flex justify-center">
            <img
              alt={pack.name}
              loading="lazy"
              decoding="async"
              src={pack.image}
              style={{ color: 'transparent', objectFit: 'contain', height: '100%', width: 'auto' }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-black text-lg text-white">{pack.value}</p>
            {pack.openedBy && (
              <p className="text-sm" style={{ color: '#7A8084' }}>开启者: {pack.openedBy}</p>
            )}
          </div>
          <div className="flex w-full" style={{ backgroundColor: '#4B5563', height: 1 }}></div>
          <p style={{ color: '#7A8084' }}>礼包详情将由后端提供。</p>
        </div>
        <button
          type="button"
          className="absolute right-5 top-5 rounded-lg w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

