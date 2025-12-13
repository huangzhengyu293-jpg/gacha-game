'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { getQualityFromLv } from '@/app/lib/catalogV2';

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
  itemSizeOverride?: number; // 外部指定单个item宽高（正方形），用于特定布局
}

  export interface LuckySlotMachineHandle {
    startSpin: () => void;
    updateReelContent: (newSymbols: SlotSymbol[]) => void;
  }

const GOLDEN_PLACEHOLDER_ID = 'golden_placeholder';
const QUALITY_HEX_MAP: Record<string, string> = {
  legendary: '#E4AE33',
  mythic: '#EB4B4B',
  epic: '#8847FF',
  rare: '#4B69FF',
  common: '#829DBB',
  placeholder: '#E4AE33',
};

const RANDOM_OFFSET_MIN_RATIO = 0.2;
const RANDOM_OFFSET_MAX_RATIO = 0.49;
const FINAL_ALIGNMENT_DURATION = 480;

function resolveQualityHex(symbol: SlotSymbol): string {
  if (symbol.id === GOLDEN_PLACEHOLDER_ID) {
    return QUALITY_HEX_MAP.placeholder;
  }

  if (symbol.qualityId && QUALITY_HEX_MAP[symbol.qualityId]) {
    return QUALITY_HEX_MAP[symbol.qualityId];
  }
  return QUALITY_HEX_MAP.common;
}

function hexToRgb(hex: string): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return '130, 157, 187';
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

