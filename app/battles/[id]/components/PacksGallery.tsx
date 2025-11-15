'use client';

import { useEffect, useRef, useState } from 'react';
import type { PackItem } from '../types';
import Image from 'next/image';

interface PacksGalleryProps {
  packs: PackItem[];
  onPackClick?: (pack: PackItem) => void;
  countdownValue?: number | null;
  highlightAlert?: boolean;
  forceHidden?: boolean;
  currentRound?: number; // 当前轮次索引
}

export default function PacksGallery({
  packs,
  onPackClick,
  countdownValue,
  highlightAlert,
  forceHidden,
  currentRound = 0,
}: PacksGalleryProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const packRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // 检查溢出
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const checkOverflow = () => {
      if (!el) return;
      setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [packs.length]);

  // 自动滚动到当前轮次卡包（显示在第二个位置）
  useEffect(() => {
    if (!scrollRef.current || !isOverflowing || currentRound < 0 || currentRound >= packs.length) {
      return;
    }

    const currentPackElement = packRefs.current[currentRound];
    if (!currentPackElement) {
      return;
    }

    // 计算滚动位置：让当前卡包显示在第二个位置
    // 第一个卡包的宽度 + gap，这样当前卡包就会显示在第二个位置
    const packWidth = 160; // min-w-[160px]
    const gap = 32; // gap-8 = 32px
    const padding = 40; // px-10 = 40px
    
    // 目标位置：从左边缘开始，跳过一个卡包的宽度和gap
    const targetScrollLeft = currentRound * (packWidth + gap) - (packWidth + gap) + padding;
    
    scrollRef.current.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });
  }, [currentRound, isOverflowing, packs.length]);

  const isCountdownActive = countdownValue !== null && countdownValue !== undefined && countdownValue > 0;
  const shouldHidePacks = forceHidden || isCountdownActive || highlightAlert;

  return (
    <div className="flex self-stretch relative w-full h-full" style={{ backgroundColor: highlightAlert ? '#B91C1C' : 'transparent' }}>
      <div className="flex w-full h-full z-[1] relative justify-center items-center">
        {shouldHidePacks ? (
          <div className="absolute inset-0 flex justify-center items-center">
            {isCountdownActive ? (
              <p className="text-[200px] text-white font-bold">{countdownValue}</p>
            ) : null}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className={`flex gap-8 items-center px-10 overflow-x-scroll w-full hide-scrollbar ${
              isOverflowing ? 'justify-start' : 'justify-center'
            }`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `,
              }}
            />
            {packs.map((pack, index) => (
          <div
            key={pack.id}
                ref={(el) => { packRefs.current[index] = el; }}
                className="min-w-[160px] max-w-[160px] flex-shrink-0"
          >
                <div className="relative">
                  <Image
                    alt={pack.name || 'pack'}
                    src={pack.image}
                    width={200}
                    height={304}
                loading="lazy"
                decoding="async"
                    className="w-full h-auto"
                    style={{ color: 'transparent' }}
                    sizes="(max-width: 640px) 160px, 160px"
                    unoptimized
                  />
                  <div className="flex justify-center pt-3 pb-4">
                    <div className="font-bold text-base text-white">{pack.value}</div>
            </div>
            </div>
          </div>
        ))}
          </div>
        )}
        <canvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}

