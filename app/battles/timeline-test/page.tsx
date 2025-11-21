/**
 * 时间轴系统测试页面
 * 访问: http://localhost:3000/battles/timeline-test?packIds=1,2,3&players=4
 */

"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BattleHeader from "../[id]/components/BattleHeader";
import ParticipantsWithPrizes from "../[id]/components/ParticipantsWithPrizes";
import WinnerDisplay from "../[id]/components/WinnerDisplay";
import Countdown from "../[id]/components/Countdown";
import { useBattleData } from "../[id]/hooks/useBattleData";
import { useBattleTimeline } from "../[id]/hooks/useBattleTimeline";
import SlotMachinesGrid from "../[id]/components/SlotMachinesGrid";
import { calculatePlaybackState } from "../[id]/timeline";
import { FIXED_PARTICIPANTS, FIXED_PACKS_DATA, FIXED_RESULTS, EXPECTED_SUMMARY, TIMELINE_EXPLANATION, FIXED_GAME_CONFIG } from "./FIXED_TEST_DATA";
import LuckySlotMachine, { type SlotSymbol, type LuckySlotMachineHandle } from "@/app/components/SlotMachine/Luckyslotmachinev2";

// ✅ 真实的礼包数据（用于测试）
const MOCK_PACKS_DATA = [
  {
    id: "pack_halloween_pokemon",
    title: "不给糖就捣蛋宝可梦",
    image: "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-3840,c-at_max",
    price: 398.3,
    items: [
      { id: "item_halloween_1", name: "仙子伊布 VMAX", image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max", price: 735, dropProbability: 0.1, qualityId: "epic" },
      { id: "item_halloween_2", name: "火箭队的超梦前任", image: "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max", price: 685, dropProbability: 0.1, qualityId: "epic" },
      { id: "item_halloween_3", name: "Zekrom ex", image: "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max", price: 588, dropProbability: 0.1, qualityId: "rare" },
      { id: "item_halloween_4", name: "喷火龙ex", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max", price: 385, dropProbability: 0.1, qualityId: "rare" },
      { id: "item_halloween_5", name: "喷火龙ex", image: "https://ik.imagekit.io/hr727kunx/products/cmg8qwvr20000kv0f7xwnyvu9_1596630__cqx8MRYg1?tr=w-3840,c-at_max", price: 370, dropProbability: 0.1, qualityId: "common" },
      { id: "item_halloween_6", name: "Zekrom ex", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5of0l0000js0mqdkst7ia_3091949__o_1YBmAkO?tr=w-3840,c-at_max", price: 335, dropProbability: 0.1, qualityId: "common" },
      { id: "item_halloween_7", name: "雷希拉姆", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max", price: 255, dropProbability: 0.1, qualityId: "uncommon" },
      { id: "item_halloween_8", name: "盖诺赛克特", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max", price: 79, dropProbability: 0.1, qualityId: "common" },
      { id: "item_halloween_9", name: "梅迪查姆五世", image: "https://ik.imagekit.io/hr727kunx/products/cmgo2qell0001i50haz4762if_4053677__c3NUX4VJv?tr=w-3840,c-at_max", price: 31, dropProbability: 0.1, qualityId: "common" },
      { id: "item_halloween_10", name: "烛光五世", image: "https://ik.imagekit.io/hr727kunx/products/cmgo2lik80000i50hy2hsb2qa_8750657__9B1p0b16-?tr=w-3840,c-at_max", price: 2.59, dropProbability: 0.05, qualityId: "common" },
      { id: "item_halloween_11", name: "螃蟹V", image: "https://ik.imagekit.io/hr727kunx/products/cmgo2hrjf0000kv0fqj7vt6yb_8772392__iqnuqYLx7?tr=w-3840,c-at_max", price: 1.84, dropProbability: 0.05, qualityId: "common" },
    ]
  },
  {
    id: "user_pack_1762609584913",
    title: "111",
    image: "https://ik.imagekit.io/hr727kunx/community_packs/version18.png",
    price: 8.52,
    items: [
      { id: "item_0014", name: "离子", image: "https://ik.imagekit.io/hr727kunx/products/cmgo7y7z50001l50i3dvrh5t7_2587383__KszFCRqvU", price: 25, dropProbability: 0.005, qualityId: "legendary" },
      { id: "item_0018", name: "精灵球", image: "https://ik.imagekit.io/hr727kunx/products/cmgo7mskd0000ju0kmqso6xbn_2808674__6u5KNOlaE", price: 1, dropProbability: 0.9, qualityId: "common" },
      { id: "item_0019", name: "仙子伊布 VMAX", image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max", price: 735, dropProbability: 0.1, qualityId: "epic" },
      { id: "item_0017", name: "茴香", image: "https://ik.imagekit.io/hr727kunx/products/cmgo7qf8u0000jv0m5vqdxffv_6839547__emfZVD1ch", price: 1.95, dropProbability: 0.06, qualityId: "rare" },
    ]
  },
];

export default function TimelineTestPage() {
  const router = useRouter();
  const originalBattleData = useBattleData();
  
  // ✅ 确保只在客户端渲染
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  console.log(111);
  
  // ✅ 直接使用固定的测试数据
  const battleData = useMemo(() => ({
    ...originalBattleData,
    packs: FIXED_PACKS_DATA,
    participants: FIXED_PARTICIPANTS,
    playersCount: FIXED_GAME_CONFIG.playersCount,
    mode: FIXED_GAME_CONFIG.gameMode,
    battleType: FIXED_GAME_CONFIG.battleType,
    teamStructure: FIXED_GAME_CONFIG.teamStructure,
    isFastMode: FIXED_GAME_CONFIG.isFastMode,
    isLastChance: FIXED_GAME_CONFIG.isLastChance,
    isInverted: FIXED_GAME_CONFIG.isInverted,
  }), [originalBattleData]);
  
  // ✅ 直接使用固定参与者，不需要等人满
  const allParticipants = FIXED_PARTICIPANTS;
  const allSlotsFilled = true;
  
  // 老虎机 refs
  const slotMachineRefs = useRef<Record<string, LuckySlotMachineHandle | null>>({});
  
  // 记录实际结果（用于对比）
  const [actualResults, setActualResults] = useState<Record<number, Record<string, { itemId: string; name: string; price: number }>>>({});
  
  // 测试选项 - 从 URL 参数读取模拟时间
  const [testServerTime, setTestServerTime] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    
    const params = new URLSearchParams(window.location.search);
    const simulateTime = params.get('simulateJoinTime');
    
    if (simulateTime) {
      const seconds = parseFloat(simulateTime);
      return new Date(Date.now() - seconds * 1000).toISOString();
    }
    
    return undefined;
  });
  
  const [joinTimeInput, setJoinTimeInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '0';
    const params = new URLSearchParams(window.location.search);
    return params.get('simulateJoinTime') || '0';
  });
  
  // 处理模拟加入
  const handleSimulateJoin = useCallback(() => {
    const seconds = parseFloat(joinTimeInput) || 0;
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('simulateJoinTime', seconds.toString());
      window.location.href = url.toString();
    }
  }, [joinTimeInput]);
  
  // ✅ 直接使用固定的游戏结果
  const gameResults = useMemo(() => {
    // 构建完整的 rounds 数据结构（添加 pools）
    const rounds = FIXED_RESULTS.rounds.map((round, index) => {
      const pack = FIXED_PACKS_DATA[index];
      const legendaryItems = pack.items.filter(it => it.qualityId === 'legendary');
      const normalItems = pack.items.filter(it => it.qualityId !== 'legendary');
      
      const goldenPlaceholder: SlotSymbol = {
        id: 'golden_placeholder',
        name: '金色神秘',
        image: '/theme/default/hidden-gold.webp',
        price: 0,
        qualityId: 'placeholder',
        description: '',
        dropProbability: 0
      };
      
      return {
        pools: {
          normal: legendaryItems.length > 0 ? [...normalItems, goldenPlaceholder] : normalItems,
          legendary: legendaryItems,
          placeholder: goldenPlaceholder
        },
        results: round.results
      };
    });
    
    return {
      rounds,
      jackpotWinner: null,
      sprintData: null,
      eliminationData: null,
    };
  }, []);
  
  // 使用时间轴系统
  const timelineControl = useBattleTimeline({
    battleData,
    rounds: gameResults?.rounds || [],
    gameMode: battleData.mode,
    isFastMode: battleData.isFastMode || false,
    eliminationData: gameResults?.eliminationData,
    jackpotData: gameResults?.jackpotWinner,
    sprintData: gameResults?.sprintData,
    serverStartTime: testServerTime,
    onComplete: () => {
      console.log('🏆 对战完成！');
    }
  });
  
  const { state, isCountingDown, currentRound, currentRoundResults, playerValues, isPlaying } = timelineControl;
  
  // 监听老虎机应该播放的状态
  const prevRoundRef = useRef(-1);
  const prevSpinEventKeyRef = useRef<string>('');
  const prevEventTypeRef = useRef<string>('');
  
  useEffect(() => {
    if (!gameResults) return;
    
    const eventType = state.currentEvent?.type || '';
    const currentStageFromEvent = state.currentEvent?.data?.stage || 1;
    
    if (eventType === 'round_spinning') {
      const eventKey = `${currentRound}-${currentStageFromEvent}`;
      
      if (prevSpinEventKeyRef.current !== eventKey) {
        if (currentRound !== prevRoundRef.current) {
          prevRoundRef.current = currentRound;
        }
        
        // ✅ 触发老虎机开始转动
        setTimeout(() => {
          if (currentStageFromEvent === 1) {
            Object.values(slotMachineRefs.current).forEach(ref => ref?.startSpin());
          } else if (currentStageFromEvent === 2) {
            const roundData = gameResults.rounds[currentRound];
            if (roundData) {
              allParticipants.forEach(p => {
                const result = roundData.results[p.id];
                if (result?.needsSecondSpin) {
                  slotMachineRefs.current[p.id]?.startSpin();
                }
              });
            }
          }
        }, 100);
        
        prevSpinEventKeyRef.current = eventKey;
      }
    }
    
    
    prevEventTypeRef.current = eventType;
  }, [state.currentEvent, currentRound, gameResults]);
  
  // ✅ 不需要等待人满，直接开始
  
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
  
  // ✅ 构建已完成轮次结果（基于老虎机回正时刻 = round_spinning.endTime）
  const completedRoundResults = useMemo(() => {
    if (!gameResults) return [];
    
    const results: Array<{ roundId: string; playerItems: Record<string, SlotSymbol | undefined> }> = [];
    
    // ✅ 找到每轮的最后一个 round_spinning 事件（老虎机回正的时刻）
    const roundLastSpinningEndTime: Record<number, number> = {};
    for (const event of timelineControl.timeline) {
      if (event.type === 'round_spinning' && event.roundIndex !== undefined) {
        const roundIdx = event.roundIndex;
        // 记录最晚的 endTime（处理二段动画的情况）
        if (!roundLastSpinningEndTime[roundIdx] || event.endTime > roundLastSpinningEndTime[roundIdx]) {
          roundLastSpinningEndTime[roundIdx] = event.endTime;
        }
      }
    }
    
    // 检查哪些轮次的老虎机已回正
    const completedRounds: number[] = [];
    Object.entries(roundLastSpinningEndTime).forEach(([roundIdx, endTime]) => {
      if (timelineControl.state.playbackTime >= endTime) {
        completedRounds.push(parseInt(roundIdx));
      }
    });
    
    // 遍历已完成的轮次，构建结果
    completedRounds.forEach(i => {
      const roundData = gameResults.rounds[i];
      if (!roundData) return;
      
      const pack = battleData.packs[i];
      if (!pack || !pack.items) return;
      
      const playerItems: Record<string, SlotSymbol | undefined> = {};
      
      Object.entries(roundData.results).forEach(([playerId, result]: [string, any]) => {
        const item = pack.items?.find((it: any) => it.id === result.itemId);
        if (item) {
          playerItems[playerId] = item as SlotSymbol;
        }
      });
      
      results.push({
        roundId: `round-${i}`,
        playerItems
      });
    });
    
    return results;
  }, [gameResults, timelineControl.timeline, timelineControl.state.playbackTime, battleData.packs]);
  
  // 🏆 计算获胜者（在对战完成时）
  const winnerData = useMemo(() => {
    if (state.phase !== 'completed' || !gameResults) {
      return null;
    }
    
    // 构建参与者列表（带总价值）
    const participants = FIXED_PARTICIPANTS.map(p => {
      const totalValue = playerValues[p.id] || 0;
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar || 'https://avatar.vercel.sh/' + p.id + '.svg',
        totalValue: `$${totalValue.toFixed(2)}`,
        _numericValue: totalValue,
      };
    });
    
    // 找出最高价值（获胜者）
    const maxValue = Math.max(...participants.map(p => p._numericValue));
    const winner = participants.find(p => p._numericValue === maxValue && maxValue > 0);
    
    return winner || null;
  }, [state.phase, gameResults, playerValues]);
  
  // ✅ 缓存老虎机渲染，减少不必要的重新渲染
  const slotMachinesContent = useMemo(() => {
    if (!currentRoundResults || currentRound < 0 || !gameResults) return null;
    
    const pack = battleData.packs[currentRound];
    if (!pack || !pack.items) return null;
    
    // ✅ 获取当前是第几段（从时间轴事件中获取）
    const currentStageFromEvent = state.currentEvent?.data?.stage || 1;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allParticipants.map((participant) => {
          const result = currentRoundResults[participant.id];
          if (!result) {
            return null;
          }
          
          // ✅ 从时间轴事件获取当前阶段
          const currentStageFromEvent = state.currentEvent?.data?.stage || 1;
          
          // 验证物品是否存在
          const targetItem = pack.items?.find((it: any) => it.id === result.itemId);
          
          // ✅ 决定老虎机的 key
          // 不需要二段的玩家：永远用 stage-1 的 key，组件不会重新挂载
          // 需要二段的玩家：第一段和第二段用不同的 key，会重新挂载
          const slotMachineKey = result.needsSecondSpin
            ? `${participant.id}-round-${currentRound}-stage-${currentStageFromEvent}`
            : `${participant.id}-round-${currentRound}-stage-1`;
          
          // ✅ 决定是否应该触发新动画
          const shouldStartSpin = 
            currentStageFromEvent === 1 ||  // 第一段所有人都转
            (currentStageFromEvent === 2 && result.needsSecondSpin);  // 第二段只有需要二段的人转
          
          // ✅ 决定物品池和目标物品
          let selectedPrizeId: string | null;
          let symbols: SlotSymbol[];
          
          const goldenPlaceholder: SlotSymbol = {
            id: 'golden_placeholder',
            name: '金色神秘',
            image: '/theme/default/hidden-gold.webp',
            price: 0,
            qualityId: 'placeholder',
            description: '',
            dropProbability: 0
          };
          
          if (result.needsSecondSpin && currentStageFromEvent === 1) {
            selectedPrizeId = 'golden_placeholder';
            const normalItems = pack.items?.filter((it: any) => it.qualityId !== 'legendary') || [];
            symbols = [...normalItems, goldenPlaceholder] as SlotSymbol[];
            
          } else if (result.needsSecondSpin && currentStageFromEvent === 2) {
            selectedPrizeId = result.itemId;
            const legendaryItems = pack.items?.filter((it: any) => it.qualityId === 'legendary') || [];
            symbols = legendaryItems as SlotSymbol[];
            
          } else if (!result.needsSecondSpin) {
            selectedPrizeId = currentStageFromEvent === 1 ? result.itemId : null;
            symbols = pack.items as SlotSymbol[];
          } else {
            selectedPrizeId = null;
            symbols = pack.items as SlotSymbol[];
          }
          
          return (
            <div key={participant.id} className="flex flex-col items-center">
              <div className="mb-2 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 mx-auto mb-2 overflow-hidden">
                  {participant.avatar ? (
                    <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {participant.name.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="text-white font-bold text-sm">{participant.name}</p>
                <p className="text-green-400 text-xs font-bold">
                  累计: ${(playerValues[participant.id] || 0).toFixed(2)}
                </p>
                {/* ✅ 只在需要转动时显示预设答案 */}
                {selectedPrizeId && (
                  <div className="mt-2 p-2 bg-yellow-900 rounded text-xs">
                    <p className="text-yellow-300 font-bold">
                      📋 预设答案 
                      {result.needsSecondSpin && (
                        <span className="ml-1">
                          ({currentStageFromEvent === 1 ? '第1段' : '第2段'})
                          {currentStageFromEvent === 1 && ' 💛占位符'}
                        </span>
                      )}:
                    </p>
                    <p className="text-white truncate">
                      {selectedPrizeId === 'golden_placeholder'
                        ? '金色占位符 💛' 
                        : targetItem?.name || result.itemId
                      }
                    </p>
                    <p className="text-green-400">
                      {selectedPrizeId === 'golden_placeholder'
                        ? '$0.00' 
                        : `$${targetItem?.price?.toFixed(2) || '0.00'}`
                      }
                    </p>
                  </div>
                )}
                
                {/* ✅ 如果是第二段且这个玩家不需要转，显示"已完成"状态 */}
                {currentStageFromEvent === 2 && !result.needsSecondSpin && (
                  <div className="mt-2 p-2 bg-green-900 rounded text-xs">
                    <p className="text-green-300 font-bold">✅ 已完成</p>
                    <p className="text-gray-300 text-xs">等待其他玩家...</p>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <LuckySlotMachine
                  key={slotMachineKey}
                  ref={(el) => {
                    slotMachineRefs.current[participant.id] = el;
                  }}
                  symbols={symbols}
                  selectedPrizeId={selectedPrizeId || undefined}
                  height={450}
                  spinDuration={battleData.isFastMode ? 1000 : 4500}
                  onSpinComplete={(prize) => {
                    // 记录结果（无日志）
                    setActualResults(prev => ({
                      ...prev,
                      [currentRound]: {
                        ...prev[currentRound],
                        [participant.id]: {
                          itemId: prize.id,
                          name: prize.name,
                          price: prize.price
                        }
                      }
                    }));
                  }}
                />
                
                {/* 实际结果显示（老虎机完成后）*/}
                {actualResults[currentRound]?.[participant.id] && (
                  <div className="mt-2 p-2 bg-green-900 rounded text-xs">
                    <p className="text-green-300 font-bold">✅ 实际结果:</p>
                    <p className="text-white truncate">{actualResults[currentRound][participant.id].name}</p>
                    <p className={actualResults[currentRound][participant.id].itemId === result.itemId ? 'text-green-400' : 'text-red-400'}>
                      ${actualResults[currentRound][participant.id].price.toFixed(2)}
                      {actualResults[currentRound][participant.id].itemId === result.itemId ? ' ✅' : ' ❌ 不匹配！'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [
    currentRoundResults, 
    currentRound, 
    gameResults, 
    battleData.packs, 
    state.currentEvent?.type,  // ✅ 只依赖 type，不依赖整个 event 对象
    state.currentEvent?.data?.stage,  // ✅ 只依赖 stage
    playerValues, 
    actualResults
  ]);
  
  // ✅ 确保只在客户端渲染，避免 hydration 错误
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F1419' }}>
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1419' }}>
      {/* 🐛 调试状态显示 */}
      {(
        <div className="fixed top-20 right-4 z-50 bg-red-900 text-white p-3 rounded text-xs max-w-48">
          <h4 className="font-bold mb-2 text-sm">🐛 状态</h4>
          <div className="space-y-1 text-xs" suppressHydrationWarning>
            <p suppressHydrationWarning>状态: {gameResults ? '✅ OK' : '❌ 加载中'}</p>
            <p suppressHydrationWarning>轮次: {currentRound >= 0 ? `${currentRound + 1}/${battleData.packs.length}` : '-'}</p>
            <p suppressHydrationWarning>阶段: {state.currentEvent?.data?.stage || '-'}</p>
            <p className="text-yellow-300 text-xs" suppressHydrationWarning>
              {(state.playbackTime / 1000).toFixed(1)}s / {(timelineControl.totalDuration / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      )}
      
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
        
        {/* 标题 */}
        <div className="text-center py-6">
          <h2 className="text-4xl font-bold text-white mb-2">
            🎮 时间轴系统测试页面
          </h2>
          <p className="text-gray-400">
            使用固定测试数据，验证时间轴驱动和中途加入功能
          </p>
        </div>
        
        {/* 动画播放区域 */}
        {allSlotsFilled && (
          <div className="w-full h-[450px]" style={{ backgroundColor: '#191d21' }}>
            <div className="flex h-full w-full max-w-screen-xl px-4 mx-auto items-center justify-center">
              {/* 倒计时 */}
              {isCountingDown && <Countdown duration={3000} />}
              
              {/* 老虎机网格 */}
              {state.phase === 'playing' && state.currentEvent?.type?.startsWith('round_') && slotMachinesContent && Array.isArray(slotMachinesContent) && slotMachinesContent.length > 0 && (
                <SlotMachinesGrid
                  playersCount={battleData.playersCount}
                  battleType={battleData.battleType as 'solo' | 'team'}
                  teamStructure={battleData.teamStructure}
                >
                  {slotMachinesContent}
                </SlotMachinesGrid>
              )}
              
              {/* 🏆 获胜者展示（对战完成后） */}
              {winnerData && state.phase === 'completed' && (
                <WinnerDisplay 
                  winner={winnerData} 
                  battleCost={battleData.cost}
                />
              )}
            </div>
          </div>
        )}
        
        {/* 参与者列表（显示已完成轮次的结果）*/}
        {allSlotsFilled && (
          <div className="mt-8">
            <ParticipantsWithPrizes
              battleData={battleData}
              roundResults={completedRoundResults}
              participantValues={playerValues}
              gameMode={battleData.mode}
              completedRounds={new Set(
                completedRoundResults.map(r => parseInt(r.roundId.replace('round-', '')))
              )}
            />
          </div>
        )}
        
      
      </div>
    </div>
  );
}

