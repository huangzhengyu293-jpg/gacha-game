'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
// @ts-ignore - @lucky-canvas/react 没有类型定义
import { SlotMachine } from '@lucky-canvas/react';

export interface SlotSymbol {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability?: number;
  qualityId?: string | null;
}

interface LuckyCanvasSlotMachineProps {
  symbols: SlotSymbol[];
  selectedPrizeId?: string | null;
  onSpinStart?: () => void;
  onSpinComplete?: (result: SlotSymbol) => void;
  height?: number;
  spinDuration?: number;
}

export interface LuckyCanvasSlotMachineHandle {
  startSpin: () => void;
  updateReelContent: (newSymbols: SlotSymbol[]) => void;
}

const LuckyCanvasSlotMachine = forwardRef<LuckyCanvasSlotMachineHandle, LuckyCanvasSlotMachineProps>(({
  symbols,
  selectedPrizeId,
  onSpinStart,
  onSpinComplete,
  height = 540,
  spinDuration = 4500
}, ref) => {
  const [selectedPrize, setSelectedPrize] = useState<SlotSymbol | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const slotRef = useRef<any>(null);
  const symbolsRef = useRef<SlotSymbol[]>(symbols);
  const isSpinningRef = useRef(false);

  // 🎯 关键：使用 useMemo 稳定 prizes 引用，只在 symbols 内容真正变化时更新
  const prizes = useMemo(() => symbols.map((symbol) => ({
    x: 0,
    y: 0,
    col: 1,
    row: 1,
    imgs: [{
      src: symbol.image,
      width: '55%',
      height: '55%',
      top: '22.5%'
    }],
    fonts: symbol.id !== 'golden_placeholder' ? [
      { 
        text: symbol.name, 
        top: '75%', 
        fontSize: '14px', 
        fontColor: '#fff', 
        fontWeight: 'bold',
        wordWrap: true,
        lengthLimit: '90%'
      },
      { 
        text: `¥${symbol.price}`, 
        top: '85%', 
        fontSize: '12px', 
        fontColor: '#FFD700' 
      }
    ] : [],
    background: symbol.qualityId === 'legendary' ? 'rgba(255, 215, 0, 0.15)' :
                symbol.qualityId === 'epic' ? 'rgba(163, 53, 238, 0.15)' :
                symbol.qualityId === 'rare' ? 'rgba(0, 112, 221, 0.15)' :
                symbol.qualityId === 'uncommon' ? 'rgba(30, 255, 0, 0.15)' :
                'transparent',
    // 存储原始 symbol 数据用于回调
    _symbol: symbol
  })), [symbols]);

  // 🚀 优化：动态更新 symbols 时，通过 key 触发 lucky-canvas 内部更新
  const [componentKey, setComponentKey] = useState(0);

  // 更新 symbols ref
  useEffect(() => {
    const prevIds = symbolsRef.current.map(s => s.id).join(',');
    const newIds = symbols.map(s => s.id).join(',');
    
    symbolsRef.current = symbols;
    
    // 只有在非旋转状态下且 symbols 真正变化时才更新 key
    if (!isSpinningRef.current && prevIds !== newIds) {
      setComponentKey(prev => prev + 1);
    }
  }, [symbols]);

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
    if (selectedPrizeId && selectedPrize && !hasStarted && !isSpinningRef.current) {
      setHasStarted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startSpin();
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrizeId, selectedPrize, hasStarted]);

  // 配置背景块
  const blocks = useMemo(() => [{
    padding: '0px',
    background: 'linear-gradient(180deg, rgba(29, 33, 37, 0.9) 0%, rgba(29, 33, 37, 0.3) 50%, rgba(29, 33, 37, 0.9) 100%)'
  }], []);

  // 🎯 关键配置：单列垂直滚动，模拟原版效果
  const slots = useMemo(() => {
    // 生成所有奖品的顺序（0, 1, 2, ..., n-1）
    const order = Array.from({ length: symbols.length }, (_, i) => i);
    
    return [{
      order: order,  // 奖品顺序
      direction: 1,  // 1 = 向下滚动（模拟原版从上往下）
      speed: 20      // 基础速度
    }];
  }, [symbols.length]);

  // 🔥 核心配置：尽量模拟原版的两阶段动画
  const defaultConfig = useMemo(() => ({
    mode: 'vertical',
    rowSpacing: '10px',
    colSpacing: '0px',
    speed: 30,                     // 提高基础速度
    accelerationTime: 2500,        // 🎯 Phase 1: 加速阶段（模拟原版的 duration * 0.8 像素/ms）
    decelerationTime: 2500,        // 🎯 Phase 2: 减速 + 回正阶段
    stopRange: 0.5                 // 🎯 随机偏移范围（模拟原版的 ±10-40px）
  }), []);

  // 样式配置
  const defaultStyle = useMemo(() => ({
    borderRadius: '12px',
    fontColor: '#fff',
    fontSize: '14px',
    fontStyle: 'sans-serif',
    fontWeight: '400',
    background: 'rgba(0, 0, 0, 0)',
    wordWrap: true,
    lengthLimit: '90%'
  }), []);

  // 开始旋转
  const startSpin = useCallback(() => {
    if (isSpinningRef.current || !selectedPrize || !slotRef.current) return;

    isSpinningRef.current = true;

    if (onSpinStart) {
      onSpinStart();
    }

    // 找到目标奖品的索引
    const targetIndex = symbolsRef.current.findIndex(s => s.id === selectedPrize.id);
    if (targetIndex === -1) {
      isSpinningRef.current = false;
      return;
    }

    // 🎰 开始旋转
    slotRef.current.play();

    // ⏱️ 第一阶段：高速旋转到接近目标位置（带随机偏移）
    setTimeout(() => {
      if (slotRef.current) {
        // lucky-canvas 会在 stopRange 范围内随机停止
        // 然后自动触发回正动画（由 decelerationTime 的最后阶段完成）
        slotRef.current.stop(targetIndex);
      }
    }, spinDuration - 600);  // 预留 600ms 给减速 + 回正

  }, [selectedPrize, spinDuration, onSpinStart]);

  // 旋转结束回调
  const handleEnd = useCallback((prize: any) => {
    isSpinningRef.current = false;

    // 🎯 从 prize 对象中获取原始 symbol
    const result = prize?._symbol || symbolsRef.current.find(s => s.id === prize?.id);
    
    if (result && onSpinComplete) {
      onSpinComplete(result);
    }
  }, [onSpinComplete]);

  // 🚀 更新转轮内容 - lucky-canvas 会自动处理，无需卸载重新挂载！
  const updateReelContent = useCallback((newSymbols: SlotSymbol[]) => {
    symbolsRef.current = newSymbols;
    // lucky-canvas 通过 props 变化自动更新，无需手动操作
  }, []);

  useImperativeHandle(ref, () => ({
    startSpin,
    updateReelContent
  }), [startSpin, updateReelContent]);

  // 获取容器宽度
  const [containerWidth, setContainerWidth] = useState(300);
  const containerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerDivRef.current) {
        const width = containerDivRef.current.offsetWidth;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div ref={containerDivRef} style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      {/* 🎰 lucky-canvas SlotMachine 组件 */}
      <SlotMachine
        key={componentKey}  // 🔥 关键：换数据时通过 key 触发重新渲染
        ref={slotRef}
        width={containerWidth}
        height={height}
        blocks={blocks}
        prizes={prizes}
        slots={slots}
        defaultConfig={defaultConfig}
        defaultStyle={defaultStyle}
        onStart={() => {
          // 已经在 startSpin 中调用了
        }}
        onEnd={handleEnd}
      />
      
      {/* 中心指示器 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          height: '180px',
          border: '3px solid rgba(255, 215, 0, 0.6)',
          borderRadius: '12px',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
        }}
      />

      <style jsx>{`
        div {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
});

LuckyCanvasSlotMachine.displayName = 'LuckyCanvasSlotMachine';

export default LuckyCanvasSlotMachine;
