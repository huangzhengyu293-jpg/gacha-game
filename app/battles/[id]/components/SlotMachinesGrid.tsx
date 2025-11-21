/**
 * 老虎机网格布局组件
 * 
 * 根据玩家数量、团队模式等自动选择合适的布局
 * 响应式尺寸：根据容器实际宽度智能选择 item 尺寸（160/140/120/90）
 */

"use client";

import React, { ReactNode, useState, useEffect, useRef } from 'react';

interface SlotMachinesGridProps {
  children: ReactNode[];
  playersCount: number;
  battleType: 'solo' | 'team';
  teamStructure?: '2v2' | '3v3' | '2v2v2';
  isSmallScreen?: boolean;
}

// 可用的 item 尺寸档位（降序）
const ITEM_SIZES = [160, 140, 120, 90];

export default function SlotMachinesGrid({
  children,
  playersCount,
  battleType,
  teamStructure,
  isSmallScreen = false,
}: SlotMachinesGridProps) {
  
  // 响应式item尺寸（仅适用于单人模式4人及以下）
  const [itemSize, setItemSize] = useState(() => {
    if (typeof window === 'undefined') return 160;
    const width = window.innerWidth;
    if (width >= 1024) return 160;
    if (width >= 768) return 140;
    if (width >= 640) return 120;
    return 90;
  });
  
  useEffect(() => {
    // 只在单人模式且4人及以下时才调整尺寸
    if (battleType !== 'solo' || playersCount > 4 || playersCount < 2) {
      return;
    }
    
    const updateItemSize = () => {
      const width = window.innerWidth;
      
      if (width >= 1024) {
        setItemSize(160);
      } else if (width >= 768) {
        setItemSize(140);
      } else if (width >= 640) {
        setItemSize(120);
      } else {
        setItemSize(90);
      }
    };
    
    // 初始化
    updateItemSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateItemSize);
    
    return () => {
      window.removeEventListener('resize', updateItemSize);
    };
  }, [battleType, playersCount]);
  
  // 为children添加itemSize属性（仅单人模式4人及以下）
  const enhancedChildren = battleType === 'solo' && playersCount <= 4
    ? React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            itemSize,
          });
        }
        return child;
      })
    : children;
  
  // VS 装饰符组件
  const VSDecorator = () => (
    <div className="flex h-full w-6 flex-col self-center justify-center items-center">
      {/* 上半部分渐变线 */}
      <div 
        className="flex transition-colors duration-300 animate-in justify-center items-center w-[1px] min-w-[1px] sm:w-[2px] sm:min-w-[2px] h-[175px] sm:h-[150px] mx-1 xs:mx-2 md:mx-3"
        style={{ background: 'linear-gradient(0deg, rgb(95, 95, 95) 4.24%, rgba(95, 95, 95, 0) 100%)' }}
      />
      
      {/* VS 图标 */}
      <div className="flex justify-center items-center relative h-[32px] w-[1px]">
        {/* 桌面版 VS 图标 */}
        <div className="hidden sm:flex absolute justify-center items-center size-[32px] bg-gradient-to-br from-[#99A6B4] to-[#42484E] rounded-full">
          <div className="flex justify-center items-center size-[28px] rounded-full overflow-clip" style={{ backgroundColor: '#2A2F35' }}>
            <div className="size-3 text-gray-400">
              <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M1.04798 4.77821C0.887314 4.61754 0.798011 4.39901 0.800175 4.1718L0.830497 0.988182C0.835516 0.461282 1.26142 0.0353727 1.78832 0.0303551L4.97194 3.84193e-05C5.19915 -0.00212522 5.41768 0.0871769 5.57835 0.247844L10.0071 4.67661L5.47675 9.20697L1.04798 4.77821ZM20.0141 0.0140547C19.7869 0.0118908 19.5683 0.101193 19.4077 0.261861L7.30719 12.3623L11.8376 16.8927L23.938 4.79223C24.0987 4.63156 24.188 4.41303 24.1858 4.18582L24.1555 1.0022C24.1505 0.475301 23.7246 0.049393 23.1977 0.0443749L20.0141 0.0140547ZM4.40089 12.8752C4.11764 12.592 3.6584 12.592 3.37515 12.8752L2.00749 14.2429C1.72424 14.5261 1.72424 14.9854 2.00749 15.2686L3.80254 17.0637C4.08579 17.3469 4.08579 17.8062 3.80254 18.0894L0.212439 21.6795C-0.0708128 21.9628 -0.0708128 22.422 0.212438 22.7053L1.49462 23.9874C1.77787 24.2707 2.23711 24.2707 2.52036 23.9874L6.11047 20.3973C6.39372 20.1141 6.85296 20.1141 7.13621 20.3973L8.93126 22.1924C9.21451 22.4756 9.67375 22.4756 9.957 22.1924L11.3247 20.8247C11.6079 20.5415 11.6079 20.0822 11.3247 19.799L4.40089 12.8752ZM13.6753 19.799C13.3921 20.0822 13.3921 20.5415 13.6753 20.8247L15.043 22.1924C15.3262 22.4756 15.7855 22.4756 16.0687 22.1924L17.8638 20.3973C18.147 20.1141 18.6063 20.1141 18.8895 20.3973L22.4796 23.9874C22.7629 24.2707 23.2221 24.2707 23.5054 23.9874L24.7876 22.7053C25.0708 22.422 25.0708 21.9628 24.7876 21.6795L21.1975 18.0894C20.9142 17.8062 20.9142 17.3469 21.1975 17.0637L22.9925 15.2686C23.2758 14.9854 23.2758 14.5261 22.9925 14.2429L21.6249 12.8752C21.3416 12.592 20.8824 12.592 20.5991 12.8752L13.6753 19.799Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* 移动版 VS 图标 */}
        <div className="flex sm:hidden absolute justify-center items-center h-[25px]">
          <div className="size-3 text-gray-400">
            <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M1.04798 4.77821C0.887314 4.61754 0.798011 4.39901 0.800175 4.1718L0.830497 0.988182C0.835516 0.461282 1.26142 0.0353727 1.78832 0.0303551L4.97194 3.84193e-05C5.19915 -0.00212522 5.41768 0.0871769 5.57835 0.247844L10.0071 4.67661L5.47675 9.20697L1.04798 4.77821ZM20.0141 0.0140547C19.7869 0.0118908 19.5683 0.101193 19.4077 0.261861L7.30719 12.3623L11.8376 16.8927L23.938 4.79223C24.0987 4.63156 24.188 4.41303 24.1858 4.18582L24.1555 1.0022C24.1505 0.475301 23.7246 0.049393 23.1977 0.0443749L20.0141 0.0140547ZM4.40089 12.8752C4.11764 12.592 3.6584 12.592 3.37515 12.8752L2.00749 14.2429C1.72424 14.5261 1.72424 14.9854 2.00749 15.2686L3.80254 17.0637C4.08579 17.3469 4.08579 17.8062 3.80254 18.0894L0.212439 21.6795C-0.0708128 21.9628 -0.0708128 22.422 0.212438 22.7053L1.49462 23.9874C1.77787 24.2707 2.23711 24.2707 2.52036 23.9874L6.11047 20.3973C6.39372 20.1141 6.85296 20.1141 7.13621 20.3973L8.93126 22.1924C9.21451 22.4756 9.67375 22.4756 9.957 22.1924L11.3247 20.8247C11.6079 20.5415 11.6079 20.0822 11.3247 19.799L4.40089 12.8752ZM13.6753 19.799C13.3921 20.0822 13.3921 20.5415 13.6753 20.8247L15.043 22.1924C15.3262 22.4756 15.7855 22.4756 16.0687 22.1924L17.8638 20.3973C18.147 20.1141 18.6063 20.1141 18.8895 20.3973L22.4796 23.9874C22.7629 24.2707 23.2221 24.2707 23.5054 23.9874L24.7876 22.7053C25.0708 22.422 25.0708 21.9628 24.7876 21.6795L21.1975 18.0894C20.9142 17.8062 20.9142 17.3469 21.1975 17.0637L22.9925 15.2686C23.2758 14.9854 23.2758 14.5261 22.9925 14.2429L21.6249 12.8752C21.3416 12.592 20.8824 12.592 20.5991 12.8752L13.6753 19.799Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* 下半部分渐变线 */}
      <div 
        className="flex transition-colors duration-300 animate-in justify-center items-center w-[1px] min-w-[1px] sm:w-[2px] sm:min-w-[2px] h-[175px] sm:h-[150px] mx-1 xs:mx-2 md:mx-3"
        style={{ background: 'linear-gradient(rgb(95, 95, 95) 4.24%, rgba(95, 95, 95, 0) 100%)' }}
      />
    </div>
  );

  // 单人模式
  if (battleType === 'solo') {
    // 2-4人：横向排列，每两个老虎机之间带VS装饰符
    if (playersCount >= 2 && playersCount <= 4) {
      return (
        <div className="flex items-center justify-around w-full h-full">
          {React.Children.map(enhancedChildren, (child, idx) => (
            <React.Fragment key={idx}>
              <div 
                className="flex flex-col items-center gap-2 flex-1 min-w-0" 
                style={{ 
                  maxWidth: `${itemSize}px`  // ✅ 限制最大宽度为当前档位
                }}
              >
                {child}
              </div>
              {/* 在每个老虎机后面添加VS装饰符（除了最后一个）*/}
              {idx < (enhancedChildren as ReactNode[]).length - 1 && (
                <div className="flex-shrink-0">
                  <VSDecorator />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    } else if (playersCount === 5) {
      // 5人：2行（3+2）
      return (
        <div className="flex flex-col justify-between w-full h-full">
          {/* First row: 3 */}
          <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
            {children.slice(0, 3).map((child, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
              >
                {child}
              </div>
            ))}
          </div>
          {/* Second row: 2 */}
          <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
            {children.slice(3, 5).map((child, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (playersCount === 6) {
      // 6人：2行3列
      return (
        <div className="flex flex-col justify-between w-full h-full">
          {/* First row: 3 */}
          <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
            {children.slice(0, 3).map((child, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
              >
                {child}
              </div>
            ))}
          </div>
          {/* Second row: 3 */}
          <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
            {children.slice(3, 6).map((child, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }
  
  // 团队模式
  if (battleType === 'team' && teamStructure === '2v2') {
    // 2v2: 两队，每队2人
    return (
      <div className="flex gap-4 w-full h-full justify-center">
        {/* Team 1 */}
        <div className="flex gap-2 justify-center">
          {children.slice(0, 2).map((child, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[280px]">
              {child}
            </div>
          ))}
        </div>
        {/* Team 2 */}
        <div className="flex gap-2 justify-center">
          {children.slice(2, 4).map((child, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[280px]">
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // 默认布局（通用网格）
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-screen-xl mx-auto px-4">
      {children}
    </div>
  );
}

