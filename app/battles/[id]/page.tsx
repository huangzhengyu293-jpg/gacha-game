"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import PackDetailModal from "./components/PackDetailModal";
import { useBattleData } from "./hooks/useBattleData";
import type { PackItem, Participant } from "./types";
import BattleInfoCard from "./components/BattleInfoCard";
import LuckySlotMachine, { type SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";

// 🎯 主状态机类型
type MainState = 'IDLE' | 'LOADING' | 'COUNTDOWN' | 'ROUND_LOOP' | 'COMPLETED';

// 🎯 轮次子状态机类型
type RoundState = 'ROUND_RENDER' | 'ROUND_SPIN' | 'ROUND_SETTLE' | 'ROUND_NEXT' | null;

// 🎯 状态数据结构
interface BattleStateData {
  mainState: MainState;
  roundState: RoundState;
  game: {
    currentRound: number;
    totalRounds: number;
    rounds: Array<{
      symbols: SlotSymbol[];
      prizes: Record<string, string>; // participantId -> prizeId
    }>;
  };
  spinning: {
    activeCount: number;
    completed: Set<string>; // participant IDs
  };
}

export default function BattleDetailPage() {
  const battleData = useBattleData();
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);
  const [allSlotsFilled, setAllSlotsFilled] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  
  // 🎯 状态机核心状态
  const [mainState, setMainState] = useState<MainState>('IDLE');
  const [roundState, setRoundState] = useState<RoundState>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  
  // 🎯 游戏数据
  const [gameData, setGameData] = useState<BattleStateData['game']>({
    currentRound: 0,
    totalRounds: 0,
    rounds: []
  });
  
  // 🎯 转动状态
  const [spinningState, setSpinningState] = useState<BattleStateData['spinning']>({
    activeCount: 0,
    completed: new Set()
  });
  
  // 结果存储
  const [roundResults, setRoundResults] = useState<Record<number, Record<string, SlotSymbol>>>({});
  
  // UI状态
  const [galleryAlert, setGalleryAlert] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const slotMachineRefs = useRef<Record<string, any>>({});
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // 兼容旧代码的状态变量（会被状态机同步更新）
  const [currentRound, setCurrentRound] = useState(0);
  const [roundStatus, setRoundStatus] = useState<'idle' | 'spinning' | 'completed'>('idle');
  const [preGeneratedResults, setPreGeneratedResults] = useState<Record<number, Record<string, string>>>({});
  const [completedSpins, setCompletedSpins] = useState<Set<string>>(new Set());
  const [currentSlotSymbols, setCurrentSlotSymbols] = useState<SlotSymbol[]>([]);
  const [currentRoundPrizes, setCurrentRoundPrizes] = useState<Record<string, string>>({});
  const [allRoundsCompleted, setAllRoundsCompleted] = useState(false);
  const [hidePacks, setHidePacks] = useState(false);
  const [showSlotMachines, setShowSlotMachines] = useState(false);
  const currentRoundRef = useRef(0);

  // 检测屏幕宽度是否小于1024px
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateMatch = (mq: MediaQueryListEvent | MediaQueryList) => {
      setIsSmallScreen(mq.matches);
    };
    updateMatch(mediaQuery);
    const listener = (event: MediaQueryListEvent) => updateMatch(event);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Convert packs to packImages format for BattleHeader
  const packImages = battleData.packs.map((pack) => ({
    src: pack.image,
    alt: pack.name,
    id: pack.id,
  }));

  // Highlight the current pack being played
  const highlightedIndices = showSlotMachines && currentRound < battleData.packs.length 
    ? [currentRound] 
    : [];

  // Pre-compute all round symbols to avoid re-creating them
  const allRoundSymbols = useMemo(() => {
    const symbolsByRound: Record<number, SlotSymbol[]> = {};
    
    battleData.packs.forEach((pack, index) => {
      if (pack.items && pack.items.length > 0) {
        symbolsByRound[index] = pack.items.map((item) => ({
          id: item.id || `${pack.id}-item-${item.name}`,
          name: item.name || pack.name,
          description: item.description || '',
          image: item.image,
          price: (item as any).value || 0,
          dropProbability: 0.1,
          qualityId: null
        }));
      } else {
        symbolsByRound[index] = [{
          id: `${pack.id}-fallback`,
          name: pack.name,
          description: '',
          image: pack.image,
          price: (pack as any).cost || 0,
          dropProbability: 1,
          qualityId: null
        }];
      }
    });
    
    return symbolsByRound;
  }, [battleData.packs]);

  // Get symbols for a specific round
  const getSymbolsForRound = useCallback((roundIndex: number): SlotSymbol[] => {
    return allRoundSymbols[roundIndex] || [];
  }, [allRoundSymbols]);

  // Pre-generate all results when countdown starts
  const hasGeneratedResultsRef = useRef(false); // Track if results have been generated
  
  const generateAllResults = useCallback((allParticipants: any[]): BattleStateData['game']['rounds'] => {
    console.log('📊 [LOADING] 生成所有轮次数据...');
    
    const rounds: BattleStateData['game']['rounds'] = [];
    const detailedResults: Record<number, Record<string, any>> = {};
    
    battleData.packs.forEach((pack, packIndex) => {
      const symbols = getSymbolsForRound(packIndex);
      if (symbols.length === 0) return;
      
      const prizes: Record<string, string> = {};
      detailedResults[packIndex] = {};
      
      allParticipants.forEach(participant => {
        if (participant && participant.id) {
          // Randomly select a symbol for this player and round
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          prizes[participant.id] = randomSymbol.id;
          detailedResults[packIndex][participant.id] = {
            id: randomSymbol.id,
            name: randomSymbol.name,
            price: randomSymbol.price
          };
          
        }
      });
      
      rounds.push({ symbols, prizes });
    });
    
    // Store detailed results globally for comparison
    (window as any).__preGeneratedDetailedResults = detailedResults;
    
    console.log('📋 ========== 所有轮次预生成结果汇总 ==========');
    console.table(detailedResults);
    console.log('==============================================');
    
    return rounds;
  }, [battleData, getSymbolsForRound]);

  // 🎯 STATE TRANSITION: IDLE → LOADING
  useEffect(() => {
    if (mainState === 'IDLE' && allSlotsFilled && allParticipants.length > 0) {
      setMainState('LOADING');
    } else if (mainState !== 'IDLE' && !allSlotsFilled) {
      // 状态守卫：玩家离开，重置到IDLE
      setMainState('IDLE');
      setRoundState(null);
      setGameData({ currentRound: 0, totalRounds: 0, rounds: [] });
      setSpinningState({ activeCount: 0, completed: new Set() });
      setRoundResults({});
      setCountdownValue(null);
      setGalleryAlert(false);
      hasGeneratedResultsRef.current = false;
    }
  }, [mainState, allSlotsFilled, allParticipants.length]);

  // 🎯 STATE TRANSITION: LOADING → COUNTDOWN
  useEffect(() => {
    if (mainState === 'LOADING') {
      
      // 生成所有轮次数据
      const rounds = generateAllResults(allParticipants);
      
      setGameData({
        currentRound: 0,
        totalRounds: rounds.length,
        rounds
      });
      
      setMainState('COUNTDOWN');
      setCountdownValue(3);
    }
  }, [mainState, allParticipants, generateAllResults]);

  // 🎯 STATE TRANSITION: COUNTDOWN → ROUND_LOOP
  useEffect(() => {
    if (mainState === 'COUNTDOWN' && countdownValue === 0) {
      setCountdownValue(null); // 销毁倒计时组件
      setMainState('ROUND_LOOP');
      setRoundState('ROUND_RENDER'); // 进入第一个轮次的渲染态
    }
  }, [mainState, countdownValue]);

  // 🎯 Countdown ticker (倒计时器)
  useEffect(() => {
    if (mainState === 'COUNTDOWN' && countdownValue !== null && countdownValue > 0) {
      const timer = setTimeout(() => {
        setCountdownValue(prev => (prev ?? 0) - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mainState, countdownValue]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_RENDER
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_RENDER') {
      const currentRound = gameData.currentRound;
      
      // 状态守卫：检查轮次有效性
      if (currentRound >= gameData.totalRounds) {
        setMainState('COMPLETED');
        setRoundState(null);
        return;
      }
      
      
      // 状态守卫：确保当轮数据完整
      const currentRoundData = gameData.rounds[currentRound];
      if (!currentRoundData || currentRoundData.symbols.length === 0) {
        return;
      }
      
    
      
      // 虚拟DOM更新：设置当前轮次数据（触发老虎机渲染）
      // 这里不需要手动渲染，React会自动diff并更新
      
      // 等待DOM渲染完成
      setTimeout(() => {
        setRoundState('ROUND_SPIN');
      }, 100); // 等待虚拟DOM diff完成
    }
  }, [mainState, roundState, gameData]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameData.rounds[currentRound];
      
      if (!currentRoundData) return;
      
      
      // 重置转动状态
      setSpinningState({
        activeCount: allParticipants.length,
        completed: new Set()
      });
      
      // 触发所有老虎机转动
      setTimeout(() => {
        allParticipants.forEach(participant => {
          if (participant && participant.id) {
            const slotRef = slotMachineRefs.current[participant.id];
            if (slotRef && slotRef.startSpin) {
              slotRef.startSpin();
            } else {
            }
          }
        });
      }, 600); // 等待老虎机完全就绪（第一轮需要更长时间）
    }
  }, [mainState, roundState, gameData, allParticipants]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN → ROUND_SETTLE (监听所有老虎机停止)
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN') {
      // 状态守卫：确认所有老虎机已停止
      if (spinningState.completed.size === allParticipants.length && allParticipants.length > 0) {
        setRoundState('ROUND_SETTLE');
      }
    }
  }, [mainState, roundState, spinningState.completed.size, allParticipants.length]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SETTLE
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SETTLE') {
      const currentRound = gameData.currentRound;
      
      
      // 状态守卫：验证所有数据已记录
      const currentResults = roundResults[currentRound];
      if (currentResults && Object.keys(currentResults).length === allParticipants.length) {
        
        // 0.5秒后进入下一步
        setTimeout(() => {
          setRoundState('ROUND_NEXT');
        }, 500);
      } else {
      }
    }
  }, [mainState, roundState, gameData.currentRound, roundResults, allParticipants.length]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_NEXT
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_NEXT') {
      const currentRound = gameData.currentRound;
      const nextRound = currentRound + 1;
      
      
      if (nextRound < gameData.totalRounds) {
        
        // 更新游戏数据到下一轮
        setGameData(prev => ({
          ...prev,
          currentRound: nextRound
        }));
        
        // 回到ROUND_RENDER开始新一轮
        setRoundState('ROUND_RENDER');
      } else {
        setMainState('COMPLETED');
        setRoundState(null);
      }
    }
  }, [mainState, roundState, gameData]);

  // 🎯 同步新旧状态（状态机 → 兼容变量）
  useEffect(() => {
    setCurrentRound(gameData.currentRound);
    currentRoundRef.current = gameData.currentRound;
    
    const currentRoundData = gameData.rounds[gameData.currentRound];
    if (currentRoundData) {
      setCurrentSlotSymbols(currentRoundData.symbols);
      setCurrentRoundPrizes(currentRoundData.prizes);
    }
    
    setHidePacks(mainState !== 'IDLE');
    setShowSlotMachines(mainState === 'ROUND_LOOP');
    setAllRoundsCompleted(mainState === 'COMPLETED');
    setCompletedSpins(spinningState.completed);
  }, [gameData, mainState, spinningState.completed]);

  // 旧的自动启动逻辑已被状态机接管，删除

  // Handle when a slot machine completes
  const handleSlotComplete = useCallback((participantId: string, result: SlotSymbol) => {
    const round = gameData.currentRound;
    
    
    // Compare with pre-generated result
    const preGenerated = (window as any).__preGeneratedDetailedResults;
    if (preGenerated && preGenerated[round] && preGenerated[round][participantId]) {
      const expected = preGenerated[round][participantId];
      const match = expected.id === result.id;
      
      if (!match) {
        console.error(`[错误] 结果不匹配！预设 ${expected.name} != 实际 ${result.name}`);
      } else {
        console.log(`✅ [验证通过] ${participantId}: ${result.name}`);
      }
    }
    
    // Save the result
    setRoundResults(prev => {
      const updated = { ...prev };
      if (!updated[round]) {
        updated[round] = {};
      }
      if (!updated[round][participantId]) {
        updated[round][participantId] = result;
      }
      return updated;
    });
    
    // 🎯 更新转动状态（添加到completed集合）
    setSpinningState(prev => {
      if (prev.completed.has(participantId)) {
        return prev; // 已经完成过，不重复添加
      }
      const newCompleted = new Set(prev.completed);
      newCompleted.add(participantId);
      return {
        ...prev,
        completed: newCompleted
      };
    });
  }, [gameData.currentRound, allParticipants.length]);

  // 旧的完成检查和轮次切换逻辑已被状态机接管
  
  // 🎯 COMPLETED状态：显示最终统计
  useEffect(() => {
    if (mainState === 'COMPLETED') {
      console.log('🏁 [COMPLETED] 所有轮次完成！');
      
      // 延迟显示最终统计
      setTimeout(() => {
        const preGenerated = (window as any).__preGeneratedDetailedResults;
        
        if (preGenerated && roundResults) {
          let matchCount = 0;
          let totalCount = 0;
          
          Object.keys(preGenerated).forEach(roundStr => {
            const round = parseInt(roundStr);
            
            Object.keys(preGenerated[round] || {}).forEach(participantId => {
              const expected = preGenerated[round][participantId];
              const actual = roundResults[round]?.[participantId];
              totalCount++;
              
              if (actual) {
                const match = expected.id === actual.id;
                if (match) matchCount++;
              }
            });
          });
          
          console.log(`📊 [最终统计] ${matchCount}/${totalCount} 匹配 (${(matchCount/totalCount*100).toFixed(1)}%)`);
          
          if (matchCount !== totalCount) {
            console.error('⚠️ 发现结果不一致！');
          } else {
            console.log('✅ 所有结果完全匹配！');
          }
        }
      }, 1000);
    }
  }, [mainState, roundResults]);

  // Get gallery height for slot machines
  const [galleryHeight, setGalleryHeight] = useState(540);
  useEffect(() => {
    if (galleryRef.current) {
      const height = galleryRef.current.clientHeight;
      setGalleryHeight(Math.max(400, height - 40)); // Leave some padding
    }
  }, [showSlotMachines]);

  // Symbols are now managed by state and only updated when round starts

  return (
    <div className="flex flex-col flex-1 items-stretch relative">
      <div className="flex flex-col items-center gap-0 pb-20 w-full" style={{ marginTop: "-32px" }}>
          <BattleHeader
            packImages={packImages}
            highlightedIndices={highlightedIndices}
          awardName="普通"
          statusText="等待玩家"
            totalCost={battleData.cost}
          isCountingDown={countdownValue !== null && countdownValue > 0}
          isPlaying={showSlotMachines && !allRoundsCompleted}
          isCompleted={allRoundsCompleted}
          currentRound={currentRound}
          totalRounds={battleData.packs.length}
          currentPackName={battleData.packs[currentRound]?.name || ''}
          currentPackPrice={`$${(battleData.packs[currentRound] as any)?.cost?.toFixed(2) || '0.00'}`}
            onFairnessClick={() => {
              // Handle fairness click
            }}
            onShareClick={() => {
              // Handle share click
          }}
        />
        <div 
          className="flex self-stretch relative justify-center items-center flex-col w-full" 
          style={{ 
            minHeight: '450px',
            backgroundColor: galleryAlert ? '#B91C1C' : '#191d21'
          }}
        >
        {!showSlotMachines ? (
          <div ref={galleryRef} className="w-full h-full flex">
            <PacksGallery
              packs={battleData.packs}
              onPackClick={setSelectedPack}
              countdownValue={countdownValue}
              highlightAlert={galleryAlert}
              forceHidden={hidePacks}
              currentRound={currentRound}
            />
          </div>
        ) : (
          <>
            {/* Round indicator */}
          
            
            
            {/* 6 players on small screen: 2 rows of 3 slot machines, otherwise: 1 row */}
            {isSmallScreen && allParticipants.length === 6 ? (
              <div className="flex flex-col justify-between px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
                {/* First row: 3 slot machines - actual height 450px, visible height 216.5px (center area) */}
                <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
                  {allParticipants.slice(0, 3).map((participant) => {
                    if (!participant || !participant.id) return null;
                    
                    const selectedPrizeId = currentRoundPrizes[participant.id] || null;
                    
                    if (selectedPrizeId) {
                      const symbol = currentSlotSymbols.find(s => s.id === selectedPrizeId);
                      console.log(`[BattlePage] 传递给 ${participant.id} 的奖品: ${symbol?.name || '未知'} (ID: ${selectedPrizeId})`);
                    }
                    
                    return (
                      <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0" style={{ marginTop: `${-(450 - 216.5) / 2}px` }}>
                        <LuckySlotMachine
                          key={`${participant.id}-${currentRound}`}
                          ref={(ref) => {
                            if (ref) slotMachineRefs.current[participant.id] = ref;
                          }}
                          symbols={currentSlotSymbols}
                          selectedPrizeId={selectedPrizeId}
                          height={450}
                          showPrizeSelector={false}
                          buttonText=""
                          spinDuration={4500}
                          onSpinComplete={(result) => handleSlotComplete(participant.id, result)}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Second row: 3 slot machines - actual height 450px, visible height 216.5px (center area) */}
                <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
                  {allParticipants.slice(3, 6).map((participant) => {
                    if (!participant || !participant.id) return null;
                    
                    const selectedPrizeId = currentRoundPrizes[participant.id] || null;
                    
                    if (selectedPrizeId) {
                      const symbol = currentSlotSymbols.find(s => s.id === selectedPrizeId);
                      console.log(`[BattlePage] 传递给 ${participant.id} 的奖品: ${symbol?.name || '未知'} (ID: ${selectedPrizeId})`);
                    }
                    
                    return (
                      <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0" style={{ marginTop: `${-(450 - 216.5) / 2}px` }}>
                        <LuckySlotMachine
                          key={`${participant.id}-${currentRound}`}
                          ref={(ref) => {
                            if (ref) slotMachineRefs.current[participant.id] = ref;
                          }}
                          symbols={currentSlotSymbols}
                          selectedPrizeId={selectedPrizeId}
                          height={450}
                          showPrizeSelector={false}
                          buttonText=""
                          spinDuration={4500}
                          onSpinComplete={(result) => handleSlotComplete(participant.id, result)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex gap-0 md:gap-4 px-4 overflow-x-hidden w-full max-w-[1248px] justify-around">
                {allParticipants.map((participant) => {
                  if (!participant || !participant.id) return null;
                  
                  const selectedPrizeId = currentRoundPrizes[participant.id] || null;
                  
                  // Log what we're passing to the slot machine
                  if (selectedPrizeId) {
                    const symbol = currentSlotSymbols.find(s => s.id === selectedPrizeId);
                    console.log(`[BattlePage] 传递给 ${participant.id} 的奖品: ${symbol?.name || '未知'} (ID: ${selectedPrizeId})`);
                  }
                  
                  return (
                    <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                     
                       <LuckySlotMachine
                         key={`${participant.id}-${currentRound}`} // Add round to key to force remount only when round changes
                         ref={(ref) => {
                           if (ref) slotMachineRefs.current[participant.id] = ref;
                         }}
                         symbols={currentSlotSymbols}
                         selectedPrizeId={selectedPrizeId}
                         height={450}
                         showPrizeSelector={false}
                         buttonText=""
                         spinDuration={4500}
                        onSpinComplete={(result) => handleSlotComplete(participant.id, result)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        </div>
        <div className="w-full ">
          <div className="flex w-full max-w-[1248px] mx-auto flex-col gap-6">
            <ParticipantsWithPrizes
              battleData={battleData}
              onAllSlotsFilledChange={useCallback((filled: boolean, participants?: any[]) => {
                setAllSlotsFilled(filled);
                if (participants) {
                  setAllParticipants(participants);
                }
              }, [])}
              roundResults={Object.entries(roundResults).map(([round, results]) => ({
                roundId: `round-${parseInt(round)}`,
                playerItems: results
              }))}
            />
        {selectedPack && (
          <PackDetailModal
            pack={selectedPack}
            onClose={() => setSelectedPack(null)}
          />
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
