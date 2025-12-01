'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { gsap } from 'gsap';

export interface SlotSymbol {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability?: number;
  qualityId?: string | null;
}

interface CanvasSlotMachineProps {
  symbols: SlotSymbol[];
  selectedPrizeId?: string | null;
  onSpinStart?: () => void;
  onSpinComplete?: (result: SlotSymbol) => void;
  height?: number;
  spinDuration?: number;
}

export interface CanvasSlotMachineHandle {
  startSpin: () => void;
  updateReelContent: (newSymbols: SlotSymbol[]) => void;
}

const CanvasSlotMachine = forwardRef<CanvasSlotMachineHandle, CanvasSlotMachineProps>(({
  symbols,
  selectedPrizeId,
  onSpinStart,
  onSpinComplete,
  height = 540,
  spinDuration = 6000
}, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<SlotSymbol | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [itemHeight, setItemHeight] = useState(180); // 🎯 动态item高度
  const [itemsPerReel, setItemsPerReel] = useState(90);
  const [repeatTimes, setRepeatTimes] = useState(3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const symbolsRef = useRef<SlotSymbol[]>(symbols);
  const virtualItemsRef = useRef<SlotSymbol[]>([]);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const scrollOffset = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const currentSelectedIndexRef = useRef(-1);
  const prevSelectedIndexRef = useRef(-1);
  const selectionLockedRef = useRef(false);
  const scaleValueRef = useRef(1); // 🎨 GSAP 控制的缩放值
  const glowOpacityRef = useRef(0.6); // 🎨 GSAP 控制的光晕透明度

  const REEL_CENTER = height / 2;

  // 🎯 动态更新item高度（和原版逻辑一致）
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateItemConfig = () => {
      const containerWidth = containerRef.current?.clientWidth || 300;
      
      // 🎯 和原版一致的尺寸判断
      let calculatedHeight = 180;
      
      if (containerWidth < 130) {
        calculatedHeight = 90;
      } else if (containerWidth < 180) {
        calculatedHeight = 130;
      } else {
        calculatedHeight = 180;
      }
      
      setItemHeight(calculatedHeight);
      
      // 根据item高度调整items数量
      let baseItemsPerReel;
      if (calculatedHeight === 180) {
        baseItemsPerReel = 90;
      } else if (calculatedHeight === 130) {
        baseItemsPerReel = Math.ceil(90 * (180 / 130));
      } else {
        baseItemsPerReel = Math.ceil(90 * (180 / 90));
      }
      
      setItemsPerReel(baseItemsPerReel);
      
      const minTotalItems = baseItemsPerReel * 3;
      const calculatedRepeatTimes = Math.max(3, Math.ceil(minTotalItems / baseItemsPerReel));
      setRepeatTimes(calculatedRepeatTimes);
    };
    
    updateItemConfig();
    
    const resizeObserver = new ResizeObserver(updateItemConfig);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // 更新 symbols ref
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // 预加载图片
  const preloadImages = useCallback(async (symbolList: SlotSymbol[]) => {
    const loadPromises = symbolList.map(symbol => {
      if (imageCache.current.has(symbol.image)) {
        return Promise.resolve();
      }
      
      return new Promise<void>((resolve) => {
        const img = new Image();
        // 🔥 不设置crossOrigin，避免CORS问题
        img.onload = () => {
          imageCache.current.set(symbol.image, img);
          resolve();
        };
        img.onerror = () => {
          // 图片加载失败时也resolve，避免阻塞
          console.warn(`图片加载失败: ${symbol.image}`);
          resolve();
        };
        img.src = symbol.image;
      });
    });

    await Promise.all(loadPromises);
  }, []);

  // 初始化虚拟项目数组
  const initializeVirtualItems = useCallback(() => {
    const symbolSequence: SlotSymbol[] = [];
    for (let j = 0; j < itemsPerReel; j++) {
      symbolSequence.push(symbolsRef.current[Math.floor(Math.random() * symbolsRef.current.length)]);
    }

    virtualItemsRef.current = [];
    for (let repeat = 0; repeat < repeatTimes; repeat++) {
      virtualItemsRef.current.push(...symbolSequence);
    }

    // 🎯 设置初始滚动位置（和原版一致）
    const initialIndex = itemsPerReel;
    const preScrollOffset = itemHeight * 5;
    const containerTop = REEL_CENTER - initialIndex * itemHeight - itemHeight / 2 - preScrollOffset;
    scrollOffset.current = -containerTop;
  }, [itemHeight, itemsPerReel, repeatTimes]);

  // 绘制单个物品
  const drawItem = useCallback((
    ctx: CanvasRenderingContext2D,
    symbol: SlotSymbol,
    y: number,
    width: number,
    isSelected: boolean,
    animatedScale: number,
    animatedGlowOpacity: number,
    itemH: number // 🎯 传入动态itemHeight
  ) => {
    const itemY = y;
    const centerY = itemY + itemH / 2;
    const centerX = width / 2;

    // 🔥 绘制光晕（径向渐变）- 使用动画透明度，根据新的品质系统
    if (symbol.qualityId) {
      const glowColor = 
        symbol.qualityId === 'legendary' ? [228, 174, 51] :  // 传说 - 金色 #E4AE33
        symbol.qualityId === 'mythic' ? [235, 75, 75] :      // 神话 - 红色 #EB4B4B
        symbol.qualityId === 'epic' ? [136, 71, 255] :       // 史诗 - 紫色 #8847FF
        symbol.qualityId === 'rare' ? [75, 105, 255] :       // 稀有 - 蓝色 #4B69FF
        [157, 157, 157];

      const glowRadius = width * 0.3;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
      gradient.addColorStop(0, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${animatedGlowOpacity})`);
      gradient.addColorStop(0.5, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${animatedGlowOpacity * 0.5})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, itemY, width, itemH);
    }

    // 绘制图片 - 使用动画缩放值
    const img = imageCache.current.get(symbol.image);
    if (img && img.complete && img.naturalHeight > 0) {
      ctx.save();
      
      // 🎯 图片大小基于itemHeight，不是容器宽度
      const baseSize = itemH * 0.55; // 原版：55%的item高度
      const imgSize = baseSize * animatedScale; // 🎨 使用GSAP控制的缩放值
      const imgX = centerX - imgSize / 2;
      const imgY = centerY - imgSize / 2;

      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      ctx.restore();
    }

    // 🎯 绘制文字信息（只在锁定后显示）
    if (isSelected && selectionLockedRef.current && symbol.id !== 'golden_placeholder') {
      ctx.save();
      
      // 🎨 参考样式：bg-gray-700/40 px-2 rounded-md
      // 测量文字宽度
      ctx.font = '900 16px sans-serif'; // font-black text-base
      const nameWidth = ctx.measureText(symbol.name).width;
      ctx.font = '900 16px sans-serif';
      const priceText = `$${symbol.price.toFixed(2)}`;
      const priceWidth = ctx.measureText(priceText).width;
      
      const maxTextWidth = Math.max(nameWidth, priceWidth);
      const boxWidth = Math.min(maxTextWidth + 16, 140);
      const boxHeight = 52;
      const boxX = centerX - boxWidth / 2;
      const boxY = itemY + itemH / 2 + 28; // 使用动态itemHeight
      
      // 绘制背景框 - bg-gray-700/40
      ctx.fillStyle = 'rgba(55, 65, 81, 0.4)';
      const radius = 6; // rounded-md
      ctx.beginPath();
      
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
      } else {
        // 手动绘制圆角矩形
        ctx.moveTo(boxX + radius, boxY);
        ctx.lineTo(boxX + boxWidth - radius, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
        ctx.lineTo(boxX + radius, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
        ctx.lineTo(boxX, boxY + radius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
      }
      ctx.fill();
      
      // 绘制文字
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 名称 - text-white font-black text-base
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 16px sans-serif'; // font-black
      
      // 文字溢出处理（模拟 text-ellipsis）
      let displayName = symbol.name;
      if (nameWidth > boxWidth - 16) {
        while (ctx.measureText(displayName + '...').width > boxWidth - 16 && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      
      ctx.fillText(displayName, centerX, boxY + 16);

      // 价格 - text-white font-black text-base
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 16px sans-serif';
      ctx.fillText(priceText, centerX, boxY + 36);

      ctx.restore();
    }
  }, []);

  // 渲染画布
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;

    // 🔥 关键：重置transform并重新scale
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // 🎯 清空画布 - 透明背景
    ctx.clearRect(0, 0, width, height);

    // 🎯 计算当前选中的索引（和原版完全一致）
    // scrollOffset = -containerTop，所以 containerTop = -scrollOffset
    const containerTop = -scrollOffset.current;
    const virtualClosestIndex = Math.round((REEL_CENTER - containerTop - itemHeight / 2) / itemHeight);
    const clampedIndex = Math.max(0, Math.min(virtualItemsRef.current.length - 1, virtualClosestIndex));

    // 🔥 滚动时也更新选中，并触发 GSAP 动画
    if (!selectionLockedRef.current) {
      if (currentSelectedIndexRef.current !== clampedIndex) {
        prevSelectedIndexRef.current = currentSelectedIndexRef.current;
        currentSelectedIndexRef.current = clampedIndex;
        
        // 🎨 GSAP：平滑渐进放大（无弹性，无突变）
        gsap.killTweensOf(scaleValueRef);
        gsap.killTweensOf(glowOpacityRef);
        
        // 直接从当前值平滑过渡到 1.3
        gsap.to(scaleValueRef, {
          current: 1.3,
          duration: 0.3,
          ease: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 和你原版CSS一致的缓动
          onUpdate: () => {
            if (canvasRef.current) render();
          }
        });
        
        // 🎨 光晕同步淡入
        gsap.to(glowOpacityRef, {
          current: 0.9,
          duration: 0.3,
          ease: 'power2.out',
          onUpdate: () => {
            if (canvasRef.current) render();
          }
        });
      }
    }

    // 计算可见范围（基于容器顶部位置）
    const viewportTop = -containerTop;
    const startIndex = Math.floor((viewportTop - itemHeight) / itemHeight);
    const endIndex = Math.ceil((viewportTop + height + itemHeight) / itemHeight);

    // 绘制可见的物品
    for (let i = startIndex; i <= endIndex; i++) {
      if (i < 0 || i >= virtualItemsRef.current.length) continue;

      const symbol = virtualItemsRef.current[i];
      
      // 🎯 关键坐标计算（使用动态itemHeight）
      const y = containerTop + i * itemHeight;
      
      // 只绘制在可见区域内的物品
      if (y + itemHeight < 0 || y > height) continue;

      // 🔥 滚动时也显示选中效果
      const isSelected = currentSelectedIndexRef.current === i;
      
      // 🎨 只有选中的物品才使用动画值，其他使用默认值
      const scale = isSelected ? scaleValueRef.current : 1;
      const glowOpacity = isSelected ? glowOpacityRef.current : 0.6;

      drawItem(ctx, symbol, y, width, isSelected, scale, glowOpacity, itemHeight);
    }
  }, [height, drawItem]);

  // 自定义缓动函数（和原版一致）
  const customEase = (t: number): number => {
    return 1 - Math.pow(1 - t, 5);
  };

  // 第一阶段：高速旋转
  const spinPhase1 = useCallback((duration: number, targetSymbol: SlotSymbol | null): Promise<void> => {
    return new Promise(resolve => {
      const startTop = -scrollOffset.current;
      const pixelsPerMs = 0.8;
      const minScrollDistance = duration * pixelsPerMs;

      let targetTop = startTop - minScrollDistance;

      if (targetSymbol) {
        const matchingIndices: number[] = [];
        virtualItemsRef.current.forEach((item, index) => {
          if (item.id === targetSymbol.id) {
            matchingIndices.push(index);
          }
        });

        if (matchingIndices.length > 0) {
          let selectedIndex: number | null = null;
          
          for (const index of matchingIndices) {
            const potentialTop = -(index * itemHeight) + REEL_CENTER - itemHeight / 2;
            const scrollDistance = startTop - potentialTop;
            
            if (scrollDistance >= minScrollDistance) {
              selectedIndex = index;
              break;
            }
          }
          
          if (selectedIndex === null) {
            selectedIndex = matchingIndices[0];
            while (true) {
              targetTop = -(selectedIndex * itemHeight) + REEL_CENTER - itemHeight / 2;
              if (startTop - targetTop >= minScrollDistance) break;
              selectedIndex += itemsPerReel;
            }
          }
          
          if (selectedIndex !== null) {
            const randomOffset = (Math.random() * 30 + 10) * (Math.random() < 0.5 ? 1 : -1);
            targetTop = -(selectedIndex * itemHeight) + REEL_CENTER - itemHeight / 2 + randomOffset;
          }
        }
      }

      const distance = startTop - targetTop;
      const startTime = Date.now();
      let lastItemIndex = -1;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = customEase(progress);

        const currentTop = startTop - distance * easedProgress;
        scrollOffset.current = -currentTop;
        render();

        // 🔊 播放 tick 音效
        const currentItemIndex = Math.floor((REEL_CENTER - currentTop - itemHeight / 2) / itemHeight);
        if (currentItemIndex !== lastItemIndex) {
          lastItemIndex = currentItemIndex;
          
          if (typeof window !== 'undefined') {
            const ctx = (window as any).__audioContext;
            const buffer = (window as any).__tickAudioBuffer;
            if (ctx && buffer) {
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(0);
            }
          }
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }, [render]);

  // 第二阶段：精确回正
  const spinPhase2 = useCallback((targetSymbol: SlotSymbol | null): Promise<void> => {
    return new Promise(resolve => {
      const duration = 500;
      const currentTop = -scrollOffset.current;

      // 🎯 找到最接近中心的索引
      let closestIndex = Math.round((REEL_CENTER - currentTop - itemHeight / 2) / itemHeight);
      closestIndex = Math.max(0, Math.min(virtualItemsRef.current.length - 1, closestIndex));

      if (targetSymbol) {
        let minDistance = Infinity;
        let bestIndex = closestIndex;

        for (let i = 0; i < virtualItemsRef.current.length; i++) {
          if (virtualItemsRef.current[i].id === targetSymbol.id) {
            const dist = Math.abs(i - closestIndex);
            if (dist < minDistance) {
              minDistance = dist;
              bestIndex = i;
            }
          }
        }
        closestIndex = bestIndex;
      }

      // 🎯 精确目标位置：让物品对准中心
      const exactTargetTop = -(closestIndex * itemHeight) + REEL_CENTER - itemHeight / 2;
      const distance = exactTargetTop - currentTop;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // easeInOutCubic
        const eased = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const newTop = currentTop + distance * eased;
        scrollOffset.current = -newTop;
        render();

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          scrollOffset.current = -exactTargetTop;
          selectionLockedRef.current = true;
          currentSelectedIndexRef.current = closestIndex;
          render();
          setTimeout(() => resolve(), 100);
        }
      };

      animate();
    });
  }, [render]);

  // 开始旋转
  const startSpin = useCallback(async () => {
    if (isSpinning || !selectedPrize) return;

    setIsSpinning(true);
    selectionLockedRef.current = false;
    currentSelectedIndexRef.current = -1;
    
    // 🎨 重置动画值
    gsap.killTweensOf([scaleValueRef, glowOpacityRef]);
    scaleValueRef.current = 1;
    glowOpacityRef.current = 0.6;

    if (onSpinStart) {
      onSpinStart();
    }

    await spinPhase1(spinDuration, selectedPrize);
    await spinPhase2(selectedPrize);

    let finalResult = selectedPrize;
    if (currentSelectedIndexRef.current >= 0 && currentSelectedIndexRef.current < virtualItemsRef.current.length) {
      finalResult = virtualItemsRef.current[currentSelectedIndexRef.current];
    }

    if (onSpinComplete && finalResult) {
      onSpinComplete(finalResult);
    }

    setIsSpinning(false);
  }, [isSpinning, selectedPrize, spinDuration, onSpinStart, onSpinComplete, spinPhase1, spinPhase2]);

  // 更新转轮内容（无缝更新）
  const updateReelContent = useCallback(async (newSymbols: SlotSymbol[]) => {
    if (isSpinning) return;

    symbolsRef.current = newSymbols;
    
    // 预加载新图片
    await preloadImages(newSymbols);

    // 重新生成虚拟项目（保持当前滚动位置）
    const symbolSequence: SlotSymbol[] = [];
    for (let j = 0; j < itemsPerReel; j++) {
      symbolSequence.push(newSymbols[Math.floor(Math.random() * newSymbols.length)]);
    }

    virtualItemsRef.current = [];
    for (let repeat = 0; repeat < repeatTimes; repeat++) {
      virtualItemsRef.current.push(...symbolSequence);
    }

    render();
  }, [isSpinning, itemsPerReel, repeatTimes, preloadImages, render]);

  useImperativeHandle(ref, () => ({
    startSpin,
    updateReelContent
  }), [startSpin, updateReelContent]);

  // 更新选中的奖品
  useEffect(() => {
    if (selectedPrizeId) {
      const prize = symbols.find(s => s.id === selectedPrizeId);
      if (prize) {
        setSelectedPrize(prize);
        setHasStarted(false);
      }
    }
  }, [selectedPrizeId, symbols]);

  // 自动启动
  useEffect(() => {
    if (selectedPrizeId && selectedPrize && !hasStarted && !isSpinning) {
      setHasStarted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startSpin();
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrizeId, selectedPrize, hasStarted]);

  // 初始化虚拟项目（当symbols或itemHeight变化时）
  useEffect(() => {
    if (symbols.length === 0 || itemsPerReel < 90) return;
    
    preloadImages(symbols).then(() => {
      initializeVirtualItems();
      requestAnimationFrame(() => {
        render();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.length, itemHeight, itemsPerReel, repeatTimes]);

  // 初始化 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 设置 Canvas 尺寸（高 DPI 支持）
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = container.offsetWidth;
      
      if (width > 0) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        requestAnimationFrame(() => {
          render();
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // 🎨 清理 GSAP 动画
      gsap.killTweensOf([scaleValueRef, glowOpacityRef]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
});

CanvasSlotMachine.displayName = 'CanvasSlotMachine';

export default CanvasSlotMachine;

