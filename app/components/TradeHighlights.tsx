"use client";

import React from "react";

type Card = {
  id: string;
  multiplier: string; // e.g. "4.32x"
  avatarSrc: string;
  productSrc: string;
  title: string;
  price: string;
};

const cards: Card[] = [
  {
    id: 'c1',
    multiplier: '4.32x',
    avatarSrc: 'https://ik.imagekit.io/hr727kunx/profile_pictures/cm7nv4fk500enl70h9eepxa9o/cm7nv4fk500enl70h9eepxa9o_yLdRdZ6wb.png?tr=w-128,c-at_max',
    productSrc: 'https://ik.imagekit.io/hr727kunx/products/cm8siykbg0000ju0m9msh7foj_7935082__dAhVSMaKw?tr=w-1080,c-at_max',
    title: '1 Kilo Argor Heraeus Gold Bar (New w/ Assay)',
    price: '$125,000.00'
  },
  {
    id: 'c2',
    multiplier: '10.00x',
    avatarSrc: 'https://ik.imagekit.io/hr727kunx/profile_pictures/cm7nv4fk500enl70h9eepxa9o/cm7nv4fk500enl70h9eepxa9o_yLdRdZ6wb.png?tr=w-128,c-at_max',
    productSrc: 'https://ik.imagekit.io/hr727kunx/products/cmcxqbint0000kz0tdzpht9wm_5363600__4cptqLz3I?tr=w-1080,c-at_max',
    title: '2002 Pokemon Neo Destiny 1st Edition Holo Light Arcanine #12 PSA 10 GEM MINT',
    price: '$10,000.00'
  },
  {
    id: 'c3',
    multiplier: '6.70x',
    avatarSrc: 'https://ik.imagekit.io/hr727kunx/profile_pictures/cll8krqb7002wla16drdzh586/cll8krqb7002wla16drdzh586_YV-BF6Wka.png?tr=w-128,c-at_max',
    productSrc: 'https://ik.imagekit.io/hr727kunx/products/cm57770t10002mh0j9asylahj_2424142__HwBUAdvPW?tr=w-1080,c-at_max',
    title: '1.15 Carat Diamond',
    price: '$7,500.00'
  },
  {
    id: 'c4',
    multiplier: '1.16x',
    avatarSrc: 'https://ik.imagekit.io/hr727kunx/profile_pictures/cm7nv4fk500enl70h9eepxa9o/cm7nv4fk500enl70h9eepxa9o_yLdRdZ6wb.png?tr=w-128,c-at_max',
    productSrc: 'https://ik.imagekit.io/hr727kunx/products/clz6bu1a200a3j6tytj07f05i_9242856__ybcfUleP5?tr=w-1080,c-at_max',
    title: 'Jewelry Shop Credit',
    price: '$7,000.00'
  },
  {
    id: 'c5',
    multiplier: '1.19x',
    avatarSrc: 'https://ik.imagekit.io/hr727kunx/profile_pictures/cm7nv4fk500enl70h9eepxa9o/cm7nv4fk500enl70h9eepxa9o_yLdRdZ6wb.png?tr=w-128,c-at_max',
    productSrc: 'https://ik.imagekit.io/hr727kunx/products/clrzhndxi000nl616ukck35by_9629497__pS9hrVwQ_?tr=w-1080,c-at_max',
    title: 'Louis Vuitton Venice Backpack Monogram Denim Blue',
    price: '$6,000.00'
  }
];

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
  return (
    <div className="relative h-40 sm:h-44 md:h-48" data-component="ForgeHighlightProductCard">
      <p className="absolute top-3 left-3 text-yellow-300 font-semibold text-sm">{c.multiplier}</p>
      <div className="absolute top-3 right-2">
        <button data-state="closed">
          <Avatar src={c.avatarSrc} />
        </button>
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

export default function TradeHighlights() {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-6 gap-5 h-40 sm:h-44 md:h-48 overflow-hidden">
      {cards.map((c) => (
        <HighlightCard key={c.id} c={c} />
      ))}
    </div>
  );
}


