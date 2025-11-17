'use client';

import React, { useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
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
  isFastMode?: boolean;
}

export interface EliminationSlotMachineHandle {
  startSpin: () => void;
}

const EliminationSlotMachine = forwardRef<EliminationSlotMachineHandle, EliminationSlotMachineProps>(({
  players,
  selectedPlayerId,
  onSpinComplete,
  isFastMode = false
}, ref) => {
  
  // 将玩家数据转换为 SlotSymbol 格式
  const playerSymbols = useMemo<SlotSymbol[]>(() => {
    console.log('🎰 [淘汰老虎机] 转换玩家数据:', players.length, '个玩家');
    
    const symbols = players.map((player, index) => {
      // 检查是否是SVG字符串（机器人）还是图片URL
      const isSvg = player.avatar.trim().startsWith('<svg');
      
      console.log(`  👤 ${player.name}:`, {
        id: player.id,
        avatarType: isSvg ? 'SVG字符串' : 'URL',
        avatarLength: player.avatar.length,
        avatarPreview: isSvg 
          ? player.avatar.substring(0, 100) + '...'
          : player.avatar.substring(0, 50)
      });
      
      const symbol = {
        id: player.id,
        name: player.name,
        description: '', // 不显示描述
        image: player.avatar, // 直接使用原始avatar（SVG字符串或URL）
        price: 0, // 不显示价格
        qualityId: null // 不显示光晕
      };
      
      console.log(`  ✅ symbol转换完成:`, {
        id: symbol.id,
        name: symbol.name,
        imageLength: symbol.image.length,
        imageStartsWith: symbol.image.substring(0, 30),
        price: symbol.price,
        qualityId: symbol.qualityId
      });
      
      return symbol;
    });
    
    console.log('✅ [淘汰老虎机] 转换完成，共', symbols.length, '个玩家');
    console.log('📦 [淘汰老虎机] symbols数组:', symbols.map(s => ({ id: s.id, name: s.name, imageLen: s.image.length })));
    return symbols;
  }, [players]);
  
  // 暴露 startSpin 方法 - 淘汰模式通过selectedPlayerId自动触发，不需要手动调用
  useImperativeHandle(ref, () => ({
    startSpin: () => {
      console.log('🎰 [淘汰老虎机] startSpin被调用（但实际通过selectedPlayerId自动触发）');
      // 不再手动调用，让HorizontalLuckySlotMachine通过selectedPlayerId自动启动
    }
  }), []);
  
  // 监听选中玩家变化
  useEffect(() => {
    if (selectedPlayerId) {
      console.log('🎰 [淘汰老虎机] 选中玩家ID:', selectedPlayerId, '- 老虎机将自动启动');
    }
  }, [selectedPlayerId]);
  
  // 处理滚动完成 - 显示名字后延迟0.5秒进入下个阶段
  const handleSpinComplete = (result: SlotSymbol) => {
    console.log('🎰 [淘汰老虎机] 滚动完成，选中:', result.name);
    
    // 给一点时间让名字完全显示
    setTimeout(() => {
      console.log('⏱️ [淘汰老虎机] 名字已显示，等待0.5秒后进入下个阶段...');
      
      // 再延迟0.5秒进入下个阶段
      setTimeout(() => {
        console.log('✅ [淘汰老虎机] 延迟结束，触发 onSpinComplete');
        onSpinComplete?.();
      }, 500);
    }, 200); // 先等200ms确保名字显示
  };
  
  // 计算滚动时长：与礼包页保持一致 - 普通4.5s，快速1s
  const spinDuration = isFastMode ? 1000 : 4500;
  
  return (
    <div className="w-full overflow-hidden relative" style={{ height: '250px' }}>
      <HorizontalLuckySlotMachine
        symbols={playerSymbols}
        selectedPrizeId={selectedPlayerId}
        onSpinComplete={handleSpinComplete}
        width={9999}  // 与礼包页保持一致
        spinDuration={spinDuration}
        isEliminationMode={true}
      />
    </div>
  );
});

EliminationSlotMachine.displayName = 'EliminationSlotMachine';

export default EliminationSlotMachine;
