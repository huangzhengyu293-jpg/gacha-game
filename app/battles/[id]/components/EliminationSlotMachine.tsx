'use client';

import React, { useImperativeHandle, forwardRef, useMemo } from 'react';
import HorizontalLuckySlotMachine, { 
  SlotSymbol
} from '@/app/components/SlotMachine/HorizontalLuckySlotMachine';

export interface PlayerSymbol {
  id: string;
  name: string;
  avatar: string;
}

interface EliminationSlotMachineProps {
  players: PlayerSymbol[];
  selectedPlayerId?: string | null;
  onSpinComplete?: () => void;
  onSpinSettled?: () => void; // 🔥 回正音效触发时调用（用于同步渲染淘汰UI）
  isFastMode?: boolean;
}

export interface EliminationSlotMachineHandle {
  startSpin: () => void;
}

const EliminationSlotMachine = forwardRef<EliminationSlotMachineHandle, EliminationSlotMachineProps>(({
  players,
  selectedPlayerId,
  onSpinComplete,
  onSpinSettled,
  isFastMode = false
}, ref) => {
  
  // 将玩家数据转换为 SlotSymbol 格式
  const playerSymbols = useMemo<SlotSymbol[]>(() => {
    
    const symbols = players.map((player, index) => {
      const symbol = {
        id: player.id,
        name: player.name,
        description: '', // 不显示描述
        image: player.avatar, // 直接使用原始avatar（SVG字符串或URL）
        price: 0, // 不显示价格
        qualityId: null // 不显示光晕
      };
      
    
      
      return symbol;
    });
    
    return symbols;
  }, [players]);
  
  // 暴露 startSpin 方法 - 淘汰模式通过selectedPlayerId自动触发，不需要手动调用
  useImperativeHandle(ref, () => ({
    startSpin: () => {
      // 不再手动调用，让HorizontalLuckySlotMachine通过selectedPlayerId自动启动
    }
  }), []);
  
 
  
  // 处理滚动完成 - 显示名字后延迟0.5秒进入下个阶段
  const handleSpinComplete = (result: SlotSymbol) => {
    
    // 给一点时间让名字完全显示
    setTimeout(() => {
      onSpinComplete?.();
    }, 500); // 先等200ms确保名字显示
  };
  
  // 计算滚动时长：与礼包页保持一致 - 普通4.5s，快速1s
  const spinDuration = isFastMode ? 1000 : 6000;
  
  return (
    <div className="w-full overflow-hidden relative" style={{ height: '250px' }}>
      <HorizontalLuckySlotMachine
        symbols={playerSymbols}
        selectedPrizeId={selectedPlayerId}
        onSpinComplete={handleSpinComplete}
        onSpinSettled={onSpinSettled}
        width={9999}  // 与礼包页保持一致
        spinDuration={spinDuration}
        isEliminationMode={true}
      />
    </div>
  );
});

EliminationSlotMachine.displayName = 'EliminationSlotMachine';

export default EliminationSlotMachine;
