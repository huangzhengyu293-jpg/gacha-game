'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type HighlightCardData = {
  id: string;
  avatarSrc: string;
  productSrc: string;
  title: string;
  price: string;
};

function Avatar({ src }: { src: string }) {
  return (
    <div className="overflow-hidden border rounded-full border-gray-600" style={{ borderWidth: 2 }}>
      <div className="relative rounded-full overflow-hidden" style={{ width: 24, height: 24 }}>
        <img alt="" loading="lazy" decoding="async" src={src} style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'cover', color: 'transparent' }} />
      </div>
    </div>
  );
}

function HighlightCard({ c }: { c: HighlightCardData }) {
  return (
    <div className="relative h-40 sm:h-44 md:h-48" data-component="FightHighlightCard">
      <div className="absolute top-3 right-2">
        <Avatar src={c.avatarSrc} />
      </div>
      <div data-component="BaseProductCard" className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden p-3 cursor-pointer" style={{ boxSizing: 'border-box', backgroundColor: '#1A1B1E' }}>
        <p className="font-semibold text-gray-400 h-6 text-sm"></p>
        <div className="relative flex-1 flex w-full justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px]" style={{ backgroundColor: 'transparent' }}></div>
          <img alt={c.title} loading="lazy" decoding="async" src={c.productSrc} style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent', zIndex: 1 }} />
        </div>
        <div className="flex flex-col w-full gap-0.5">
          <p className="font-semibold truncate max-w-full text-gray-400 text-center text-sm">{c.title}</p>
          <div className="flex justify-center">
            <p className="font-extrabold text-sm">{c.price}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FightHighlights() {
  const { data } = useQuery({
    queryKey: ['fightBestRecord'],
    queryFn: () => api.getFightBestRecord(),
    staleTime: 30_000,
  });

  const cards = useMemo<HighlightCardData[]>(() => {
    const list = Array.isArray(data?.data) ? data?.data : [];
    return list.map((item: any, idx: number) => {
      const priceNum = Number(item?.awards?.bean ?? item?.bean ?? item?.price ?? 0);
      const price = priceNum > 0 ? `$${priceNum.toFixed(2)}` : '$0.00';
      return {
        id: item?.id ? String(item.id) : `fight-${idx}`,
        avatarSrc: item?.user?.avatar || item?.avatar || '',
        productSrc: item?.awards?.cover || item?.cover || item?.image || '',
        title: item?.awards?.name || item?.name || '',
        price,
      };
    });
  }, [data?.data]);

  const display = cards.length > 0 ? cards : [];

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-6 gap-5 h-40 sm:h-44 md:h-48 overflow-hidden">
      {display.map((c) => (
        <HighlightCard key={c.id} c={c} />
      ))}
      {display.length === 0 && (
        <div className="col-span-full text-center text-sm text-gray-400">暂无数据</div>
      )}
    </div>
  );
}





