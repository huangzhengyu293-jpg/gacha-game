'use client';

import type { PackItem } from '../types';

interface PacksGalleryProps {
  packs: PackItem[];
  onPackClick: (pack: PackItem) => void;
}

export default function PacksGallery({ packs, onPackClick }: PacksGalleryProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-extrabold text-white">已开启的礼包</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="flex flex-col gap-2 p-3 rounded-lg cursor-pointer transition-all hover:bg-[#2A2D35]"
            style={{ backgroundColor: '#22272B' }}
            onClick={() => onPackClick(pack)}
          >
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden" style={{ backgroundColor: '#0F1012' }}>
              <img
                alt={pack.name}
                loading="lazy"
                decoding="async"
                src={pack.image}
                className="w-full h-full object-cover"
                style={{ color: 'transparent', opacity: 0.9 }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-white truncate">{pack.name}</p>
              <p className="text-xs font-bold" style={{ color: '#7A8084' }}>{pack.value}</p>
              {pack.openedBy && (
                <p className="text-xs" style={{ color: '#7A8084' }}>开启者: {pack.openedBy}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

