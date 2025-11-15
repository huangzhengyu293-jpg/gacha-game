"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import PackDetailModal from "./components/PackDetailModal";
import { useBattleData } from "./hooks/useBattleData";
import type { PackItem, Participant } from "./types";
import BattleInfoCard from "./components/BattleInfoCard";
import LuckySlotMachine, { type SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";

// 🎰 大奖模式内联进度条组件（避免重复挂载问题）
function JackpotProgressBarInline({ 
  players, 
  winnerId, 
  onComplete 
}: { 
  players: Array<{id: string; name: string; percentage: number; color: string}>; 
  winnerId: string; 
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const executed = useRef(false);
  const loggedOnce = useRef(false);
  
  // 只在组件首次渲染时打印一次
  if (!loggedOnce.current) {
    loggedOnce.current = true;
    console.log('🎰 [Jackpot进度条] 组件渲染 - 玩家数:', players.length, '获胜者ID:', winnerId || '(空)');
  }
  
  useEffect(() => {
    if (executed.current || !containerRef.current || !segmentsRef.current || players.length === 0 || !winnerId) {
      return;
    }
    
    executed.current = true;
    
    const containerWidth = containerRef.current.offsetWidth;
    const screenCenter = containerWidth / 2;
    
    // 🎯 找到获胜者色块的位置区间
    let cumulativePercent = 0;
    let winnerStartPercent = 0;
    let winnerEndPercent = 0;
    let winnerFound = false;
    
    for (const p of players) {
      if (p.id === winnerId) {
        winnerStartPercent = cumulativePercent;
        winnerEndPercent = cumulativePercent + p.percentage;
        winnerFound = true;
        break;
      }
      cumulativePercent += p.percentage;
    }
    
    if (!winnerFound) return;
    
    // 🎲 在获胜者色块区间内随机选择一个停止位置
    const randomPercent = winnerStartPercent + (Math.random() * (winnerEndPercent - winnerStartPercent));
    
    // 计算这个随机位置在第6份色条中的绝对像素位置
    const randomPixels = (randomPercent / 100) * containerWidth;
    const randomAbsolutePos = (6 * containerWidth) + randomPixels;
    
    // 需要移动的距离 = 随机位置 - 屏幕中心
    const moveDistance = randomAbsolutePos - screenCenter;
    
    gsap.set(segmentsRef.current, { x: 0 });
    setTimeout(() => {
      if (segmentsRef.current) {
        gsap.to(segmentsRef.current, {
          x: -moveDistance,
          duration: 4,
          ease: "power2.inOut",
          onComplete: () => {
            onComplete();
          }
        });
      }
    }, 500);
  }, []);
  
  // 渲染色块（使用 flex 布局形成连续的色条）
  const renderSegments = () => {
    const containerWidth = containerRef.current?.offsetWidth || 1248;
    const segments = [];
    
    for (let copy = 0; copy < 10; copy++) {
      for (const player of players) {
        const widthPx = (player.percentage / 100) * containerWidth;
        const lighter = adjustColor(player.color, 20);
        
        segments.push(
          <div
            key={`${copy}-${player.id}`}
            className="h-full flex-shrink-0"
            style={{
              width: `${widthPx}px`,
              border: `1px solid ${player.color}`,
              background: `repeating-linear-gradient(115deg, ${player.color}, ${lighter} 1px, ${lighter} 5px, ${player.color} 6px, ${player.color} 17px)`,
            }}
          />
        );
      }
    }
    return segments;
  };
  
  function adjustColor(color: string, amount: number): string {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return color;
    const r = Math.min(255, Math.max(0, parseInt(match[1]) + amount));
    const g = Math.min(255, Math.max(0, parseInt(match[2]) + amount));
    const b = Math.min(255, Math.max(0, parseInt(match[3]) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  return (
    <div className="flex flex-col items-center justify-center w-full px-4 overflow-hidden" style={{ height: '450px' }}>
      <div className="flex flex-col items-center relative w-full max-w-[1248px]">
        <div ref={containerRef} className="relative w-full max-w-[1248px] overflow-hidden h-28 min-h-28 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
          <div ref={segmentsRef} className="flex h-full" style={{ width: 'max-content' }}>
            {renderSegments()}
          </div>
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 size-5 min-w-5 min-h-5 text-white z-10">
          <svg viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.739429 3.00255L6.01823 12.1147C6.77519 13.4213 8.65172 13.4499 9.44808 12.1668L15.1039 3.05473C15.9309 1.72243 14.9727 0 13.4047 0H2.47C0.929093 0 -0.0329925 1.66922 0.739429 3.00255Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 size-5 min-w-5 min-h-5 text-white z-10">
          <svg viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.739429 10.9974L6.01823 1.88534C6.77519 0.578686 8.65172 0.550138 9.44808 1.83316L15.1039 10.9453C15.9309 12.2776 14.9727 14 13.4047 14H2.47C0.929093 14 -0.0329925 12.3308 0.739429 10.9974Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

// 🎯 主状态机类型
type MainState = 'IDLE' | 'LOADING' | 'COUNTDOWN' | 'ROUND_LOOP' | 'COMPLETED';

// 🎯 轮次子状态机类型
type RoundState = 
  | 'ROUND_RENDER' 
  | 'ROUND_SPIN_FIRST'           // 第一段转动（使用普通池）
  | 'ROUND_CHECK_LEGENDARY'      // 检查是否有人中legendary
  | 'ROUND_PREPARE_SECOND'       // 准备第二段（替换数据源）
  | 'ROUND_SPIN_SECOND'          // 第二段转动（使用legendary池）
  | 'ROUND_SETTLE' 
  | 'ROUND_NEXT' 
  | null;

// 🎯 状态数据结构
interface BattleStateData {
  mainState: MainState;
  roundState: RoundState;
  game: {
    currentRound: number;
    totalRounds: number;
    rounds: Array<{
      pools: {
        normal: SlotSymbol[];        // 普通池（legendary被占位符替换）
        legendary: SlotSymbol[];     // 传奇池（仅legendary道具）
        placeholder: SlotSymbol;     // 占位符对象
      };
      results: Record<string, {      // 原始中奖结果
        itemId: string;
        qualityId: string | null;
        poolType: 'normal' | 'legendary';
        needsSecondSpin: boolean;
      }>;
      spinStatus: {
        firstStage: {
          completed: Set<string>;
          gotLegendary: Set<string>;  // 第一段抽中占位符的玩家
        };
        secondStage: {
          active: Set<string>;
          completed: Set<string>;
        };
      };
    }>;
  };
  spinning: {
    activeCount: number;
    completed: Set<string>; // participant IDs
  };
}

// 🎵 全局Web Audio API上下文
let audioContext: AudioContext | null = null;
let tickAudioBuffer: AudioBuffer | null = null;
let basicWinAudioBuffer: AudioBuffer | null = null;

export default function BattleDetailPage() {
  const router = useRouter();
  const battleData = useBattleData();
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);
  const [allSlotsFilled, setAllSlotsFilled] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  
  // 💰 玩家累计金额映射 (participantId -> totalValue)
  const [participantValues, setParticipantValues] = useState<Record<string, number>>({});
  
  // 🚀 快速对战模式（从battleData读取）
  const isFastMode = battleData.isFastMode || false;
  const spinDuration = isFastMode ? 1000 : 4500;
  
  // 🎯 最后的机会模式（从battleData读取）
  const isLastChance = battleData.isLastChance || false;
  
  // 🔄 倒置模式（从battleData读取）
  const isInverted = battleData.isInverted || false;
  

  
  // 🎯 团队模式相关
  const isTeamMode = battleData.battleType === 'team';
  const teamStructure = battleData.teamStructure;
  
  // 🎮 游戏模式
  const gameMode = battleData.mode;
  
  // 🎨 大奖模式：玩家颜色分配（在所有插槽填满后分配）
  const [playerColors, setPlayerColors] = useState<Record<string, string>>({});
  
  // 🏆 大奖模式：控制显示阶段（'rolling' | 'winner'）
  const [jackpotPhase, setJackpotPhase] = useState<'rolling' | 'winner'>('rolling');
  
  // 🔄 大奖模式：动画重置计数器（用于强制重新挂载组件）
  const [jackpotAnimationKey, setJackpotAnimationKey] = useState(0);
  
  // 🎰 大奖模式：固定的玩家色块数据（进入COMPLETED时计算一次，之后不变）
  const [jackpotPlayerSegments, setJackpotPlayerSegments] = useState<Array<{
    id: string;
    name: string;
    percentage: number;
    color: string;
  }>>([]);
  
  // 🏆 大奖模式：固定的获胜者ID
  const [jackpotWinnerId, setJackpotWinnerId] = useState<string>('');
  
  // 🔒 大奖模式：防止重复初始化
  const jackpotInitialized = useRef(false);
  const jackpotWinnerSet = useRef(false); // 防止重复设置获胜者
  
  // 🎉 大奖模式：动画完成回调（稳定引用）
  const handleJackpotAnimationComplete = useCallback(() => {
    setTimeout(() => {
      setJackpotPhase('winner');
    }, 1000);
  }, []);
  
  // 按teamId分组玩家（用于老虎机布局）
  const teamGroups = useMemo(() => {
    if (!isTeamMode) return [];
    
    const teamMap = new Map<string, any[]>();
    allParticipants.forEach(p => {
      const teamId = p.teamId || 'team-unknown';
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, []);
      }
      teamMap.get(teamId)!.push(p);
    });
    
    return Array.from(teamMap.values());
  }, [isTeamMode, allParticipants]);
  
  // 🎵 使用Web Audio API加载音频（零延迟播放）
  useEffect(() => {
    const initAudio = async () => {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        (window as any).__audioContext = audioContext;
      }
      
      // 加载tick.mp3
      if (!tickAudioBuffer) {
        try {
          const response = await fetch('/tick.mp3');
          const arrayBuffer = await response.arrayBuffer();
          tickAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          (window as any).__tickAudioBuffer = tickAudioBuffer;
        } catch (err) {
        }
      }
      
      // 加载basic_win.mp3
      if (!basicWinAudioBuffer) {
        try {
          const response = await fetch('/basic_win.mp3');
          const arrayBuffer = await response.arrayBuffer();
          basicWinAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          (window as any).__basicWinAudioBuffer = basicWinAudioBuffer;
        } catch (err) {
        }
      }
    };
    
    initAudio();
  }, []);
  
  // 🎯 状态机核心状态
  const [mainState, setMainState] = useState<MainState>('IDLE');
  const [roundState, setRoundState] = useState<RoundState>(null);
  const roundStateRef = useRef<RoundState>(null); // 实时状态ref
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
  
  // 🎯 每个玩家的专属数据源（第二段时切换）
  const [playerSymbols, setPlayerSymbols] = useState<Record<string, SlotSymbol[]>>({});
  
  // 🎯 老虎机key后缀（第二段时改变以触发重新挂载）
  const [slotMachineKeySuffix, setSlotMachineKeySuffix] = useState<Record<string, string>>({});
  
  // 🎯 防止重复执行的ref
  const firstSpinStartedRef = useRef<Record<number, boolean>>({});
  const secondSpinStartedRef = useRef<Record<number, boolean>>({});
  const settleExecutedRef = useRef<Record<number, boolean>>({});
  
  // 结果存储
  const [roundResults, setRoundResults] = useState<Record<number, Record<string, SlotSymbol>>>({});
  
  // UI状态
  const [galleryAlert, setGalleryAlert] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const slotMachineRefs = useRef<Record<string, any>>({});
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [activeTeam, setActiveTeam] = useState(0); // 团队模式小屏幕tabs切换
  
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
        symbolsByRound[index] = pack.items.map((item) => {
          const itemAny = item as any;
          
          return {
            id: item.id || `${pack.id}-item-${item.name}`,
            name: item.name || pack.name,
            description: item.description || '',
            image: item.image,
            price: itemAny.price || 0,
            dropProbability: itemAny.dropProbability || 0.1,
            qualityId: itemAny.qualityId || null
          };
        });
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

  // 🎯 创建金色占位符
  const createGoldenPlaceholder = (): SlotSymbol => ({
    id: 'golden_placeholder',
    name: '金色神秘',
    image: '/theme/default/hidden-gold.webp',
    price: 0,
    qualityId: 'placeholder',
    description: '',
    dropProbability: 0
  });

  // 🎯 处理道具池（分离legendary，替换为占位符）
  const processSymbolPools = useCallback((roundIndex: number) => {
    const allSymbols = allRoundSymbols[roundIndex] || [];
    
    
    // 提取legendary道具
    const legendaryPool = allSymbols.filter(s => s.qualityId === 'legendary');
    const normalSymbols = allSymbols.filter(s => s.qualityId !== 'legendary');
    
    
    // 创建普通池：普通道具 + 占位符（如果有legendary）
    const placeholder = createGoldenPlaceholder();
    const normalPool = legendaryPool.length > 0 
      ? [...normalSymbols, placeholder]
      : normalSymbols;
    
 

    return { 
      normal: normalPool, 
      legendary: legendaryPool, 
      placeholder 
    };
  }, [allRoundSymbols]);

  // Pre-generate all results when countdown starts
  const hasGeneratedResultsRef = useRef(false); // Track if results have been generated
  
  const generateAllResults = useCallback((allParticipants: any[]): BattleStateData['game']['rounds'] => {
   
    
    const rounds: BattleStateData['game']['rounds'] = [];
    const detailedResults: Record<number, Record<string, any>> = {};
    
    battleData.packs.forEach((pack, packIndex) => {
      const pools = processSymbolPools(packIndex);
      if (pools.normal.length === 0) return;
      
      const results: Record<string, any> = {};
      detailedResults[packIndex] = {};
      
      allParticipants.forEach(participant => {
        if (participant && participant.id) {
          // 从原始完整列表随机抽取
          const allSymbols = [...pools.normal.filter(s => s.id !== 'golden_placeholder'), ...pools.legendary];
          const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
          
          // 判断是否抽中legendary
          const isLegendary = randomSymbol.qualityId === 'legendary';
          
          results[participant.id] = {
            itemId: randomSymbol.id,
            qualityId: randomSymbol.qualityId,
            poolType: isLegendary ? 'legendary' : 'normal',
            needsSecondSpin: isLegendary
          };
          
          detailedResults[packIndex][participant.id] = {
            道具: randomSymbol.name,
            品质: randomSymbol.qualityId,
            价格: `¥${randomSymbol.price}`,
            需要二段: isLegendary ? '是 💛' : '否'
          };
          
        }
      });
      
      
      rounds.push({
        pools,
        results,
        spinStatus: {
          firstStage: {
            completed: new Set(),
            gotLegendary: new Set()
          },
          secondStage: {
            active: new Set(),
            completed: new Set()
          }
        }
      });
    });
    
    // Store detailed results globally for comparison
    (window as any).__preGeneratedDetailedResults = detailedResults;
    
    console.log('📋 ========== 所有轮次预生成结果汇总 ==========');
    console.table(detailedResults);
    console.log('==============================================');
    
    // 🏆 大奖模式：计算每个玩家的总价值和获胜者
    if (gameMode === 'jackpot') {
      console.log('\n🎯🎯🎯 [大奖模式] 计算每个玩家的总价值和获胜者 🎯🎯🎯');
      
      const playerTotals: Record<string, { name: string; totalValue: number; items: any[] }> = {};
      
      // 遍历所有轮次，累计每个玩家的总价值
      allParticipants.forEach(p => {
        if (p && p.id) {
          playerTotals[p.id] = { name: p.name, totalValue: 0, items: [] };
          
          // 累计所有轮次的物品价值
          Object.entries(detailedResults).forEach(([roundIdx, roundRes]) => {
            const item = roundRes[p.id];
            if (item && item.价格) {
              const price = parseFloat(item.价格.replace('¥', ''));
              playerTotals[p.id].totalValue += price;
              playerTotals[p.id].items.push({
                round: parseInt(roundIdx) + 1,
                name: item.道具,
                price: price
              });
            }
          });
        }
      });
      
      // 找出总价值最高的玩家
      let maxValue = -1;
      let topPlayerId = '';
      
      Object.entries(playerTotals).forEach(([id, data]) => {
        console.log(`\n👤 ${data.name}: 总价值 $${data.totalValue.toFixed(2)}`);
        data.items.forEach(item => {
          console.log(`   轮次${item.round}: ${item.name} - $${item.price.toFixed(2)}`);
        });
        
        if (data.totalValue > maxValue) {
          maxValue = data.totalValue;
          topPlayerId = id;
        }
      });
      
      // 判断是否团队模式
      const topPlayer = allParticipants.find(p => p.id === topPlayerId);
      let winnerIds: string[] = [topPlayerId];
      
      if (topPlayer && topPlayer.teamId) {
        // 团队模式：整个队伍获胜
        const winningTeam = allParticipants.filter(p => p && p.teamId === topPlayer.teamId);
        winnerIds = winningTeam.map(p => p.id);
        console.log(`\n🏆🏆🏆 [预定获胜队伍]: 队伍 ${topPlayer.teamId}`);
        console.log(`👥 [队伍成员]: ${winningTeam.map(p => p.name).join(', ')}`);
      } else {
        // 单人模式：只有一个获胜者
        console.log(`\n🏆🏆🏆 [预定获胜者]: ${playerTotals[topPlayerId]?.name}`);
      }
      
      console.log(`💰 [获胜金额]: $${maxValue.toFixed(2)}`);
      console.log(`🆔 [获胜者ID]: ${topPlayerId}`);
      console.log('🎯🎯🎯 [大奖模式答案计算完成] 🎯🎯🎯\n');
      
      // 保存到全局变量供后续使用
      (window as any).__jackpotWinner = { 
        id: topPlayerId, 
        name: playerTotals[topPlayerId]?.name, 
        totalValue: maxValue,
        teamIds: winnerIds
      };
    }
    
    return rounds;
  }, [battleData, processSymbolPools, gameMode]);

  // 🎨 大奖模式：在所有插槽填满后分配颜色
  useEffect(() => {
    if (allSlotsFilled && allParticipants.length > 0 && gameMode === 'jackpot') {
      console.log('\n🎨 [人员满了] 分配玩家颜色');
      
      // 分配颜色
      const colors = [
        'rgb(255, 75, 79)',    // 红色
        'rgb(93, 123, 139)',   // 蓝灰
        'rgb(78, 78, 237)',    // 蓝色
        'rgb(162, 89, 255)',   // 紫色
        'rgb(255, 117, 181)',  // 粉色
        'rgb(253, 121, 59)',   // 橙色
        'rgb(0, 200, 150)',    // 青色
        'rgb(255, 200, 0)',    // 黄色
      ];
      
      const colorMap: Record<string, string> = {};
      allParticipants.forEach((p, idx) => {
        colorMap[p.id] = colors[idx % colors.length];
        console.log(`🎨 ${p.name} -> ${colors[idx % colors.length]}`);
      });
      
      setPlayerColors(colorMap);
      console.log('✅ [颜色分配完成]\n');
    }
  }, [allSlotsFilled, allParticipants, gameMode]);

  // 🎯 STATE TRANSITION: IDLE → LOADING
  useEffect(() => {
    if (mainState === 'IDLE' && allSlotsFilled && allParticipants.length > 0) {
      setMainState('LOADING');
    } else if (mainState !== 'IDLE' && mainState !== 'COMPLETED' && !allSlotsFilled) {
      // 状态守卫：玩家离开，重置到IDLE（但COMPLETED状态不重置）
      setMainState('IDLE');
      setRoundState(null);
      setGameData({ currentRound: 0, totalRounds: 0, rounds: [] });
      setSpinningState({ activeCount: 0, completed: new Set() });
      setRoundResults({});
      setCountdownValue(null);
      setGalleryAlert(false);
      hasGeneratedResultsRef.current = false;
      // 重置防重复标记
      firstSpinStartedRef.current = {};
      secondSpinStartedRef.current = {};
      settleExecutedRef.current = {};
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
  }, [mainState, allParticipants, generateAllResults, battleData.packs.length]);

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
      // 🎵 使用Web Audio API播放tick音效（零延迟）
      const ctx = (window as any).__audioContext;
      const buffer = (window as any).__tickAudioBuffer;
      if (ctx && buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
      
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
      
      const currentRoundData = gameData.rounds[currentRound];
      if (!currentRoundData || currentRoundData.pools.normal.length === 0) {
        return;
      }
      
      
      // 🎯 重置这一轮的spinStatus（清除上一轮残留）
      currentRoundData.spinStatus.firstStage.completed.clear();
      currentRoundData.spinStatus.firstStage.gotLegendary.clear();
      currentRoundData.spinStatus.secondStage.active.clear();
      currentRoundData.spinStatus.secondStage.completed.clear();
      
      // 🎯 重置spinningState（关键！防止跨轮误触发）
      setSpinningState({
        activeCount: 0,
        completed: new Set()
      });
      
      
      // 等待DOM渲染完成
      setTimeout(() => {
        setRoundState('ROUND_SPIN_FIRST');
      }, 100);
    }
  }, [mainState, roundState, gameData]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_FIRST（第一段转动）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_FIRST') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameData.rounds[currentRound];
      
      if (!currentRoundData) return;
      
      // 防止重复执行
      if (firstSpinStartedRef.current[currentRound]) {
        return;
      }
      
      firstSpinStartedRef.current[currentRound] = true;
      
      
      // 重置转动状态
      setSpinningState({
        activeCount: allParticipants.length,
        completed: new Set()
      });
      
      // 触发所有老虎机转动（使用普通池）
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
      }, 600);
    }
  }, [mainState, roundState, gameData, allParticipants]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_FIRST → ROUND_CHECK_LEGENDARY
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_FIRST') {
      const currentRoundData = gameData.rounds[gameData.currentRound];
      if (!currentRoundData) return;
      
      // 使用spinningState来监听（这个会正确触发）
      if (spinningState.completed.size === allParticipants.length && allParticipants.length > 0) {
        setRoundState('ROUND_CHECK_LEGENDARY');
      }
    }
  }, [mainState, roundState, gameData, allParticipants.length, spinningState.completed.size]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_CHECK_LEGENDARY（检查legendary）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_CHECK_LEGENDARY') {
      const currentRoundData = gameData.rounds[gameData.currentRound];
      if (!currentRoundData) {
        return;
      }
      
      const gotLegendary = currentRoundData.spinStatus.firstStage.gotLegendary;
      
      
      if (gotLegendary.size > 0) {
        // 有人中legendary，等待0.5秒让玩家看清金色占位符
        setTimeout(() => {
          setRoundState('ROUND_PREPARE_SECOND');
        }, 500); // 0.5秒延迟
      } else {
        // 无人中legendary，等待动画完成再结算
        setTimeout(() => {
          setRoundState('ROUND_SETTLE');
        }, 1000); // 1秒等待回正动画完成
      }
    }
  }, [mainState, roundState, gameData]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_PREPARE_SECOND（准备第二段）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_PREPARE_SECOND') {
      const currentRoundData = gameData.rounds[gameData.currentRound];
      if (!currentRoundData) return;
      
      
      const goldenPlayers = Array.from(currentRoundData.spinStatus.firstStage.gotLegendary);
      
      // 🎯 为金色玩家切换数据源到legendary池
      const newPlayerSymbols: Record<string, SlotSymbol[]> = {};
      
      allParticipants.forEach(participant => {
        if (!participant || !participant.id) return;
        
        if (goldenPlayers.includes(participant.id)) {
          // 金色玩家：切换到legendary池
          newPlayerSymbols[participant.id] = currentRoundData.pools.legendary;
        } else {
          // 非金色玩家：保持普通池（但他们不会再转动）
          newPlayerSymbols[participant.id] = currentRoundData.pools.normal;
        }
      });
      
      setPlayerSymbols(newPlayerSymbols);
      
      // 🎯 为金色玩家改变key，触发老虎机重新挂载
      const newKeySuffix: Record<string, string> = {};
      goldenPlayers.forEach(participantId => {
        newKeySuffix[participantId] = '-second'; // 添加后缀
      });
      setSlotMachineKeySuffix(newKeySuffix);
      
      
      // 等待老虎机重新挂载完成
      setTimeout(() => {
        setRoundState('ROUND_SPIN_SECOND');
      }, 800); // 更长延迟等待重新挂载
    
    }
  }, [mainState, roundState, gameData, allParticipants, currentRoundPrizes]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_SECOND（第二段转动）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_SECOND') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameData.rounds[currentRound];
      if (!currentRoundData) return;
      
      // 防止重复执行
      if (secondSpinStartedRef.current[currentRound]) {
        return;
      }
      
      secondSpinStartedRef.current[currentRound] = true;
      
      const goldenPlayers = Array.from(currentRoundData.spinStatus.firstStage.gotLegendary);
      
      
      // 🎯 现在更新奖品为真实legendary道具ID
      const newPrizes: Record<string, string> = { ...currentRoundPrizes };
      goldenPlayers.forEach(participantId => {
        const result = currentRoundData.results[participantId];
        if (result) {
          newPrizes[participantId] = result.itemId;
        }
      });
      setCurrentRoundPrizes(newPrizes);
      
      // 重置第二段状态
      currentRoundData.spinStatus.secondStage.active = new Set(goldenPlayers);
      currentRoundData.spinStatus.secondStage.completed.clear();
      
      // 重置spinning状态（只追踪金色玩家）
      setSpinningState({
        activeCount: goldenPlayers.length,
        completed: new Set()
      });
      
      // 等待selectedPrizeId更新完成，然后手动启动老虎机
      setTimeout(() => {
        goldenPlayers.forEach(participantId => {
          const slotRef = slotMachineRefs.current[participantId];
          if (slotRef && slotRef.startSpin) {
            slotRef.startSpin();
          } else {
          }
        });
      }, 100); // 短暂延迟等待selectedPrizeId更新
    }
  }, [mainState, roundState, gameData, currentRoundPrizes]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_SECOND → ROUND_SETTLE
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_SECOND') {
      const currentRoundData = gameData.rounds[gameData.currentRound];
      if (!currentRoundData) return;
      
      const activeCount = currentRoundData.spinStatus.secondStage.active.size;
      
      // 使用spinningState来监听
      if (spinningState.completed.size === activeCount && activeCount > 0) {
        
        setRoundState('ROUND_SETTLE');
        setPlayerSymbols({}); // 清空玩家数据源
      }
    }
  }, [mainState, roundState, gameData, spinningState.completed.size]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SETTLE（统一记录所有道具）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SETTLE') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameData.rounds[currentRound];
      
      if (!currentRoundData) return;
      
      // 防止重复执行
      if (settleExecutedRef.current[currentRound]) {
        return;
      }
      
      settleExecutedRef.current[currentRound] = true;
      
      
      // 🎯 记录所有玩家的最终道具
      const finalResults: Record<string, SlotSymbol> = {};
      
      allParticipants.forEach(participant => {
        if (!participant || !participant.id) return;
        
        const result = currentRoundData.results[participant.id];
        const itemId = result.itemId;
        
        // 从对应的池中找到道具
        let item: SlotSymbol | undefined;
        if (result.needsSecondSpin) {
          // legendary道具：从legendary池查找
          item = currentRoundData.pools.legendary.find(s => s.id === itemId);
        } else {
          // 普通道具：从普通池查找（排除占位符）
          item = currentRoundData.pools.normal.find(s => s.id === itemId && s.id !== 'golden_placeholder');
        }
        
        if (item) {
          finalResults[participant.id] = item;
        }
      });
      
      // 保存结果
      setRoundResults(prev => ({
        ...prev,
        [currentRound]: finalResults
      }));
      
      // 💰 累加玩家金额
      setParticipantValues(prevValues => {
        const newValues = { ...prevValues };
        
        allParticipants.forEach(participant => {
          if (!participant || !participant.id) return;
          
          const prizeItem = finalResults[participant.id];
          if (!prizeItem) return;
          
          // 解析本轮奖品价格
          const prizeValue = parseFloat(String(prizeItem.price || '0')) || 0;
          // 累加
          const currentValue = newValues[participant.id] || 0;
          const newValue = currentValue + prizeValue;
          newValues[participant.id] = newValue;
          
        });
        
        return newValues;
      });
      
      // 清空玩家数据源（准备下一轮）
      setPlayerSymbols({});
      
      // 等待记录完成
      setTimeout(() => {
        setRoundState('ROUND_NEXT');
      }, 500); // 0.5秒显示结果
    }
  }, [mainState, roundState, gameData, allParticipants]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_NEXT
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_NEXT') {
      const currentRound = gameData.currentRound;
      const nextRound = currentRound + 1;
      
      if (nextRound < gameData.totalRounds) {
        // 重置玩家数据源和key后缀
        setPlayerSymbols({});
        setSlotMachineKeySuffix({});
        
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
    roundStateRef.current = roundState; // 同步roundState到ref
    
    const currentRoundData = gameData.rounds[gameData.currentRound];
    if (currentRoundData) {
      // 设置全局显示列表（第一段用普通池）
      setCurrentSlotSymbols(currentRoundData.pools.normal);
      
      // 🎯 构建奖品映射（关键：第一段期间必须显示占位符）
      const prizes: Record<string, string> = {};
      Object.keys(currentRoundData.results).forEach(participantId => {
        const result = currentRoundData.results[participantId];
        
        // 判断当前阶段
        const isFirstStage = roundState === 'ROUND_RENDER' 
                          || roundState === 'ROUND_SPIN_FIRST' 
                          || roundState === 'ROUND_CHECK_LEGENDARY';
        
        if (result.needsSecondSpin && isFirstStage) {
          // 第一段 + legendary道具 → 显示占位符
          prizes[participantId] = 'golden_placeholder';
        } else {
          // 第二段 或 普通道具 → 显示真实ID
          prizes[participantId] = result.itemId;
        }
      });
      setCurrentRoundPrizes(prizes);
      
    }
    
    setHidePacks(mainState !== 'IDLE');
    setShowSlotMachines(mainState === 'ROUND_LOOP');
    setAllRoundsCompleted(mainState === 'COMPLETED');
    setCompletedSpins(spinningState.completed);
  }, [gameData, mainState, spinningState.completed, roundState]);

  // 旧的自动启动逻辑已被状态机接管，删除

  // Handle when a slot machine completes
  const handleSlotComplete = useCallback((participantId: string, result: SlotSymbol) => {
    const round = gameData.currentRound;
    const currentRoundData = gameData.rounds[round];
    
    if (!currentRoundData) return;
    
    
    // 🎯 使用ref获取实时状态（避免闭包问题）
    const currentRoundState = roundStateRef.current;
    
    // 判断当前是第一段还是第二段（使用ref）
    if (currentRoundState === 'ROUND_SPIN_FIRST') {
      // 🎯 第一段完成处理
      
      // 记录到第一段完成
      currentRoundData.spinStatus.firstStage.completed.add(participantId);
      
      // 检查是否抽中占位符
      if (result.id === 'golden_placeholder') {
        currentRoundData.spinStatus.firstStage.gotLegendary.add(participantId);
      } else {
      }
      
      // 更新spinning状态
      setSpinningState(prev => {
        const newCompleted = new Set(prev.completed);
        newCompleted.add(participantId);
        return { ...prev, completed: newCompleted };
      });
      
    } else if (currentRoundState === 'ROUND_SPIN_SECOND') {
      // 🎯 第二段完成处理
      
      // 记录到第二段完成
      currentRoundData.spinStatus.secondStage.completed.add(participantId);
      
      // 更新spinning状态
      setSpinningState(prev => {
        const newCompleted = new Set(prev.completed);
        newCompleted.add(participantId);
        return { ...prev, completed: newCompleted };
      });
    }
  }, [gameData, roundState]);

  // 旧的完成检查和轮次切换逻辑已被状态机接管
  
  // 🎯 COMPLETED状态：显示最终统计和判定获胜者
  useEffect(() => {
    if (mainState === 'COMPLETED') {
      console.log('🏁 [COMPLETED] 所有轮次完成！');
      console.log('🏁 [COMPLETED] 状态已锁定，不会再改变');
      console.log(`🎮 [游戏模式] ${gameMode}`);
      
      // 🎰 大奖模式：计算并固定玩家色块数据
      if (gameMode === 'jackpot') {
        // 只在第一次或数据为空时计算
        if (!jackpotInitialized.current || jackpotPlayerSegments.length === 0) {
          jackpotInitialized.current = true;
          
          let totalPrize = 0;
          allParticipants.forEach(p => {
            if (p && p.id) {
              totalPrize += (participantValues[p.id] || 0);
            }
          });
          
          const segments = allParticipants.map(p => ({
            id: p.id,
            name: p.name,
            percentage: totalPrize > 0 ? ((participantValues[p.id] || 0) / totalPrize) * 100 : 0,
            color: playerColors[p.id] || 'rgb(128, 128, 128)',
          }));
          
          // 从预先计算的结果中获取获胜者ID
          const preCalculatedWinner = (window as any).__jackpotWinner;
          const winnerId = preCalculatedWinner?.id || '';
          
          setJackpotPlayerSegments(segments);
          setJackpotWinnerId(winnerId);
          setJackpotPhase('rolling');
        } else {
          // 回放：只重置阶段到 rolling
          setJackpotPhase('rolling');
        }
      }
      
      // 🏆 根据游戏模式判定获胜者
      setTimeout(() => {
        // 计算总奖池（使用 participantValues）
        let totalPrize = 0;
        allParticipants.forEach(p => {
          if (p && p.id) {
            const value = participantValues[p.id] || 0;
            totalPrize += value;
          }
        });
        
        console.log(`💰 [总奖池] $${totalPrize.toFixed(2)}`);
        
        // 🎁 分享模式：所有人都是获胜者，平分奖金
        if (gameMode === 'share') {
          console.log('🎁 [分享模式] 所有玩家都是获胜者，平分奖金');
          
          // 标记所有玩家为获胜者
          setAllParticipants(prev => prev.map(p => ({
            ...p,
            isWinner: true
          })));
          
            const prizePerPerson = totalPrize / allParticipants.length;
          console.log(`💰 [分享模式] 每人获得: $${prizePerPerson.toFixed(2)}`);
        }
        // 🏆 大奖模式：标记获胜者
        else if (gameMode === 'jackpot') {
          // 检查是否已经标记过获胜者
          const hasWinner = allParticipants.some(p => p && p.isWinner);
          
          if (!hasWinner && !jackpotWinnerSet.current) {
            jackpotWinnerSet.current = true;
            
            const preCalculatedWinner = (window as any).__jackpotWinner;
            
            if (preCalculatedWinner && preCalculatedWinner.teamIds) {
              // 标记获胜者（可能是多个，如果是团队模式）
              const winnerIds = preCalculatedWinner.teamIds;
              setAllParticipants(prev => prev.map(p => ({
                ...p,
                isWinner: p && winnerIds.includes(p.id)
              })));
            }
          }
        }
        // 只有经典模式需要判定获胜者
        else if (gameMode === 'classic') {
          console.log('🏆 [经典模式] 开始判定获胜者...');
          console.log(`🎯 [模式] 最后的机会: ${isLastChance ? '是' : '否'}`);
          console.log(`🔄 [模式] 倒置模式: ${isInverted ? '是（最低获胜）' : '否（最高获胜）'}`);
          
          // 🎯 计算每个玩家的比较值
          const playerCompareValues: Record<string, number> = {};
          
          if (isLastChance) {
            // 最后的机会模式：只看最后一轮的奖品价值
            const lastRoundIndex = gameData.totalRounds - 1;
            const lastRoundResult = roundResults[lastRoundIndex] || {};
            
            console.log('🎯 [最后的机会] 只计算最后一轮奖品价值');
            
            allParticipants.forEach(p => {
              if (p && p.id) {
                const lastPrize = lastRoundResult[p.id];
                const lastValue = lastPrize ? parseFloat(String(lastPrize.price || '0')) : 0;
                playerCompareValues[p.id] = lastValue;
                console.log(`  ${p.name}: 最后一轮 $${lastValue.toFixed(2)}`);
              }
            });
          } else {
            // 普通模式：看累计总金额
            console.log('💰 [普通模式] 计算累计总金额');
            
            allParticipants.forEach(p => {
              if (p && p.id) {
                const totalValue = participantValues[p.id] || 0;
                playerCompareValues[p.id] = totalValue;
                console.log(`  ${p.name}: 累计 $${totalValue.toFixed(2)}`);
              }
            });
          }
          
          if (isTeamMode) {
            // 团队模式：根据倒置模式找出比较值最高/最低的玩家，该玩家所在队伍获胜
            let targetValue = isInverted ? Infinity : -1;
            let topPlayer: any = null;
            
            allParticipants.forEach(p => {
              if (p && p.id) {
                const value = playerCompareValues[p.id] || 0;
                const shouldUpdate = isInverted ? (value < targetValue) : (value > targetValue);
                if (shouldUpdate) {
                  targetValue = value;
                  topPlayer = p;
                }
              }
            });
            
            if (topPlayer && topPlayer.teamId) {
              // 找出该队伍的所有成员
              const winningTeam = allParticipants.filter(p => p && p.teamId === topPlayer.teamId);
              const prizePerPerson = totalPrize / winningTeam.length;
              
              console.log(`🎉 [团队获胜] 队伍 ${topPlayer.teamId} 获胜！`);
              console.log(`👥 [获胜成员] ${winningTeam.map(p => p.name).join(', ')}`);
              console.log(`💰 [每人奖金] $${prizePerPerson.toFixed(2)}`);
              
              // 标记获胜队伍成员
              setAllParticipants(prev => prev.map(p => ({
                ...p,
                isWinner: p && p.teamId === topPlayer.teamId
              })));
            }
          } else {
            // 单人模式：根据倒置模式找出比较值最高/最低的玩家
            let targetValue = isInverted ? Infinity : -1;
            let winner: any = null;
            
            allParticipants.forEach(p => {
              if (p && p.id) {
                const value = playerCompareValues[p.id] || 0;
                const compareText = isInverted ? '当前最低' : '当前最高';
                console.log(`  比较: ${p.name} = $${value.toFixed(2)}, ${compareText} = $${targetValue === Infinity ? '∞' : targetValue.toFixed(2)}`);
                
                const shouldUpdate = isInverted ? (value < targetValue) : (value > targetValue);
                if (shouldUpdate) {
                  targetValue = value;
                  winner = p;
                  const resultText = isInverted ? '最低' : '最高';
                  console.log(`    ✅ 新的${resultText}${isLastChance ? '最后一轮' : '累计'}金额玩家: ${p.name}`);
                }
              }
            });
            
            if (winner) {
              const resultText = isInverted ? '最低' : '最高';
              console.log(`🎉 [单人获胜] ${winner.name} 获胜！${isLastChance ? '最后一轮' : '累计'}金额(${resultText}): $${targetValue.toFixed(2)}`);
              console.log(`💰 [总奖金] $${totalPrize.toFixed(2)}`);
              
              // 标记获胜者
              setAllParticipants(prev => prev.map(p => ({
                ...p,
                isWinner: p && p.id === winner.id
              })));
            }
          }
        }
        
        // 延迟显示最终统计
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
  }, [mainState, roundResults, allParticipants, isTeamMode, gameMode, participantValues, isLastChance, isInverted, gameData.totalRounds, playerColors]);

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
          statusText="等待玩家"
            totalCost={battleData.cost}
          isCountingDown={countdownValue !== null && countdownValue > 0}
          isPlaying={showSlotMachines && !allRoundsCompleted}
          isCompleted={allRoundsCompleted}
          currentRound={currentRound}
          totalRounds={battleData.packs.length}
          currentPackName={battleData.packs[currentRound]?.name || ''}
          currentPackPrice={`$${(battleData.packs[currentRound] as any)?.cost?.toFixed(2) || '0.00'}`}
          gameMode={gameMode}
          isFastMode={isFastMode}
          isLastChance={isLastChance}
          isInverted={isInverted}
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
        {/* 🏆 Jackpot 大奖模式奖池显示 */}
        {gameMode === 'jackpot' && showSlotMachines && !allRoundsCompleted && (
          <div className="flex absolute justify-center top-0 md:top-4 left-0 right-0">
            <div className="flex self-center relative z-[5] bg-gradient-to-b from-[#FFD39F] to-[#3E2D19] rounded-lg p-[1px]">
              <div className="flex bg-gray-650 rounded-lg">
                <div 
                  className="flex py-2 px-3 rounded-lg" 
                  style={{ background: 'radial-gradient(at center top, rgba(255, 176, 84, 0.627), rgba(255, 211, 159, 0.314) 42%, rgba(153, 106, 50, 0.063) 85%, rgba(153, 106, 50, 0)) no-repeat' }}
                >
                  <h3 className="text-sm md:text-lg font-bold text-white">
                    Jackpot: ${Object.values(participantValues).reduce((sum, val) => sum + val, 0).toFixed(2)}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
        {mainState === 'COMPLETED' ? (
          (() => {
            const winners = allParticipants.filter(p => p && p.isWinner);
            
            // 🏆 大奖模式：显示进度条动画或获胜者
            if (gameMode === 'jackpot') {
              let totalPrize = 0;
              allParticipants.forEach(p => {
                if (p && p.id) {
                  totalPrize += (participantValues[p.id] || 0);
                }
              });
              
              // 🎰 阶段1：显示色条滚动动画（内联实现，避免组件重新挂载）
              if (jackpotPhase === 'rolling' && jackpotPlayerSegments.length > 0) {
                return <JackpotProgressBarInline 
                  key={`jackpot-animation-${jackpotAnimationKey}`}
                  players={jackpotPlayerSegments}
                  winnerId={jackpotWinnerId}
                  onComplete={handleJackpotAnimationComplete}
                />;
              }
              
              // 🏆 阶段2：显示获胜者（色条动画完成后）
              console.log('🏆 [大奖模式-获胜者阶段] 显示获胜者信息');
              // 继续执行后面的普通获胜者显示逻辑
            }
            
            let totalPrize = 0;
            allParticipants.forEach(p => {
              if (p && p.id) {
                totalPrize += (participantValues[p.id] || 0);
              }
            });
            
            const renderAvatar = (participant: any) => {
              const isBotParticipant = (p: any) => p && (p.id.startsWith('bot-') || !p.avatar);
              
              if (isBotParticipant(participant)) {
                const maskId = `mask-${participant.id}`;
                return (
                  <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                      <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                    </mask>
                    <g mask={`url(#${maskId})`}>
                      <rect width="36" height="36" fill="#333333"></rect>
                      <rect x="0" y="0" width="36" height="36" transform="translate(-1 5) rotate(305 18 18) scale(1.2)" fill="#0C8F8F" rx="36"></rect>
                      <g transform="translate(-1 1) rotate(5 18 18)">
                        <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
                        <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                        <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                      </g>
                    </g>
                  </svg>
                );
              } else {
                return (
                  <Image
                    alt={participant.name}
                    src={participant.avatar}
                    fill
                    sizes="(min-width: 0px) 100px"
                    className="pointer-events-none object-cover"
                  />
                );
              }
            };
            
            // 计算每人获得的金额
            // - 分享模式：所有玩家平分
            // - 团队模式：获胜队伍成员平分
            // - 普通单人模式：获胜者独得
            let prizePerPerson = totalPrize;
            if (gameMode === 'share') {
              // 分享模式：所有玩家平分
              prizePerPerson = totalPrize / allParticipants.length;
            } else if (isTeamMode) {
              // 团队模式：获胜队伍成员平分
              prizePerPerson = totalPrize / winners.length;
            }
            
            // 辅助函数：调整颜色亮度
            const adjustColorInline = (color: string, amount: number): string => {
              const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              if (!match) return color;
              const r = Math.min(255, Math.max(0, parseInt(match[1]) + amount));
              const g = Math.min(255, Math.max(0, parseInt(match[2]) + amount));
              const b = Math.min(255, Math.max(0, parseInt(match[3]) + amount));
              return `rgb(${r}, ${g}, ${b})`;
            };
            
            return (
              <div className="flex flex-col items-center justify-center gap-6 w-[1280px]" style={{ minHeight: '450px' }}>
                {/* 获胜者展示 */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
                  {winners.map((member, index) => (
                    <div key={member.id} className="flex flex-col items-center justify-center">
                      <div className="relative" style={{ opacity: 1 }}>
                    
                        
                        <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: '1px' }}>
                          <div className="relative rounded-full overflow-hidden w-12 h-12 md:w-24 md:h-24 xl:w-32 xl:h-32">
                            {renderAvatar(member)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center max-w-[100px] md:max-w-[200px]">
                        <span className="font-bold text-sm md:text-lg xl:text-xl text-center w-full truncate">{member.name}</span>
                        <p className="text-sm md:text-base text-white font-bold">${prizePerPerson.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 按钮组 */}
                <div className="flex flex-col gap-3">
                  <button 
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none h-10 px-6"
                    style={{ 
                      backgroundColor: '#10B981',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                  >
                    <p className="text-base font-bold" style={{ color: '#ffffff' }}>
                      用 {battleData.cost} 重新创建此对战
                    </p>
                  </button>
                  <div className="flex gap-3">
                    <button 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
                      style={{ backgroundColor: '#34383C', color: '#ffffff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5E62'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#34383C'}
                      onClick={() => {
                        // 重置到COUNTDOWN状态，使用原有答案重新执行动画
                        if (gameMode === 'jackpot') {
                          setJackpotPhase('rolling');
                          setJackpotAnimationKey(prev => prev + 1);
                          jackpotWinnerSet.current = false;
                        }
                        
                        // 清除获胜者标记
                        setAllParticipants(prev => prev.map(p => ({
                          ...p,
                          isWinner: false
                        })));
                        
                        // 重置 gameData 的当前轮次到第一轮
                        setGameData(prev => ({
                          ...prev,
                          currentRound: 0
                        }));
                        
                        setMainState('COUNTDOWN');
                        setRoundState(null);
                        setCountdownValue(3);
                        setRoundResults({});
                        setPlayerSymbols({});
                        setSlotMachineKeySuffix({});
                        setSpinningState({ activeCount: 0, completed: new Set() });
                        setParticipantValues({}); // 清空金额和百分比
                        firstSpinStartedRef.current = {};
                        secondSpinStartedRef.current = {};
                        settleExecutedRef.current = {};
                        // gameData.rounds 保留，只重置 currentRound
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                      </svg>
                    </button>
                    <button 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none h-10 px-6 flex-1"
                      style={{ backgroundColor: '#34383C', color: '#ffffff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5E62'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#34383C'}
                      onClick={() => {
                        console.log('➕ [创建新对战] 跳转到创建页面');
                        router.push('/create-battle');
                      }}
                    >
                      <p className="text-base font-bold" style={{ color: '#ffffff' }}>创建新对战</p>
                    </button>
                    <button 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
                      style={{ backgroundColor: '#34383C', color: '#ffffff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A5E62'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#34383C'}
                      onClick={() => {
                        const params = new URLSearchParams();
                        
                        // 卡包IDs
                        const packIds = battleData.packs.map(p => p.id).join(',');
                        params.set('packIds', packIds);
                        
                        // 对战类型
                        if (battleData.battleType === 'team') {
                          params.set('type', 'team');
                          if (battleData.teamStructure) {
                            params.set('teamStructure', battleData.teamStructure);
                          }
                        } else {
                          params.set('type', 'solo');
                          params.set('playersInSolo', String(battleData.playersCount));
                        }
                        
                        // 游戏模式
                        params.set('gameMode', gameMode);
                        
                        // 选项
                        if (isFastMode) {
                          params.set('fastBattle', 'true');
                        }
                        if (isLastChance) {
                          params.set('lastChance', 'true');
                        }
                        if (isInverted) {
                          params.set('upsideDown', 'true');
                        }
                        
                        router.push(`/create-battle?${params.toString()}`);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* 大奖模式：显示获胜者颜色条 */}
                {gameMode === 'jackpot' && winners.length > 0 && (
                  <div className="flex flex-col items-center relative w-full max-w-[1280px] p-4">
                    <div className="flex relative justify-center w-full overflow-hidden transition-transform duration-100 ease-in h-6 min-h-6 rounded-md">
                      <div className="flex relative w-full">
                        <div 
                          className="flex absolute top-0 bottom-0 left-0 right-0 justify-center items-center" 
                          style={{
                            border: `1px solid ${playerColors[winners[0].id] || 'rgb(128, 128, 128)'}`,
                            background: `repeating-linear-gradient(115deg, ${playerColors[winners[0].id] || 'rgb(128, 128, 128)'}, ${adjustColorInline(playerColors[winners[0].id] || 'rgb(128, 128, 128)', 20)} 1px, ${adjustColorInline(playerColors[winners[0].id] || 'rgb(128, 128, 128)', 20)} 5px, ${playerColors[winners[0].id] || 'rgb(128, 128, 128)'} 6px, ${playerColors[winners[0].id] || 'rgb(128, 128, 128)'} 17px)`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex absolute -top-4 size-5 min-w-5 min-h-5 opacity-0">
                      <svg viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.739429 3.00255L6.01823 12.1147C6.77519 13.4213 8.65172 13.4499 9.44808 12.1668L15.1039 3.05473C15.9309 1.72243 14.9727 0 13.4047 0H2.47C0.929093 0 -0.0329925 1.66922 0.739429 3.00255Z" fill="currentColor"></path>
                      </svg>
                    </div>
                    <div className="flex absolute -bottom-4 size-5 min-w-5 min-h-5 opacity-0">
                      <svg viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.739429 10.9974L6.01823 1.88534C6.77519 0.578686 8.65172 0.550138 9.44808 1.83316L15.1039 10.9453C15.9309 12.2776 14.9727 14 13.4047 14H2.47C0.929093 14 -0.0329925 12.3308 0.739429 10.9974Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : !showSlotMachines ? (
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
          
            
            
            {/* 🎯 团队模式：按队伍分组显示老虎机 */}
            {isTeamMode && teamGroups.length > 0 ? (
              // 大屏幕 (>= 1024px): 横向排列所有队伍
              !isSmallScreen ? (
                <div className="flex gap-4 px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
                  {teamGroups.map((teamMembers, teamIndex) => (
                    <div
                      key={`team-${teamIndex}`}
                      className="flex gap-0 md:gap-4 justify-around flex-1"
                      style={{ height: '450px' }}
                    >
                      {teamMembers.map((participant) => {
                        if (!participant || !participant.id) return null;
                        
                        const currentRoundData = gameData.rounds[gameData.currentRound];
                        if (!currentRoundData) return null;
                        
                        const selectedPrizeId = currentRoundPrizes[participant.id];
                        const keySuffix = slotMachineKeySuffix[participant.id] || '';
                        const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                        
                        return (
                          <div 
                            key={participant.id} 
                            className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                            style={{ height: '450px' }}
                          >
                            {/* 第一段老虎机 */}
                            <div 
                              className="w-full h-full transition-opacity duration-300 absolute inset-0" 
                              style={{ 
                                opacity: !keySuffix ? 1 : 0,
                                pointerEvents: !keySuffix ? 'auto' : 'none',
                                zIndex: !keySuffix ? 1 : 0
                              }}
                            >
                              <LuckySlotMachine
                                key={`${participant.id}-${gameData.currentRound}-first`}
                                ref={(ref) => {
                                  if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                }}
                                symbols={currentRoundData.pools.normal}
                                selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                                height={450}
                                showPrizeSelector={false}
                                buttonText=""
                                spinDuration={spinDuration}
                                onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                              />
                            </div>
                            
                            {/* 第二段老虎机（预加载） */}
                            {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                              <div 
                                className="w-full h-full transition-opacity duration-300 absolute inset-0" 
                                style={{ 
                                  opacity: keySuffix ? 1 : 0,
                                  pointerEvents: keySuffix ? 'auto' : 'none',
                                  zIndex: keySuffix ? 1 : 0
                                }}
                              >
                                <LuckySlotMachine
                                  key={`${participant.id}-${gameData.currentRound}-second`}
                                  ref={(ref) => {
                                    if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  symbols={currentRoundData.pools.legendary}
                                  selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                  height={450}
                                  showPrizeSelector={false}
                                  buttonText=""
                                  spinDuration={spinDuration}
                                  onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : teamStructure === '3v3' ? (
                // 小屏幕 3v3: 2行3列（和单人6人模式完全一样）
                <div className="flex flex-col justify-between px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
                  {/* First row: 3 slot machines */}
                  <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
                    {allParticipants.slice(0, 3).map((participant) => {
                      if (!participant || !participant.id) return null;
                      
                      const currentRoundData = gameData.rounds[gameData.currentRound];
                      if (!currentRoundData) return null;
                      
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      
                      return (
                        <div 
                          key={participant.id} 
                          className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                          style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
                        >
                          <div 
                            className="w-full h-full transition-opacity duration-300 absolute inset-0" 
                            style={{ 
                              opacity: !keySuffix ? 1 : 0,
                              pointerEvents: !keySuffix ? 'auto' : 'none',
                              zIndex: !keySuffix ? 1 : 0
                            }}
                          >
                            <LuckySlotMachine
                              key={`${participant.id}-${gameData.currentRound}-first`}
                              ref={(ref) => {
                                if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                              }}
                              symbols={currentRoundData.pools.normal}
                              selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                              height={450}
                              showPrizeSelector={false}
                              buttonText=""
                              spinDuration={spinDuration}
                              onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                            />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div 
                              className="w-full h-full transition-opacity duration-300 absolute inset-0" 
                              style={{ 
                                opacity: keySuffix ? 1 : 0,
                                pointerEvents: keySuffix ? 'auto' : 'none',
                                zIndex: keySuffix ? 1 : 0
                              }}
                            >
                              <LuckySlotMachine
                                key={`${participant.id}-${gameData.currentRound}-second`}
                                ref={(ref) => {
                                  if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                }}
                                symbols={currentRoundData.pools.legendary}
                                selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                height={450}
                                showPrizeSelector={false}
                                buttonText=""
                                spinDuration={spinDuration}
                                onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Second row: 3 slot machines */}
                  <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
                    {allParticipants.slice(3, 6).map((participant) => {
                      if (!participant || !participant.id) return null;
                      
                      const currentRoundData = gameData.rounds[gameData.currentRound];
                      if (!currentRoundData) return null;
                      
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      
                      return (
                        <div 
                          key={participant.id} 
                          className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                          style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
                        >
                          <div 
                            className="w-full h-full transition-opacity duration-300 absolute inset-0" 
                            style={{ 
                              opacity: !keySuffix ? 1 : 0,
                              pointerEvents: !keySuffix ? 'auto' : 'none',
                              zIndex: !keySuffix ? 1 : 0
                            }}
                          >
                            <LuckySlotMachine
                              key={`${participant.id}-${gameData.currentRound}-first`}
                              ref={(ref) => {
                                if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                              }}
                              symbols={currentRoundData.pools.normal}
                              selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                              height={450}
                              showPrizeSelector={false}
                              buttonText=""
                              spinDuration={spinDuration}
                              onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                            />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div 
                              className="w-full h-full transition-opacity duration-300 absolute inset-0" 
                              style={{ 
                                opacity: keySuffix ? 1 : 0,
                                pointerEvents: keySuffix ? 'auto' : 'none',
                                zIndex: keySuffix ? 1 : 0
                              }}
                            >
                              <LuckySlotMachine
                                key={`${participant.id}-${gameData.currentRound}-second`}
                                ref={(ref) => {
                                  if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                }}
                                symbols={currentRoundData.pools.legendary}
                                selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                height={450}
                                showPrizeSelector={false}
                                buttonText=""
                                spinDuration={spinDuration}
                                onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : teamStructure === '2v2v2' ? (
                // 小屏幕 2v2v2: 3行2列
                <div className="flex flex-col px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px', gap: '17px', justifyContent: 'center' }}>
                  {/* Row 1: 2 slot machines */}
                  <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '130px', overflow: 'hidden', pointerEvents: 'none' }}>
                    {allParticipants.slice(0, 2).map((participant) => {
                      if (!participant || !participant.id) return null;
                      const currentRoundData = gameData.rounds[gameData.currentRound];
                      if (!currentRoundData) return null;
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      return (
                        <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ marginTop: `${-(450 - 130) / 2}px` }}>
                          <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: !keySuffix ? 1 : 0, pointerEvents: !keySuffix ? 'auto' : 'none', zIndex: !keySuffix ? 1 : 0 }}>
                            <LuckySlotMachine key={`${participant.id}-${gameData.currentRound}-first`} ref={(ref) => { if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.normal} selectedPrizeId={!keySuffix ? selectedPrizeId : null} height={450} showPrizeSelector={false} buttonText="" spinDuration={spinDuration} onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)} />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                              <LuckySlotMachine key={`${participant.id}-${gameData.currentRound}-second`} ref={(ref) => { if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.legendary} selectedPrizeId={keySuffix ? selectedPrizeId : null} height={450} showPrizeSelector={false} buttonText="" spinDuration={spinDuration} onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Row 2: 2 slot machines */}
                  <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '130px', overflow: 'hidden', pointerEvents: 'none' }}>
                    {allParticipants.slice(2, 4).map((participant) => {
                      if (!participant || !participant.id) return null;
                      const currentRoundData = gameData.rounds[gameData.currentRound];
                      if (!currentRoundData) return null;
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      return (
                        <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ marginTop: `${-(450 - 130) / 2}px` }}>
                          <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: !keySuffix ? 1 : 0, pointerEvents: !keySuffix ? 'auto' : 'none', zIndex: !keySuffix ? 1 : 0 }}>
                            <LuckySlotMachine key={`${participant.id}-${gameData.currentRound}-first`} ref={(ref) => { if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.normal} selectedPrizeId={!keySuffix ? selectedPrizeId : null} height={450} showPrizeSelector={false} buttonText="" spinDuration={spinDuration} onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)} />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                              <LuckySlotMachine key={`${participant.id}-${gameData.currentRound}-second`} ref={(ref) => { if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.legendary} selectedPrizeId={keySuffix ? selectedPrizeId : null} height={450} showPrizeSelector={false} buttonText="" spinDuration={spinDuration} onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Row 3: 2 slot machines */}
                  <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '130px', overflow: 'hidden', pointerEvents: 'none' }}>
                    {allParticipants.slice(4, 6).map((participant) => {
                      if (!participant || !participant.id) return null;
                      const currentRoundData = gameData.rounds[gameData.currentRound];
                      if (!currentRoundData) return null;
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      return (
                        <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ marginTop: `${-(450 - 130) / 2}px` }}>
                          <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: !keySuffix ? 1 : 0, pointerEvents: !keySuffix ? 'auto' : 'none', zIndex: !keySuffix ? 1 : 0 }}>
                            <LuckySlotMachine key={`${participant.id}-${gameData.currentRound}-first`} ref={(ref) => { if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.normal} selectedPrizeId={!keySuffix ? selectedPrizeId : null} height={450} showPrizeSelector={false} buttonText="" spinDuration={spinDuration} onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)} />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                              <LuckySlotMachine key={`${participant.id}-${gameData.currentRound}-second`} ref={(ref) => { if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.legendary} selectedPrizeId={keySuffix ? selectedPrizeId : null} height={450} showPrizeSelector={false} buttonText="" spinDuration={spinDuration} onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            ) : isSmallScreen && allParticipants.length === 6 ? (
              <div className="flex flex-col justify-between px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
                {/* First row: 3 slot machines - actual height 450px, visible height 216.5px (center area) */}
                <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
                  {allParticipants.slice(0, 3).map((participant) => {
                    if (!participant || !participant.id) return null;
                    
                    return (
                      <div 
                        key={participant.id} 
                        className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                        style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
                      >
                        {/* 渲染所有轮次的老虎机 */}
                        {gameData.rounds.map((roundData, roundIndex) => {
                          const isCurrentRound = roundIndex === gameData.currentRound;
                          const selectedPrizeId = isCurrentRound ? currentRoundPrizes[participant.id] : null;
                          const keySuffix = slotMachineKeySuffix[participant.id] || '';
                          const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                          const participantSymbols = playerSymbols[participant.id] || currentSlotSymbols;
                          
                          return (
                            <div key={`round-${roundIndex}`} className="absolute inset-0">
                              {/* 第一段老虎机 */}
                              <div 
                                className="w-full transition-opacity duration-300 absolute inset-0" 
                                style={{ 
                                  opacity: isCurrentRound && !keySuffix ? 1 : 0,
                                  pointerEvents: isCurrentRound && !keySuffix ? 'auto' : 'none',
                                  zIndex: isCurrentRound && !keySuffix ? 1 : 0
                                }}
                              >
                                <LuckySlotMachine
                                  key={`${participant.id}-${roundIndex}-first`}
                                  ref={(ref) => {
                                    if (ref && isCurrentRound && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  symbols={roundData.pools.normal}
                                  selectedPrizeId={isCurrentRound && !keySuffix ? selectedPrizeId : null}
                                  height={450}
                                  showPrizeSelector={false}
                                  buttonText=""
                                  spinDuration={spinDuration}
                                  onSpinComplete={(result) => isCurrentRound && !keySuffix && handleSlotComplete(participant.id, result)}
                                />
                              </div>
                              
                              {/* 第二段老虎机（预加载） */}
                              {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
                                <div 
                                  className="w-full transition-opacity duration-300 absolute inset-0" 
                                  style={{ 
                                    opacity: isCurrentRound && keySuffix ? 1 : 0,
                                    pointerEvents: isCurrentRound && keySuffix ? 'auto' : 'none',
                                    zIndex: isCurrentRound && keySuffix ? 1 : 0
                                  }}
                                >
                                  <LuckySlotMachine
                                    key={`${participant.id}-${roundIndex}-second`}
                                    ref={(ref) => {
                                      if (ref && isCurrentRound && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    symbols={roundData.pools.legendary}
                                    selectedPrizeId={isCurrentRound && keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    showPrizeSelector={false}
                                    buttonText=""
                                    spinDuration={spinDuration}
                                    onSpinComplete={(result) => isCurrentRound && keySuffix && handleSlotComplete(participant.id, result)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                
                {/* Second row: 3 slot machines - actual height 450px, visible height 216.5px (center area) */}
                <div className="flex gap-0 md:gap-4 justify-around" style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}>
                  {allParticipants.slice(3, 6).map((participant) => {
                    if (!participant || !participant.id) return null;
                    
                    return (
                      <div 
                        key={participant.id} 
                        className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
                        style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
                      >
                        {/* 渲染所有轮次的老虎机 */}
                        {gameData.rounds.map((roundData, roundIndex) => {
                          const isCurrentRound = roundIndex === gameData.currentRound;
                          const selectedPrizeId = isCurrentRound ? currentRoundPrizes[participant.id] : null;
                          const keySuffix = slotMachineKeySuffix[participant.id] || '';
                          const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                          const participantSymbols = playerSymbols[participant.id] || currentSlotSymbols;
                          
                          return (
                            <div key={`round-${roundIndex}`} className="absolute inset-0">
                              {/* 第一段老虎机 */}
                              <div 
                                className="w-full transition-opacity duration-300 absolute inset-0" 
                                style={{ 
                                  opacity: isCurrentRound && !keySuffix ? 1 : 0,
                                  pointerEvents: isCurrentRound && !keySuffix ? 'auto' : 'none',
                                  zIndex: isCurrentRound && !keySuffix ? 1 : 0
                                }}
                              >
                                <LuckySlotMachine
                                  key={`${participant.id}-${roundIndex}-first`}
                                  ref={(ref) => {
                                    if (ref && isCurrentRound && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  symbols={roundData.pools.normal}
                                  selectedPrizeId={isCurrentRound && !keySuffix ? selectedPrizeId : null}
                                  height={450}
                                  showPrizeSelector={false}
                                  buttonText=""
                                  spinDuration={spinDuration}
                                  onSpinComplete={(result) => isCurrentRound && !keySuffix && handleSlotComplete(participant.id, result)}
                                />
                              </div>
                              
                              {/* 第二段老虎机（预加载） */}
                              {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
                                <div 
                                  className="w-full transition-opacity duration-300 absolute inset-0" 
                                  style={{ 
                                    opacity: isCurrentRound && keySuffix ? 1 : 0,
                                    pointerEvents: isCurrentRound && keySuffix ? 'auto' : 'none',
                                    zIndex: isCurrentRound && keySuffix ? 1 : 0
                                  }}
                                >
                                  <LuckySlotMachine
                                    key={`${participant.id}-${roundIndex}-second`}
                                    ref={(ref) => {
                                      if (ref && isCurrentRound && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    symbols={roundData.pools.legendary}
                                    selectedPrizeId={isCurrentRound && keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    showPrizeSelector={false}
                                    buttonText=""
                                    spinDuration={spinDuration}
                                    onSpinComplete={(result) => isCurrentRound && keySuffix && handleSlotComplete(participant.id, result)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex gap-0 md:gap-4 px-4 overflow-x-hidden w-full max-w-[1248px] justify-around" style={{ height: '450px' }}>
                {allParticipants.map((participant) => {
                  if (!participant || !participant.id) return null;
                  
                  return (
                    <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ height: '450px' }}>
                      {/* 渲染所有轮次的老虎机 */}
                      {gameData.rounds.map((roundData, roundIndex) => {
                        const isCurrentRound = roundIndex === gameData.currentRound;
                        const selectedPrizeId = isCurrentRound ? currentRoundPrizes[participant.id] : null;
                        const keySuffix = slotMachineKeySuffix[participant.id] || '';
                        const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                        
                        return (
                          <div key={`round-${roundIndex}`} className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
                            {/* 第一段老虎机 */}
                            <div 
                              className="w-full transition-opacity duration-300 absolute inset-0" 
                              style={{ 
                                opacity: isCurrentRound && !keySuffix ? 1 : 0,
                                pointerEvents: isCurrentRound && !keySuffix ? 'auto' : 'none',
                                zIndex: isCurrentRound && !keySuffix ? 1 : 0
                              }}
                            >
                             <LuckySlotMachine
                               key={`${participant.id}-${roundIndex}-first`}
                               ref={(ref) => {
                                 if (ref && isCurrentRound && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                               }}
                               symbols={roundData.pools.normal}
                               selectedPrizeId={isCurrentRound && !keySuffix ? selectedPrizeId : null}
                               height={450}
                               showPrizeSelector={false}
                               buttonText=""
                               spinDuration={spinDuration}
                              onSpinComplete={(result) => isCurrentRound && !keySuffix && handleSlotComplete(participant.id, result)}
                            />
                            </div>
                            
                            {/* 第二段老虎机（预加载） */}
                            {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
                              <div 
                                className="w-full transition-opacity duration-300 absolute inset-0" 
                                style={{ 
                                  opacity: isCurrentRound && keySuffix ? 1 : 0,
                                  pointerEvents: isCurrentRound && keySuffix ? 'auto' : 'none',
                                  zIndex: isCurrentRound && keySuffix ? 1 : 0
                                }}
                              >
                                <LuckySlotMachine
                                  key={`${participant.id}-${roundIndex}-second`}
                                  ref={(ref) => {
                                    if (ref && isCurrentRound && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  symbols={roundData.pools.legendary}
                                  selectedPrizeId={isCurrentRound && keySuffix ? selectedPrizeId : null}
                                  height={450}
                                  showPrizeSelector={false}
                                  buttonText=""
                                  spinDuration={spinDuration}
                                  onSpinComplete={(result) => isCurrentRound && keySuffix && handleSlotComplete(participant.id, result)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        </div>
        <div className="w-full ">
          <div className="flex w-full max-w-[1280px] mx-auto flex-col gap-6">
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
              participantValues={participantValues}
              gameMode={gameMode}
              playerColors={playerColors}
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
