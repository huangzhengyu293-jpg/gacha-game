'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  
  // 虚拟滚动状态
  const BUFFER_SIZE = 2; // 缓冲区大小（减少渲染数量）
  const PACK_WIDTH = 160; // 卡包宽度
  const GAP = 32; // gap-8 = 32px
  const VIRTUAL_THRESHOLD = 10; // 超过10个启用虚拟滚动
  
  // 计算初始可见范围：根据典型视口宽度（1920px），大约能看到 8-10 个
  // 但我们保守估计，确保初始渲染足够
  const initialVisibleCount = 8 + BUFFER_SIZE + 1;
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: initialVisibleCount });

  // 虚拟滚动：更新可见范围
  const updateVisibleRange = useCallback(() => {
    const el = scrollRef.current;
    if (!el || packs.length <= VIRTUAL_THRESHOLD) return;
    
    const scrollLeft = el.scrollLeft;
    const clientWidth = el.clientWidth;
    
    // 计算视口内可见的卡包数量
    const visibleCount = Math.ceil(clientWidth / (PACK_WIDTH + GAP));
    
    // 计算可见范围（当前滚动位置的卡包索引）
    const startIndex = Math.max(0, Math.floor(scrollLeft / (PACK_WIDTH + GAP)) - BUFFER_SIZE);
    const endIndex = Math.min(
      packs.length,
      Math.floor(scrollLeft / (PACK_WIDTH + GAP)) + visibleCount + BUFFER_SIZE + 1
    );
    
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [packs.length]);

  // 检查溢出并初始化虚拟滚动
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!el) return;
      setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
      updateVisibleRange();
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [packs.length, updateVisibleRange]);

  // 监听滚动事件更新可见范围
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || packs.length <= VIRTUAL_THRESHOLD) return;

    let rafId: number;
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateVisibleRange();
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [packs.length, updateVisibleRange, VIRTUAL_THRESHOLD]);

  // 自动滚动到当前轮次卡包（显示在第二个位置）
  useEffect(() => {
    if (!scrollRef.current || !isOverflowing || currentRound < 0 || currentRound >= packs.length) {
      return;
    }

    // 计算滚动位置：让当前卡包显示在第二个位置
    const padding = 40; // px-10 = 40px
    const targetScrollLeft = currentRound * (PACK_WIDTH + GAP) - (PACK_WIDTH + GAP) + padding;
    
    scrollRef.current.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });
    
    // 滚动后更新可见范围
    setTimeout(() => {
      updateVisibleRange();
    }, 500);
  }, [currentRound, isOverflowing, packs.length, updateVisibleRange]);

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
            {packs.map((pack, index) => {
              // 虚拟滚动：只渲染可见范围内的卡包
              const isVisible = packs.length <= VIRTUAL_THRESHOLD || (index >= visibleRange.start && index < visibleRange.end);
              
              if (!isVisible) {
                // 不可见的卡包：只渲染占位符保持布局
                return (
                  <div
                    key={`pack-${index}-${pack.id}`}
                    className="min-w-[160px] max-w-[160px] flex-shrink-0"
                    style={{ height: '304px', visibility: 'hidden' }}
                  />
                );
              }
              
              return (
                <div
                  key={`pack-${index}-${pack.id}`}
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
              );
            })}
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