const LuckySlotMachine = forwardRef<LuckySlotMachineHandle, LuckySlotMachineProps>(({
  symbols,
  selectedPrizeId,
  onSpinStart,
  onSpinComplete,
  height = 540,
  spinDuration,
  itemSizeOverride
}, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<SlotSymbol | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  const currentScrollYRef = useRef<number>(0); // 🚀 性能优化：使用 ref 记录位置，不再读取 DOM
  const initialSymbolsRef = useRef<SlotSymbol[]>([]); // Store initial symbols, never update
  
  // 🚀 Virtual Scrolling: Data structure for all items (virtual)
  const virtualItemsRef = useRef<SlotSymbol[]>([]); // All virtual items
  const renderedItemsMapRef = useRef<Map<number, HTMLDivElement>>(new Map()); // Pool of rendered DOM elements
  const visibleRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // 配置参数
  const REEL_HEIGHT = height;
  const [itemHeight, setItemHeight] = useState(itemSizeOverride ?? 180);
  const [itemsPerReel, setItemsPerReel] = useState(() => {
    const size = itemSizeOverride ?? 180;
    return Math.ceil(90 * (180 / size));
  });
  const [repeatTimes, setRepeatTimes] = useState(3);
  const FINAL_REVEAL_BUFFER_MS = 500;
  const FAKE_STOP_OFFSET_SCALE = 0.4;
  // Calculate reel center based on actual height (450px fixed)
  const reelCenter = 225; // Fixed at 450/2 = 225px for all screen sizes
  const getRandomStopOffset = useCallback((baseHeight: number) => {
    const clampedHeight = baseHeight || itemHeightRef.current || 150;
    const minOffset = clampedHeight * RANDOM_OFFSET_MIN_RATIO;
    const maxOffset = clampedHeight * RANDOM_OFFSET_MAX_RATIO;
    const magnitude = Math.random() * (maxOffset - minOffset) + minOffset;
    return magnitude * (Math.random() < 0.5 ? 1 : -1);
  }, []);

  
  // 🚀 Virtual scrolling constants
  const BUFFER_SIZE = 5; // Render 5 extra items above and below viewport
  const UPDATE_THROTTLE = 50; // 🔥 提高节流间隔到 50ms (~20fps)，降低多老虎机并发压力
  
  // 性能优化：节流时间戳
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Dynamically update item height and count based on parent container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateItemConfig = () => {
      // 优先使用外部指定尺寸（用于特定布局，如小屏2v2v2）
      if (typeof itemSizeOverride === 'number') {
        const forcedHeight = Math.max(60, itemSizeOverride);
        setItemHeight(forcedHeight);
        const baseItemsPerReel = Math.ceil(90 * (180 / forcedHeight));
        setItemsPerReel(baseItemsPerReel);
        const minTotalItems = baseItemsPerReel * 3;
        const calculatedRepeatTimes = Math.max(3, Math.ceil(minTotalItems / baseItemsPerReel));
        setRepeatTimes(calculatedRepeatTimes);
        return;
      }
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
  }, [REEL_HEIGHT, itemSizeOverride]);

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

  // 🚀 性能优化：统一设置位置 (使用 transform)
  const setReelPosition = useCallback((y: number) => {
    if (reelContainerRef.current) {
      reelContainerRef.current.style.transform = `translate3d(0, ${y}px, 0)`; // 开启 GPU 加速
      currentScrollYRef.current = y;
    }
  }, []);

  // 检查并重置位置 (适配 transform)
  const checkAndResetPosition = useCallback((): number => {
    let currentY = currentScrollYRef.current;
    const totalHeight = itemsPerReelRef.current * itemHeightRef.current;
    const minTop = -totalHeight * 2;
    const resetTop = -totalHeight;
    
    if (currentY < minTop) {
      currentY = resetTop + (currentY - minTop);
      setReelPosition(currentY);
    }
    return currentY;
  }, [setReelPosition]);

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
    
    let containerTop = currentScrollYRef.current;
    
    const totalHeight = itemsPerReelRef.current * itemHeightRef.current;
    const minTop = -totalHeight * 2;
    const resetTop = -totalHeight;
    
    if (containerTop < minTop) {
      containerTop = resetTop + (containerTop - minTop);
      setReelPosition(containerTop);
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


  const createItemInfoElement = useCallback((symbol: SlotSymbol): HTMLDivElement => {
    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';

    const itemName = document.createElement('p');
    itemName.className = 'item-name';
    itemName.textContent = symbol.name;
    itemInfo.appendChild(itemName);

    if (symbol.price > 0) {
      const itemPrice = document.createElement('p');
      itemPrice.className = 'item-price';
      itemPrice.textContent = `¥${symbol.price}`;
      itemInfo.appendChild(itemPrice);
    }

    return itemInfo;
  }, []);

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
    
    const qualityHexColor = resolveQualityHex(symbol);
    const glowColor = hexToRgb(qualityHexColor);
    glow.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.6) 0%, rgba(${glowColor}, 0.3) 50%, transparent 70%)`;
    
    // 图片包装器
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'item-image-wrapper';
    
    const img = document.createElement('img');
    img.src = symbol.image;
    img.alt = symbol.name;
    
    imgWrapper.appendChild(img);
    
    const info = symbol.id === GOLDEN_PLACEHOLDER_ID ? null : createItemInfoElement(symbol);
    
    const selectedBackdrop = document.createElement('div');
    selectedBackdrop.className = 'selected-backdrop';
    selectedBackdrop.style.backgroundColor = qualityHexColor;
    
    item.appendChild(glow);
    item.appendChild(selectedBackdrop);
    item.appendChild(imgWrapper);
    if (info) {
      item.appendChild(info);
    }
    
    // Set absolute position
    item.style.position = 'absolute';
    item.style.top = `${index * itemHeightRef.current}px`;
    
    return item;
  }, [createItemInfoElement]);

  // 🚀 Update virtual items rendering (only render visible range)
  const updateVirtualItems = useCallback(() => {
    const container = reelContainerRef.current;
    if (!container || virtualItemsRef.current.length === 0) return;
    
    // 🚀 节流优化：限制更新频率到 ~60fps
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE) {
      return;
    }
    lastUpdateTimeRef.current = now;
    
    const containerTop = currentScrollYRef.current;
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
    
    // 🚀 批量DOM操作：使用 DocumentFragment
    const fragment = document.createDocumentFragment();
    const newItems: Array<{ index: number; element: HTMLDivElement }> = [];
    
    // Add/update items in visible range
    for (let i = startIndex; i <= endIndex; i++) {
      const symbol = virtualItemsRef.current[i];
      if (!symbol) continue;
      
      let item = renderedItemsMapRef.current.get(i);
      if (!item) {
        // Create new DOM element
        item = createItemElement(symbol, i);
        renderedItemsMapRef.current.set(i, item);
        newItems.push({ index: i, element: item });
        fragment.appendChild(item);
      }
      // Position is set in createItemElement, no need to update unless changed
    }
    
    // 一次性插入所有新元素
    if (newItems.length > 0) {
      container.appendChild(fragment);
    }
  }, [createItemElement, REEL_HEIGHT]);

  // 提前展示目标 item 的 info，用于回正过程中也能看到
  const revealInfoForIndex = useCallback(
    (index: number) => {
      updateVirtualItems();
      const item = renderedItemsMapRef.current.get(index);
      if (item) {
        item.classList.add('show-info');
        currentSelectedElementRef.current = item;
        currentSelectedIndexRef.current = index;
      }
    },
    [updateVirtualItems]
  );

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
    setReelPosition(initialTop);
    
    // 🚀 Render only visible items
    updateVirtualItems();
    updateSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateVirtualItems, updateSelection, itemsPerReel, repeatTimes, itemHeight, isSpinning]);

  // 🚀 缓存 actualItemHeight
  const actualItemHeightRef = useRef<number>(0);
  
  // 第一阶段旋转
  // 修改：不再搜索最近的符号，而是接受一个固定的 targetIndex
  const spinPhase1 = useCallback((duration: number, finalIndex: number): Promise<void> => {
    return new Promise(resolve => {
      if (!reelContainerRef.current) {
        resolve();
        return;
      }
      
      const container = reelContainerRef.current;
      let startTop = currentScrollYRef.current;
      
      // 🚀 优化：缓存 actualItemHeight，只在第一次查询
      if (actualItemHeightRef.current === 0) {
        actualItemHeightRef.current = container.querySelector('.slot-item')?.getBoundingClientRect().height || itemHeightRef.current;
      }
      const actualItemHeight = actualItemHeightRef.current;
      
      // 1. 计算目标位置 (基于固定的 finalIndex)
      // 目标 top = -(索引 * 高度) + 居中偏移 - 随机微调
      const randomOffset = getRandomStopOffset(actualItemHeight);
      const targetTop = -(finalIndex * actualItemHeight) + reelCenterRef.current - actualItemHeight / 2 + randomOffset;
      
      // 2. 检查距离是否足够
      let distance = startTop - targetTop;
      const minRunway = (itemsPerReelRef.current * 0.2) * actualItemHeight; // 至少跑 1/4 圈
      
      // 如果距离太短（比如已经在底部了），我们需要“后退”来制造助跑距离
      // 利用虚拟列表的重复性，我们把 startTop 向上挪动一个周期（itemsPerReel * height）
      if (distance < minRunway) {
        const cycleHeight = itemsPerReelRef.current * actualItemHeight;
        startTop += cycleHeight; 
        setReelPosition(startTop);
        distance = startTop - targetTop;
      }

      const startTime = Date.now();
      let lastFrameTime = Date.now();
      let frameCount = 0;
      
      const animate = () => {
        const now = Date.now();
        const frameDelta = now - lastFrameTime;
        lastFrameTime = now;
        
        
        if (frameDelta > 200) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = customEase(progress);
          const currentTop = startTop - distance * easedProgress;
          setReelPosition(currentTop);
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
        
        const currentTop = startTop - distance * easedProgress;
        setReelPosition(currentTop);
        
        frameCount++;
        
        if (frameCount % 5 === 0) {
          // 移除 checkAndResetPosition，因为我们是定点运动，不需要中途重置
          updateVirtualItems();
          updateSelection(); 
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }, [updateVirtualItems, updateSelection, customEase, getRandomStopOffset]);

  // 第二阶段旋转
  // 修改：直接对齐到 finalIndex，不需要再查找
  const spinPhase2 = useCallback((finalIndex: number): Promise<void> => {
    return new Promise(resolve => {
      if (!reelContainerRef.current) {
        resolve();
        return;
      }
      
      const duration = FINAL_ALIGNMENT_DURATION;
      const container = reelContainerRef.current;
      const currentTop = currentScrollYRef.current;
      
      const actualItemHeight = actualItemHeightRef.current || itemHeightRef.current;
      
      // 直接计算目标位置（无随机偏移）
      const exactTargetTop = -(finalIndex * actualItemHeight) + reelCenterRef.current - actualItemHeight / 2;
      const distance = exactTargetTop - currentTop;
      
      const startTime = Date.now();
      let lastFrameTime = Date.now();
      let frameCount = 0;
      
      const animate = () => {
        const now = Date.now();
        const frameDelta = now - lastFrameTime;
        lastFrameTime = now;
        
        if (frameDelta > 200) {
          setReelPosition(exactTargetTop);
          updateVirtualItems();
          resolve();
          return;
        }
        
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        
        const newTop = currentTop + distance * eased;
        setReelPosition(newTop);
        
        frameCount++;
        if (progress < 1) {
          if (frameCount % 5 === 0) {
             updateVirtualItems();
             updateSelection();
          }
          requestAnimationFrame(animate);
        } else {
          setReelPosition(exactTargetTop);
          // void container.offsetHeight;
          updateVirtualItems();
          updateSelection();
          selectionLockedRef.current = true;
          resolve();
        }
      };
      
      animate();
    });
  }, [updateVirtualItems, updateSelection]);

  // 开始旋转
  const startSpin = useCallback(async () => {
    if (isSpinning || !reelContainerRef.current) {
      return;
    }
    
    // 重置选中锁，允许新一轮正常更新选中态
    selectionLockedRef.current = false;
    
    setIsSpinning(true);
    setIsFinalizing(false);
    
    // 🚀 重置 actualItemHeight 缓存
    actualItemHeightRef.current = 0;
    
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
    const duration = spinDuration||6000;

    // 🎯 核心逻辑修改：计算固定的目标索引（倒数第二组的中间）
    // 🎯 核心逻辑修改：基于当前位置计算相对目标
    // 1. 算出当前位置索引
    const container = reelContainerRef.current;
    const currentTop = currentScrollYRef.current;
    const h = itemHeightRef.current;
    const currentVisualIndex = Math.round((-currentTop + reelCenterRef.current - h / 2) / h);
    
    // 2. 设定目标：每次随机跑 40-45 格，保持可配置
    const runDistance = 40;
    let targetBaseIndex = currentVisualIndex + runDistance;
    
    // 3. 越界回绕处理：如果目标超出了列表范围，将整体坐标向上回滚一圈
    if (targetBaseIndex >= virtualItemsRef.current.length - 10) {
       const cycleLen = itemsPerReelRef.current;
       const offsetAmount = cycleLen * h;
       setReelPosition(currentTop + offsetAmount);
       targetBaseIndex -= cycleLen;
    }
    
    // 注入结果
    if (selectedPrize) {
      // 注入目标位置
      virtualItemsRef.current[targetBaseIndex] = selectedPrize;
      // 注入前一周期位置（为了视觉连贯）
      if (targetBaseIndex - itemsPerReelRef.current >= 0) {
         virtualItemsRef.current[targetBaseIndex - itemsPerReelRef.current] = selectedPrize;
      }
      // 注入后一周期位置
      if (targetBaseIndex + itemsPerReelRef.current < virtualItemsRef.current.length) {
         virtualItemsRef.current[targetBaseIndex + itemsPerReelRef.current] = selectedPrize;
      }
    }
    
    await spinPhase1(duration, targetBaseIndex);
    setIsFinalizing(true);
    
    // 在回正阶段开始前就展示 info，避免等待完全停住才显示
    revealInfoForIndex(targetBaseIndex);

    await spinPhase2(targetBaseIndex);
    
    if (reelContainerRef.current) {
      
      // Get the final result from virtual items using the selected index
      let finalResult: SlotSymbol | null = selectedPrize;
      
      // 强制使用目标索引
      currentSelectedIndexRef.current = targetBaseIndex;
        
      const selectedVirtualItem = virtualItemsRef.current[targetBaseIndex];
      
      // Add show-info class to the rendered DOM element (if it exists)
      // 需要先 updateVirtualItems 确保 DOM 存在
      updateVirtualItems();
      const finalItem = renderedItemsMapRef.current.get(targetBaseIndex);

      if (finalItem) {
        finalItem.classList.add('show-info');
        currentSelectedElementRef.current = finalItem;
      }
      
      if (!finalResult) {
        finalResult = selectedVirtualItem;
      }
      
      // Use the pre-selected prize for the result, or the actual stopped item
      if (finalResult) {
        if (onSpinComplete) {
          // Always use the pre-selected prize if available
          const reportResult = selectedPrize || finalResult;
          onSpinComplete(reportResult);
        }
      }
    }
    
    setIsFinalizing(false);
    setIsSpinning(false);
    // Don't reset hasStarted here - it should only be reset when selectedPrizeId changes
  }, [isSpinning, selectedPrize, onSpinStart, onSpinComplete, spinPhase1, spinPhase2, hasStarted, spinDuration, updateVirtualItems]); // Removed symbols dependency

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
 

  // 🚀 优化：无缝更新转轮内容，无需卸载重新挂载
  const updateReelContent = useCallback((newSymbols: SlotSymbol[]) => {
    if (!reelContainerRef.current || newSymbols.length === 0 || isSpinning) return;
    
    // 保存当前滚动位置
    const currentTop = currentScrollYRef.current;
    
    // 更新初始符号引用
    initialSymbolsRef.current = newSymbols;
    
    // 重新生成虚拟项目数组（保持相同的结构）
    const symbolSequence: SlotSymbol[] = [];
    for (let j = 0; j < itemsPerReelRef.current; j++) {
      symbolSequence.push(newSymbols[Math.floor(Math.random() * newSymbols.length)]);
    }
    
    virtualItemsRef.current = [];
    for (let repeat = 0; repeat < repeatTimes; repeat++) {
      virtualItemsRef.current.push(...symbolSequence);
    }
    
    // 🔥 关键：逐个更新已渲染的 DOM 元素，而不是全部重建
    renderedItemsMapRef.current.forEach((element, index) => {
      const symbol = virtualItemsRef.current[index];
      if (!symbol) return;
      
      // 更新数据属性
      element.dataset.id = symbol.id;
      element.dataset.name = symbol.name;
      element.dataset.price = symbol.price.toString();
      element.dataset.index = index.toString();
      
      // 更新图片
      const img = element.querySelector('img');
      if (img && img.src !== symbol.image) {
        img.src = symbol.image;
        img.alt = symbol.name;
      }
      
      // 🔥 更新光晕颜色
      const glow = element.querySelector('.item-glow') as HTMLElement;
      if (glow) {
        const glowColor = symbol.qualityId === 'legendary' ? '228, 174, 51'  // 传说 - 金色
          : symbol.qualityId === 'mythic' ? '235, 75, 75'     // 神话 - 红色
          : symbol.qualityId === 'epic' ? '136, 71, 255'      // 史诗 - 紫色
          : symbol.qualityId === 'rare' ? '75, 105, 255'      // 稀有 - 蓝色
          : '130, 157, 187'; // 普通 - 灰色
        glow.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.6) 0%, rgba(${glowColor}, 0.3) 50%, transparent 70%)`;
      }
      
      let info = element.querySelector('.item-info') as HTMLDivElement | null;
      if (symbol.id === GOLDEN_PLACEHOLDER_ID) {
        if (info) {
          info.remove();
          info = null;
        }
      } else {
        if (!info) {
          info = createItemInfoElement(symbol);
          element.appendChild(info);
        } else {
          const namePara = info.querySelector('.item-name');
          if (namePara) {
            namePara.textContent = symbol.name;
          }
          let pricePara = info.querySelector('.item-price') as HTMLParagraphElement | null;
          if (symbol.price > 0) {
            if (!pricePara) {
              pricePara = document.createElement('p');
              pricePara.className = 'item-price';
              info.appendChild(pricePara);
            }
            pricePara.textContent = `¥${symbol.price}`;
          } else if (pricePara) {
            pricePara.remove();
          }
        }
      }
    });
    
    // 保持当前滚动位置，实现无缝切换
    setReelPosition(currentTop);
    
    // 重置选中状态
    currentSelectedIndexRef.current = -1;
    currentSelectedElementRef.current = null;
    selectionLockedRef.current = false;
  }, [repeatTimes, createItemInfoElement]);

  // Expose startSpin and updateReelContent methods to parent
  useImperativeHandle(ref, () => ({
    startSpin,
    updateReelContent
  }), [startSpin, updateReelContent]);

  return (
    <div
      className={[
        'lucky-slot-machine-container',
        isSpinning ? 'is-spinning' : '',
        isFinalizing ? 'is-finalizing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={containerRef}
      style={{ '--item-height': `${itemHeight}px` } as React.CSSProperties}
    >
      <style>{`
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
          transform: scaleY(-1);
          transform-origin: center;
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
          transform: scaleY(-1);
          transform-origin: center;
        }

        .lucky-slot-machine-container .item-glow {
          position: absolute;
          width: 60%;
          aspect-ratio: 1;
          top: 50%;
          left: 50%;
          background: radial-gradient(circle, rgba(255, 182, 193, 0.6) 0%, rgba(255, 182, 193, 0.3) 50%, transparent 70%);
          z-index: 1;
          opacity: 0;
          transition: opacity 0.08s ease-out;
          will-change: opacity;
          transform: translate(-50%, -50%) translateZ(0);
        }

        .lucky-slot-machine-container .selected-backdrop {
          position: absolute;
          width: 60%;
          aspect-ratio: 1;
          min-width: 60%;
          min-height: 60%;
          top: 50%;
          left: 50%;
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
          transform: translate(-50%, -50%) translateZ(0);
          transition: opacity 0.12s ease-out;
        }

        .lucky-slot-machine-container .item-image-wrapper {
          position: relative;
          width: 60%;
          height: 60%;
          z-index: 3;
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
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
          background: #1D2125;
          border: 1px solid #2A2F33;
          padding: 4px 8px;
          border-radius: 6px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, calc(var(--item-height) * 0.4));
          max-width: var(--item-height);
          opacity: 0;
          z-index: 4;
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

        .lucky-slot-machine-container.is-spinning:not(.is-finalizing) .slot-item.selected .selected-backdrop {
          opacity: 1;
        }

        .lucky-slot-machine-container.is-finalizing .slot-item.selected .selected-backdrop {
          opacity: 0;
        }

        .lucky-slot-machine-container .slot-item.selected .item-image-wrapper {
          transform: scale(1.3) translateZ(0);
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
            transform: translate(-50%, calc(var(--item-height) * 0.35));
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
