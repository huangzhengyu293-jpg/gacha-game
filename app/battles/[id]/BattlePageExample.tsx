/**
 * 完整的时间轴驱动对战页面示例
 * 
 * 展示如何整合：
 * 1. 前端结果生成（临时方案）
 * 2. 时间轴控制
 * 3. 老虎机渲染
 * 4. 中途加入支持
 */

"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import { useBattleData } from "./hooks/useBattleData";
import { useBattleTimeline } from "./hooks/useBattleTimeline";
import { generateAllBattleResults } from "./utils/generateResults";
import LuckySlotMachine, { type SlotSymbol, type LuckySlotMachineHandle } from "@/app/components/SlotMachine/Luckyslotmachinev2";
import FireworkArea, { FireworkAreaHandle } from '@/app/components/FireworkArea';

export default function BattlePageExample() {
  const router = useRouter();
  const battleData = useBattleData();
  
  // 参与者状态
  const [allSlotsFilled, setAllSlotsFilled] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  
  // 老虎机 refs
  const slotMachineRefs = useRef<Record<string, LuckySlotMachineHandle | null>>({});
  const winnerFireworkRef = useRef<FireworkAreaHandle>(null);
  
  // 生成游戏结果（人员满了之后）
  const gameResults = useMemo(() => {
    if (!allSlotsFilled || allParticipants.length === 0) {
      return null;
    }
    
    console.log('🎲 开始生成游戏结果...');
    return generateAllBattleResults(battleData, allParticipants);
  }, [allSlotsFilled, allParticipants, battleData]);
  
  // 使用时间轴系统（只有结果生成后才启动）
  const timelineControl = useBattleTimeline({
    battleData,
    rounds: gameResults?.rounds || [],
    gameMode: battleData.mode,
    isFastMode: battleData.isFastMode || false,
    eliminationData: gameResults?.eliminationData,
    jackpotData: gameResults?.jackpotWinner,
    sprintData: gameResults?.sprintData,
    serverStartTime: undefined,  // TODO: 从后端获取
    onComplete: () => {
      console.log('🏆 对战完成！');
    }
  });
  
  const { state, isCountingDown, currentRound, currentRoundResults, playerValues, isPlaying } = timelineControl;
  
  // 监听老虎机应该播放的状态
  const prevEventTypeRef = useRef<string | null>(null);
  const hasTriggeredSpinRef = useRef<Record<number, boolean>>({});
  
  useEffect(() => {
    if (!state.currentEvent || !gameResults) return;
    
    const eventType = state.currentEvent.type;
    const roundIndex = state.currentRound;
    
    // 检测进入新的转动阶段
    if (eventType === 'round_spinning' && prevEventTypeRef.current !== 'round_spinning') {
      console.log(`🎰 [时间轴] 第 ${roundIndex + 1} 轮开始转动`);
      
      // 防止重复触发
      if (!hasTriggeredSpinRef.current[roundIndex]) {
        hasTriggeredSpinRef.current[roundIndex] = true;
        
        // 触发所有老虎机
        Object.values(slotMachineRefs.current).forEach(ref => {
          if (ref) {
            ref.startSpin();
          }
        });
      }
    }
    
    // 检测完成
    if (eventType === 'completed' && prevEventTypeRef.current !== 'completed') {
      console.log('🏆 [时间轴] 对战结束');
      
      // 播放烟花
      setTimeout(() => {
        winnerFireworkRef.current?.triggerFirework();
      }, 500);
    }
    
    prevEventTypeRef.current = eventType;
  }, [state.currentEvent, state.currentRound, gameResults]);
  
  // 处理参与者变化
  const handleAllSlotsFilledChange = useCallback((filled: boolean, participants?: any[]) => {
    setAllSlotsFilled(filled);
    if (filled && participants) {
      setAllParticipants(participants);
      console.log(`👥 参与者已满: ${participants.length} 人`);
    }
  }, []);
  
  // 构建 packImages
  const packImages = battleData.packs.map((pack) => ({
    src: pack.image,
    alt: pack.name,
    id: pack.id,
  }));
  
  const highlightedIndices = currentRound >= 0 && currentRound < battleData.packs.length
    ? [currentRound]
    : [];
  
  const currentPack = currentRound >= 0 ? battleData.packs[currentRound] : null;
  
  // 渲染老虎机
  const renderSlotMachines = () => {
    if (!currentRoundResults || currentRound < 0 || !gameResults) return null;
    
    const pack = battleData.packs[currentRound];
    if (!pack || !pack.items) return null;
    
    return allParticipants.map((participant) => {
      const result = currentRoundResults[participant.id];
      if (!result) return null;
      
      return (
        <div key={participant.id} className="flex flex-col items-center">
          <div className="mb-2 text-center">
            <img 
              src={participant.avatar} 
              alt={participant.name}
              className="w-8 h-8 rounded-full mx-auto mb-1"
            />
            <p className="text-white font-bold text-sm">{participant.name}</p>
            <p className="text-gray-400 text-xs">
              ${(playerValues[participant.id] || 0).toFixed(2)}
            </p>
          </div>
          
          <LuckySlotMachine
            ref={(el) => {
              slotMachineRefs.current[participant.id] = el;
            }}
            symbols={pack.items as SlotSymbol[]}
            selectedPrizeId={result.itemId}
            height={450}
            spinDuration={battleData.isFastMode ? 1000 : 4500}
            onSpinComplete={(prize) => {
              console.log(`${participant.name} 开出: ${prize.name} ($${prize.price})`);
            }}
          />
        </div>
      );
    });
  };
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1419' }}>
      {/* 烟花效果 */}
      <FireworkArea ref={winnerFireworkRef} />
      
      {/* 头部 */}
      <BattleHeader
        packImages={packImages}
        highlightedIndices={highlightedIndices}
        statusText={
          !allSlotsFilled ? '等待玩家' :
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
        
        {/* 等待玩家 */}
        {!allSlotsFilled && (
          <div className="text-center py-20">
            <ParticipantsWithPrizes
              battleData={battleData}
              onAllSlotsFilledChange={handleAllSlotsFilledChange}
              roundResults={[]}
              participantValues={{}}
              gameMode={battleData.mode}
            />
          </div>
        )}
        
        {/* 倒计时 */}
        {allSlotsFilled && isCountingDown && (
          <div className="flex items-center justify-center h-96">
            <div className="text-9xl font-bold text-white">
              {Math.ceil(3 - state.progress * 3)}
            </div>
          </div>
        )}
        
        {/* 老虎机区域 */}
        {allSlotsFilled && state.phase === 'playing' && state.currentEvent?.type?.startsWith('round_') && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {renderSlotMachines()}
            </div>
          </div>
        )}
        
        {/* 参与者列表（显示累计价值和奖品） */}
        {allSlotsFilled && (
          <ParticipantsWithPrizes
            battleData={battleData}
            onAllSlotsFilledChange={handleAllSlotsFilledChange}
            roundResults={[]}  // TODO: 转换格式
            participantValues={playerValues}
            gameMode={battleData.mode}
          />
        )}
        
        {/* 调试面板（开发模式下显示） */}
        {process.env.NODE_ENV === 'development' && allSlotsFilled && (
          <div className="mt-8 p-4 bg-gray-800 rounded text-white text-sm font-mono">
            <h3 className="font-bold mb-2">🛠️ 调试面板</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>播放时间: {(state.playbackTime / 1000).toFixed(1)}s</div>
              <div>总时长: {(timelineControl.totalDuration / 1000).toFixed(1)}s</div>
              <div>当前事件: {state.currentEvent?.type || 'none'}</div>
              <div>进度: {(state.progress * 100).toFixed(1)}%</div>
              <div>当前轮次: {currentRound >= 0 ? `${currentRound + 1}/${battleData.packs.length}` : '未开始'}</div>
              <div>阶段: {state.phase}</div>
              <div>播放中: {isPlaying ? '是' : '否'}</div>
              <div>已完成: {state.isCompleted ? '是' : '否'}</div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={timelineControl.play}
                className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
              >
                ▶️ 播放
              </button>
              <button 
                onClick={timelineControl.pause}
                className="px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-700"
              >
                ⏸️ 暂停
              </button>
              <button 
                onClick={timelineControl.reset}
                className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
              >
                🔄 重置
              </button>
              <button 
                onClick={() => timelineControl.jumpTo(5000)}
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
              >
                ⏩ 跳到5秒
              </button>
              <button 
                onClick={() => timelineControl.jumpTo(timelineControl.totalDuration - 1000)}
                className="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700"
              >
                ⏭️ 跳到结尾
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

