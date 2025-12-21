'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface SlotSymbol {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability?: number;
  qualityId?: string | null;
}

interface HorizontalLuckySlotMachineProps {
  symbols: SlotSymbol[];
  selectedPrizeId?: string | null;
  onSpinStart?: () => void;
  onSpinComplete?: (result: SlotSymbol) => void;
  onSpinSettled?: () => void; // 🔥 回正音效触发时调用（用于淘汰模式同步渲染淘汰UI）
  width?: number; // 转轮宽度，默认540
  spinDuration?: number; // 固定的旋转时长
  isEliminationMode?: boolean; // 是否是淘汰模式（用于区分礼包/淘汰老虎机）
}

export interface HorizontalLuckySlotMachineHandle {
  startSpin: () => void;
  updateReelContent: (newSymbols: SlotSymbol[]) => void;
}

const GOLDEN_PLACEHOLDER_ID = 'golden_placeholder';

const GLOW_COLOR_MAP: Record<string, string> = {
  legendary: '#E4AE33',
  mythic: '#EB4B4B',
  epic: '#8847FF',
  rare: '#4B69FF',
  placeholder: '#E4AE33',
};

// 与纵向老虎机保持一致的随机偏移比例
const RANDOM_OFFSET_MIN_RATIO = 0.2;
const RANDOM_OFFSET_MAX_RATIO = 0.49;

function resolveGlowColor(symbol: SlotSymbol): string | null {
  if (symbol.id === GOLDEN_PLACEHOLDER_ID) {
    return '#E4AE33';
  }
  if (!symbol.qualityId) {
    return '#829DBB';
  }
  return GLOW_COLOR_MAP[symbol.qualityId] ?? '#829DBB';
}

