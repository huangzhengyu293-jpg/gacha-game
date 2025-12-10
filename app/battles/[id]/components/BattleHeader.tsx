"use client";

import Link from "next/link";
import React, { type ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { getModeVisual, getSpecialOptionIcons } from "@/app/battles/modeVisuals";

export interface PackImage {
  src: string;
  alt: string;
  id: string;
}

export interface BattleHeaderProps {
  packImages?: PackImage[];
  highlightedIndices?: number[];
  awardName?: string;
  statusText?: string; // 状态文本，如 "等待玩家"
  currentRound?: number; // 当前轮次
  totalRounds?: number; // 总轮次
  currentPackName?: string;
  currentPackPrice?: string;
  totalCost?: string;
  isCountingDown?: boolean; // 是否正在倒计时
  isPlaying?: boolean; // 是否正在进行中
  isCompleted?: boolean; // 是否已完成
  gameMode?: string; // 游戏模式
  isFastMode?: boolean; // 快速对战
  isLastChance?: boolean; // 最后的机会
  isInverted?: boolean; // 倒置模式
  onFairnessClick?: () => void;
  onShareClick?: () => void;
  onPackClick?: (index: number) => void;
}

export default function BattleHeader({
  packImages = [],
  highlightedIndices = [],
  awardName = "普通",
  statusText = "等待玩家",
  currentRound = 0,
  totalRounds = 0,
  currentPackName = "",
  currentPackPrice = "",
  totalCost = "",
  isCountingDown = false,
  isPlaying = false,
  isCompleted = false,
  gameMode = "classic",
  isFastMode = false,
  isLastChance = false,
  isInverted = false,
  onFairnessClick,
  onShareClick,
  onPackClick,
}: BattleHeaderProps) {
  const packScrollRefDesktop = useRef<HTMLDivElement>(null);
  const packScrollRefMobile = useRef<HTMLDivElement>(null);
  const packRefs = useRef<(HTMLImageElement | null)[]>([]);
  const isHighlighted = (index: number) => highlightedIndices.includes(index);
  
  // 虚拟滚动状态
  const BUFFER_SIZE = 3; // 缓冲区大小（减少渲染数量）
  const PACK_WIDTH = 42; // 卡包宽度
  const GAP = 8; // gap-2 = 8px
  const VIRTUAL_THRESHOLD = 15; // 超过15个启用虚拟滚动
  
  // 计算初始可见范围：顶部可视区域约 210px，每个卡包 50px，大约能看到 4-5 个
  const VISIBLE_WIDTH = 210; // 252px - 42px padding
  const initialVisibleCount = Math.ceil(VISIBLE_WIDTH / (PACK_WIDTH + GAP)) + BUFFER_SIZE + 1;
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: initialVisibleCount });
  
  const modeVisual = getModeVisual(gameMode, awardName);
  const optionIcons = getSpecialOptionIcons({ isFastMode, isLastChance, isInverted });

  // 虚拟滚动：更新可见范围（节流优化）
  const lastUpdateTimeRef = useRef(0);
  const updateVisibleRange = useCallback(() => {
    // 🚀 节流：每100ms最多更新一次虚拟滚动范围
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 100) {
      return;
    }
    lastUpdateTimeRef.current = now;
    
    // 检查桌面端或移动端的滚动容器
    const el = packScrollRefDesktop.current || packScrollRefMobile.current;
    if (!el || packImages.length <= VIRTUAL_THRESHOLD) return;
    
    const scrollLeft = el.scrollLeft;
    // 顶部可视区域固定宽度约 252px (15.75rem)，减去 padding
    const visibleWidth = 252 - 42; // 252px 减去右侧 padding 38px + 4px
    
    // 计算视口内可见的卡包数量
    const visibleCount = Math.ceil(visibleWidth / (PACK_WIDTH + GAP));
    
    // 计算可见范围（当前滚动位置的卡包索引）
    const startIndex = Math.max(0, Math.floor(scrollLeft / (PACK_WIDTH + GAP)) - BUFFER_SIZE);
    const endIndex = Math.min(
      packImages.length,
      Math.floor(scrollLeft / (PACK_WIDTH + GAP)) + visibleCount + BUFFER_SIZE + 1
    );
    
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [packImages.length]);

  // 监听滚动事件更新可见范围（桌面端和移动端）
  useEffect(() => {
    const elDesktop = packScrollRefDesktop.current;
    const elMobile = packScrollRefMobile.current;
    
    if (packImages.length <= VIRTUAL_THRESHOLD) return;

    let rafId: number;
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateVisibleRange();
      });
    };

    // 同时监听桌面端和移动端的滚动
    if (elDesktop) {
      elDesktop.addEventListener('scroll', handleScroll, { passive: true });
    }
    if (elMobile) {
      elMobile.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    updateVisibleRange(); // 初始化
    
    return () => {
      if (elDesktop) {
        elDesktop.removeEventListener('scroll', handleScroll);
      }
      if (elMobile) {
        elMobile.removeEventListener('scroll', handleScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [packImages.length, updateVisibleRange, VIRTUAL_THRESHOLD]);

  // 自动滚动到当前轮次卡包（显示在第二个位置）
  useEffect(() => {
    if (highlightedIndices.length === 0) {
      return;
    }

    const currentIndex = highlightedIndices[0];
    if (currentIndex < 0 || currentIndex >= packImages.length) {
      return;
    }

    // 计算滚动位置：让当前卡包显示在第二个位置
    const targetScrollLeft = currentIndex * (PACK_WIDTH + GAP) - (PACK_WIDTH + GAP);

    // 🚀 使用 requestAnimationFrame 延迟滚动，避免阻塞主线程
    const rafId = requestAnimationFrame(() => {
      // 同时滚动桌面端和移动端（只有一个会显示）
      if (packScrollRefDesktop.current) {
        packScrollRefDesktop.current.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        });
      }
      if (packScrollRefMobile.current) {
        packScrollRefMobile.current.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        });
      }
      
      // 滚动后更新可见范围
      setTimeout(() => {
        updateVisibleRange();
      }, 500);
    });

    return () => cancelAnimationFrame(rafId);
  }, [highlightedIndices, packImages.length, updateVisibleRange]);

  return (
    <div className="flex self-stretch justify-center border-t-[1px] border-t-gray-650">
      <div className="flex max-w-screen-xl w-full relative">
        {/* Desktop Layout */}
        <div className="hidden sm:flex flex-1">
          <div className="flex flex-1 justify-between pt-2 pb-3  min-h-32">
            {/* Left Column */}
            <div className="flex flex-1 flex-col justify-between px-4">
              <Link href="/battles">
                <div className="flex cursor-pointer items-center">
                  <div className="size-5 text-[#FAFAFA]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-[#FAFAFA]"
                    >
                      <path
                        d="M8 3L3 8L8 13"
                        stroke="#FAFAFA"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                      <path
                        d="M13 8L3 8"
                        stroke="#FAFAFA"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-sm text-white font-bold ml-2">所有对战</p>
                </div>
              </Link>
              <div className="flex flex-col-reverse items-start md:flex-row md:items-center">
                <div
                  className="flex items-center relative gap-2 rounded px-3 py-1 after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0.5 after:rounded-l mode-badge"
                  style={{ backgroundColor: "#22272B" }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `.mode-badge::after { background-color: ${modeVisual.accentColor} !important; }`
                  }} />
                  <p className="text-sm font-bold" style={{ color: "#CBD5E0" }}>
                    {modeVisual.label}
                  </p>
                  {optionIcons.map(icon => icon)}
                </div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="flex flex-1 flex-col justify-between items-center">
              {/* Pack Images Gallery */}
              <div className="flex w-[15.75rem] rounded" style={{ backgroundColor: "#1F2428" }}>
                <div className="flex w-full overflow-x-hidden">
                  <div
                    ref={packScrollRefDesktop}
                    className="rounded-lg m-[1px] flex gap-2 overflow-x-auto hide-scrollbar"
                    style={{
                      height: "72px",
                      padding: "4px 38px 4px 4px",
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
                    {packImages.map((pack, index) => {
                      // 虚拟滚动：只渲染可见范围内的卡包
                      const isVisible = packImages.length <= VIRTUAL_THRESHOLD || (index >= visibleRange.start && index < visibleRange.end);
                      
                      if (!isVisible) {
                        // 不可见的卡包：只渲染占位符保持布局
                        return (
                          <div
                            key={`pack-header-${index}-${pack.id}`}
                            className="flex-shrink-0"
                            style={{ width: '42px', height: '64px', visibility: 'hidden' }}
                          />
                        );
                      }
                      
                      return (
                        <img
                          key={`pack-header-${index}-${pack.id}`}
                          ref={(el) => { packRefs.current[index] = el; }}
                          alt={pack.alt}
                          loading="eager"
                          width="42"
                          height="64"
                          decoding="async"
                          src={pack.src}
                          className="cursor-pointer flex-shrink-0"
                          style={{
                            color: "transparent",
                            opacity: isHighlighted(index) ? 1 : 0.32,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Battle Status Row */}
              <div className="flex self-center">
                {isCountingDown ? (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    准备开始
                  </span>
                ) : isPlaying ? (
                  <div className="flex gap-1 items-center">
                    <span className="text-base font-bold ml-1" style={{ color: "#E1E7EF" }}>
                        回合
                      </span>
                    <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                      {currentRound + 1}/{totalRounds}
                      </span>
                    <div className="flex w-[1px] h-4 bg-gray-600 mx-2"></div>
                    <p className="text-base font-bold max-w-32 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "#E1E7EF" }}>
                      {currentPackName}
                    </p>
                    <div className="flex w-[1px] h-4 bg-gray-600 mx-2"></div>
                    <p className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                      {currentPackPrice}
                    </p>
                  </div>
                ) : isCompleted ? (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    已结束
                  </span>
                ) : (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    {statusText}
                  </span>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-1 flex-col justify-between px-4">
              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onFairnessClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-sm font-bold select-none h-7 py-1 px-2"
                  style={{ backgroundColor: "#1D2125", color: "#E1E7EF" }}
                >
                  <div className="size-4 mb-0.5">
                    <svg
                      viewBox="0 0 21 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.09 21.7011C9.67369 21.7026 9.26162 21.6175 8.88 21.4511C6.24748 20.2911 4.00763 18.3929 2.43161 15.9863C0.855588 13.5797 0.0109702 10.7678 0 7.89107V5.34107C0.00183285 4.70595 0.205185 4.0878 0.580773 3.57564C0.95636 3.06347 1.4848 2.68372 2.09 2.49107L9.18 0.15107C9.79048 -0.0503568 10.4495 -0.0503568 11.06 0.15107L18.09 2.49107C18.6896 2.68891 19.2115 3.07088 19.5814 3.58259C19.9512 4.09431 20.1502 4.70968 20.15 5.34107V7.89107C20.1487 10.7763 19.3086 13.599 17.732 16.0154C16.1554 18.4318 13.9103 20.3377 11.27 21.5011C10.8941 21.6463 10.4928 21.7143 10.09 21.7011ZM2.69 4.39107C2.48115 4.45888 2.30043 4.59354 2.17572 4.77427C2.05102 4.955 1.98927 5.17175 2 5.39107V7.89107C2.01123 10.3803 2.74352 12.8129 4.10828 14.8946C5.47304 16.9764 7.4118 18.6181 9.69 19.6211C9.81617 19.6761 9.95234 19.7046 10.09 19.7046C10.2277 19.7046 10.3638 19.6761 10.49 19.6211C12.7682 18.6181 14.707 16.9764 16.0717 14.8946C17.4365 12.8129 18.1688 10.3803 18.18 7.89107V5.34107C18.1907 5.12175 18.129 4.905 18.0043 4.72427C17.8796 4.54354 17.6988 4.40888 17.49 4.34107L10.4 2.05107C10.1993 1.98095 9.98072 1.98095 9.78 2.05107L2.69 4.39107Z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M17.81 3.44111L10.72 1.10111C10.3117 0.960924 9.8683 0.960924 9.46 1.10111L2.37 3.44111C1.97089 3.57358 1.62369 3.82847 1.37774 4.16956C1.13179 4.51066 0.999619 4.9206 1 5.34111V7.89111C1.00003 10.5829 1.78277 13.2166 3.25287 15.4715C4.72298 17.7263 6.81703 19.5051 9.28 20.5911C9.53616 20.7 9.81165 20.7562 10.09 20.7562C10.3684 20.7562 10.6438 20.7 10.9 20.5911C13.363 19.5051 15.457 17.7263 16.9271 15.4715C18.3972 13.2166 19.18 10.5829 19.18 7.89111V5.34111C19.1804 4.9206 19.0482 4.51066 18.8023 4.16956C18.5563 3.82847 18.2091 3.57358 17.81 3.44111ZM14.09 9.39111L11.26 12.2211C11.0743 12.4071 10.8537 12.5546 10.6109 12.6552C10.3681 12.7559 10.1078 12.8077 9.845 12.8077C9.58217 12.8077 9.32192 12.7559 9.07912 12.6552C8.83632 12.5546 8.61575 12.4071 8.43 12.2211L7.09 10.8011C6.90375 10.6138 6.79921 10.3603 6.79921 10.0961C6.79921 9.83193 6.90375 9.57848 7.09 9.39111C7.18296 9.29739 7.29356 9.22299 7.41542 9.17222C7.53728 9.12145 7.66799 9.09532 7.8 9.09532C7.93201 9.09532 8.06272 9.12145 8.18458 9.17222C8.30644 9.22299 8.41704 9.29739 8.51 9.39111L9.92 10.8011L12.75 7.98111C12.843 7.88739 12.9536 7.81299 13.0754 7.76222C13.1973 7.71146 13.328 7.68532 13.46 7.68532C13.592 7.68532 13.7227 7.71146 13.8446 7.76222C13.9664 7.81299 14.077 7.88739 14.17 7.98111C14.346 8.17886 14.4365 8.43834 14.4215 8.70265C14.4065 8.96697 14.2873 9.21455 14.09 9.39111Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </div>
                  <p>公平性</p>
                </button>
                <button
                  onClick={onShareClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-sm font-bold select-none h-7 py-1 px-2"
                  style={{ backgroundColor: "#1D2125", color: "#E1E7EF" }}
                >
                  <div className="size-4 mb-0.5">
                    <svg
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.5574 8.74841L8.72897 11.5768C8.27987 12.0259 8.27987 12.7541 8.72897 13.2032C9.17807 13.6523 9.90621 13.6523 10.3553 13.2032L13.1837 10.3748C13.6328 9.92566 13.6328 9.19752 13.1837 8.74841C12.7346 8.29931 12.0065 8.29931 11.5574 8.74841Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                      <path
                        d="M17.4216 13.2022L17.4216 13.2022L19.1601 11.4736C19.1604 11.4734 19.1606 11.4732 19.1608 11.473C20.249 10.4198 20.9215 9.0099 21.0551 7.50139C21.1886 5.99256 20.7741 4.48612 19.8874 3.25802L19.8875 3.25799L19.8848 3.25448C19.3519 2.56042 18.677 1.98809 17.9052 1.57571C17.1334 1.16334 16.2824 0.920415 15.4092 0.863173C14.5361 0.805931 13.6607 0.935688 12.8417 1.24378C12.0227 1.55184 11.2789 2.03111 10.66 2.64958C10.6599 2.64963 10.6599 2.64968 10.6598 2.64973L8.8502 4.44933C8.85016 4.44937 8.8501 4.44943 8.85006 4.44947C8.74233 4.55635 8.65684 4.68348 8.59848 4.82357C8.54009 4.9637 8.51003 5.11402 8.51003 5.26583C8.51003 5.41764 8.54009 5.56796 8.59848 5.70809C8.65686 5.84823 8.74241 5.97542 8.8502 6.08233L8.85016 6.08237L8.85308 6.08511C9.06636 6.28564 9.34809 6.39729 9.64083 6.39729C9.93358 6.39729 10.2153 6.28564 10.4286 6.08511L10.4286 6.08515L10.4313 6.08249L12.2313 4.30249L12.2313 4.30249L12.2319 4.30185C12.6126 3.92084 13.0691 3.62395 13.5717 3.43037C14.0743 3.23679 14.612 3.15083 15.1499 3.17805C15.6878 3.20526 16.2141 3.34504 16.6946 3.58836C17.1745 3.83137 17.5982 4.17226 17.9383 4.58904C18.5341 5.3622 18.8242 6.32778 18.7531 7.30133C18.682 8.27554 18.2542 9.18935 17.5516 9.86793L17.551 9.86854L15.801 11.5785L15.801 11.5785L15.7995 11.5801C15.5853 11.7955 15.465 12.087 15.465 12.3908C15.465 12.6946 15.5853 12.9861 15.7995 13.2016L15.8001 13.2022C16.0156 13.4164 16.307 13.5366 16.6108 13.5366C16.9146 13.5366 17.2061 13.4164 17.4216 13.2022Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                      <path
                        d="M13.1822 17.4416L13.1823 17.4417L13.1858 17.4379C13.383 17.2252 13.4926 16.9459 13.4926 16.6559C13.4926 16.3658 13.383 16.0865 13.1858 15.8739L13.1859 15.8738L13.1816 15.8695C12.9661 15.6553 12.6746 15.5351 12.3708 15.5351C12.0673 15.5351 11.7761 15.6551 11.5606 15.8689C11.5605 15.8691 11.5603 15.8693 11.5601 15.8695L9.6812 17.6984L9.68119 17.6984L9.67972 17.6998C9.29901 18.0808 8.84259 18.3777 8.33997 18.5713C7.83734 18.7649 7.29968 18.8509 6.76175 18.8236C6.22382 18.7964 5.69759 18.6566 5.21706 18.4133C4.73713 18.1703 4.31347 17.8294 3.97337 17.4126C3.37757 16.6395 3.08746 15.6739 3.15853 14.7004C3.22964 13.7261 3.65742 12.8123 4.36003 12.1338L4.36006 12.1338L4.3622 12.1316L6.1122 10.3716L6.11221 10.3716C6.3264 10.1561 6.44662 9.86467 6.44662 9.56086C6.44662 9.25704 6.3264 8.96557 6.11221 8.7501L6.11158 8.74947C5.89611 8.53529 5.60464 8.41506 5.30083 8.41506C4.99702 8.41506 4.70555 8.53529 4.49008 8.74947L4.49007 8.74946L4.48835 8.75122L2.64904 10.6405C2.03083 11.2594 1.55175 12.003 1.24378 12.8217C0.935688 13.6407 0.805931 14.5161 0.863173 15.3893C0.920415 16.2625 1.16334 17.1134 1.57571 17.8852C1.98809 18.657 2.56042 19.3319 3.25448 19.8648L3.25444 19.8649L3.25775 19.8673C4.47946 20.7535 5.97872 21.1717 7.48275 21.0457C8.98663 20.9198 10.3953 20.2581 11.4526 19.1812C11.4527 19.1811 11.4528 19.181 11.4529 19.1809L13.1822 17.4416Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.3"
                      ></path>
                    </svg>
                  </div>
                  <p>分享</p>
                </button>
              </div>

              {/* Total Cost */}
              <div className="flex justify-end">
                <div className="flex gap-1">
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    总费用：
                  </span>
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    {totalCost}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex sm:hidden flex-1 w-full">
          <div className="flex flex-1 flex-col w-full gap-2 items-stretch pt-2 pb-3 px-4">
            {/* Top Row: Award Name and Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col-reverse items-start md:flex-row md:items-center">
                <div
                  className="flex items-center relative gap-2 rounded px-3 py-1 after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0.5 after:rounded-l mode-badge-mobile"
                  style={{ backgroundColor: "#22272B" }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `.mode-badge-mobile::after { background-color: ${modeVisual.accentColor} !important; }`
                  }} />
                  <p className="text-sm font-bold" style={{ color: "#CBD5E0" }}>
                    {modeVisual.label}
                  </p>
                  {optionIcons.map(icon => icon)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onFairnessClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                  style={{ backgroundColor: "#1D2125", color: "#E1E7EF" }}
                >
                  <div className="text-white size-2.5">
                    <svg viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.09 21.7011C9.67369 21.7026 9.26162 21.6175 8.88 21.4511C6.24748 20.2911 4.00763 18.3929 2.43161 15.9863C0.855588 13.5797 0.0109702 10.7678 0 7.89107V5.34107C0.00183285 4.70595 0.205185 4.0878 0.580773 3.57564C0.95636 3.06347 1.4848 2.68372 2.09 2.49107L9.18 0.15107C9.79048 -0.0503568 10.4495 -0.0503568 11.06 0.15107L18.09 2.49107C18.6896 2.68891 19.2115 3.07088 19.5814 3.58259C19.9512 4.09431 20.1502 4.70968 20.15 5.34107V7.89107C20.1487 10.7763 19.3086 13.599 17.732 16.0154C16.1554 18.4318 13.9103 20.3377 11.27 21.5011C10.8941 21.6463 10.4928 21.7143 10.09 21.7011ZM2.69 4.39107C2.48115 4.45888 2.30043 4.59354 2.17572 4.77427C2.05102 4.955 1.98927 5.17175 2 5.39107V7.89107C2.01123 10.3803 2.74352 12.8129 4.10828 14.8946C5.47304 16.9764 7.4118 18.6181 9.69 19.6211C9.81617 19.6761 9.95234 19.7046 10.09 19.7046C10.2277 19.7046 10.3638 19.6761 10.49 19.6211C12.7682 18.6181 14.707 16.9764 16.0717 14.8946C17.4365 12.8129 18.1688 10.3803 18.18 7.89107V5.34107C18.1907 5.12175 18.129 4.905 18.0043 4.72427C17.8796 4.54354 17.6988 4.40888 17.49 4.34107L10.4 2.05107C10.1993 1.98095 9.98072 1.98095 9.78 2.05107L2.69 4.39107Z" fill="currentColor"></path>
                      <path d="M17.81 3.44111L10.72 1.10111C10.3117 0.960924 9.8683 0.960924 9.46 1.10111L2.37 3.44111C1.97089 3.57358 1.62369 3.82847 1.37774 4.16956C1.13179 4.51066 0.999619 4.9206 1 5.34111V7.89111C1.00003 10.5829 1.78277 13.2166 3.25287 15.4715C4.72298 17.7263 6.81703 19.5051 9.28 20.5911C9.53616 20.7 9.81165 20.7562 10.09 20.7562C10.3684 20.7562 10.6438 20.7 10.9 20.5911C13.363 19.5051 15.457 17.7263 16.9271 15.4715C18.3972 13.2166 19.18 10.5829 19.18 7.89111V5.34111C19.1804 4.9206 19.0482 4.51066 18.8023 4.16956C18.5563 3.82847 18.2091 3.57358 17.81 3.44111ZM14.09 9.39111L11.26 12.2211C11.0743 12.4071 10.8537 12.5546 10.6109 12.6552C10.3681 12.7559 10.1078 12.8077 9.845 12.8077C9.58217 12.8077 9.32192 12.7559 9.07912 12.6552C8.83632 12.5546 8.61575 12.4071 8.43 12.2211L7.09 10.8011C6.90375 10.6138 6.79921 10.3603 6.79921 10.0961C6.79921 9.83193 6.90375 9.57848 7.09 9.39111C7.18296 9.29739 7.29356 9.22299 7.41542 9.17222C7.53728 9.12145 7.66799 9.09532 7.8 9.09532C7.93201 9.09532 8.06272 9.12145 8.18458 9.17222C8.30644 9.22299 8.41704 9.29739 8.51 9.39111L9.92 10.8011L12.75 7.98111C12.843 7.88739 12.9536 7.81299 13.0754 7.76222C13.1973 7.71146 13.328 7.68532 13.46 7.68532C13.592 7.68532 13.7227 7.71146 13.8446 7.76222C13.9664 7.81299 14.077 7.88739 14.17 7.98111C14.346 8.17886 14.4365 8.43834 14.4215 8.70265C14.4065 8.96697 14.2873 9.21455 14.09 9.39111Z" fill="currentColor"></path>
                    </svg>
                  </div>
                </button>
                <button
                  onClick={onShareClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                  style={{ backgroundColor: "#1D2125", color: "#E1E7EF" }}
                >
                  <div className="text-white size-2.5">
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.5574 8.74841L8.72897 11.5768C8.27987 12.0259 8.27987 12.7541 8.72897 13.2032C9.17807 13.6523 9.90621 13.6523 10.3553 13.2032L13.1837 10.3748C13.6328 9.92566 13.6328 9.19752 13.1837 8.74841C12.7346 8.29931 12.0065 8.29931 11.5574 8.74841Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3"></path>
                      <path d="M17.4216 13.2022L17.4216 13.2022L19.1601 11.4736C19.1604 11.4734 19.1606 11.4732 19.1608 11.473C20.249 10.4198 20.9215 9.0099 21.0551 7.50139C21.1886 5.99256 20.7741 4.48612 19.8874 3.25802L19.8875 3.25799L19.8848 3.25448C19.3519 2.56042 18.677 1.98809 17.9052 1.57571C17.1334 1.16334 16.2824 0.920415 15.4092 0.863173C14.5361 0.805931 13.6607 0.935688 12.8417 1.24378C12.0227 1.55184 11.2789 2.03111 10.66 2.64958C10.6599 2.64963 10.6599 2.64968 10.6598 2.64973L8.8502 4.44933C8.85016 4.44937 8.8501 4.44943 8.85006 4.44947C8.74233 4.55635 8.65684 4.68348 8.59848 4.82357C8.54009 4.9637 8.51003 5.11402 8.51003 5.26583C8.51003 5.41764 8.54009 5.56796 8.59848 5.70809C8.65686 5.84823 8.74241 5.97542 8.8502 6.08233L8.85016 6.08237L8.85308 6.08511C9.06636 6.28564 9.34809 6.39729 9.64083 6.39729C9.93358 6.39729 10.2153 6.28564 10.4286 6.08511L10.4286 6.08515L10.4313 6.08249L12.2313 4.30249L12.2313 4.30249L12.2319 4.30185C12.6126 3.92084 13.0691 3.62395 13.5717 3.43037C14.0743 3.23679 14.612 3.15083 15.1499 3.17805C15.6878 3.20526 16.2141 3.34504 16.6946 3.58836C17.1745 3.83137 17.5982 4.17226 17.9383 4.58904C18.5341 5.3622 18.8242 6.32778 18.7531 7.30133C18.682 8.27554 18.2542 9.18935 17.5516 9.86793L17.551 9.86854L15.801 11.5785L15.801 11.5785L15.7995 11.5801C15.5853 11.7955 15.465 12.087 15.465 12.3908C15.465 12.6946 15.5853 12.9861 15.7995 13.2016L15.8001 13.2022C16.0156 13.4164 16.307 13.5366 16.6108 13.5366C16.9146 13.5366 17.2061 13.4164 17.4216 13.2022Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3"></path>
                      <path d="M13.1822 17.4416L13.1823 17.4417L13.1858 17.4379C13.383 17.2252 13.4926 16.9459 13.4926 16.6559C13.4926 16.3658 13.383 16.0865 13.1858 15.8739L13.1859 15.8738L13.1816 15.8695C12.9661 15.6553 12.6746 15.5351 12.3708 15.5351C12.0673 15.5351 11.7761 15.6551 11.5606 15.8689C11.5605 15.8691 11.5603 15.8693 11.5601 15.8695L9.6812 17.6984L9.68119 17.6984L9.67972 17.6998C9.29901 18.0808 8.84259 18.3777 8.33997 18.5713C7.83734 18.7649 7.29968 18.8509 6.76175 18.8236C6.22382 18.7964 5.69759 18.6566 5.21706 18.4133C4.73713 18.1703 4.31347 17.8294 3.97337 17.4126C3.37757 16.6395 3.08746 15.6739 3.15853 14.7004C3.22964 13.7261 3.65742 12.8123 4.36003 12.1338L4.36006 12.1338L4.3622 12.1316L6.1122 10.3716L6.11221 10.3716C6.3264 10.1561 6.44662 9.86467 6.44662 9.56086C6.44662 9.25704 6.3264 8.96557 6.11221 8.7501L6.11158 8.74947C5.89611 8.53529 5.60464 8.41506 5.30083 8.41506C4.99702 8.41506 4.70555 8.53529 4.49008 8.74947L4.49007 8.74946L4.48835 8.75122L2.64904 10.6405C2.03083 11.2594 1.55175 12.003 1.24378 12.8217C0.935688 13.6407 0.805931 14.5161 0.863173 15.3893C0.920415 16.2625 1.16334 17.1134 1.57571 17.8852C1.98809 18.657 2.56042 19.3319 3.25448 19.8648L3.25444 19.8649L3.25775 19.8673C4.47946 20.7535 5.97872 21.1717 7.48275 21.0457C8.98663 20.9198 10.3953 20.2581 11.4526 19.1812C11.4527 19.1811 11.4528 19.181 11.4529 19.1809L13.1822 17.4416Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3"></path>
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* Pack Images Gallery */}
            <div className="flex rounded" style={{ backgroundColor: "#1F2428" }}>
              <div className="flex w-full overflow-x-hidden">
                <div
                  ref={packScrollRefMobile}
                  className="rounded-lg m-[1px] flex gap-2 overflow-x-auto hide-scrollbar"
                  style={{
                    height: "72px",
                    padding: "4px 38px 4px 4px",
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {packImages.map((pack, index) => {
                    const isVisible = packImages.length <= VIRTUAL_THRESHOLD || (index >= visibleRange.start && index < visibleRange.end);
                    
                    if (!isVisible) {
                      // 不可见的卡包：只渲染占位符保持布局
                      return (
                        <div
                          key={`pack-header-mobile-${index}-${pack.id}`}
                          className="flex-shrink-0"
                          style={{ width: '42px', height: '64px', visibility: 'hidden' }}
                        />
                      );
                    }
                    
                    return (
                      <img
                        key={`pack-header-mobile-${index}-${pack.id}`}
                        alt={pack.alt}
                        loading="eager"
                        width="42"
                        height="64"
                        decoding="async"
                        src={pack.src}
                        className="cursor-pointer flex-shrink-0"
                        style={{
                          color: "transparent",
                          opacity: isHighlighted(index) ? 1 : 0.32,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Battle Status Row */}
            <div className="flex flex-col items-center gap-2">
            <div className="flex self-center">
                {isCountingDown ? (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    准备开始
                  </span>
                ) : isPlaying ? (
                  <div className="flex gap-1 items-center flex-wrap justify-center">
                    <span className="text-base font-bold ml-1" style={{ color: "#E1E7EF" }}>
                      回合
                    </span>
                    <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                      {currentRound + 1}/{totalRounds}
                    </span>
                    <div className="flex w-[1px] h-4 bg-gray-600 mx-2"></div>
                    <p className="text-base font-bold max-w-24 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "#E1E7EF" }}>
                    {currentPackName}
                  </p>
                    <div className="flex w-[1px] h-4 bg-gray-600 mx-2"></div>
                    <p className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    {currentPackPrice}
                  </p>
                  </div>
                ) : isCompleted ? (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    已结束
                  </span>
                ) : (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    {statusText}
                  </span>
              )}
              </div>
              <div className="flex gap-1">
                <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                  总费用：
                </span>
                <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                  {totalCost}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
