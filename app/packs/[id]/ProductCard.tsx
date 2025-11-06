"use client";

import { useState } from 'react';
import type { Product } from '../../lib/packs';

const BASE_BG = '#22272B'; // 等同 bg-gray-700（按你取色）
const HOVER_BG = '#292F34'; // 近似等同 bg-gray-650

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(Math.max(0, Math.min(255, Math.round(g))))}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
}

// 按比例 t (0~1) 将 colorA 向 colorB 混合：t 越大越接近 colorB
function mixHexColors(colorA: string, colorB: string, t: number) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = a.r + (b.r - a.r) * t;
  const g = a.g + (b.g - a.g) * t;
  const bl = a.b + (b.b - a.b) * t;
  return rgbToHex(r, g, bl);
}

export default function ProductCard({ prod }: { prod: Product }) {
  const [isHover, setIsHover] = useState(false);

  const baseGlowColor = mixHexColors(prod.backlightColor, BASE_BG, 0.55); // 非 hover 更贴近背景，弱一些
  const hoverGlowColor = mixHexColors(prod.backlightColor, BASE_BG, 0.2);  // hover 更接近原色，更亮

  return (
    <div
      className="h-40 sm:h-44 md:h-48"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div
        data-component="BaseProductCard"
        className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden p-4 cursor-pointer"
        style={{
          boxSizing: 'border-box',
          backgroundColor: isHover ? HOVER_BG : BASE_BG,
          transition: 'background-color 200ms ease-in-out',
        }}
      >
        <p className="font-semibold h-6 text-base" style={{ color: '#7A8084' }}>{(prod.probability * 100).toFixed(4)}%</p>
        <div className="relative flex-1 flex w-full justify-center">
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              aspectRatio: '1 / 1',
              transition: 'opacity 200ms ease-in-out, background-color 200ms ease-in-out',
              height: '83.333%',
              width: '83.333%',
              borderRadius: '50%',
              filter: 'blur(25px)',
              backgroundColor: isHover ? hoverGlowColor : baseGlowColor,
              opacity: isHover ? 0.9 : 0.4,
            }}
          />
          <img
            alt={prod.name}
            loading="lazy"
            decoding="async"
            src={`${prod.image}?tr=w-3840,c-at_max`}
            style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent', zIndex: 1 }}
          />
        </div>
        <div className="flex flex-col w-full gap-0.5">
          <p className="font-semibold truncate max-w-full text-center text-base" style={{ color: '#7A8084' }}>{prod.name}</p>
          <div className="flex justify-center">
            <p className="font-extrabold text-base" style={{ color: '#FAFAFA' }}>${prod.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