const HorizontalLuckySlotMachine = forwardRef<HorizontalLuckySlotMachineHandle, HorizontalLuckySlotMachineProps>(({
  symbols,
  selectedPrizeId,
  onSpinStart,
  onSpinComplete,
  onSpinSettled,
  width = 540,
  spinDuration,
  isEliminationMode = false
}, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<SlotSymbol | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  const initialSymbolsRef = useRef<SlotSymbol[]>([]);
  
  const virtualItemsRef = useRef<SlotSymbol[]>([]);
  const renderedItemsMapRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const visibleRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // 配置参数
  const [REEL_WIDTH, setREEL_WIDTH] = useState(width);
  const [itemWidth] = useState(195); // item容器宽度
  const [itemsPerReel] = useState(90); // 固定90个item
  const [repeatTimes] = useState(3);
  const [reelCenter, setReelCenter] = useState(width / 2); // 水平中心点
  
  const BUFFER_SIZE = 5;
  
  // 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      const actualWidth = containerRef.current?.offsetWidth || width;
      const newCenter = actualWidth / 2;
      
      // 只在宽度真正变化时才更新
      if (Math.abs(reelCenterRef.current - newCenter) > 1) {
        setREEL_WIDTH(actualWidth);
        setReelCenter(newCenter);
      }
    };
    
    // 立即执行一次
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [width, REEL_WIDTH]);
  
  const symbolsRef = useRef<SlotSymbol[]>(symbols);
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);
  
  useEffect(() => {
    if (selectedPrizeId) {
      const prize = symbolsRef.current.find(s => s.id === selectedPrizeId);
      if (prize) {
        setSelectedPrize(prize);
        setHasStarted(false);
        selectionLockedRef.current = false; // 重置选中锁定
        currentSelectedIndexRef.current = -1; // 重置选中索引
        setIsSpinning(false); // 重置转动状态
      }
    } else {
      setSelectedPrize(null);
      setHasStarted(false);
      selectionLockedRef.current = false;
      setIsSpinning(false);
    }
  }, [selectedPrizeId]);

  useEffect(() => {
    if (selectedPrizeId && !isSpinning && selectedPrize && !hasStarted) {
      setHasStarted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startSpin();
        });
      });
    }
  }, [selectedPrizeId, selectedPrize, hasStarted]);

  const customEase = (t: number): number => {
    return 1 - Math.pow(1 - t, 5);
  };

  const checkAndResetPosition = useCallback((container: HTMLDivElement): number => {
    let currentLeft = parseFloat(container.style.left || '0');
    const totalWidth = itemsPerReelRef.current * 195;
    const minLeft = -totalWidth * 2;
    const resetLeft = -totalWidth;
    
    // 当滚动超出范围时，跳回一个周期
    while (currentLeft < minLeft) {
      currentLeft += totalWidth;
      container.style.left = currentLeft + 'px';
    }
    
    return currentLeft;
  }, []);

  const currentSelectedIndexRef = useRef<number>(-1);
  const currentSelectedElementRef = useRef<HTMLElement | null>(null);
  const selectionLockedRef = useRef<boolean>(false);
  const isSpinningRef = useRef<boolean>(false); // 🎵 用ref跟踪滚动状态，确保tick音效正常播放

  const reelCenterRef = useRef(reelCenter);
  const itemWidthRef = useRef(itemWidth);
  const itemsPerReelRef = useRef(itemsPerReel);
  
  useEffect(() => {
    reelCenterRef.current = reelCenter;
    itemWidthRef.current = itemWidth;
    itemsPerReelRef.current = itemsPerReel;
  }, [reelCenter, itemWidth, itemsPerReel]);

  const setSelectedBackdropVisibility = useCallback((visible: boolean) => {
    if (!reelContainerRef.current || isEliminationMode) return;
    const nodes = reelContainerRef.current.querySelectorAll<HTMLElement>('.selected-backdrop');
    nodes.forEach(node => {
      node.style.display = visible ? 'block' : 'none';
    });
  }, [isEliminationMode]);

  const updateSelection = useCallback(() => {
    if (!reelContainerRef.current || selectionLockedRef.current) return;
    
    const container = reelContainerRef.current;
    const containerLeft = parseFloat(container.style.left || '0');
    
    // element.left = i * 195 (由于transform已经居中了element)
    // 所以：containerLeft + (i * 195) = reelCenter
    // i = (reelCenter - containerLeft) / 195
    const virtualClosestIndex = Math.floor((reelCenterRef.current - containerLeft) / 195 + 0.5);
    
    // 确保index在有效范围内
    if (virtualClosestIndex < 0 || virtualClosestIndex >= virtualItemsRef.current.length) {
      return;
    }
    
    if (virtualClosestIndex === currentSelectedIndexRef.current) {
      return;
    }
    
    if (currentSelectedElementRef.current) {
      currentSelectedElementRef.current.classList.remove('selected');
      // 恢复未选中scale
      const prevWrapper = currentSelectedElementRef.current.querySelector('.img-wrapper') as HTMLElement;
      if (prevWrapper) {
        prevWrapper.style.transform = 'scale(1)';
      }
      // 恢复光晕透明度
      const prevGlow = currentSelectedElementRef.current.querySelector('.glow') as HTMLElement;
      if (prevGlow) {
        prevGlow.style.opacity = '0.4';
      }
    }
    
    const element = renderedItemsMapRef.current.get(virtualClosestIndex);
    if (element) {
      element.classList.add('selected');
      // 放大scale（使用GPU加速）
      const wrapper = element.querySelector('.img-wrapper') as HTMLElement;
      if (wrapper) {
        wrapper.style.transform = 'scale(1.3) translateZ(0)';
      }
      // 增强光晕
      const glow = element.querySelector('.glow') as HTMLElement;
      if (glow) {
        glow.style.opacity = '0.9';
      }
      currentSelectedElementRef.current = element;
      currentSelectedIndexRef.current = virtualClosestIndex;
      
      // 🎵 播放tick音效（只在正在滚动时播放，且选中index改变时）
      if (isSpinningRef.current && typeof window !== 'undefined') {
        const ctx = (window as any).__audioContext;
        const buffer = (window as any).__tickAudioBuffer;
        if (ctx && buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }
      }
    } else {
      // element还没渲染，保存index等下次updateVirtualItems时再选中
      currentSelectedIndexRef.current = virtualClosestIndex;
    }
  }, []);

  const updateVirtualItems = useCallback(() => {
    if (!reelContainerRef.current || !containerRef.current) return;
    
    const container = reelContainerRef.current;
    const containerLeft = parseFloat(container.style.left || '0');
    
    // 使用实际容器宽度作为可视区域
    const actualWidth = containerRef.current.offsetWidth;
    const viewportStart = -containerLeft;
    const viewportEnd = viewportStart + actualWidth;
    
    const startIndex = Math.floor((viewportStart - BUFFER_SIZE * 195) / 195);
    const endIndex = Math.ceil((viewportEnd + BUFFER_SIZE * 195) / 195);
    
    const clampedStart = Math.max(0, startIndex);
    const clampedEnd = Math.min(virtualItemsRef.current.length, endIndex);
    
    if (clampedStart === visibleRangeRef.current.start && clampedEnd === visibleRangeRef.current.end) {
      return;
    }
    
    visibleRangeRef.current = { start: clampedStart, end: clampedEnd };
    
    const toRemove: number[] = [];
    renderedItemsMapRef.current.forEach((_, index) => {
      if (index < clampedStart || index >= clampedEnd) {
        toRemove.push(index);
      }
    });
    
    toRemove.forEach(index => {
      const element = renderedItemsMapRef.current.get(index);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      renderedItemsMapRef.current.delete(index);
    });
    
    for (let i = clampedStart; i < clampedEnd; i++) {
      if (!renderedItemsMapRef.current.has(i) && virtualItemsRef.current[i]) {
        const item = virtualItemsRef.current[i];
        
        // 外层容器
        const element = document.createElement('div');
        element.className = 'slot-item';
        element.style.position = 'absolute';
        element.style.left = `${i * 195}px`;
        element.style.top = '50%'; // 垂直居中
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.width = '195px';
        element.style.height = '195px';
        element.style.minWidth = '195px';
        element.style.minHeight = '195px';
        element.style.maxWidth = '195px';
        element.style.maxHeight = '195px';
        element.style.transform = 'translate(-97.5px, -97.5px)';
        
        const glowColor = resolveGlowColor(item);
        let glow: HTMLDivElement | null = null;
        let selectedBackdrop: HTMLDivElement | null = null;
        
        if (glowColor) {
          glow = document.createElement('div');
          glow.className = 'glow';
          glow.style.position = 'absolute';
          glow.style.top = '50%';
          glow.style.left = '50%';
          glow.style.transform = 'translate(-50%, -50%) translateZ(0)';
          glow.style.width = '60%';
          glow.style.height = '60%';
          glow.style.aspectRatio = '1';
          glow.style.backgroundColor = glowColor;
          glow.style.borderRadius = '50%';
          glow.style.filter = 'blur(25px)';
          glow.style.opacity = '0.4';
          glow.style.transition = 'opacity 0.08s ease-out';
          glow.style.willChange = 'opacity';
          glow.style.zIndex = '1'; // 确保光晕在图片后面
          
          if (!isEliminationMode) {
            selectedBackdrop = document.createElement('div');
            selectedBackdrop.className = 'selected-backdrop';
            selectedBackdrop.style.setProperty('--selected-backdrop-color', glowColor);
            selectedBackdrop.style.backgroundColor = glowColor;
            selectedBackdrop.style.display = 'block';
          }
        }
        
        // 图片容器
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'img-wrapper';
        imgWrapper.style.position = 'relative';
        imgWrapper.style.display = 'flex';
        imgWrapper.style.alignItems = 'center'; // 垂直居中
        imgWrapper.style.justifyContent = 'center'; // 水平居中
        imgWrapper.style.width = '55%';
        imgWrapper.style.height = '55%';
        imgWrapper.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        imgWrapper.style.transform = 'scale(1) translateZ(0)';
        imgWrapper.style.willChange = 'transform';
        imgWrapper.style.backfaceVisibility = 'hidden';
        (imgWrapper.style as any).webkitFontSmoothing = 'antialiased';
        imgWrapper.style.zIndex = '2'; // 确保图片在光晕上方
        
        // 根据模式渲染不同的图片结构
        if (isEliminationMode) {
          // 淘汰模式：按照参考HTML结构渲染头像（多层包裹）
          // <div class="flex rounded-full overflow-clip transition-transform duration-200 scale-125">
          const outerWrapper = document.createElement('div');
          outerWrapper.className = 'flex rounded-full overflow-clip transition-transform duration-200';
          outerWrapper.style.transform = 'scale(1)';
          const avatarSlotSize = 112;
          outerWrapper.style.width = `${avatarSlotSize}px`;
          outerWrapper.style.height = `${avatarSlotSize}px`;
          
          // <div class="overflow-hidden border rounded-full border-gray-700" style="border-width: 1px;">
          const borderWrapper = document.createElement('div');
        
          
          // <div class="relative rounded-full overflow-hidden" style="width: 96px; height: 96px;">
          const avatarContainer = document.createElement('div');
          avatarContainer.className = 'relative rounded-full overflow-hidden';
          avatarContainer.style.width = `${avatarSlotSize - 8}px`;
          avatarContainer.style.height = `${avatarSlotSize - 8}px`;
          avatarContainer.style.margin = 'auto';
          avatarContainer.style.aspectRatio = '1';
          
          // 检查是否是SVG字符串（机器人头像）
          const isSvgString = item.image.trim().startsWith('<svg');
          
          if (isSvgString) {
            // SVG字符串：直接设置innerHTML
            avatarContainer.innerHTML = item.image;
            const svgElement = avatarContainer.querySelector('svg');
            if (svgElement) {
              svgElement.style.width = '100%';
              svgElement.style.height = '100%';
              svgElement.style.objectFit = 'cover';
              
              // 设置SVG颜色（确保可见）
              svgElement.style.color = 'currentColor';
              
              // 如果SVG有fill="currentColor"，需要设置父容器的color
              avatarContainer.style.color = '#ffffff'; // 白色
            }
          } else {
            // 普通图片URL：创建img标签
            const img = document.createElement('img');
            img.src = item.image || '';
            img.alt = item.name;
            img.className = 'pointer-events-none';
            img.style.position = 'absolute';
            img.style.height = '100%';
            img.style.width = '100%';
            img.style.inset = '0px';
            img.style.objectFit = 'cover';
            img.style.color = 'transparent';
            avatarContainer.appendChild(img);
          }
          
          // 组装：avatarContainer -> borderWrapper -> outerWrapper -> imgWrapper
          borderWrapper.appendChild(avatarContainer);
          outerWrapper.appendChild(borderWrapper);
          imgWrapper.appendChild(outerWrapper);
        } else {
          // 礼包模式：简单渲染（原有逻辑）
          const isSvgString = item.image.trim().startsWith('<svg');
          
          if (isSvgString) {
            // SVG字符串
            const svgContainer = document.createElement('div');
            svgContainer.className = 'avatar-svg-container';
            svgContainer.innerHTML = item.image;
            svgContainer.style.position = 'absolute';
            svgContainer.style.height = '100%';
            svgContainer.style.width = '100%';
            svgContainer.style.inset = '0px';
            svgContainer.style.display = 'flex';
            svgContainer.style.alignItems = 'center';
            svgContainer.style.justifyContent = 'center';
            
            const svgElement = svgContainer.querySelector('svg');
            if (svgElement) {
              svgElement.style.width = '100%';
              svgElement.style.height = '100%';
              svgElement.style.objectFit = 'contain';
            }
            
            imgWrapper.appendChild(svgContainer);
          } else {
            // 普通图片URL
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.className = 'product-image';
            img.style.position = 'absolute';
            img.style.height = '100%';
            img.style.width = '100%';
            img.style.inset = '0px';
            img.style.objectFit = 'contain';
            img.style.color = 'transparent';
            
            imgWrapper.appendChild(img);
          }
        }
        
        // 物品信息（名字和价格）
        const itemInfo = document.createElement('div');
        itemInfo.className = 'item-info';
        itemInfo.style.position = 'absolute';
        itemInfo.style.display = 'flex';
        itemInfo.style.flexDirection = 'column';
        itemInfo.style.alignItems = 'center';
        // 背景与纵向老虎机保持一致，避免被父级压缩
        itemInfo.style.background = '#22272b66';
        itemInfo.style.border = 'none';
        itemInfo.style.boxSizing = 'border-box';
        itemInfo.style.padding = '4px 8px';
        itemInfo.style.borderRadius = '6px';
        itemInfo.style.transform = 'translateY(78px)'; // 195px * 0.4
        itemInfo.style.maxWidth = '195px';
        itemInfo.style.minWidth = 'max-content';
        itemInfo.style.whiteSpace = 'nowrap';
        itemInfo.style.opacity = '0';
        itemInfo.style.transition = 'opacity 0.2s';
        itemInfo.style.zIndex = '3';
        
        const itemName = document.createElement('p');
        itemName.className = 'item-name';
        itemName.textContent = item.name;
        itemName.style.margin = '0';
        itemName.style.color = 'white';
        itemName.style.fontWeight = '900';
        itemName.style.fontSize = '16px';
        itemName.style.whiteSpace = 'nowrap';
        itemName.style.maxWidth = '100%';
        itemName.style.overflow = 'hidden';
        itemName.style.textOverflow = 'ellipsis';
        
        // 只在价格大于0时显示价格
        itemInfo.appendChild(itemName);
        
        if (item.price > 0) {
          const itemPrice = document.createElement('p');
          itemPrice.textContent = `$${item.price.toFixed(2)}`;
          itemPrice.style.margin = '0';
          itemPrice.style.color = 'white';
          itemPrice.style.fontWeight = '900';
          itemPrice.style.fontSize = '16px';
          itemInfo.appendChild(itemPrice);
        }
        
        // 组装元素（imgWrapper已经在上面的if-else中添加了子元素）
        if (glow) {
          element.appendChild(glow); // 只在有光晕时添加
        }
        if (selectedBackdrop) {
          element.appendChild(selectedBackdrop);
        }
        element.appendChild(imgWrapper);
        element.appendChild(itemInfo);
        container.appendChild(element);
        renderedItemsMapRef.current.set(i, element);
      }
    }
  }, [REEL_WIDTH]);

  const findClosestItem = useCallback((): SlotSymbol | null => {
    if (!reelContainerRef.current) return null;
    
    const container = reelContainerRef.current;
    const containerLeft = parseFloat(container.style.left || '0');
    
    let closestIndex = -1;
    let closestDistance = Infinity;
    
    renderedItemsMapRef.current.forEach((element, index) => {
      // element.left = index * 195，加上containerLeft就是element在视口中的位置
      // 由于element有transform: translate(-97.5px, -97.5px)，element.left就是它的中心
      const itemCenter = containerLeft + (index * 195);
      const distance = Math.abs(itemCenter - reelCenterRef.current);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    if (closestIndex >= 0 && closestIndex < virtualItemsRef.current.length) {
      return virtualItemsRef.current[closestIndex];
    }
    
    return null;
  }, []);

  const initReels = useCallback(() => {
    if (!reelContainerRef.current || !containerRef.current) return;
    
    if (isSpinning) {
      return;
    }
    
    const container = reelContainerRef.current;
    container.innerHTML = '';
    renderedItemsMapRef.current.clear();
    
    if (initialSymbolsRef.current.length === 0) {
      return;
    }
    
    const symbolSequence: SlotSymbol[] = [];
    for (let j = 0; j < itemsPerReel; j++) {
      symbolSequence.push(initialSymbolsRef.current[Math.floor(Math.random() * initialSymbolsRef.current.length)]);
    }
    
    virtualItemsRef.current = [];
    for (let repeat = 0; repeat < repeatTimes; repeat++) {
      virtualItemsRef.current.push(...symbolSequence);
    }
    
    container.style.position = 'relative';
    container.style.height = '100%';
    // 设置足够的宽度容纳所有item
    const totalWidth = virtualItemsRef.current.length * 195;
    container.style.width = `${totalWidth}px`;
    
    // 使用实际容器宽度计算reelCenter
    const actualContainerWidth = containerRef.current.offsetWidth;
    const actualReelCenter = actualContainerWidth / 2;
    
    // 更新ref
    reelCenterRef.current = actualReelCenter;
    
    // 设置初始位置
    // 必须让中心位置有一个item，其他向左右铺开
    const targetIndex = itemsPerReel; // 第二个周期的第一个item
    const initialLeft = actualReelCenter - (targetIndex * 195);
    container.style.left = `${initialLeft}px`;
    
    
    // 立即更新虚拟项和选中状态
    updateVirtualItems();
    
    // 强制更新选中到targetIndex
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        currentSelectedIndexRef.current = -1; // 重置以强制更新
        updateSelection();
        
      
      });
    });
  }, [isSpinning, itemsPerReel, repeatTimes, itemWidth, reelCenter, updateVirtualItems, updateSelection]);

  const spinPhase1 = useCallback((duration: number, finalIndex: number): Promise<void> => {
    return new Promise(resolve => {
      if (!reelContainerRef.current) {
        resolve();
        return;
      }
      
      const container = reelContainerRef.current;
      let startLeft = parseFloat(container.style.left || '0');
      
      const actualItemWidth = 195;
      const baseWidth = itemWidthRef.current || actualItemWidth;
      const minOffset = baseWidth * RANDOM_OFFSET_MIN_RATIO;
      const maxOffset = baseWidth * RANDOM_OFFSET_MAX_RATIO;
      const randomMagnitude = Math.random() * (maxOffset - minOffset) + minOffset;
      const randomOffset = randomMagnitude * (Math.random() < 0.5 ? 1 : -1);
      
      const targetLeft = reelCenterRef.current - (finalIndex * actualItemWidth) + randomOffset;
      
      let distance = startLeft - targetLeft;
      const minRunway = (itemsPerReelRef.current * 0.2) * actualItemWidth;
      if (distance < minRunway) {
        const cycleWidth = itemsPerReelRef.current * actualItemWidth;
        startLeft += cycleWidth;
        container.style.left = `${startLeft}px`;
        distance = startLeft - targetLeft;
      }
      
      const startTime = Date.now();
      let lastFrameTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const frameDelta = now - lastFrameTime;
        lastFrameTime = now;
        
        if (frameDelta > 200) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = customEase(progress);
          const currentLeft = startLeft - distance * easedProgress;
          container.style.left = currentLeft + 'px';
          updateVirtualItems();
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
          return;
        }
        
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = customEase(progress);
        
        const currentLeft = startLeft - distance * easedProgress;
        container.style.left = currentLeft + 'px';
        
        updateVirtualItems();
        updateSelection();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }, [updateVirtualItems, updateSelection, customEase]);

  // 第二阶段回正
  const spinPhase2 = useCallback((finalIndex: number): Promise<void> => {
    return new Promise(resolve => {
      if (!reelContainerRef.current) {
        resolve();
        return;
      }
      
      const duration = 500;
      const startTime = Date.now();
      const container = reelContainerRef.current;
      let currentLeft = parseFloat(container.style.left || '0');
      
      const totalWidth = itemsPerReelRef.current * 195;
      const minLeft = -totalWidth * 2;
      const resetLeft = -totalWidth;
      
      if (currentLeft < minLeft) {
        currentLeft = resetLeft + (currentLeft - minLeft);
        container.style.left = currentLeft + 'px';
      }
      
      const actualItemWidth = 195;
      
      const exactTargetLeft = reelCenterRef.current - (finalIndex * actualItemWidth);
      const distance = exactTargetLeft - currentLeft;
      
      let lastFrameTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const frameDelta = now - lastFrameTime;
        lastFrameTime = now;
        
        // 🎯 检测时间跳跃（页面失焦超过200ms），直接跳到当前进度，不赶帧
        if (frameDelta > 200) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          const newLeft = currentLeft + distance * eased;
          container.style.left = newLeft + 'px';
          updateVirtualItems();
          // 跳跃后不播放音效
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            container.style.left = exactTargetLeft + 'px';
            void container.offsetWidth;
            updateVirtualItems();
            selectionLockedRef.current = true;
            
            // 🎵 播放回正音效
            if (typeof window !== 'undefined') {
              const ctx = (window as any).__audioContext;
              const buffer = (window as any).__basicWinAudioBuffer;
              if (ctx && buffer) {
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
              }
            }
            
            // 🔥 回正音效触发时立即调用 onSpinSettled（用于淘汰模式同步渲染淘汰UI）
            onSpinSettled?.();
            
            setTimeout(() => { resolve(); }, 100);
          }
          return;
        }
        
        // 正常流程
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const eased = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const newLeft = currentLeft + distance * eased;
        container.style.left = newLeft + 'px';
        
        if (progress < 1) {
          updateVirtualItems();
          updateSelection(); // 正常播放音效
          requestAnimationFrame(animate);
        } else {
          container.style.left = exactTargetLeft + 'px';
          void container.offsetWidth;
          
          updateVirtualItems();
          updateSelection();
          
          selectionLockedRef.current = true;
          
          // 🎵 播放回正音效
          if (typeof window !== 'undefined') {
            const ctx = (window as any).__audioContext;
            const buffer = (window as any).__basicWinAudioBuffer;
            if (ctx && buffer) {
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(0);
            }
          }
          
          // 🔥 回正音效触发时立即调用 onSpinSettled（用于淘汰模式同步渲染淘汰UI）
          onSpinSettled?.();
          
          setTimeout(() => {
            resolve();
          }, 100);
        }
      };
      
      animate();
    });
  }, [findClosestItem, updateVirtualItems, updateSelection, REEL_WIDTH]);

  const startSpin = useCallback(async () => {
    if (isSpinning || !reelContainerRef.current) {
      return;
    }
    
    setIsSpinning(true);
    isSpinningRef.current = true; // 🎵 设置ref状态，用于tick音效判断
    
    // 重置选中锁定，准备新的spin
    selectionLockedRef.current = false;
    
    // 隐藏所有信息（但保留selected类，等新的选中后再更新）
    const items = reelContainerRef.current.querySelectorAll('.slot-item');
    items.forEach(item => {
      item.classList.remove('show-info');
      const itemInfo = item.querySelector('.item-info') as HTMLElement;
      if (itemInfo) {
        itemInfo.style.opacity = '0';
      }
    });
    
    if (onSpinStart) {
      onSpinStart();
    }
    
    setSelectedBackdropVisibility(true);

    const duration = spinDuration || 6000;
    
    // 🎯 固定逻辑：计算目标索引并注入结果（与纵向老虎机保持一致）
    const container = reelContainerRef.current;
    const currentLeft = parseFloat(container.style.left || '0');
    const w = itemWidthRef.current || 195;
    // 与纵向老虎机一致，使用半格偏移对齐中心
    const currentVisualIndex = Math.round((reelCenterRef.current - currentLeft - w / 2) / w);
    const runDistance = 40;
    let targetBaseIndex = currentVisualIndex + runDistance;
    
    const cycleLen = itemsPerReelRef.current;
    const totalLen = virtualItemsRef.current.length;
    if (targetBaseIndex >= totalLen - 10) {
      const offsetAmount = cycleLen * w;
      const nextLeft = currentLeft + offsetAmount;
      container.style.left = `${nextLeft}`;
      targetBaseIndex -= cycleLen;
    }
    
    if (selectedPrize) {
      virtualItemsRef.current[targetBaseIndex] = selectedPrize;
      if (targetBaseIndex - cycleLen >= 0) {
        virtualItemsRef.current[targetBaseIndex - cycleLen] = selectedPrize;
      }
      if (targetBaseIndex + cycleLen < totalLen) {
        virtualItemsRef.current[targetBaseIndex + cycleLen] = selectedPrize;
      }
    }
    
    await spinPhase1(duration, targetBaseIndex);
    await spinPhase2(targetBaseIndex);
    setSelectedBackdropVisibility(false);
    
    const finalResult = findClosestItem();
    
    // 显示选中物品的信息
    if (currentSelectedElementRef.current) {
      (currentSelectedElementRef.current as HTMLElement).classList.add('show-info');
      
      // 直接设置opacity，覆盖内联样式
      const itemInfo = currentSelectedElementRef.current.querySelector('.item-info') as HTMLElement;
      if (itemInfo) {
        itemInfo.style.opacity = '1';
      }
    }
    
    if (finalResult) {
      if (onSpinComplete) {
        const reportResult = selectedPrize || finalResult;
        onSpinComplete(reportResult);
      }
    }
    
    setIsSpinning(false);
    isSpinningRef.current = false; // 🎵 重置ref状态
    // 保持选中锁定，不要重置
    // selectionLockedRef.current = false;  // 注释掉，保持选中状态
  }, [isSpinning, onSpinStart, onSpinComplete, spinDuration, selectedPrize, spinPhase1, spinPhase2, findClosestItem, setSelectedBackdropVisibility]);

  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!hasInitializedRef.current && symbols.length > 0) {
      initialSymbolsRef.current = symbols;
      initReels();
      hasInitializedRef.current = true;
    }
  }, [symbols.length, initReels]);

  const updateReelContent = useCallback((newSymbols: SlotSymbol[]) => {
    if (!reelContainerRef.current || newSymbols.length === 0) return;
    
    initialSymbolsRef.current = newSymbols;
    initReels();
  }, [initReels]);

  useImperativeHandle(ref, () => ({
    startSpin,
    updateReelContent
  }), [startSpin, updateReelContent]);

  return (
    <div className="horizontal-lucky-slot-machine-container" ref={containerRef}>
      <style jsx global>{`
        .horizontal-lucky-slot-machine-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .horizontal-reel {
          width: 100%;
          height: 195px;
          position: relative;
          overflow: hidden;
          margin: auto; // 垂直居中
        }
        
        .horizontal-reel-container {
          position: relative;
          height: 100%;
          left: 0px;
        }
        
        .slot-item .glow {
          opacity: 0.4;
        }
        
        .slot-item .selected-backdrop {
          position: absolute;
          width: 60%;
          aspect-ratio: 1;
          min-width: 60%;
          min-height: 60%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          background-color: var(--selected-backdrop-color, #FFFFFF);
          mask-image: url('/images/tick.svg');
          mask-size: contain;
          mask-position: center;
          mask-repeat: no-repeat;
          -webkit-mask-image: url('/images/tick.svg');
          -webkit-mask-size: contain;
          -webkit-mask-position: center;
          -webkit-mask-repeat: no-repeat;
          opacity: 0;
          z-index: 2;
          transition: opacity 0.12s ease-out;
        }
        
        .slot-item:hover .glow {
          opacity: 0.9;
        }
        
        .slot-item.selected .glow {
          opacity: 0.9;
        }
        
        .slot-item.selected .selected-backdrop {
          opacity: 1;
        }
        
        .slot-item.show-info .item-info {
          opacity: 1;
        }
      `}</style>
      
      <div 
        ref={reelRef}
        className="horizontal-reel"
      >
        <div ref={reelContainerRef} className="horizontal-reel-container" />
      </div>
    </div>
  );
});

HorizontalLuckySlotMachine.displayName = 'HorizontalLuckySlotMachine';

export default HorizontalLuckySlotMachine;
