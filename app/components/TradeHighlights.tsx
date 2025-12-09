"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";

type Card = {
  id: string; // 商品 id（保持原逻辑用于转动）
  steamId?: string; // 用于交易页匹配
  avatarSrc: string;
  productSrc: string;
  title: string;
  price: string;
  multiplier?: string;
  priceValue: number;
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

function HighlightCard({ c }: { c: Card }) {
  const router = useRouter();
  const multiplier = c.multiplier;
  const multiplierLabel = multiplier
    ? `${multiplier}${String(multiplier).toLowerCase().includes('x') ? '' : 'x'}`
    : '';
  return (
    <div
      className="relative h-40 sm:h-44 md:h-48"
      data-component="ForgeHighlightProductCard"
      onClick={() => {
        const params = new URLSearchParams();
        if (c.id) params.set('productId', c.id);
        if (c.steamId) params.set('steamId', String(c.steamId));
        router.push(`/deals?${params.toString()}`);
      }}
      style={{ cursor: 'pointer' }}
    >
      <p className="absolute top-3 left-3 font-semibold text-sm min-h-[20px]" style={{ color: '#f6e05e' }}>
        {multiplierLabel}
      </p>
      <div className="absolute top-3 right-2">
        <button data-state="closed">
          <Avatar src={c.avatarSrc} />
        </button>
      </div>
      <div
        data-component="BaseProductCard"
        className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden p-3 cursor-pointer transition-colors duration-200 ease-in-out bg-[#22272B] hover:bg-[#292f34]"
        style={{ boxSizing: 'border-box' }}
      >
        <p className="font-semibold h-6 text-sm" style={{ color: '#7A8084' }}></p>
        <div className="relative flex-1 flex w-full justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px]" style={{ backgroundColor: 'transparent' }}></div>
          <img alt={c.title} loading="lazy" decoding="async" src={c.productSrc} style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent', zIndex: 1 }} />
        </div>
        <div className="flex flex-col w-full gap-0.5">
          <p className="font-semibold truncate max-w-full text-center text-sm" style={{ color: '#7A8084' }}>{c.title}</p>
          <div className="flex justify-center">
            <p className="font-extrabold text-sm" style={{ color: '#FFFFFF' }}>{c.price}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradeHighlights() {
  const { data } = useQuery({
    queryKey: ["luckyBestRecord"],
    queryFn: () => api.getLuckyBestRecord(),
    staleTime: 30_000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });

  const cards = useMemo<Card[]>(() => {
    const list = Array.isArray(data?.data) ? data?.data : [];
    return list.map((item: any, idx: number) => {
      const steam = item?.steam || {};
      const priceNum = Number(steam?.bean ?? item?.bean ?? item?.price ?? 0);
      const price = priceNum > 0 ? `$${priceNum.toFixed(2)}` : '$0.00';
      const multiplier =
        item?.multiple ??
        steam?.multiple ??
        item?.multiplier ??
        steam?.multiplier ??
        '';
      return {
        id: item?.id ? String(item.id) : `trade-${idx}`,
        steamId: steam?.id ?? item?.steam_id ?? '',
        avatarSrc: item?.user?.avatar || item?.avatar || '',
        productSrc: steam?.cover || item?.awards?.cover || item?.cover || item?.image || '',
        title: steam?.name || item?.awards?.name || item?.name || '',
        price,
        multiplier,
        priceValue: priceNum,
      };
    });
  }, [data?.data]);

  const display = cards.length > 0 ? cards : [];

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-6 gap-5 h-40 sm:h-44 md:h-48 overflow-hidden">
      {display.map((c) => (
        <HighlightCard key={c.id} c={c} />
      ))}
     
    </div>
  );
}


