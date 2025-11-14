"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import PackDetailModal from "./components/PackDetailModal";
import { useBattleData } from "./hooks/useBattleData";
import type { PackItem, Participant } from "./types";
import BattleInfoCard from "./components/BattleInfoCard";
import LuckySlotMachine, { type SlotSymbol } from "@/app/components/Slotmachine/LuckySlotMachine";

export default function BattleDetailPage() {
  const battleData = useBattleData();
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);
  const [allSlotsFilled, setAllSlotsFilled] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [galleryAlert, setGalleryAlert] = useState(false);
  const [hidePacks, setHidePacks] = useState(false);
  const [showSlotMachines, setShowSlotMachines] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundStatus, setRoundStatus] = useState<'idle' | 'spinning' | 'completed'>('idle');
  const [roundResults, setRoundResults] = useState<Record<number, Record<string, SlotSymbol>>>({});
  const [preGeneratedResults, setPreGeneratedResults] = useState<Record<number, Record<string, string>>>({});
  const [completedSpins, setCompletedSpins] = useState<Set<string>>(new Set());
  const [currentSlotSymbols, setCurrentSlotSymbols] = useState<SlotSymbol[]>([]); // Store symbols for current round
  const [currentRoundPrizes, setCurrentRoundPrizes] = useState<Record<string, string>>({}); // Store prizes for current round
  const [allRoundsCompleted, setAllRoundsCompleted] = useState(false); // Track if all rounds are completed
  const galleryRef = useRef<HTMLDivElement>(null);
  const slotMachineRefs = useRef<Record<string, any>>({});
  const currentRoundRef = useRef(0); // Keep track of current round in ref to avoid closure issues
  const [isSmallScreen, setIsSmallScreen] = useState(false);

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
  
  const generateAllResults = useCallback((allParticipants: any[]) => {
    // Prevent generating results multiple times
    if (hasGeneratedResultsRef.current) {
      return;
    }
    
    hasGeneratedResultsRef.current = true;
    const results: Record<number, Record<string, string>> = {};
    
    
    const detailedResults: Record<number, Record<string, any>> = {};
    
    battleData.packs.forEach((pack, packIndex) => {
      const symbols = getSymbolsForRound(packIndex);
      if (symbols.length === 0) return;
      
      results[packIndex] = {};
      detailedResults[packIndex] = {};
      
      allParticipants.forEach(participant => {
        if (participant && participant.id) {
          // Randomly select a symbol for this player and round
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          results[packIndex][participant.id] = randomSymbol.id;
          detailedResults[packIndex][participant.id] = {
            id: randomSymbol.id,
            name: randomSymbol.name,
            price: randomSymbol.price
          };
        }
      });
    });
    
    // Store detailed results globally for comparison
    (window as any).__preGeneratedDetailedResults = detailedResults;
    
    setPreGeneratedResults(results);
  }, [battleData, getSymbolsForRound]);

  // Track if we've already started countdown to avoid re-triggering
  const hasStartedCountdownRef = useRef(false);
  
  useEffect(() => {
    if (allSlotsFilled && allParticipants.length > 0) {
      if (!hasStartedCountdownRef.current && countdownValue === null && !galleryAlert) {
        hasStartedCountdownRef.current = true;
        setHidePacks(true);
        setCountdownValue(3);
        // Generate all results when countdown starts with all participants (including bots)
        generateAllResults(allParticipants);
      }
    } else {
      // Reset when slots are not filled
      if (!allSlotsFilled) {
        hasStartedCountdownRef.current = false;
        hasGeneratedResultsRef.current = false; // Reset results generation flag
        setCountdownValue(null);
        setGalleryAlert(false);
        setHidePacks(false);
        setShowSlotMachines(false);
        setCurrentRound(0);
        currentRoundRef.current = 0; // Reset round ref
        setRoundStatus('idle');
        setCompletedSpins(new Set());
        setRoundResults({});
        setPreGeneratedResults({});
        setCurrentSlotSymbols([]);
        setCurrentRoundPrizes({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSlotsFilled, allParticipants.length]); // Only depend on the essential states

  useEffect(() => {
    if (countdownValue === null) return;

    if (countdownValue <= 0) {
      setCountdownValue(null);
      // Instead of turning red, show slot machines
      setShowSlotMachines(true);
      setRoundStatus('idle'); // Start with idle status
      // Initialize symbols AND prizes for first round
      const firstRoundSymbols = allRoundSymbols[0] || [];
      const firstRoundPrizes = preGeneratedResults[0] || {};
      setCurrentSlotSymbols(firstRoundSymbols);
      setCurrentRoundPrizes(firstRoundPrizes);
      return;
    }

    const timer = setTimeout(() => {
      setCountdownValue((prev) => (prev ?? 0) - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownValue]);

  // Track if we're currently starting a round to prevent multiple triggers
  const isStartingRoundRef = useRef(false);
  const lastProcessedRoundRef = useRef(-1); // Track last processed round to prevent duplicates
  
  // Start a round when slot machines are shown and round is idle
  useEffect(() => {
    if (showSlotMachines && roundStatus === 'idle' && preGeneratedResults && Object.keys(preGeneratedResults).length > 0 && !allRoundsCompleted) {
      // Check if current round is valid
      if (currentRound >= battleData.packs.length) {
        return;
      }
      
      // Prevent multiple executions for the same round
      if (isStartingRoundRef.current || lastProcessedRoundRef.current === currentRound) {
        return;
      }
      
      isStartingRoundRef.current = true;
      lastProcessedRoundRef.current = currentRound;
      
      // For first round only, update symbols and prizes
      // (subsequent rounds have their data already set in the completed handler)
      if (currentRound === 0 && currentSlotSymbols.length === 0) {
        const symbols = allRoundSymbols[currentRound] || [];
        const prizes = preGeneratedResults[currentRound] || {};
        setCurrentSlotSymbols(symbols);
        setCurrentRoundPrizes(prizes);
        
        // For first round, we need to wait for state to update before starting
        // Exit here and let the next render cycle handle the start
        isStartingRoundRef.current = false;
        return;
      }
      
      // Verify that we have the data before starting
      if (currentSlotSymbols.length === 0 || Object.keys(currentRoundPrizes).length === 0) {
        console.warn(`[警告] 第 ${currentRound + 1} 轮数据未准备好，等待下一个周期`);
        isStartingRoundRef.current = false;
        return;
      }
      
      // Clear completed spins for new round
      setCompletedSpins(new Set());
      
      // Use setTimeout to ensure state has been updated
      setTimeout(() => {
        setRoundStatus('spinning');
        
        // Trigger all slot machines for current round simultaneously
        allParticipants.forEach(participant => {
          if (participant && participant.id) {
            const slotMachine = slotMachineRefs.current[participant.id];
            if (slotMachine && slotMachine.startSpin) {
              slotMachine.startSpin();
            }
          }
        });
        
        // Reset the flag after starting
        isStartingRoundRef.current = false;
      }, 100); // Small delay to ensure state is updated
      
      // Cleanup
      return () => {
        isStartingRoundRef.current = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSlotMachines, roundStatus, currentRound, allRoundsCompleted, battleData.packs.length]); // Removed data length dependencies to prevent re-triggers

  // Update currentRoundRef when currentRound changes
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  // Handle when a slot machine completes
  const handleSlotComplete = useCallback((participantId: string, result: SlotSymbol) => {
    const round = currentRoundRef.current; // Use ref to get the latest value
    
    // Compare with pre-generated result
    const preGenerated = (window as any).__preGeneratedDetailedResults;
    if (preGenerated && preGenerated[round] && preGenerated[round][participantId]) {
      const expected = preGenerated[round][participantId];
      const match = expected.id === result.id;
      
      if (!match) {
        console.error(`[错误] 结果不匹配！预设 ${expected.name} != 实际 ${result.name}`);
      }
    }
    
    // Save the result using the current round from ref
    setRoundResults(prev => {
      const updated = { ...prev };
      if (!updated[round]) {
        updated[round] = {};
      }
      // Only save if not already saved for this round
      if (!updated[round][participantId]) {
        updated[round][participantId] = result;
      } else {
      }
      return updated;
    });
    
    // Add to completed spins (only if not already completed) - MUST be after result is saved
    setCompletedSpins(prev => {
      if (prev.has(participantId)) {
        return prev;
      }
      const newSet = new Set(prev);
      newSet.add(participantId);
      return newSet;
    });
  }, []); // Remove currentRound from dependencies

  // Prevent multiple completion checks
  const hasCheckedCompletionRef = useRef(false); // Prevent multiple completion checks
  const isTransitioningToNextRoundRef = useRef(false); // Prevent multiple round transitions
  
  // Check if all slot machines have completed for current round
  useEffect(() => {
    
    if (roundStatus === 'spinning' && completedSpins.size === allParticipants.length && allParticipants.length > 0 && !hasCheckedCompletionRef.current) {
      hasCheckedCompletionRef.current = true;
      
      // Verify all results are saved before marking as completed
      const currentRoundResults = roundResults[currentRound];
      const savedCount = currentRoundResults ? Object.keys(currentRoundResults).length : 0;
      
      if (savedCount === allParticipants.length) {
        setRoundStatus('completed');
      } else {
        hasCheckedCompletionRef.current = false; // Reset to check again
      }
    }
    
    // Reset the flag when round status changes from completed
    if (roundStatus === 'idle') {
      hasCheckedCompletionRef.current = false;
    }
  }, [completedSpins.size, allParticipants.length, roundStatus, currentRound, roundResults, completedSpins]);
  
  // Move to next round when current round is completed
  useEffect(() => {
    if (roundStatus === 'completed' && !isTransitioningToNextRoundRef.current) {
      if (currentRound < battleData.packs.length - 1) {
        // Prevent multiple transitions
        isTransitioningToNextRoundRef.current = true;
        
        // Move to next round immediately after a short delay for visual effect
        const timer = setTimeout(() => {
          
          // Update round and prepare data for next round
          const nextRound = currentRound + 1;
          const symbols = allRoundSymbols[nextRound] || [];
          const prizes = preGeneratedResults[nextRound] || {};
          
       
          
          // Update everything at once
          setCurrentRound(nextRound);
          setCurrentSlotSymbols(symbols);
          setCurrentRoundPrizes(prizes);
          // Don't set to 'idle' immediately - let the useEffect handle it after data is ready
          setTimeout(() => {
            setRoundStatus('idle'); // This will trigger spin after data is ready
          }, 50);
          
          // Reset the flag after transition
          isTransitioningToNextRoundRef.current = false;
        }, 500); // Reduced from 2000ms to 500ms
        
        // Cleanup
        return () => {
          clearTimeout(timer);
          isTransitioningToNextRoundRef.current = false;
        };
      } else {
        // All rounds completed
        setAllRoundsCompleted(true);
        // Ensure no more rounds can start
        setRoundStatus('completed');
        isTransitioningToNextRoundRef.current = false;
        
        // Print final comparison after a delay
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
                  
                } else {
                }
              });
            });
            
            if (matchCount !== totalCount) {
              console.error('⚠️ 发现结果不一致，请检查老虎机逻辑！');
            } else {
              console.log('✅ 所有结果完全匹配！');
            }
          }
        }, 2000);
      }
    }
  }, [roundStatus, currentRound, battleData.packs.length]);

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
