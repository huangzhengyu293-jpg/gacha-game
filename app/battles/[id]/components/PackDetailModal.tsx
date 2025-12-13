'use client';

import type { PackItem } from '../types';
import { useI18n } from '../../components/I18nProvider';

interface PackDetailModalProps {
  pack: PackItem;
  onClose: () => void;
}

export default function PackDetailModal({ pack, onClose }: PackDetailModalProps) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        pointerEvents: 'auto',
        width: '100vw',
        height: '100vh',
        left: 0,
        top: 0
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-lg shadow-lg overflow-hidden grid gap-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#22272B' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg sm:text-xl font-bold text-white pr-8">{pack.name}</h2>
        </div>
        <div className="rounded-lg" style={{ backgroundColor: '#34383C', padding: '16px' }}>
          <div className="h-[250px] sm:h-[300px] md:h-[400px] flex justify-center">
            <img
              alt={pack.name}
              loading="lazy"
              decoding="async"
              src={pack.image}
              style={{ color: 'transparent', objectFit: 'contain', height: '100%', width: 'auto', maxWidth: '100%' }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-black text-base sm:text-lg text-white">{pack.value}</p>
            {pack.openedBy && (
              <p className="text-xs sm:text-sm" style={{ color: '#7A8084' }}>
                {t('packOpenedBy')}: {pack.openedBy}
              </p>
            )}
          </div>
          <div className="flex w-full" style={{ backgroundColor: '#4B5563', height: 1 }}></div>
          <p className="text-sm" style={{ color: '#7A8084' }}>{t('packDetailsFallback')}</p>
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 sm:right-5 sm:top-5 rounded-lg w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-black/20 hover:bg-black/40"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span className="sr-only">{t('close')}</span>
        </button>
      </div>
    </div>
  );
}

