'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';

export interface SlotSymbol {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability?: number;
  qualityId?: string | null;
}

interface LuckySlotMachineProps {
  symbols: SlotSymbol[];
  selectedPrizeId?: string | null;
  onSpinStart?: () => void;
  onSpinComplete?: (result: SlotSymbol) => void;
  height?: number; // 转轮高度，默认540
  spinDuration?: number; // 固定的旋转时长
}

  export interface LuckySlotMachineHandle {
    startSpin: () => void;
    updateReelContent: (newSymbols: SlotSymbol[]) => void;
  }

const LuckySlotMachine = forwardRef<LuckySlotMachineHandle, LuckySlotMachineProps>(({
  symbols,
  selectedPrizeId,
  onSpinStart,
  onSpinComplete,
  height = 540,
  spinDuration
}, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<SlotSymbol | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  const initialSymbolsRef = useRef<SlotSymbol[]>([]); // Store initial symbols, never update
  
  // 🚀 Virtual Scrolling: Data structure for all items (virtual)
  const virtualItemsRef = useRef<SlotSymbol[]>([]); // All virtual items
  const renderedItemsMapRef = useRef<Map<number, HTMLDivElement>>(new Map()); // Pool of rendered DOM elements
  const visibleRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // 配置参数
  const REEL_HEIGHT = height;
  const [itemHeight, setItemHeight] = useState(180);
  const [itemsPerReel, setItemsPerReel] = useState(30);
  const [repeatTimes, setRepeatTimes] = useState(3);
  // Calculate reel center based on actual height (450px fixed)
  const reelCenter = 225; // Fixed at 450/2 = 225px for all screen sizes
  
  // 🚀 Virtual scrolling constants
  const BUFFER_SIZE = 5; // Render 5 extra items above and below viewport
  
  // Dynamically update item height and count based on parent container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateItemConfig = () => {
      // Get parent container width
      const containerWidth = containerRef.current?.clientWidth || 300;
      
      
      // Determine item size based on parent container width
      // 180×180 for width >= 180px
      // 130×130 for width >= 130px && < 180px
      // 90×90 for width < 130px
      let calculatedHeight = 180; // Default
      
      if (containerWidth < 130) {
        calculatedHeight = 90;
      } else if (containerWidth < 180) {
        calculatedHeight = 130;
      } else {
        calculatedHeight = 180;
      }
      
      
      setItemHeight(calculatedHeight);
      
      // Base items count: 180×180 has 90 items
      // Scale items based on size: smaller items need more items for smooth scrolling
      let baseItemsPerReel;
      if (calculatedHeight === 180) {
        baseItemsPerReel = 90; // Base case
      } else if (calculatedHeight === 130) {
        // 130 is 72% of 180, so we need 90 / 0.72 = 125 items
        baseItemsPerReel = Math.ceil(90 * (180 / 130));
      } else { // 90
        // 90 is 50% of 180, so we need 90 / 0.5 = 180 items
        baseItemsPerReel = Math.ceil(90 * (180 / 90));
      }
      
      setItemsPerReel(baseItemsPerReel);
      
      // Calculate repeat times to ensure enough total items
      // We want at least 3x the base items for smooth infinite scrolling
      const minTotalItems = baseItemsPerReel * 3;
      const calculatedRepeatTimes = Math.max(3, Math.ceil(minTotalItems / baseItemsPerReel));
      setRepeatTimes(calculatedRepeatTimes);
      
    };
    
    updateItemConfig();
    
    // Listen for window resize events (in case parent container size changes)
    const handleResize = () => {
      updateItemConfig();
    };
    
    window.addEventListener('resize', handleResize);
    
    const resizeObserver = new ResizeObserver(updateItemConfig);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [REEL_HEIGHT]);

  // 更新选中的奖品
  // Store symbols in ref to avoid triggering this effect when symbols change
  const symbolsRef = useRef<SlotSymbol[]>(symbols);
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);
  
  useEffect(() => {
    if (selectedPrizeId) {
      // Use symbolsRef to get the latest symbols without triggering on symbols change
      const prize = symbolsRef.current.find(s => s.id === selectedPrizeId);
      if (prize) {
        setSelectedPrize(prize);
        // Reset hasStarted when selectedPrizeId changes (new round)
        setHasStarted(false);
      } else {
      }
    } else {
      // Reset when no prize is selected
      setSelectedPrize(null);
      setHasStarted(false);
    }
  }, [selectedPrizeId]); // Only depend on selectedPrizeId

  // 自动开始旋转（当有选中奖品且没有按钮时）
  useEffect(() => {
    if (selectedPrizeId && !isSpinning &&  selectedPrize && !hasStarted) {
      // For auto-start, trust that parent passed valid selectedPrizeId
      // The actual target comes from selectedPrize, not initialSymbolsRef
      // 立即启动，无延迟
      setHasStarted(true);
      // 使用 requestAnimationFrame 确保 DOM 准备就绪后立即启动
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startSpin();
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrizeId,  selectedPrize, hasStarted]); // Removed symbols dependency

  // 自定义缓动函数
  const customEase = (t: number): number => {
    // 直接高速开局，只有减速阶段
    return 1 - Math.pow(1 - t, 5);
  };

  // 检查并重置位置
  const checkAndResetPosition = useCallback((container: HTMLDivElement): number => {
    let currentTop = parseFloat(container.style.top || '0');
    const totalHeight = itemsPerReelRef.current * itemHeightRef.current;
    const minTop = -totalHeight * 2;
    const resetTop = -totalHeight;
    
    if (currentTop < minTop) {
      currentTop = resetTop + (currentTop - minTop);
      container.style.top = currentTop + 'px';
    }
    return currentTop;
  }, []); // NO dependencies - completely stable!

  // Cache for performance optimization
  const currentSelectedIndexRef = useRef<number>(-1);
  const currentSelectedElementRef = useRef<HTMLElement | null>(null);
  const selectionLockedRef = useRef<boolean>(false); // Lock selection after spin completes

  // 更新选中状态（优化版：只操作变化的元素）
  // CRITICAL: Make this function stable by using refs for all values
  const reelCenterRef = useRef(reelCenter);
  const itemHeightRef = useRef(itemHeight);
  const itemsPerReelRef = useRef(itemsPerReel);
  
  useEffect(() => {
    reelCenterRef.current = reelCenter;
    itemHeightRef.current = itemHeight;
    itemsPerReelRef.current = itemsPerReel;
  }, [reelCenter, itemHeight, itemsPerReel]);
  
  const updateSelection = useCallback(() => {
    if (!reelContainerRef.current) return;
    
    // CRITICAL: If selection is locked (after spin completes), don't update
    if (selectionLockedRef.current) {
      return;
    }
    
    const container = reelContainerRef.current;
    let containerTop = parseFloat(container.style.top || '0');
    
    const totalHeight = itemsPerReelRef.current * itemHeightRef.current;
    const minTop = -totalHeight * 2;
    const resetTop = -totalHeight;
    
    if (containerTop < minTop) {
      containerTop = resetTop + (containerTop - minTop);
      container.style.top = containerTop + 'px';
    }
    
    // 🚀 Calculate closest VIRTUAL index (not DOM index!)
    const virtualClosestIndex = Math.round((reelCenterRef.current - containerTop - itemHeightRef.current / 2) / itemHeightRef.current);
    const clampedIndex = Math.max(0, Math.min(virtualItemsRef.current.length - 1, virtualClosestIndex));
    
    // Only update if the virtual index has changed
    if (clampedIndex !== currentSelectedIndexRef.current) {
      // Remove selected from only the previous item
      if (currentSelectedElementRef.current) {
        currentSelectedElementRef.current.classList.remove('selected');
      }
      
      // Add selected to the new closest item (if it's rendered)
      const closestItem = renderedItemsMapRef.current.get(clampedIndex);
      if (closestItem) {
        closestItem.classList.add('selected');
        currentSelectedIndexRef.current = clampedIndex;
        currentSelectedElementRef.current = closestItem;
        
        // 🎵 使用Web Audio API播放tick音效（零延迟，支持无限并发）
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
      } else {
        // Item not rendered yet, just track the index
        currentSelectedIndexRef.current = clampedIndex;
        currentSelectedElementRef.current = null;
      }
    }
  }, []); // NO dependencies - completely stable!

  // 🚀 查找最接近的虚拟项目索引
  const findClosestItem = useCallback((container: HTMLDivElement): number => {
    const containerTop = parseFloat(container.style.top || '0');
    
    // Directly calculate the closest virtual index using math (O(1))
    const virtualClosestIndex = Math.round((reelCenterRef.current - containerTop - itemHeightRef.current / 2) / itemHeightRef.current);
    const clampedIndex = Math.max(0, Math.min(virtualItemsRef.current.length - 1, virtualClosestIndex));
    
    return clampedIndex;
  }, []); // NO dependencies - completely stable!

  // 🚀 Create a single DOM element (reusable factory)
  const createItemElement = useCallback((symbol: SlotSymbol, index: number): HTMLDivElement => {
    const item = document.createElement('div');
    item.className = 'slot-item';
    item.dataset.id = symbol.id;
    item.dataset.name = symbol.name;
    item.dataset.price = symbol.price.toString();
    item.dataset.index = index.toString(); // Track virtual index
    
    // 光晕层 - 根据品质设置颜色
    const glow = document.createElement('div');
    glow.className = 'item-glow';
    
    // 根据品质设置光晕颜色
    const glowColor = symbol.qualityId === 'legendary' ? '255, 215, 0' // 金色
      : symbol.qualityId === 'epic' ? '163, 53, 238'      // 紫色
      : symbol.qualityId === 'rare' ? '0, 112, 221'       // 蓝色
      : symbol.qualityId === 'uncommon' ? '30, 255, 0'    // 绿色
      : '157, 157, 157'; // 灰色 (common)
    
    glow.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.6) 0%, rgba(${glowColor}, 0.3) 50%, transparent 70%)`;
    
    // 图片包装器
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'item-image-wrapper';
    
    const img = document.createElement('img');
    img.src = symbol.image;
    img.alt = symbol.name;
    
    imgWrapper.appendChild(img);
    
    // 信息层
    const info = document.createElement('div');
    info.className = 'item-info';
    
    // 🎯 金色占位符不显示名字和金额
    if (symbol.id !== 'golden_placeholder') {
      const namePara = document.createElement('p');
      namePara.className = 'item-name';
      namePara.textContent = symbol.name;
      
      const pricePara = document.createElement('p');
      pricePara.textContent = `¥${symbol.price}`;
      
      info.appendChild(namePara);
      info.appendChild(pricePara);
    }
    
    item.appendChild(glow);
    item.appendChild(imgWrapper);
    item.appendChild(info);
    
    // Set absolute position
    item.style.position = 'absolute';
    item.style.top = `${index * itemHeightRef.current}px`;
    
    return item;
  }, []);

  // 🚀 Update virtual items rendering (only render visible range)
  const updateVirtualItems = useCallback(() => {
    const container = reelContainerRef.current;
    if (!container || virtualItemsRef.current.length === 0) return;
    
    const containerTop = parseFloat(container.style.top || '0');
    const viewportStart = -containerTop;
    const viewportEnd = viewportStart + REEL_HEIGHT;
    
    // Calculate visible range with buffer
    const startIndex = Math.max(0, Math.floor(viewportStart / itemHeightRef.current) - BUFFER_SIZE);
    const endIndex = Math.min(
      virtualItemsRef.current.length - 1,
      Math.ceil(viewportEnd / itemHeightRef.current) + BUFFER_SIZE
    );
    
    // Only update if range changed significantly
    if (startIndex === visibleRangeRef.current.start && endIndex === visibleRangeRef.current.end) {
      return;
    }
    
    visibleRangeRef.current = { start: startIndex, end: endIndex };
    
    // Remove items outside visible range
    const itemsToRemove: number[] = [];
    renderedItemsMapRef.current.forEach((element, index) => {
      if (index < startIndex || index > endIndex) {
        element.remove();
        itemsToRemove.push(index);
      }
    });
    itemsToRemove.forEach(index => renderedItemsMapRef.current.delete(index));
    
    // Add/update items in visible range
    for (let i = startIndex; i <= endIndex; i++) {
      const symbol = virtualItemsRef.current[i];
      if (!symbol) continue;
      
      let item = renderedItemsMapRef.current.get(i);
      if (!item) {
        // Create new DOM element
        item = createItemElement(symbol, i);
        renderedItemsMapRef.current.set(i, item);
        container.appendChild(item);
      }
      // Position is set in createItemElement, no need to update unless changed
    }
  }, [createItemElement, REEL_HEIGHT]);

  // 初始化转轮 - 只创建虚拟数据，不创建所有DOM
  const initReels = useCallback(() => {
    if (!reelContainerRef.current) return;
    
    // CRITICAL: Prevent reinitialization during spinning
    if (isSpinning) {
      console.error('❌ [initReels] 阻止：正在旋转中，不允许重新初始化！');
      console.trace('调用栈:');
      return;
    }
    
    
    const container = reelContainerRef.current;
    container.innerHTML = '';
    renderedItemsMapRef.current.clear();
    
    // CRITICAL: Only use initialSymbolsRef, NEVER use symbols prop
    if (initialSymbolsRef.current.length === 0) {
      return;
    }
    
    // 🚀 Build virtual items array (NO DOM creation yet!)
    const symbolSequence: SlotSymbol[] = [];
    for (let j = 0; j < itemsPerReel; j++) {
      symbolSequence.push(initialSymbolsRef.current[Math.floor(Math.random() * initialSymbolsRef.current.length)]);
    }
    
    virtualItemsRef.current = [];
    for (let repeat = 0; repeat < repeatTimes; repeat++) {
      virtualItemsRef.current.push(...symbolSequence);
    }
    
    
    // Set container to absolute positioning for virtual scrolling
    container.style.position = 'relative';
    
    // 设置初始位置（给一个向上的偏移，模拟已经在滚动中）
    const initialIndex = itemsPerReel;
    const preScrollOffset = itemHeight * 5; // 预先向上滚动5个物品的距离
    const initialTop = reelCenter - initialIndex * itemHeight - itemHeight / 2 - preScrollOffset;
    container.style.top = initialTop + 'px';
    
    // 🚀 Render only visible items
    updateVirtualItems();
    updateSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateVirtualItems, updateSelection, itemsPerReel, repeatTimes, itemHeight, isSpinning]);

  // 第一阶段旋转
  const spinPhase1 = useCallback((duration: number, targetSymbol: SlotSymbol | null = null): Promise<void> => {
    return new Promise(resolve => {
      if (!reelContainerRef.current) {
        resolve();
        return;
      }
      
      const container = reelContainerRef.current;
      const startTop = parseFloat(container.style.top || '0');
      
      let targetTop: number;
      
      // Get actual item height from DOM
      const actualItemHeight = container.querySelector('.slot-item')?.getBoundingClientRect().height || itemHeightRef.current;
      
      if (targetSymbol) {
        // 🚀 Search in virtual items array instead of DOM
        const matchingIndices: number[] = [];
        virtualItemsRef.current.forEach((item, index) => {
          if (item.id === targetSymbol.id) {
            matchingIndices.push(index);
          }
        });
        
        // ⏱️ 基于时间计算滚动距离（而非固定圈数）
        // duration越长，滚动越远，保持恒定速度感
        const pixelsPerMs = 0.8; // 每毫秒滚动0.8像素（可调整速度）
        const minScrollDistance = duration * pixelsPerMs;
        const equivalentRolls = minScrollDistance / actualItemHeight;
        
        
        let selectedIndex: number | null = null;
        for (const index of matchingIndices) {
          const potentialTop = -(index * actualItemHeight) + reelCenterRef.current - actualItemHeight / 2;
          const scrollDistance = startTop - potentialTop;
          
          if (scrollDistance >= minScrollDistance) {
            selectedIndex = index;
            break;
          }
        }
        
        if (selectedIndex === null && matchingIndices.length > 0) {
          selectedIndex = matchingIndices[0];
          while (true) {
            targetTop = -(selectedIndex * actualItemHeight) + reelCenterRef.current - actualItemHeight / 2;
            if (startTop - targetTop >= minScrollDistance) {
              break;
            }
            selectedIndex += itemsPerReelRef.current;
          }
        }
        
        if (selectedIndex !== null) {
          // Add random offset for more realistic stopping
          const randomOffset = (Math.random() * 30 + 10) * (Math.random() < 0.5 ? 1 : -1);
          targetTop = -(selectedIndex * actualItemHeight) + reelCenterRef.current - actualItemHeight / 2 + randomOffset;
        } else {
          targetTop = startTop - minScrollDistance;
        }
      } else {
        // ⏱️ 无目标时：基于时间计算滚动距离
        const pixelsPerMs = 0.8;
        const scrollDistance = duration * pixelsPerMs;
        const randomOffset = (Math.random() * 40 + 20) * (Math.random() < 0.5 ? 1 : -1);
        targetTop = startTop - scrollDistance + randomOffset;
      }
      
      const distance = startTop - targetTop;
      const startTime = Date.now();
      let lastFrameTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const frameDelta = now - lastFrameTime;
        lastFrameTime = now;
        
        // 🎯 检测时间跳跃（页面失焦超过200ms），直接跳到当前进度，不赶帧
        if (frameDelta > 200) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = customEase(progress);
          const currentTop = startTop - distance * easedProgress;
          container.style.top = currentTop + 'px';
          checkAndResetPosition(container);
          updateVirtualItems();
          // 跳跃后不播放音效，避免爆炸
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
          return;
        }
        
        // 正常流程
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = customEase(progress);
        
        const currentTop = startTop - distance * easedProgress;
        container.style.top = currentTop + 'px';
        
        checkAndResetPosition(container);
        updateVirtualItems();
        updateSelection(); // 正常播放音效
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }, [checkAndResetPosition, updateVirtualItems, updateSelection, customEase]);

  // 第二阶段旋转
  const spinPhase2 = useCallback((targetSymbol: SlotSymbol | null = null): Promise<void> => {
    return new Promise(resolve => {
      if (!reelContainerRef.current) {
        resolve();
        return;
      }
      
      const duration = 500; // Fixed duration for synchronized stopping
      const container = reelContainerRef.current;
      let currentTop = parseFloat(container.style.top || '0');
      
      const totalHeight = itemsPerReelRef.current * itemHeightRef.current;
      const minTop = -totalHeight * 2;
      const resetTop = -totalHeight;
      
      if (currentTop < minTop) {
        currentTop = resetTop + (currentTop - minTop);
        container.style.top = currentTop + 'px';
      }
      
      let closestIndex = findClosestItem(container);
      
      const actualItemHeight = container.querySelector('.slot-item')?.getBoundingClientRect().height || itemHeightRef.current;
      
      if (targetSymbol) {
        const targetIndices: number[] = [];
        
        // Find all instances in virtual array
        virtualItemsRef.current.forEach((item, index) => {
          if (item.id === targetSymbol.id) {
            targetIndices.push(index);
          }
        });
        
        
        if (targetIndices.length > 0) {
          let bestIndex = targetIndices[0];
          let minMovement = Infinity;
          
          targetIndices.forEach(index => {
            const itemTop = index * actualItemHeight + currentTop;
            const itemCenter = itemTop + actualItemHeight / 2;
            const targetTop = reelCenterRef.current - actualItemHeight / 2;
            const movement = Math.abs(itemTop - targetTop);
            
            if (movement < minMovement && itemCenter > 0 && itemCenter < REEL_HEIGHT) {
              minMovement = movement;
              bestIndex = index;
            }
          });
          
          closestIndex = bestIndex;
        } else {
        }
      } else {
      }
      
      // Calculate exact center position
      const exactTargetTop = -(closestIndex * actualItemHeight) + reelCenterRef.current - actualItemHeight / 2;
      
      // Calculate distance to exact center
      const distance = exactTargetTop - currentTop;
      
      const startTime = Date.now();
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
          const newTop = currentTop + distance * eased;
          container.style.top = newTop + 'px';
          updateVirtualItems();
          // 跳跃后不播放音效
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            container.style.top = exactTargetTop + 'px';
            void container.offsetHeight;
            updateVirtualItems();
            selectionLockedRef.current = true;
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
        
        const newTop = currentTop + distance * eased;
        container.style.top = newTop + 'px';
        
        if (progress < 1) {
          // 🚀 Update virtual items and selection during animation
          updateVirtualItems();
          updateSelection(); // 正常播放音效
          requestAnimationFrame(animate);
        } else {
          // Animation finished - ensure we're at the EXACT position (no correction needed)
          container.style.top = exactTargetTop + 'px';
          
          // Force reflow to apply position immediately
          void container.offsetHeight;
          
          // 🚀 Final update of virtual items and selection
          updateVirtualItems();
          updateSelection();
          
          // CRITICAL: Lock selection to prevent any further updates
          selectionLockedRef.current = true;
          
          
          // Wait a tiny bit before resolving
          setTimeout(() => {
            resolve();
          }, 100);
        }
      };
      
      animate();
    });
  }, [findClosestItem, updateVirtualItems, updateSelection]);

  // 开始旋转
  const startSpin = useCallback(async () => {
    if (isSpinning || !reelContainerRef.current) {
      return;
    }
    
    setIsSpinning(true);
    
    // 触发开始回调
    if (onSpinStart) {
      onSpinStart();
    }
    
    // 隐藏所有信息并重置缓存
    const items = reelContainerRef.current.querySelectorAll('.slot-item');
    items.forEach(item => {
      item.classList.remove('show-info', 'selected');
    });
    
    // Reset selection cache
    currentSelectedIndexRef.current = -1;
    currentSelectedElementRef.current = null;
    
    // 使用固定时长，确保所有老虎机同步回正
    const duration = spinDuration || 4500;
    
    await spinPhase1(duration, selectedPrize);
    
    await spinPhase2(selectedPrize);
    
    if (reelContainerRef.current) {
      
      // Get the final result from virtual items using the selected index
      let finalResult: SlotSymbol | null = selectedPrize;
      
      // If we have a selected index, get the virtual item
      if (currentSelectedIndexRef.current >= 0 && currentSelectedIndexRef.current < virtualItemsRef.current.length) {
        const selectedVirtualItem = virtualItemsRef.current[currentSelectedIndexRef.current];
        
        // Add show-info class to the rendered DOM element (if it exists)
        if (currentSelectedElementRef.current) {
          (currentSelectedElementRef.current as HTMLElement).classList.add('show-info');
        }
        
        // If no pre-selected prize, use the virtual item as result
        if (!finalResult) {
          finalResult = selectedVirtualItem;
        }
      }
      
      // Use the pre-selected prize for the result, or the actual stopped item
      if (finalResult) {
        if (onSpinComplete) {
          // Always use the pre-selected prize if available
          const reportResult = selectedPrize || finalResult;
          onSpinComplete(reportResult);
        }
      } else {
      }
    }
    
    setIsSpinning(false);
    // Don't reset hasStarted here - it should only be reset when selectedPrizeId changes
  }, [isSpinning, selectedPrize, onSpinStart, onSpinComplete, spinPhase1, spinPhase2, hasStarted]); // Removed symbols dependency

  // 初始化转轮 - 在组件首次挂载或结构变化时
  const hasInitializedRef = useRef(false);
  const prevItemsPerReelRef = useRef(itemsPerReel);
  const prevRepeatTimesRef = useRef(repeatTimes);
  const symbolsIdRef = useRef<string>('');
  
  useEffect(() => {
    // Only initialize once on mount when symbols are available AND item config is ready
    // Wait for itemsPerReel to be calculated (default is 30, after calculation it should be >= 90)
    if (!hasInitializedRef.current && symbols.length > 0 && itemsPerReel >= 90) {
      
      // Store initial symbols and NEVER update them
      initialSymbolsRef.current = symbols;
      
      initReels();
      hasInitializedRef.current = true;
      const currentSymbolsId = symbols.map(s => s.id).join(',');
      symbolsIdRef.current = currentSymbolsId;
      prevItemsPerReelRef.current = itemsPerReel;
      prevRepeatTimesRef.current = repeatTimes;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerReel, repeatTimes, itemHeight]); // Wait for item config to be calculated
  
  // Handle structure changes separately - but ONLY allow one initialization ever
  useEffect(() => {
    // If already initialized, NEVER reinitialize even if structure changes
    if (!hasInitializedRef.current) return;
    
    const structureChanged = prevItemsPerReelRef.current !== itemsPerReel || 
                            prevRepeatTimesRef.current !== repeatTimes;
    
    if (structureChanged) {
      prevItemsPerReelRef.current = itemsPerReel;
      prevRepeatTimesRef.current = repeatTimes;
    }
  }, [itemsPerReel, repeatTimes]); // Removed initReels dependency to prevent any reinit
  

  // 处理奖品选择
 

  const updateReelContent = useCallback((newSymbols: SlotSymbol[]) => {
    if (!reelContainerRef.current || newSymbols.length === 0) return;
    
    
    // Update initialSymbolsRef to new symbols
    initialSymbolsRef.current = newSymbols;
    
    // Reset selection cache
    currentSelectedIndexRef.current = -1;
    currentSelectedElementRef.current = null;
    
    // Reinitialize the reel with new symbols
    initReels();
  }, [initReels]);

  // Expose startSpin and updateReelContent methods to parent
  useImperativeHandle(ref, () => ({
    startSpin,
    updateReelContent
  }), [startSpin, updateReelContent]);

  return (
    <div className="lucky-slot-machine-container" ref={containerRef} style={{ '--item-height': `${itemHeight}px` } as React.CSSProperties}>
      <style jsx global>{`
        .lucky-slot-machine-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
          overflow: hidden;
        }

        .lucky-slot-machine-container .slot-machine {
          display: flex;
          gap: 15px;
          justify-content: center;
          max-width: 100%;
        }

        .lucky-slot-machine-container .reel {
          width: var(--item-height);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .lucky-slot-machine-container .reel::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 180px;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 10;
        }

        .lucky-slot-machine-container .reel-container {
          position: relative;
          top: 0;
          transition: none;
        }

        .lucky-slot-machine-container .slot-item {
          width: var(--item-height);
          height: var(--item-height);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .lucky-slot-machine-container .item-glow {
          position: absolute;
          width: 60%;
          aspect-ratio: 1;
          background: radial-gradient(circle, rgba(255, 182, 193, 0.6) 0%, rgba(255, 182, 193, 0.3) 50%, transparent 70%);
          z-index: 1;
          opacity: 0;
          transition: opacity 0.08s ease-out;
        }

        .lucky-slot-machine-container .item-image-wrapper {
          position: relative;
          width: 55%;
          height: 55%;
          z-index: 2;
          transition: transform 0.08s ease-out;
        }

        .lucky-slot-machine-container .item-image-wrapper img {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: contain;
          inset: 0;
        }

        .lucky-slot-machine-container .item-info {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(55, 65, 81, 0.4);
          padding: 4px 8px;
          border-radius: 6px;
          transform: translateY(calc(var(--item-height) * 0.4));
          max-width: var(--item-height);
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 3;
        }

        .lucky-slot-machine-container .item-info p {
          margin: 0;
          color: white;
          font-weight: 900;
          font-size: 16px;
        }

        .lucky-slot-machine-container .item-info .item-name {
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lucky-slot-machine-container .slot-item.selected .item-glow {
          opacity: 1;
        }

        .lucky-slot-machine-container .slot-item.selected .item-image-wrapper {
          transform: scale(1.3);
        }

        .lucky-slot-machine-container .slot-item.show-info .item-info {
          opacity: 1;
        }

        .lucky-slot-machine-container .slot-item.selected {
          z-index: 5;
        }

        .lucky-slot-machine-container .controls {
          text-align: center;
        }

        .lucky-slot-machine-container .spin-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 50px;
          font-size: 1.2em;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .lucky-slot-machine-container .spin-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .lucky-slot-machine-container .spin-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lucky-slot-machine-container .result {
          text-align: center;
          margin-top: 20px;
          font-size: 1.3em;
          color: #667eea;
          font-weight: bold;
          min-height: 30px;
        }

        .lucky-slot-machine-container .prize-selector {
          text-align: center;
          padding: 20px;
          border-radius: 10px;
          width: 100%;
          max-width: 600px;
        }

        .lucky-slot-machine-container .prize-selector label {
          display: block;
          margin-bottom: 10px;
          font-size: 1.1em;
          color: #333;
          font-weight: bold;
        }

        .lucky-slot-machine-container .prize-options {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .lucky-slot-machine-container .prize-option {
          width: 60px;
          height: 60px;
          border: 3px solid #ddd;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          overflow: hidden;
          position: relative;
        }

        .lucky-slot-machine-container .prize-option:hover {
          transform: scale(1.1);
          border-color: #667eea;
        }

        .lucky-slot-machine-container .prize-option.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transform: scale(1.15);
        }

        .lucky-slot-machine-container .prize-option img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 7px;
        }
        
        /* Responsive adjustments for medium screens (tablets) */
        @media (max-width: 1023px) and (min-width: 640px) {
          .lucky-slot-machine-container .item-info {
            padding: 3px 6px;
          }
          
          .lucky-slot-machine-container .item-info p {
            font-size: 14px;
          }
          
          .lucky-slot-machine-container .slot-machine {
            gap: 12px;
          }
        }
        
        /* Responsive adjustments for small screens (mobile) */
        @media (max-width: 639px) {
          .lucky-slot-machine-container .item-info {
            padding: 2px 4px;
            transform: translateY(calc(var(--item-height) * 0.35));
          }
          
          .lucky-slot-machine-container .item-info p {
            font-size: 11px;
          }
          
          .lucky-slot-machine-container .slot-machine {
            gap: 8px;
          }
          
          .lucky-slot-machine-container {
            gap: 20px;
          }
        }
      `}</style>

      <div className="slot-machine">
        <div 
          className="reel" 
          ref={reelRef}
          style={{ height: `${REEL_HEIGHT}px` }}
        >
          <div className="reel-container" ref={reelContainerRef}></div>
        </div>
      </div>

    


     
    

    
      </div>
    );
  });

LuckySlotMachine.displayName = 'LuckySlotMachine';

export default LuckySlotMachine;
