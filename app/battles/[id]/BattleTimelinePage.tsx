/**
 * 基于时间轴驱动的对战详情页面
 * 
 * 核心理念：
 * 1. 整个对战是一个确定性的动画播放过程
 * 2. 根据播放时间计算当前应该显示的状态
 * 3. 支持中途加入：根据服务器开始时间计算播放位置
 */

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import PackDetailModal from "./components/PackDetailModal";
import { useBattleData } from "./hooks/useBattleData";
import { useBattleTimeline } from "./hooks/useBattleTimeline";
import LuckySlotMachine, { type SlotSymbol, type LuckySlotMachineHandle } from "@/app/components/SlotMachine/Luckyslotmachinev2";
import FireworkArea, { FireworkAreaHandle } from '@/app/components/FireworkArea';
import type { PackItem } from "./types";

export default function BattleTimelinePage() {
  const router = useRouter();
  const battleData = useBattleData();
  
  // 老虎机 refs
  const slotMachineRefs = useRef<Record<string, LuckySlotMachineHandle | null>>({});
  const winnerFireworkRef = useRef<FireworkAreaHandle>(null);
  
  // TODO: 从后端获取这些数据（现在先用前端生成）
  const { rounds, eliminationData, jackpotData, sprintData } = useMemo(() => {
    // 这里调用你原来的 generateAllResults 逻辑
    // 暂时返回空数据，等待后续对接
    return {
      rounds: [],
      eliminationData: null,
      jackpotData: null,
      sprintData: null,
    };
  }, []);
  
  // 使用时间轴系统
  const timelineControl = useBattleTimeline({
    battleData,
    rounds,
    gameMode: battleData.mode,
    isFastMode: battleData.isFastMode || false,
    eliminationData,
    jackpotData,
    sprintData,
    serverStartTime: undefined,  // TODO: 从后端获取
  });
  
  const { state, isCountingDown, currentRound, currentRoundResults, playerValues } = timelineControl;
  
  // 监听状态变化，控制老虎机动画
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currState = state;
    
    // 检测状态切换
    if (prevState.currentEvent?.type !== currState.currentEvent?.type) {
      console.log(`🎬 状态切换: ${prevState.currentEvent?.type || 'null'} → ${currState.currentEvent?.type}`);
      
      // 进入新轮次的转动阶段
      if (currState.currentEvent?.type === 'round_spinning') {
        console.log(`🎰 开始第 ${(currState.currentRound || 0) + 1} 轮转动`);
        
        // 触发所有老虎机开始转动
        Object.values(slotMachineRefs.current).forEach(ref => {
          if (ref) {
            ref.startSpin();
          }
        });
      }
      
      // 进入回正阶段
      if (currState.currentEvent?.type === 'round_snapping') {
        console.log(`📍 第 ${(currState.currentRound || 0) + 1} 轮回正中`);
      }
      
      // 轮次完成
      if (currState.currentEvent?.type === 'round_complete') {
        console.log(`✅ 第 ${(currState.currentRound || 0) + 1} 轮完成`);
      }
      
      // 最终完成
      if (currState.currentEvent?.type === 'completed') {
        console.log(`🏆 对战完成！`);
        
        // 播放烟花
        setTimeout(() => {
          winnerFireworkRef.current?.triggerFirework();
        }, 500);
      }
    }
    
    prevStateRef.current = currState;
  }, [state]);
  
  // 构建 packImages（用于头部显示）
  const packImages = battleData.packs.map((pack) => ({
    src: pack.image,
    alt: pack.name,
    id: pack.id,
  }));
  
  // 高亮当前轮次的礼包
  const highlightedIndices = currentRound >= 0 && currentRound < battleData.packs.length
    ? [currentRound]
    : [];
  
  // 当前轮次信息
  const currentPack = currentRound >= 0 ? battleData.packs[currentRound] : null;
  
  // 渲染老虎机
  const renderSlotMachines = () => {
    if (!currentRoundResults || currentRound < 0) return null;
    
    const currentPack = battleData.packs[currentRound];
    if (!currentPack || !currentPack.items) return null;
    
    return battleData.participants.map((participant) => {
      const result = currentRoundResults[participant.id];
      if (!result) return null;
      
      return (
        <div key={participant.id} className="slot-machine-wrapper">
          <p className="text-white font-bold mb-2">{participant.name}</p>
          <LuckySlotMachine
            ref={(el) => {
              slotMachineRefs.current[participant.id] = el;
            }}
            symbols={currentPack.items as SlotSymbol[]}
            selectedPrizeId={result.itemId}
            height={450}
            spinDuration={isFastMode ? 1000 : 4500}
            onSpinComplete={(prize) => {
              console.log(`${participant.name} 开出: ${prize.name}`);
            }}
          />
        </div>
      );
    });
  };
  
  return (
    <div className="battle-timeline-page min-h-screen" style={{ backgroundColor: '#0F1419' }}>
      {/* 烟花效果 */}
      <FireworkArea ref={winnerFireworkRef} />
      
      {/* 头部 */}
      <BattleHeader
        packImages={packImages}
        highlightedIndices={highlightedIndices}
        statusText={
          isCountingDown ? '准备开始' : 
          state.phase === 'playing' ? '进行中' :
          state.phase === 'completed' ? '已结束' :
          '等待开始'
        }
        currentRound={currentRound}
        totalRounds={battleData.packs.length}
        currentPackName={currentPack?.name || ''}
        currentPackPrice={currentPack?.value || ''}
        totalCost={battleData.cost}
        isCountingDown={isCountingDown}
        isPlaying={state.phase === 'playing'}
        isCompleted={state.phase === 'completed'}
        gameMode={battleData.mode}
        isFastMode={battleData.isFastMode}
        isLastChance={battleData.isLastChance}
        isInverted={battleData.isInverted}
      />
      
      {/* 主内容区 */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* 倒计时显示 */}
        {isCountingDown && (
          <div className="flex items-center justify-center h-96">
            <div className="text-9xl font-bold text-white">
              {Math.ceil(3 - state.progress * 3)}
            </div>
          </div>
        )}
        
        {/* 老虎机区域 */}
        {state.phase === 'playing' && state.currentEvent?.type?.startsWith('round_') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {renderSlotMachines()}
          </div>
        )}
        
        {/* 参与者和奖品展示 */}
        <ParticipantsWithPrizes
          battleData={battleData}
          roundResults={[]}  // TODO: 转换格式
          participantValues={playerValues}
          gameMode={battleData.mode}
        />
        
        {/* 调试信息 */}
        <div className="mt-8 p-4 bg-gray-800 rounded text-white text-sm">
          <p>播放时间: {(state.playbackTime / 1000).toFixed(1)}s / {(totalDuration / 1000).toFixed(1)}s</p>
          <p>当前事件: {state.currentEvent?.type || 'none'}</p>
          <p>当前轮次: {currentRound + 1} / {battleData.packs.length}</p>
          <p>进度: {(state.progress * 100).toFixed(1)}%</p>
          <p>阶段: {state.phase}</p>
          
          {/* 控制按钮 */}
          <div className="flex gap-2 mt-4">
            <button 
              onClick={timelineControl.play}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              播放
            </button>
            <button 
              onClick={timelineControl.pause}
              className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
            >
              暂停
            </button>
            <button 
              onClick={timelineControl.reset}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              重置
            </button>
            <button 
              onClick={() => timelineControl.jumpTo(10000)}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              跳到10秒
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

