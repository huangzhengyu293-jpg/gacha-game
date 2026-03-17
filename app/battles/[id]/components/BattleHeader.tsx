"use client";

import Link from "next/link";
import React, { type ReactNode, useEffect, useRef, useState, useCallback } from "react";
import PackContentsModal from "@/app/components/PackContentsModal";
import { getModeVisual, getSpecialOptionLabels } from "@/app/battles/modeVisuals";
import { useI18n } from "@/app/components/I18nProvider";
import InfoTooltip from "@/app/components/InfoTooltip";

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
  modeLabel?: string;
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
}

interface PackModalState {
  open: boolean;
  packId: string | null;
}

export default function BattleHeader({
  packImages = [],
  highlightedIndices = [],
  awardName = "",
  statusText = "",
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
  modeLabel,
}: BattleHeaderProps) {
  const { t } = useI18n();
  const displayAwardName = awardName || t("battleModeClassic");
  const displayStatusText = statusText || t("waitingPlayers");
  const [packModal, setPackModal] = useState<PackModalState>({ open: false, packId: null });
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
  
  const modeVisual = getModeVisual(gameMode, displayAwardName);
  const displayModeLabel = modeLabel || modeVisual.label;
  const optionLabels = getSpecialOptionLabels({ isFastMode, isLastChance, isInverted });
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // 虚拟滚动：更新可见范围（节流优化）
  const lastUpdateTimeRef = useRef(0);
  const updateVisibleRange = useCallback(() => {
    // 🚀 节流：每100ms最多更新一次虚拟滚动范围
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 100) {
      return;
    }
    lastUpdateTimeRef.current = now;
    
    if (packImages.length <= VIRTUAL_THRESHOLD) return;
    
    // 🔥 修复：分别处理桌面端和移动端，确保使用正确的容器和宽度
    const elDesktop = packScrollRefDesktop.current;
    const elMobile = packScrollRefMobile.current;
    
    // 检查哪个容器实际可见（通过检查 offsetWidth 和 offsetHeight）
    // 隐藏的容器 offsetWidth 或 offsetHeight 为 0
    let el: HTMLDivElement | null = null;
    let containerWidth = 252; // 默认桌面端宽度
    
    // 优先检查桌面端（桌面端在 sm 及以上可见）
    if (elDesktop && elDesktop.offsetWidth > 0 && elDesktop.offsetHeight > 0) {
      el = elDesktop;
      containerWidth = 252; // 桌面端固定宽度
    } 
    // 如果桌面端不可见，使用移动端（移动端在 sm 以下可见）
    else if (elMobile && elMobile.offsetWidth > 0 && elMobile.offsetHeight > 0) {
      el = elMobile;
      // 移动端使用实际容器宽度
      containerWidth = el.clientWidth || el.offsetWidth || 252;
    }
    
    if (!el) return;
    
    const scrollLeft = el.scrollLeft;
    // 减去右侧 padding (38px + 4px = 42px)
    const visibleWidth = containerWidth - 42;
    
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
                  <p className="text-sm text-white font-bold ml-2">{t("allBattles")}</p>
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
                    {displayModeLabel}
                  </p>
                  {optionLabels.map((option, idx) => (
                    <span key={`option-${String(option.key)}-${idx}`} className="flex items-center justify-center">
                      <InfoTooltip
                        content={t(option.key)}
                        trigger={option.icon}
                        buttonClassName="inline-flex items-center justify-center cursor-pointer p-0 border-0 bg-transparent hover:bg-transparent"
                        usePortal={true}
                      />
                    </span>
                  ))}
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
                          ref={(el) => {
                            packRefs.current[index] = el;
                          }}
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
                          onClick={() => setPackModal({ open: true, packId: pack.id })}
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
                    {t("readyToStart")}
                  </span>
                ) : isPlaying ? (
                  <div className="flex gap-1 items-center">
                    <span className="text-base font-bold ml-1" style={{ color: "#E1E7EF" }}>
                      {t("roundLabel")}
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
                    {t("endedStatus")}
                  </span>
                ) : (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    {displayStatusText}
                  </span>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-1 flex-col justify-between px-4">
              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onShareClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-sm font-bold select-none h-7 py-1 px-2"
                  style={{ background: "var(--deposit-gradient-bg)", color: "#E1E7EF", cursor: 'pointer' }}
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
                  <p>{t("shareAction")}</p>
                </button>
              </div>

              {/* Total Cost */}
              <div className="flex justify-end">
                <div className="flex gap-1">
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    {t("totalCostLabel")}：
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
                    {displayModeLabel}
                  </p>
                  {optionLabels.map((option, idx) => (
                    <span key={`option-mobile-${String(option.key)}-${idx}`} className="flex items-center justify-center">
                      <InfoTooltip
                        content={t(option.key)}
                        trigger={option.icon}
                        buttonClassName="inline-flex items-center justify-center cursor-pointer p-0 border-0 bg-transparent hover:bg-transparent"
                        usePortal={true}
                      />
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onShareClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                  style={{ background: "var(--deposit-gradient-bg)", color: "#E1E7EF", cursor: 'pointer' }}
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
                    // 虚拟滚动：只渲染可见范围内的卡包（与桌面端保持一致）
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
                        ref={(el) => {
                          packRefs.current[index] = el;
                        }}
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
                        onClick={() => setPackModal({ open: true, packId: pack.id })}
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
                    {t("readyToStart")}
                  </span>
                ) : isPlaying ? (
                  <div className="flex gap-1 items-center flex-wrap justify-center">
                    <span className="text-base font-bold ml-1" style={{ color: "#E1E7EF" }}>
                      {t("roundLabel")}
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
                    {t("endedStatus")}
                  </span>
                ) : (
                  <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                    {displayStatusText}
                  </span>
              )}
              </div>
              <div className="flex gap-1">
                <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                  {t("totalCostLabel")}：
                </span>
                <span className="text-base font-bold" style={{ color: "#E1E7EF" }}>
                  {totalCost}
                </span>
              </div>
            </div>
          </div>
        </div>
      {packModal.open && (
        <PackContentsModal
          open={packModal.open}
          packId={packModal.packId}
          onClose={() => setPackModal({ open: false, packId: null })}
        />
      )}
      </div>
    </div>
  );
}
