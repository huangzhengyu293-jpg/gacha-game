'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import HorizontalLuckySlotMachine from '@/app/components/SlotMachine/HorizontalLuckySlotMachine';
import type { SlotSymbol } from '@/app/components/SlotMachine/HorizontalLuckySlotMachine';
import LuckySlotMachine from '@/app/components/SlotMachine/CanvasSlotMachine';

const GOLDEN_PLACEHOLDER_ID = 'golden_placeholder';

const createGoldenPlaceholder = (): SlotSymbol => ({
  id: GOLDEN_PLACEHOLDER_ID,
  name: '金色神秘',
  image: '/theme/default/hidden-gold.webp',
  price: 0,
  qualityId: 'placeholder',
  description: '',
  dropProbability: 0,
});

interface HorizontalSlotMachineClientProps {
  packId: string;
}

interface PackSlotData {
  packId: string;
  allSymbols: SlotSymbol[];
  normalSymbols: SlotSymbol[];
  legendarySymbols: SlotSymbol[];
  stage: 'normal' | 'legendary';
  selectedPrizeId: string | null;
  pendingLegendaryId: string | null;
  spinKey: number;
}

export default function HorizontalSlotMachineClient({ packId }: HorizontalSlotMachineClientProps) {
  const [packSlots, setPackSlots] = useState<PackSlotData[]>([{
    packId,
    allSymbols: [],
    normalSymbols: [],
    legendarySymbols: [],
    stage: 'normal',
    selectedPrizeId: null,
    pendingLegendaryId: null,
    spinKey: 0
  }]);
  const [isSpinning, setIsSpinning] = useState(false);
  const completedCountRef = useRef(0);
  const expectedCountRef = useRef(0);
  
  // 多轮抽奖相关
  const currentRoundRef = useRef(0); // 当前正在播放的轮次（从1开始）
  const totalRoundsRef = useRef(1); // 总轮数
  const allRoundsPlansRef = useRef<Array<Array<{ firstStageId: string; finalId: string; needsSecondStage: boolean } | null>>>([]); // 所有轮次的预设结果
  
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const verticalContainerRef = useRef<HTMLDivElement | null>(null);
  const [verticalContainerWidth, setVerticalContainerWidth] = useState<number>(0);
  
  // 初始化音频
  useEffect(() => {
    const initAudio = async () => {
      if (typeof window === 'undefined') return;
      
      let audioContext = (window as any).__audioContext;
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        (window as any).__audioContext = audioContext;
      }
      
      // 加载tick.mp3
      let tickAudioBuffer = (window as any).__tickAudioBuffer;
      if (!tickAudioBuffer) {
        try {
          const response = await fetch('/tick.mp3');
          const arrayBuffer = await response.arrayBuffer();
          tickAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          (window as any).__tickAudioBuffer = tickAudioBuffer;
        } catch (err) {
          console.error('加载tick音效失败:', err);
        }
      }
      
      // 加载basic_win.mp3
      let basicWinAudioBuffer = (window as any).__basicWinAudioBuffer;
      if (!basicWinAudioBuffer) {
        try {
          const response = await fetch('/basic_win.mp3');
          const arrayBuffer = await response.arrayBuffer();
          basicWinAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          (window as any).__basicWinAudioBuffer = basicWinAudioBuffer;
        } catch (err) {
          console.error('加载basic_win音效失败:', err);
        }
      }
    };
    
    initAudio();
  }, []);
  
  // 获取所有卡包数据
  const { data: packs } = useQuery({ 
    queryKey: ['packs'], 
    queryFn: api.getPacks,
    staleTime: 30_000 
  });
  
  // 监听PackMediaStrip的卡包选择
  const lastPackIdsRef = useRef<string>('');
  
  useEffect(() => {
    const updateSlots = () => {
      const selectedPackIds = (window as any).__slotPackIds || [packId];
      const currentPackIdsKey = selectedPackIds.join(',');
      
      // 如果 packIds 没有变化，不更新
      if (lastPackIdsRef.current === currentPackIdsKey) {
        return;
      }
      
      console.log(`📦 [updateSlots] selectedPackIds数量: ${selectedPackIds.length}`);
      console.log(`🔄 [updateSlots] packIds变化: "${lastPackIdsRef.current}" -> "${currentPackIdsKey}"`);
      
      lastPackIdsRef.current = currentPackIdsKey;
      
      setPackSlots(prev => {
        // 使用index来区分，即使packId相同
        const newSlots = selectedPackIds.map((pid: string, index: number) => {
          const existing = prev[index];
          // 如果位置上的packId相同，保留数据
          if (existing && existing.packId === pid) {
            return existing;
          }
          // 否则创建新的slot
          console.log(`➕ [updateSlots] 位置${index}创建新slot: ${pid.slice(-6)}`);
          return { 
            packId: pid, 
            allSymbols: [],
            normalSymbols: [],
            legendarySymbols: [],
            stage: 'normal' as const,
            selectedPrizeId: null,
            pendingLegendaryId: null,
            spinKey: 0 
          };
        });
        
        // 检查是否真的有变化（长度或内容）
        if (newSlots.length === prev.length && 
            newSlots.every((slot: any, i: number) => slot === prev[i])) {
          console.log('⏸️ [updateSlots] 内容没变化，不更新');
          return prev; // 返回原数组，避免触发重渲染
        }
        
        console.log(`✅ [updateSlots] 更新slots: ${newSlots.length}个`);
        return newSlots;
      });
    };
    
    updateSlots();
    const interval = setInterval(updateSlots, 200);
    
    return () => clearInterval(interval);
  }, [packId]);
  
  // 加载每个卡包的物品数据
  const packsLoadedRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!packs || packs.length === 0) {
      console.log('⚠️ [数据加载] packs未加载');
      return;
    }
    
    if (packSlots.length === 0) {
      console.log('⚠️ [数据加载] packSlots为空');
      return;
    }
    
    console.log(`🔍 [数据加载] 检查${packSlots.length}个slots的数据`);
    console.log(`🔍 [数据加载] packs数量: ${packs.length}`, packs.map((p: any) => p.id.slice(-6)));
    
    setPackSlots(prev => {
      let hasChanges = false;
      
      const updated = prev.map((slot, index) => {
        // 如果已经加载过，直接返回
        if (slot.allSymbols.length > 0) {
          console.log(`✓ [数据加载] Slot${index} (${slot.packId.slice(-6)}) 已有${slot.allSymbols.length}个物品`);
          return slot;
        }
        
        console.log(`🔍 [数据加载] Slot${index} packId: ${slot.packId}`);
        
        const pack = packs.find((p: any) => p.id === slot.packId);
        if (!pack) {
          console.log(`⚠️ [数据加载] Slot${index} 找不到卡包 ${slot.packId}`);
          console.log(`   可用的packIds:`, packs.map((p: any) => p.id));
          return slot;
        }
        
        if (!pack.items || pack.items.length === 0) {
          console.log(`⚠️ [数据加载] Slot${index} 卡包 ${slot.packId.slice(-6)} 没有items数据`);
          return slot;
        }
        
        hasChanges = true;
        packsLoadedRef.current.add(slot.packId);
        
        const allSymbols: SlotSymbol[] = pack.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          price: item.price || 0,
          qualityId: item.qualityId || 'common',
          description: item.description || '',
          dropProbability: item.dropProbability
        }));
        
        const legendarySymbols = allSymbols.filter(symbol => symbol.qualityId === 'legendary');
        const nonLegendarySymbols = allSymbols.filter(symbol => symbol.qualityId !== 'legendary');
        const normalSymbols = legendarySymbols.length > 0
          ? [...nonLegendarySymbols, createGoldenPlaceholder()]
          : [...nonLegendarySymbols];
        
        console.log(`✅ [数据加载] Slot${index} 卡包 ${slot.packId.slice(-6)} 加载${allSymbols.length}个物品，传奇${legendarySymbols.length}`);
        
        return { 
          ...slot, 
          allSymbols,
          normalSymbols,
          legendarySymbols
        };
      });
      
      return hasChanges ? updated : prev;
    });
  }, [packs, packSlots.length]);
  
  // 快速模式状态（从ActionBarClient的闪电按钮控制）
  const [isFastMode, setIsFastMode] = useState(false);
  const slotCountRef = useRef(packSlots.length);
  const slotWidth = useMemo(() => {
    if (viewportWidth < 640) return 85;
    if (viewportWidth < 768) return 140;
    if (viewportWidth < 1024) return 160;
    return 180;
  }, [viewportWidth]);
  const showVerticalGrid = packSlots.length >= 3;
  const isMobileTwoRowMode =
    showVerticalGrid &&
    (
      (packSlots.length === 5 && viewportWidth < 640) ||
      (packSlots.length === 6 && viewportWidth < 1024)
    );
  
  // 追踪布局模式变化，但不触发任何状态更新
  const layoutModeRef = useRef(isMobileTwoRowMode);
  useEffect(() => {
    if (layoutModeRef.current !== isMobileTwoRowMode) {
      console.log(`📐 [布局模式变化] ${layoutModeRef.current ? '两行' : '单行'} → ${isMobileTwoRowMode ? '两行' : '单行'}`);
      layoutModeRef.current = isMobileTwoRowMode;
    }
  }, [isMobileTwoRowMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const element = verticalContainerRef.current;
    if (!element) return;
    
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const width = entries[0].contentRect.width;
      setVerticalContainerWidth(width);
    });
    
    observer.observe(element);
    setVerticalContainerWidth(element.getBoundingClientRect().width);
    
    return () => observer.disconnect();
  }, [showVerticalGrid]);
  
  // 监听全局快速模式状态
  useEffect(() => {
    const checkFastMode = () => {
      const fastModeActive = (window as any).__slotMachineFastMode || false;
      setIsFastMode(fastModeActive);
    };
    
    checkFastMode();
    const interval = setInterval(checkFastMode, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // 将演示转动函数暴露给全局（供ActionBarClient调用）
  // 生成单轮的随机结果
  const generateRoundPlans = useCallback(() => {
    return packSlots.map((slot, index) => {
      if (slot.allSymbols.length === 0) {
        return null;
      }
      const candidate = slot.allSymbols[Math.floor(Math.random() * slot.allSymbols.length)];
      const isLegendaryResult = candidate.qualityId === 'legendary' && slot.legendarySymbols.length > 0;
      return {
        firstStageId: isLegendaryResult ? GOLDEN_PLACEHOLDER_ID : candidate.id,
        finalId: candidate.id,
        needsSecondStage: isLegendaryResult
      };
    });
  }, [packSlots]);

  // 启动指定轮次的动画
  const startRound = useCallback((roundIndex: number) => {
    const plans = allRoundsPlansRef.current[roundIndex];
    if (!plans) return;
    
    console.log(`🎰 [第${roundIndex + 1}轮/${totalRoundsRef.current}轮] 开始动画`);
    
    const totalSpins = plans.reduce((sum, plan) => {
      if (!plan || !plan.firstStageId) return sum;
      return sum + (plan.needsSecondStage ? 2 : 1);
    }, 0);
    
    completedCountRef.current = 0;
    expectedCountRef.current = totalSpins;
    
    setPackSlots(prev => prev.map(slot => ({
      ...slot,
      selectedPrizeId: null,
      pendingLegendaryId: null,
      stage: 'normal',
      spinKey: slot.spinKey + 1
    })));
    
    setTimeout(() => {
      setPackSlots(prev => prev.map((slot, index) => {
        const plan = plans[index];
        if (!plan || !plan.firstStageId) return slot;
        return {
          ...slot,
          selectedPrizeId: plan.firstStageId,
          pendingLegendaryId: plan.needsSecondStage ? plan.finalId : null,
          stage: 'normal'
        };
      }));
    }, 50);
  }, []);

  useEffect(() => {
    const handleDemoSpin = (rounds: number = 1) => {
      if (isSpinning) {
        console.log('⚠️ [演示转动] 老虎机正在运行中');
        return;
      }
      
      // 生成所有轮次的结果
      const allPlans: Array<Array<{ firstStageId: string; finalId: string; needsSecondStage: boolean } | null>> = [];
      console.log(`🎰 [演示转动] 生成${rounds}轮结果...`);
      
      for (let i = 0; i < rounds; i++) {
        const roundPlans = generateRoundPlans();
        allPlans.push(roundPlans);
        console.log(`📋 [第${i + 1}轮结果]:`);
        roundPlans.forEach((plan, index) => {
          if (plan) {
            const slot = packSlots[index];
            if (slot) {
              const result = slot.allSymbols.find(s => s.id === plan.finalId);
              if (result) {
                console.log(`  Slot${index + 1}: ${result.name} ¥${result.price} ${plan.needsSecondStage ? '(传奇)' : ''}`);
              }
            }
          }
        });
      }
      
      if (allPlans.length === 0 || allPlans[0].every(p => !p)) {
        console.warn('⚠️ [演示转动] 没有可用数据');
        return;
      }
      
      allRoundsPlansRef.current = allPlans;
      totalRoundsRef.current = rounds;
      currentRoundRef.current = 1;
      
      console.log(`🎰 [演示转动] 开始播放${rounds}轮动画`);
      setIsSpinning(true);
      (window as any).__isSlotMachineSpinning = true;
      
      startRound(0);
    };
    
    (window as any).spinSlotMachine = handleDemoSpin;
    
    return () => {
      delete (window as any).spinSlotMachine;
    };
  }, [packSlots, isSpinning, generateRoundPlans, startRound]);
  
  // 暴露isSpinning状态
  useEffect(() => {
    (window as any).__isSlotMachineSpinning = isSpinning;
  }, [isSpinning]);
  
  // 只在用户手动添加/删除卡包时重置，不在数据加载或其他状态变化时触发
  useEffect(() => {
    const currentCount = packSlots.length;
    
    // 第一次初始化，不触发重置
    if (slotCountRef.current === 0 && currentCount > 0) {
      slotCountRef.current = currentCount;
      return;
    }
    
    // 只有在不是spinning状态下，且卡包数量真的变化了，才重置
    if (!isSpinning && slotCountRef.current !== currentCount && currentCount > 0) {
      console.log(`🔄 [卡包数量变化] ${slotCountRef.current} → ${currentCount}`);
      slotCountRef.current = currentCount;
      
      // 重置所有slot的状态，但不改变spinKey（避免触发不必要的重新渲染）
      setPackSlots(prev => prev.map(slot => ({
        ...slot,
        stage: 'normal' as const,
        selectedPrizeId: null,
        pendingLegendaryId: null
      })));
      
      completedCountRef.current = 0;
      expectedCountRef.current = 0;
      setIsSpinning(false);
      (window as any).__isSlotMachineSpinning = false;
    }
  }, [packSlots.length, isSpinning]);
  
  const getActiveSymbols = useCallback((slot: PackSlotData): SlotSymbol[] => {
    if (slot.stage === 'legendary' && slot.legendarySymbols.length > 0) {
      return slot.legendarySymbols;
    }
    return slot.normalSymbols;
  }, []);

  const playWinSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    const ctx = (window as any).__audioContext;
    const buffer = (window as any).__basicWinAudioBuffer;
    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  }, []);

  const handleSpinComplete = (result: SlotSymbol, index: number) => {
    const slotSnapshot = packSlots[index];
    const packLabel = slotSnapshot ? slotSnapshot.packId.slice(-6) : '';
    let triggeredSecondStage = false;
    let finalResult: SlotSymbol | null = null;
    
    setPackSlots(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const slot = prev[index];
      if (!slot) return prev;
      
      const nextSlots = [...prev];
      const shouldEnterLegendary = slot.stage === 'normal' && !!slot.pendingLegendaryId;
      
      if (shouldEnterLegendary) {
        triggeredSecondStage = true;
        nextSlots[index] = {
          ...slot,
          stage: 'legendary',
          selectedPrizeId: slot.pendingLegendaryId,
          pendingLegendaryId: null,
          spinKey: slot.spinKey + 1
        };
        return nextSlots;
      }
      
      const activePool = slot.stage === 'legendary' ? slot.legendarySymbols : slot.normalSymbols;
      finalResult = activePool.find(item => item.id === slot.selectedPrizeId) || result;
      // 清空 selectedPrizeId，避免布局变化时重新触发滚动
      nextSlots[index] = { 
        ...slot, 
        selectedPrizeId: null 
      };
      return nextSlots;
    });
    
    completedCountRef.current += 1;
    const expectedCount = expectedCountRef.current || packSlots.length;
    console.log(`🎰 [完成进度] ${completedCountRef.current}/${expectedCount}`);
    
    if (triggeredSecondStage) {
      console.log(`✨ [老虎机${index + 1}] 卡包${packLabel} 抽到金色占位符，切换传奇奖池`);
      return;
    }
    
    const displayResult = finalResult || result;
    console.log(`🎰 [老虎机${index + 1}] 卡包${packLabel} 抽中:`, displayResult.name, '$' + displayResult.price);
    
    if (showVerticalGrid) {
      playWinSound();
    }
    
    if (completedCountRef.current >= expectedCount) {
      // 当前轮完成
      console.log(`✅ [第${currentRoundRef.current}轮完成]`);
      
      // 检查是否还有下一轮
      if (currentRoundRef.current < totalRoundsRef.current) {
        // 还有下一轮，延迟后自动开始
        setTimeout(() => {
          currentRoundRef.current += 1;
          startRound(currentRoundRef.current - 1);
        }, 500); // 500ms延迟，让玩家看清结果
      } else {
        // 所有轮次完成
        setTimeout(() => {
          setIsSpinning(false);
          (window as any).__isSlotMachineSpinning = false;
          console.log(`✅ [全部完成] ${totalRoundsRef.current}轮动画播放完毕`);
          
          // 重置多轮状态
          currentRoundRef.current = 0;
          totalRoundsRef.current = 1;
          allRoundsPlansRef.current = [];
        }, 100);
      }
    }
  };

  const renderHorizontalSlots = () => (
    <div className="w-full flex flex-col">
      {packSlots.map((slot, index) => {
        const activeSymbols = getActiveSymbols(slot);
        return (
        <div key={`slot-${index}-${slot.packId}`} className="w-full overflow-hidden relative" style={{ height: '250px' }}>
          {/* 第一个老虎机：顶部向上箭头（仅当有多个卡包时显示） */}
          {index === 0 && packSlots.length > 1 && (
            <div className="flex absolute top-3 size-4 left-1/2 -translate-x-1/2 rotate-90 text-white">
              <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.00255 0.739429L12.1147 6.01823C13.4213 6.77519 13.4499 8.65172 12.1668 9.44808L3.05473 15.1039C1.72243 15.9309 0 14.9727 0 13.4047V2.47C0 0.929093 1.66922 -0.0329925 3.00255 0.739429Z" fill="currentColor"></path>
              </svg>
            </div>
          )}
          {/* 第二个老虎机：底部向下箭头（仅当有多个卡包时显示） */}
          {index === 1 && packSlots.length > 1 && (
            <div className="flex absolute bottom-3 size-4 left-1/2 -translate-x-1/2 rotate-90 text-white">
              <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.9974 0.739429L1.88534 6.01823C0.578686 6.77519 0.550138 8.65172 1.83316 9.44808L10.9453 15.1039C12.2776 15.9309 14 14.9727 14 13.4047V2.47C14 0.929093 12.3308 -0.0329925 10.9974 0.739429Z" fill="currentColor"></path>
              </svg>
            </div>
          )}
          {activeSymbols.length > 0 && (
            <HorizontalLuckySlotMachine
              key={`machine-${index}-${slot.spinKey}`}
              symbols={activeSymbols}
              selectedPrizeId={slot.selectedPrizeId}
              width={9999}
              spinDuration={isFastMode ? 1000 : 4500}
              onSpinComplete={(result) => handleSpinComplete(result, index)}
            />
          )}
        </div>
      );
      })}
    </div>
  );

  const renderVerticalGrid = () => {
    console.log(`🎯 [renderVerticalGrid] packSlots数量: ${packSlots.length}`);
    packSlots.forEach((slot, i) => {
      console.log(`  ${i}: packId=${slot.packId.slice(-6)}, symbols=${slot.allSymbols.length}`);
    });
    
    if (isMobileTwoRowMode) {
      // 为每个slot保留原始索引
      const slotsWithIndex = packSlots.map((slot, originalIndex) => ({
        slot,
        originalIndex,
        activeSymbols: getActiveSymbols(slot)
      })).filter(item => item.activeSymbols.length > 0);
      
      console.log(`🎯 [双排模式] 有效slots数量: ${slotsWithIndex.length}`);
      
      const topRowItems = slotsWithIndex.slice(0, Math.min(3, slotsWithIndex.length));
      const bottomRowItems = slotsWithIndex.slice(topRowItems.length);
      const visibleHeight = 216.5;

      const renderRow = (rowItems: typeof slotsWithIndex, rowOffset: number) => (
        <div
          key={`mobile-row-${rowOffset}`}
          className="flex gap-0 md:gap-4 justify-around"
          style={{ height: `${visibleHeight}px`, overflow: 'hidden', pointerEvents: 'none' }}
        >
          {rowItems.map(({ slot, originalIndex, activeSymbols }) => {
            return (
              <div
                key={`mobile-slot-${originalIndex}-${slot.spinKey}`}
                className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
              >
                <div style={{ width: `${slotWidth}px` }}>
                  <LuckySlotMachine
                    key={`vertical-machine-${originalIndex}-${slot.spinKey}`}
                    symbols={activeSymbols}
                    selectedPrizeId={slot.selectedPrizeId}
                    height={450}
                    spinDuration={isFastMode ? 1000 : 4500}
                    onSpinComplete={(result) => handleSpinComplete(result, originalIndex)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );

      return (
        <div ref={verticalContainerRef} className="flex flex-col justify-between px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
          {renderRow(topRowItems, 0)}
          <div className="w-full flex flex-row justify-center items-center my-1">
            <div
              className="flex transition-colors duration-300 animate-in justify-center items-center h-[1px] w-[175px] my-2"
              style={{ background: 'linear-gradient(270deg, rgb(95, 95, 95) 4.24%, rgba(95, 95, 95, 0) 100%)' }}
            />
            <div className="flex justify-center items-center relative w-[32px] h-[1px]">
              <div className="flex absolute justify-center items-center w-[25px]">
                <div className="size-4 text-gray-400">
                  <svg viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.155 15.8964V2.37359C13.155 1.06143 12.0936 0 10.7814 0H2.37359C1.06143 0 0 1.06143 0 2.37359V15.8964C0 17.2085 1.06143 18.27 2.37359 18.27H10.7814C12.0936 18.27 13.155 17.2085 13.155 15.8964Z" fill="currentColor" />
                    <path d="M15.5286 2.00584L13.9908 1.72168C14.0326 1.93062 14.0577 2.15628 14.0577 2.37358V15.8964C14.0577 17.7016 12.5867 19.1726 10.7814 19.1726H7.95654L12.1688 19.9582C13.4559 20.2006 14.6929 19.3481 14.9352 18.061L17.4175 4.76388C17.6598 3.4768 16.8074 2.23986 15.5203 1.99748L15.5286 2.00584Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
            <div
              className="flex transition-colors duration-300 animate-in justify-center items-center h-[1px] w-[175px] my-1"
              style={{ background: 'linear-gradient(90deg, rgb(95, 95, 95) 4.24%, rgba(95, 95, 95, 0) 100%)' }}
            />
          </div>
          {renderRow(bottomRowItems, topRowItems.length)}
        </div>
      );
    }

    // 使用实际容器宽度
    const containerWidth = verticalContainerWidth || viewportWidth;
    // 1-4个卡包：总是单行
    // 5个卡包：≥640 单行，<640 双排（在 isMobileTwoRowMode 中处理）
    // 6个卡包：≥1024 单行，<1024 双排（在 isMobileTwoRowMode 中处理）
    // 7+个卡包：多行
    const isSingleRowForced = packSlots.length > 0 && packSlots.length <= 4;
    const effectiveColumns = isSingleRowForced ? packSlots.length : packSlots.length;
    const gapPx = viewportWidth < 640 ? 16 : viewportWidth < 1024 ? 24 : 32;
    const totalGapWidth = gapPx * Math.max(0, effectiveColumns - 1);
    const availableForSlots = Math.max(120, containerWidth - totalGapWidth - 32);
    const calculatedSlotWidth = Math.floor(availableForSlots / effectiveColumns);
    const dynamicSlotWidth = isSingleRowForced 
      ? Math.max(60, Math.min(slotWidth, calculatedSlotWidth))
      : slotWidth;
    const dynamicSlotColumnWidth = dynamicSlotWidth;
    const totalRows = 1;
    const containerHeight = totalRows * 450;
    const shouldWrap = false;
    
    return (
      <div ref={verticalContainerRef} className="flex flex-col w-full items-center justify-center relative max-w-screen-xl px-4 mx-auto" style={{ minHeight: `${containerHeight}px` }}>
        {packSlots.length > 0 && (
          <>
            <div className="flex absolute left-0 size-3 text-white">
              <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.00255 0.739429L12.1147 6.01823C13.4213 6.77519 13.4499 8.65172 12.1668 9.44808L3.05473 15.1039C1.72243 15.9309 0 14.9727 0 13.4047V2.47C0 0.929093 1.66922 -0.0329925 3.00255 0.739429Z" fill="currentColor"></path>
              </svg>
            </div>
            <div className="flex absolute right-0 size-3 text-white">
              <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.9974 0.739429L1.88534 6.01823C0.578686 6.77519 0.550138 8.65172 1.83316 9.44808L10.9453 15.1039C12.2776 15.9309 14 14.9727 14 13.4047V2.47C14 0.929093 12.3308 -0.0329925 10.9974 0.739429Z" fill="currentColor"></path>
              </svg>
            </div>
          </>
        )}
        <div
          className={`flex ${shouldWrap ? 'flex-wrap' : 'flex-nowrap'} justify-center items-center gap-4 sm:gap-6 lg:gap-8 w-full`}
          style={{
            minHeight: shouldWrap ? `${containerHeight}px` : '450px',
            flexWrap: shouldWrap ? 'wrap' : 'nowrap'
          }}
        >
          {packSlots.map((slot, index) => {
            const activeSymbols = getActiveSymbols(slot);
            if (activeSymbols.length === 0) return null;
            
            return (
              <div
                key={`slot-vertical-${index}-${slot.packId}-${slot.spinKey}`}
                className="flex flex-none justify-center items-center"
                style={{ width: `${dynamicSlotColumnWidth}px`, minWidth: `${dynamicSlotColumnWidth}px`, height: '450px' }}
              >
                <div className="flex justify-center items-center" style={{ width: `${dynamicSlotWidth}px`, height: '450px' }}>
                  <LuckySlotMachine
                    key={`vertical-machine-${index}-${slot.spinKey}`}
                    symbols={activeSymbols}
                    selectedPrizeId={slot.selectedPrizeId}
                    height={450}
                    spinDuration={isFastMode ? 1000 : 4500}
                    onSpinComplete={(result) => handleSpinComplete(result, index)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return showVerticalGrid ? renderVerticalGrid() : renderHorizontalSlots();
}

