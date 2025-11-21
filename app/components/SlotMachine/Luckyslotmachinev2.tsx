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

interface LuckySlotMachineProps {
  symbols: SlotSymbol[];
  selectedPrizeId?: string | null;
  onSpinStart?: () => void;
  onSpinComplete?: (result: SlotSymbol) => void;
  height?: number;
  spinDuration?: number;
  itemSize?: number; // 单个item的宽高（px），用于响应式布局
}

export interface LuckySlotMachineHandle {
  startSpin: () => void;
  updateReelContent: (newSymbols: SlotSymbol[]) => void;
  jumpToProgress: (progress: number, showResult?: boolean) => void;  // 跳转到指定进度（0-1）
  showResult: () => void;  // 直接显示最终结果
}

const LuckySlotMachineV2 = forwardRef<LuckySlotMachineHandle, LuckySlotMachineProps>(({
  symbols,
  selectedPrizeId,
  onSpinStart,
  onSpinComplete,
  height = 540,
  spinDuration = 4500,
  itemSize
}, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<SlotSymbol | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  const initialSymbolsRef = useRef<SlotSymbol[]>([]);
  
  // Animation state
  const animationRef = useRef<{
    startTime: number;
    startPosition: number;
    targetPosition: number;
    duration: number;
    phase: 'spinning' | 'decelerating' | 'snapping' | 'idle';
    rafId?: number;
    targetSymbol?: SlotSymbol | null;
    easingFunction: (t: number) => number;
  }>({
    startTime: 0,
    startPosition: 0,
    targetPosition: 0,
    duration: 0,
    phase: 'idle',
    easingFunction: (t: number) => t
  });
  
  // Virtual items management
  const virtualItemsRef = useRef<SlotSymbol[]>([]);
  const renderedItemsMapRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const visibleRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // Selection tracking
  const currentSelectedIndexRef = useRef<number>(-1);
  const currentSelectedElementRef = useRef<HTMLElement | null>(null);
  const selectionLockedRef = useRef<boolean>(false);
  
  // Configuration
  const [itemHeight, setItemHeight] = useState(itemSize || 180);
  const [itemsPerReel, setItemsPerReel] = useState(30);
  const [repeatTimes, setRepeatTimes] = useState(3);
  const reelCenter = 225; // Fixed center position
  
  // Constants
  const BUFFER_SIZE = 5;
  const REEL_HEIGHT = height;
  const VELOCITY_PER_MS = 0.8; // Pixels per millisecond during spin
  
  // Refs for stable callbacks
  const reelCenterRef = useRef(reelCenter);
  const itemHeightRef = useRef(itemHeight);
  const itemsPerReelRef = useRef(itemsPerReel);
  
  // 更新itemHeight当itemSize prop改变时
  useEffect(() => {
    if (itemSize && itemSize !== itemHeight) {
      setItemHeight(itemSize);
    }
  }, [itemSize, itemHeight]);
  
  useEffect(() => {
    reelCenterRef.current = reelCenter;
    itemHeightRef.current = itemHeight;
    itemsPerReelRef.current = itemsPerReel;
  }, [reelCenter, itemHeight, itemsPerReel]);

  // Initialize Web Audio for tick sounds（手机端禁用）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      isMobileRef.current = isMobile;
      
      // ✅ 手机端禁用音效，减少性能开销
      if (!isMobile && !(window as any).__audioContext) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          (window as any).__audioContext = ctx;
          
          // Create tick sound buffer
          const sampleRate = ctx.sampleRate;
          const duration = 0.02; // 20ms tick
          const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
          const data = buffer.getChannelData(0);
          
          for (let i = 0; i < data.length; i++) {
            data[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * Math.exp(-i / (sampleRate * 0.01));
          }
          
          (window as any).__tickAudioBuffer = buffer;
        }
      }
    }
  }, []);

  // Dynamic item configuration based on container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    // ✅ 如果有 itemSize prop，跳过自动计算，使用传入的尺寸
    if (itemSize) {
      const baseItemsPerReel = Math.ceil(90 * (180 / itemSize));
      setItemsPerReel(baseItemsPerReel);
      
      const minTotalItems = baseItemsPerReel * 3;
      const calculatedRepeatTimes = Math.max(3, Math.ceil(minTotalItems / baseItemsPerReel));
      setRepeatTimes(calculatedRepeatTimes);
      return;
    }
    
    const updateItemConfig = () => {
      const containerWidth = containerRef.current?.clientWidth || 300;
      
      let calculatedHeight = 180;
      if (containerWidth < 130) {
        calculatedHeight = 90;
      } else if (containerWidth < 180) {
        calculatedHeight = 130;
      } else {
        calculatedHeight = 180;
      }
      
      setItemHeight(calculatedHeight);
      
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
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [REEL_HEIGHT, itemSize]);

  // Update selected prize
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
      }
    } else {
      setSelectedPrize(null);
      setHasStarted(false);
    }
  }, [selectedPrizeId]);

  // Create DOM element for slot item
  const createItemElement = useCallback((symbol: SlotSymbol, index: number): HTMLDivElement => {
    const item = document.createElement('div');
    item.className = 'slot-item';
    item.dataset.id = symbol.id;
    item.dataset.name = symbol.name;
    item.dataset.price = symbol.price.toString();
    item.dataset.index = index.toString();
    
    const glow = document.createElement('div');
    glow.className = 'item-glow';
    
    const glowColor = symbol.qualityId === 'legendary' ? '255, 215, 0'
      : symbol.qualityId === 'epic' ? '163, 53, 238'
      : symbol.qualityId === 'rare' ? '0, 112, 221'
      : symbol.qualityId === 'uncommon' ? '30, 255, 0'
      : '157, 157, 157';
    
    glow.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.6) 0%, rgba(${glowColor}, 0.3) 50%, transparent 70%)`;
    
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'item-image-wrapper';
    
    const img = document.createElement('img');
    img.src = symbol.image;
    img.alt = symbol.name;
    img.loading = 'lazy';
    
    imgWrapper.appendChild(img);
    
    const info = document.createElement('div');
    info.className = 'item-info';
    
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
    
    item.style.position = 'absolute';
    item.style.top = `${index * itemHeightRef.current}px`;
    
    return item;
  }, []);

  // Update visible items with virtual scrolling
  const updateVirtualItems = useCallback((currentPosition: number) => {
    const container = reelContainerRef.current;
    if (!container || virtualItemsRef.current.length === 0) return;
    
    const viewportStart = -currentPosition;
    const viewportEnd = viewportStart + REEL_HEIGHT;
    
    const startIndex = Math.max(0, Math.floor(viewportStart / itemHeightRef.current) - BUFFER_SIZE);
    const endIndex = Math.min(
      virtualItemsRef.current.length - 1,
      Math.ceil(viewportEnd / itemHeightRef.current) + BUFFER_SIZE
    );
    
    if (startIndex === visibleRangeRef.current.start && endIndex === visibleRangeRef.current.end) {
      return;
    }
    
    visibleRangeRef.current = { start: startIndex, end: endIndex };
    
    // Remove items outside range
    const itemsToRemove: number[] = [];
    renderedItemsMapRef.current.forEach((element, index) => {
      if (index < startIndex || index > endIndex) {
        element.remove();
        itemsToRemove.push(index);
      }
    });
    itemsToRemove.forEach(index => renderedItemsMapRef.current.delete(index));
    
    // Add new items
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i <= endIndex; i++) {
      const symbol = virtualItemsRef.current[i];
      if (!symbol) continue;
      
      if (!renderedItemsMapRef.current.has(i)) {
        const item = createItemElement(symbol, i);
        renderedItemsMapRef.current.set(i, item);
        fragment.appendChild(item);
      }
    }
    
    if (fragment.childNodes.length > 0) {
      container.appendChild(fragment);
    }
  }, [createItemElement, REEL_HEIGHT]);

  // Update selection based on position
  const updateSelection = useCallback((currentPosition: number, playSound = true) => {
    if (!reelContainerRef.current || selectionLockedRef.current) return;
    
    // Calculate closest item index
    const virtualClosestIndex = Math.round((reelCenterRef.current - currentPosition - itemHeightRef.current / 2) / itemHeightRef.current);
    const clampedIndex = Math.max(0, Math.min(virtualItemsRef.current.length - 1, virtualClosestIndex));
    
    if (clampedIndex !== currentSelectedIndexRef.current) {
      // Remove previous selection
      if (currentSelectedElementRef.current) {
        currentSelectedElementRef.current.classList.remove('selected');
      }
      
      // Add new selection
      const closestItem = renderedItemsMapRef.current.get(clampedIndex);
      if (closestItem) {
        closestItem.classList.add('selected');
        currentSelectedIndexRef.current = clampedIndex;
        currentSelectedElementRef.current = closestItem;
        
        // Play tick sound
        if (playSound && typeof window !== 'undefined') {
          const ctx = (window as any).__audioContext;
          const buffer = (window as any).__tickAudioBuffer;
          if (ctx && buffer) {
            try {
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(0);
            } catch (e) {
              // Ignore audio errors
            }
          }
        }
      } else {
        currentSelectedIndexRef.current = clampedIndex;
        currentSelectedElementRef.current = null;
      }
    }
  }, []);

  // Initialize reel with virtual items
  const initReels = useCallback(() => {
    if (!reelContainerRef.current || isSpinning) return;
    
    const container = reelContainerRef.current;
    container.innerHTML = '';
    renderedItemsMapRef.current.clear();
    
    if (initialSymbolsRef.current.length === 0) return;
    
    // Build virtual items
    const symbolSequence: SlotSymbol[] = [];
    for (let j = 0; j < itemsPerReel; j++) {
      symbolSequence.push(initialSymbolsRef.current[Math.floor(Math.random() * initialSymbolsRef.current.length)]);
    }
    
    virtualItemsRef.current = [];
    for (let repeat = 0; repeat < repeatTimes; repeat++) {
      virtualItemsRef.current.push(...symbolSequence);
    }
    
    // Set initial position
    const initialIndex = itemsPerReel;
    const preScrollOffset = itemHeight * 5;
    const initialPosition = -(initialIndex * itemHeight + preScrollOffset - reelCenter + itemHeight / 2);
    
    container.style.position = 'relative';
    container.style.transform = `translateY(${initialPosition}px)`;
    container.style.willChange = 'transform';
    
    updateVirtualItems(initialPosition);
    updateSelection(initialPosition, false);
  }, [updateVirtualItems, updateSelection, itemsPerReel, repeatTimes, itemHeight, isSpinning]);

  // Animation frame update - 核心动画循环
  const frameCountRef = useRef(0);
  const lastVirtualUpdateTimeRef = useRef(0);
  const isMobileRef = useRef(typeof window !== 'undefined' && window.innerWidth < 768);
  
  const animate = useCallback(function animate(): void {
    const anim = animationRef.current;
    if (anim.phase === 'idle') return;
    
    const now = performance.now();
    const elapsed = now - anim.startTime;
    
    frameCountRef.current++;
    
    let currentPosition: number;
    
    if (anim.phase === 'spinning') {
      // 高速旋转阶段 - 使用强力 ease-out 缓动（和原版一致）
      const progress = Math.min(elapsed / anim.duration, 1);
      // ✅ 使用和原版一样的缓动：1 - (1-t)^5 (ease-out quint)
      const easedProgress = 1 - Math.pow(1 - progress, 5);
      const distance = anim.targetPosition - anim.startPosition;
      currentPosition = anim.startPosition + distance * easedProgress;
      
      // 检查是否到达旋转时长
      if (progress >= 1) {
        // 直接进入回正阶段（不需要单独的减速阶段了）
        startSnapPhase();
        return;
      }
    } else if (anim.phase === 'decelerating') {
      // 减速阶段 - 保留代码以防万一，但正常流程不会进入这里了
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = anim.easingFunction(progress);
      currentPosition = anim.startPosition + (anim.targetPosition - anim.startPosition) * easedProgress;
      
      if (progress >= 1) {
        startSnapPhase();
        return;
      }
    } else if (anim.phase === 'snapping') {
      // 回正阶段 - 平滑对齐到中心
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = anim.easingFunction(progress);
      currentPosition = anim.startPosition + (anim.targetPosition - anim.startPosition) * easedProgress;
      
      if (progress >= 1) {
        // 完成动画
        completeSpinAnimation();
        return;
      }
    } else {
      currentPosition = anim.startPosition;
    }
    
    // Apply transform
    if (reelContainerRef.current) {
      // 处理位置循环
      const totalHeight = itemsPerReelRef.current * itemHeightRef.current;
      const minPosition = -totalHeight * 2;
      const resetPosition = -totalHeight;
      
      if (currentPosition < minPosition) {
        currentPosition = resetPosition + (currentPosition - minPosition);
        // 更新动画起始位置，避免跳跃
        if (anim.phase === 'spinning') {
          anim.startPosition = currentPosition + elapsed * VELOCITY_PER_MS;
        }
      }
      
      reelContainerRef.current.style.transform = `translateY(${currentPosition}px)`;
      
      // ✅ 性能优化：根据设备降低更新频率
      const isMobile = isMobileRef.current;
      const virtualUpdateInterval = isMobile ? 8 : 5;  // 手机每8帧，桌面每5帧
      const selectionUpdateInterval = isMobile ? 5 : 3;  // 手机每5帧，桌面每3帧
      
      // 更新虚拟项（减少DOM操作）
      if (frameCountRef.current % virtualUpdateInterval === 0 || anim.phase === 'snapping') {
        updateVirtualItems(currentPosition);
      }
      
      // 更新选择和音效
      if (frameCountRef.current % selectionUpdateInterval === 0 && anim.phase !== 'snapping') {
        const shouldPlaySound = !isMobile && Math.floor(elapsed / 100) !== Math.floor((elapsed - 50) / 100);
        updateSelection(currentPosition, shouldPlaySound);
      } else if (anim.phase === 'snapping') {
        updateSelection(currentPosition, false);
      }
    }
    
    anim.rafId = requestAnimationFrame(animate);
  }, [updateVirtualItems, updateSelection]);

  // ✅ 删除单独的减速阶段（现在合并到 spinning 阶段了）

  // 开始回正阶段
  const startSnapPhase = useCallback(() => {
    if (!reelContainerRef.current) return;
    
    const container = reelContainerRef.current;
    const currentTransform = window.getComputedStyle(container).transform;
    const matrix = new DOMMatrix(currentTransform);
    const currentPosition = matrix.m42;
    
    // 找到最接近中心的物品
    const closestIndex = Math.round((reelCenterRef.current - currentPosition - itemHeightRef.current / 2) / itemHeightRef.current);
    const clampedIndex = Math.max(0, Math.min(virtualItemsRef.current.length - 1, closestIndex));
    
    // 如果有指定奖品，确保回正到正确的奖品
    let finalIndex = clampedIndex;
    if (selectedPrize && virtualItemsRef.current[clampedIndex]?.id !== selectedPrize.id) {
      // 在附近寻找匹配的奖品
      for (let offset = 0; offset <= 2; offset++) {
        for (const dir of [1, -1]) {
          const checkIndex = clampedIndex + dir * offset;
          if (checkIndex >= 0 && checkIndex < virtualItemsRef.current.length) {
            if (virtualItemsRef.current[checkIndex].id === selectedPrize.id) {
              finalIndex = checkIndex;
              break;
            }
          }
        }
        if (finalIndex !== clampedIndex) break;
      }
    }
    
    // 精确对齐到中心
    const exactTargetPosition = -(finalIndex * itemHeightRef.current - reelCenterRef.current + itemHeightRef.current / 2);
    
    // 设置回正动画
    animationRef.current = {
      startTime: performance.now(),
      startPosition: currentPosition,
      targetPosition: exactTargetPosition,
      duration: 500, // ✅ 回正持续500ms（和原版一致）
      phase: 'snapping',
      targetSymbol: selectedPrize,
      easingFunction: (t: number) => t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2 // ✅ 和原版一样的 ease-in-out cubic
    };
    
    // 锁定选择，防止回正过程中的选择变化
    selectionLockedRef.current = true;
    
    animate();
  }, [selectedPrize, animate]);

  // Complete spin animation
  const completeSpinAnimation = useCallback(() => {
    animationRef.current.phase = 'idle';
    
    // 取消动画帧
    if (animationRef.current.rafId) {
      cancelAnimationFrame(animationRef.current.rafId);
      animationRef.current.rafId = undefined;
    }
    
    // Show final info
    if (currentSelectedElementRef.current) {
      currentSelectedElementRef.current.classList.add('show-info');
    }
    
    // Get final result
    let finalResult: SlotSymbol | null = selectedPrize;
    if (!finalResult && currentSelectedIndexRef.current >= 0 && currentSelectedIndexRef.current < virtualItemsRef.current.length) {
      finalResult = virtualItemsRef.current[currentSelectedIndexRef.current];
    }
    
    // ✅ 播放回正音效和特殊道具音效
    if (finalResult) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      console.log('🔊 音效检查:', { 
        isMobile, 
        道具: finalResult.name, 
        品质: finalResult.qualityId,
        禁用音效: isMobile 
      });
      
      if (!isMobile) {
        // 判断是否是传说道具或金色占位符
        const isLegendaryOrGold = finalResult.qualityId === 'legendary' || finalResult.qualityId === 'placeholder';
        
        // 播放对应音效
        const soundFile = isLegendaryOrGold ? '/special_win.mp3' : '/basic_win.mp3';
        
        console.log('🔊 播放音效:', soundFile);
        
        try {
          const audio = new Audio(soundFile);
          audio.volume = 0.8;
          audio.play()
            .then(() => console.log('✅ 音效播放成功:', soundFile))
            .catch((err) => console.error('❌ 音效播放失败:', soundFile, err));
        } catch (err) {
          console.error('❌ 音效创建失败:', err);
        }
      }
    }
    
    if (finalResult && onSpinComplete) {
      onSpinComplete(selectedPrize || finalResult);
    }
    
    setIsSpinning(false);
  }, [selectedPrize, onSpinComplete]);

  // Start spin
  const startSpin = useCallback(async () => {
    if (isSpinning || !reelContainerRef.current) return;
    
    setIsSpinning(true);
    selectionLockedRef.current = false;
    
    if (onSpinStart) {
      onSpinStart();
    }
    
    // Hide all info and reset
    const items = reelContainerRef.current.querySelectorAll('.slot-item');
    items.forEach(item => {
      item.classList.remove('show-info', 'selected');
    });
    
    currentSelectedIndexRef.current = -1;
    currentSelectedElementRef.current = null;
    
    // Get current position
    const container = reelContainerRef.current;
    const currentTransform = window.getComputedStyle(container).transform;
    const matrix = new DOMMatrix(currentTransform);
    const currentPosition = matrix.m42;
    
    // ✅ 计算目标位置（和原版一样）
    let targetPosition: number;
    
    if (selectedPrize) {
      // 寻找目标符号
      const matchingIndices: number[] = [];
      virtualItemsRef.current.forEach((item, index) => {
        if (item.id === selectedPrize.id) {
          matchingIndices.push(index);
        }
      });
      
      // ⏱️ 基于时间计算滚动距离（和原版一致）
      const pixelsPerMs = 0.8;
      const minScrollDistance = spinDuration * pixelsPerMs;
      
      let selectedIndex: number | null = null;
      for (const index of matchingIndices) {
        const potentialPosition = -(index * itemHeightRef.current - reelCenterRef.current + itemHeightRef.current / 2);
        const scrollDistance = currentPosition - potentialPosition;
        
        if (scrollDistance >= minScrollDistance) {
          selectedIndex = index;
          break;
        }
      }
      
      if (selectedIndex === null && matchingIndices.length > 0) {
        selectedIndex = matchingIndices[0];
        while (true) {
          targetPosition = -(selectedIndex * itemHeightRef.current - reelCenterRef.current + itemHeightRef.current / 2);
          if (currentPosition - targetPosition >= minScrollDistance) {
            break;
          }
          selectedIndex += itemsPerReelRef.current;
        }
      }
      
      if (selectedIndex !== null) {
        // 添加随机偏移
        const randomOffset = (Math.random() * 30 + 10) * (Math.random() < 0.5 ? 1 : -1);
        targetPosition = -(selectedIndex * itemHeightRef.current - reelCenterRef.current + itemHeightRef.current / 2) + randomOffset;
      } else {
        targetPosition = currentPosition - minScrollDistance;
      }
    } else {
      // 无目标时：基于时间计算滚动距离
      const pixelsPerMs = 0.8;
      const scrollDistance = spinDuration * pixelsPerMs;
      const randomOffset = (Math.random() * 40 + 20) * (Math.random() < 0.5 ? 1 : -1);
      targetPosition = currentPosition - scrollDistance + randomOffset;
    }
    
    // 设置高速旋转动画（一个阶段完成，使用强力 ease-out）
    animationRef.current = {
      startTime: performance.now(),
      startPosition: currentPosition,
      targetPosition: targetPosition, // ✅ 设置目标位置
      duration: spinDuration, // 整个旋转持续时间
      phase: 'spinning',
      targetSymbol: selectedPrize,
      easingFunction: (t: number) => 1 - Math.pow(1 - t, 5) // ✅ 和原版一样的缓动
    };
    
    // Cancel any existing animation frame
    if (animationRef.current.rafId) {
      cancelAnimationFrame(animationRef.current.rafId);
    }
    
    // Start animation
    animate();
  }, [isSpinning, selectedPrize, onSpinStart, spinDuration, animate]);

  // Auto-start when prize is selected
  useEffect(() => {
    if (selectedPrizeId && !isSpinning && selectedPrize && !hasStarted) {
      setHasStarted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startSpin();
        });
      });
    }
  }, [selectedPrizeId, selectedPrize, hasStarted, isSpinning, startSpin]);

  // Initialize on mount
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current && symbols.length > 0 && itemsPerReel >= 90) {
      initialSymbolsRef.current = symbols;
      initReels();
      hasInitializedRef.current = true;
    }
  }, [symbols, itemsPerReel, initReels]);

  // Update reel content
  const updateReelContent = useCallback((newSymbols: SlotSymbol[]) => {
    if (!reelContainerRef.current || newSymbols.length === 0 || isSpinning) return;
    
    // Save current position
    const container = reelContainerRef.current;
    const currentTransform = window.getComputedStyle(container).transform;
    const matrix = new DOMMatrix(currentTransform);
    const currentPosition = matrix.m42;
    
    // Update symbols
    initialSymbolsRef.current = newSymbols;
    
    // Rebuild virtual items
    const symbolSequence: SlotSymbol[] = [];
    for (let j = 0; j < itemsPerReelRef.current; j++) {
      symbolSequence.push(newSymbols[Math.floor(Math.random() * newSymbols.length)]);
    }
    
    virtualItemsRef.current = [];
    for (let repeat = 0; repeat < repeatTimes; repeat++) {
      virtualItemsRef.current.push(...symbolSequence);
    }
    
    // Update rendered items
    renderedItemsMapRef.current.forEach((element, index) => {
      const symbol = virtualItemsRef.current[index];
      if (!symbol) return;
      
      // Update element data
      element.dataset.id = symbol.id;
      element.dataset.name = symbol.name;
      element.dataset.price = symbol.price.toString();
      
      // Update image
      const img = element.querySelector('img') as HTMLImageElement;
      if (img && img.src !== symbol.image) {
        img.src = symbol.image;
        img.alt = symbol.name;
      }
      
      // Update glow
      const glow = element.querySelector('.item-glow') as HTMLElement;
      if (glow) {
        const glowColor = symbol.qualityId === 'legendary' ? '255, 215, 0' 
          : symbol.qualityId === 'epic' ? '163, 53, 238'
          : symbol.qualityId === 'rare' ? '0, 112, 221'
          : symbol.qualityId === 'uncommon' ? '30, 255, 0'
          : '157, 157, 157';
        glow.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.6) 0%, rgba(${glowColor}, 0.3) 50%, transparent 70%)`;
      }
      
      // Update info
      if (symbol.id !== 'golden_placeholder') {
        const info = element.querySelector('.item-info');
        if (info) {
          const namePara = info.querySelector('.item-name');
          const pricePara = info.querySelector('p:last-child');
          if (namePara) namePara.textContent = symbol.name;
          if (pricePara) pricePara.textContent = `¥${symbol.price}`;
        }
      }
    });
    
    // Maintain position
    container.style.transform = `translateY(${currentPosition}px)`;
    
    // Reset selection
    currentSelectedIndexRef.current = -1;
    currentSelectedElementRef.current = null;
    selectionLockedRef.current = false;
  }, [repeatTimes, isSpinning]);

  // ✅ 跳转到指定进度（用于时间轴系统）
  const jumpToProgress = useCallback((progress: number, showResult = false) => {
    if (!reelContainerRef.current) return;
    
    const container = reelContainerRef.current;
    const currentTransform = window.getComputedStyle(container).transform;
    const matrix = new DOMMatrix(currentTransform);
    let startPosition = matrix.m42;
    
    // 获取初始位置（如果还没初始化）
    if (startPosition === 0 && virtualItemsRef.current.length > 0) {
      const initialIndex = itemsPerReelRef.current;
      const preScrollOffset = itemHeightRef.current * 5;
      startPosition = -(initialIndex * itemHeightRef.current + preScrollOffset - reelCenterRef.current + itemHeightRef.current / 2);
    }
    
    // 找到目标符号的最终位置
    let targetIndex = -1;
    if (selectedPrize) {
      const matchingIndices: number[] = [];
      virtualItemsRef.current.forEach((item, index) => {
        if (item.id === selectedPrize.id) {
          matchingIndices.push(index);
        }
      });
      
      if (matchingIndices.length > 0) {
        // 计算应该停在哪个实例上（基于滚动距离）
        const pixelsPerMs = 0.8;
        const totalScrollDistance = (spinDuration || 4500) * pixelsPerMs;
        
        for (const index of matchingIndices) {
          const itemPosition = -(index * itemHeightRef.current - reelCenterRef.current + itemHeightRef.current / 2);
          const scrollDistance = startPosition - itemPosition;
          
          if (scrollDistance >= totalScrollDistance) {
            targetIndex = index;
            break;
          }
        }
        
        if (targetIndex === -1 && matchingIndices.length > 0) {
          targetIndex = matchingIndices[0];
          while (true) {
            const itemPosition = -(targetIndex * itemHeightRef.current - reelCenterRef.current + itemHeightRef.current / 2);
            if (startPosition - itemPosition >= totalScrollDistance) {
              break;
            }
            targetIndex += itemsPerReelRef.current;
          }
        }
      }
    }
    
    // 如果没有目标，使用当前位置
    if (targetIndex === -1) {
      const pixelsPerMs = 0.8;
      const scrollDistance = (spinDuration || 4500) * pixelsPerMs;
      const targetPosition = startPosition - scrollDistance * progress;
      container.style.transform = `translateY(${targetPosition}px)`;
      updateVirtualItems(targetPosition);
      updateSelection(targetPosition, false);
      return;
    }
    
    // 计算最终位置
    const finalTargetPosition = -(targetIndex * itemHeightRef.current - reelCenterRef.current + itemHeightRef.current / 2);
    
    // 根据进度计算中间位置（使用 ease-out quint 缓动）
    const distance = finalTargetPosition - startPosition;
    const easedProgress = 1 - Math.pow(1 - progress, 5);  // ease-out quint
    const currentPosition = startPosition + distance * easedProgress;
    
    // 设置位置
    container.style.transform = `translateY(${currentPosition}px)`;
    
    // 更新虚拟项和选择
    updateVirtualItems(currentPosition);
    updateSelection(currentPosition, false);
    
    // 如果进度 >= 1，显示结果
    if (progress >= 1 && showResult && currentSelectedElementRef.current) {
      currentSelectedElementRef.current.classList.add('show-info');
      selectionLockedRef.current = true;
    }
  }, [selectedPrize, updateVirtualItems, updateSelection, spinDuration]);

  // ✅ 直接显示最终结果（跳过动画）
  const showResultDirect = useCallback(() => {
    if (!selectedPrize) return;
    
    jumpToProgress(1, true);
    
    // 触发完成回调
    if (onSpinComplete) {
      onSpinComplete(selectedPrize);
    }
  }, [selectedPrize, jumpToProgress, onSpinComplete]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    startSpin,
    updateReelContent,
    jumpToProgress,
    showResult: showResultDirect
  }), [startSpin, updateReelContent, jumpToProgress, showResultDirect]);

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
          will-change: transform;
          transform: translateY(0);
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
          will-change: opacity;
          transform: translateZ(0);
        }

        .lucky-slot-machine-container .item-image-wrapper {
          position: relative;
          width: 55%;
          height: 55%;
          z-index: 2;
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
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
          transform: scale(1.3) translateZ(0);
        }

        .lucky-slot-machine-container .slot-item.show-info .item-info {
          opacity: 1;
        }

        .lucky-slot-machine-container .slot-item.selected {
          z-index: 5;
        }

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

LuckySlotMachineV2.displayName = 'LuckySlotMachineV2';

export default LuckySlotMachineV2;