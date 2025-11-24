"use client";

import { useEffect, useState, useRef, useCallback, useMemo, useReducer } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { gsap } from "gsap";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import PackDetailModal from "./components/PackDetailModal";
import type { PackItem, Participant, BattleData } from "./types";
import LuckySlotMachine, { type SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import EliminationSlotMachine, { type PlayerSymbol, type EliminationSlotMachineHandle } from "./components/EliminationSlotMachine";
import FireworkArea, { FireworkAreaHandle } from '@/app/components/FireworkArea';
import { getDynamicBattleSource } from '../dynamicBattleSource';
import HorizontalLuckySlotMachine, { type SlotSymbol as HorizontalSlotSymbol } from '@/app/components/SlotMachine/HorizontalLuckySlotMachine';
import type {
  BackendBattlePayload,
  BackendRoundPlan,
  BackendRoundDrop,
  BattleConfigPayload,
  GameplayMode,
  MatchVariant,
  SoloSeatSize,
  DuoVariant,
  SpecialOption,
} from './battlePayloadTypes';

function resolveEntryRoundIndex(totalRounds: number, entryRoundSetting: number): number | null {
  if (entryRoundSetting <= 0 || totalRounds <= 0) {
    return null;
  }
  const normalized = Math.min(entryRoundSetting, totalRounds);
  return Math.max(0, normalized - 1);
}

type BattleDataSourceConfig = {
  id: string;
  entryRound: number;
  buildData: () => BattleData;
  buildPayload: () => BackendBattlePayload;
};

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
  }, [players, winnerId, onComplete]);
  
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

const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

// 🎯 主状态机类型
type RuntimeRoundPlan = BackendRoundPlan;

interface TimelineCursor {
  phase: 'COUNTDOWN' | 'ROUND' | 'COMPLETED';
  roundIndex: number;
  roundElapsedMs: number;
}

interface TimelinePlan {
  startAt: number;
  countdownMs: number;
  roundDurationMs: number;
  totalRounds: number;
  fastMode: boolean;
  getRoundByTimestamp: (ts: number) => TimelineCursor;
}

interface ParticipantRuntimeState {
  id: string;
  name: string;
  avatar: string;
  teamId?: string;
  totalValue: number;
  sprintScore: number;
  eliminatedAtRound?: number;
  roundHistory: Array<{
    roundIndex: number;
    itemId: string;
    itemName: string;
    value: number;
    rarity: 'normal' | 'legendary';
  }>;
}

interface BattleStateData {
  mainState: MainState;
  roundState: RoundState;
  game: {
    currentRound: number;
    totalRounds: number;
    rounds: Array<{
      pools: {
        normal: SlotSymbol[];
        legendary: SlotSymbol[];
        placeholder: SlotSymbol;
      };
      results: Record<string, {
        itemId: string;
        qualityId: string | null;
        poolType: 'normal' | 'legendary';
        needsSecondSpin: boolean;
      }>;
      spinStatus: {
        firstStage: {
          completed: Set<string>;
          gotLegendary: Set<string>;
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
    completed: Set<string>;
  };
}

interface BattleRuntime {
  config: BattleConfigPayload;
  participants: Record<string, ParticipantRuntimeState>;
  rounds: RuntimeRoundPlan[];
  timeline: TimelinePlan;
  jackpot?: BackendBattlePayload['jackpot'];
  sprint?: BackendBattlePayload['sprint'];
  classic?: BackendBattlePayload['classic'];
  eliminationMeta?: BackendBattlePayload['eliminationMeta'];
}

type JackpotRuntimeData = {
  id: string;
  name: string;
  totalValue: number;
  teamIds: string[];
  contenderIds?: string[];
  usedLastChance?: boolean;
};

type SprintRuntimeData = {
  scores: Record<string, number>;
  roundWinners: Record<number, string[]>;
  finalWinnerId: string;
  needsTiebreaker: boolean;
  tiebreakerPlayers: string[];
};

type EliminationRuntimeData = {
  eliminations: Record<number, {
    eliminatedPlayerId: string;
    eliminatedPlayerName: string;
    needsSlotMachine: boolean;
    tiedPlayerIds?: string[];
  }>;
  eliminationStartRound: number;
  finalWinnerId?: string;
};

type MainState = 'IDLE' | 'LOADING' | 'COUNTDOWN' | 'ROUND_LOOP' | 'COMPLETED';

// 🎯 轮次子状态机类型
type RoundState = 
  | 'ROUND_RENDER' 
  | 'ROUND_SPIN_FIRST'           // 第一段转动（使用普通池）
  | 'ROUND_CHECK_LEGENDARY'      // 检查是否有人中legendary
  | 'ROUND_PREPARE_SECOND'       // 准备第二段（替换数据源）
  | 'ROUND_SPIN_SECOND'          // 第二段转动（使用legendary池）
  | 'ROUND_SETTLE' 
  | 'ROUND_CHECK_ELIMINATION'    // 🔥 淘汰模式：检查是否需要淘汰
  | 'ROUND_ELIMINATION_SLOT'     // 🔥 淘汰模式：播放淘汰老虎机动画
  | 'ROUND_ELIMINATION_RESULT'   // 🔥 淘汰模式：显示淘汰结果
  | 'ROUND_NEXT' 
  | null;

type CountdownUpdater = number | null | ((prev: number | null) => number | null);

type BattleViewState = {
  main: MainState;
  round: RoundState;
  countdown: number | null;
};

type BattleViewAction =
  | { type: 'SET_MAIN'; next: MainState }
  | { type: 'SET_ROUND'; next: RoundState }
  | { type: 'SET_COUNTDOWN'; value: CountdownUpdater };

const battleViewInitialState: BattleViewState = {
  main: 'IDLE',
  round: null,
  countdown: null,
};

function battleViewReducer(state: BattleViewState, action: BattleViewAction): BattleViewState {
  switch (action.type) {
    case 'SET_MAIN': {
      if (state.main === action.next) return state;
      return { ...state, main: action.next };
    }
    case 'SET_ROUND': {
      if (state.round === action.next) return state;
      return { ...state, round: action.next };
    }
    case 'SET_COUNTDOWN': {
      const nextValue =
        typeof action.value === 'function' ? action.value(state.countdown) : action.value;
      if (nextValue === state.countdown) return state;
      return { ...state, countdown: nextValue };
    }
    default:
      return state;
  }
}

type RoundResultsMap = Record<number, Record<string, SlotSymbol>>;

type SpinTracker = {
  activeCount: number;
  completed: Set<string>;
};

type RoundExecutionFlags = {
  renderStarted?: boolean;
  firstSpinStarted?: boolean;
  secondSpinStarted?: boolean;
  settleExecuted?: boolean;
};

type RoundEventType =
  | 'ROUND_RENDER_START'
  | 'ROUND_SPIN_FIRST_START'
  | 'ROUND_SPIN_SECOND_START'
  | 'ROUND_SETTLE_START'
  | 'ROUND_SPIN_FIRST_STOP'
  | 'ROUND_SPIN_SECOND_STOP';

type RoundEvent = {
  id: string;
  roundIndex: number;
  type: RoundEventType;
  timestamp: number;
};

type TieBreakerPlan = {
  mode: 'classic' | 'jackpot' | 'sprint';
  contenderIds: string[];
  winnerId: string;
};

type BattleProgressState = {
  currentRound: number;
  totalRounds: number;
  participantValues: Record<string, number>;
  roundResults: RoundResultsMap;
  completedRounds: Set<number>;
  spinState: SpinTracker;
  playerSymbols: Record<string, SlotSymbol[]>;
  slotMachineKeySuffix: Record<string, string>;
  currentRoundPrizes: Record<string, string>;
  roundExecutionFlags: Record<number, RoundExecutionFlags>;
  roundEventLog: RoundEvent[];
};

type BattleProgressAction =
  | { type: 'RESET_PROGRESS' }
  | { type: 'SET_TOTAL_ROUNDS'; totalRounds: number }
  | { type: 'SET_CURRENT_ROUND'; currentRound: number }
  | { type: 'SET_PARTICIPANT_VALUES'; values: Record<string, number> }
  | { type: 'ACCUMULATE_PARTICIPANT_VALUES'; deltas: Record<string, number> }
  | { type: 'SET_ROUND_RESULTS'; roundResults: RoundResultsMap }
  | { type: 'UPSERT_ROUND_RESULT'; roundIndex: number; results: Record<string, SlotSymbol> }
  | { type: 'SET_COMPLETED_ROUNDS'; completedRounds: Set<number> }
  | { type: 'MARK_ROUND_COMPLETED'; roundIndex: number }
  | { type: 'RESET_SPIN_STATE' }
  | { type: 'SET_SPIN_STATE'; state: SpinTracker }
  | { type: 'ADD_SPIN_COMPLETED'; participantId: string }
  | { type: 'SET_PLAYER_SYMBOLS'; symbols: Record<string, SlotSymbol[]> }
  | { type: 'RESET_PLAYER_SYMBOLS' }
  | { type: 'SET_SLOT_KEY_SUFFIX'; suffixMap: Record<string, string> }
  | { type: 'RESET_SLOT_KEY_SUFFIX' }
  | { type: 'SET_CURRENT_ROUND_PRIZES'; prizes: Record<string, string> }
  | { type: 'RESET_CURRENT_ROUND_PRIZES' }
  | { type: 'PUSH_ROUND_EVENT'; event: RoundEvent }
  | { type: 'RESET_ROUND_EVENT_LOG' }
  | { type: 'SET_ROUND_FLAG'; roundIndex: number; flag: keyof RoundExecutionFlags; value: boolean }
  | { type: 'RESET_ROUND_FLAGS'; roundIndex: number }
  | { type: 'RESET_ALL_ROUND_FLAGS' }
  | { type: 'APPLY_PROGRESS_SNAPSHOT'; snapshot: BattleProgressState };

function createBattleProgressInitialState(): BattleProgressState {
  return {
    currentRound: 0,
    totalRounds: 0,
    participantValues: {},
    roundResults: {},
    completedRounds: new Set<number>(),
    spinState: {
      activeCount: 0,
      completed: new Set<string>(),
    },
    playerSymbols: {},
    slotMachineKeySuffix: {},
    currentRoundPrizes: {},
    roundExecutionFlags: {},
    roundEventLog: [],
  };
}

function cloneCompletedRounds(source: Set<number>): Set<number> {
  return new Set<number>(source);
}

function cloneStringSet(source: Set<string>): Set<string> {
  return new Set<string>(source);
}

function battleProgressReducer(state: BattleProgressState, action: BattleProgressAction): BattleProgressState {
  switch (action.type) {
    case 'RESET_PROGRESS':
      return createBattleProgressInitialState();
    case 'SET_TOTAL_ROUNDS':
      if (state.totalRounds === action.totalRounds) return state;
      return { ...state, totalRounds: action.totalRounds };
    case 'SET_CURRENT_ROUND':
      if (state.currentRound === action.currentRound) return state;
      return { ...state, currentRound: action.currentRound };
    case 'SET_PARTICIPANT_VALUES':
      return { ...state, participantValues: action.values };
    case 'ACCUMULATE_PARTICIPANT_VALUES': {
      if (!Object.keys(action.deltas).length) return state;
      const nextValues = { ...state.participantValues };
      Object.entries(action.deltas).forEach(([participantId, delta]) => {
        nextValues[participantId] = (nextValues[participantId] || 0) + delta;
      });
      return { ...state, participantValues: nextValues };
    }
    case 'SET_ROUND_RESULTS':
      return { ...state, roundResults: action.roundResults };
    case 'UPSERT_ROUND_RESULT':
      return {
        ...state,
        roundResults: {
          ...state.roundResults,
          [action.roundIndex]: action.results,
        },
      };
    case 'SET_COMPLETED_ROUNDS':
      return { ...state, completedRounds: cloneCompletedRounds(action.completedRounds) };
    case 'MARK_ROUND_COMPLETED': {
      if (state.completedRounds.has(action.roundIndex)) return state;
      const updated = new Set(state.completedRounds);
      updated.add(action.roundIndex);
      return {
        ...state,
        completedRounds: updated,
      };
    }
    case 'RESET_SPIN_STATE':
      if (state.spinState.activeCount === 0 && state.spinState.completed.size === 0) {
        return state;
      }
      return {
        ...state,
        spinState: {
          activeCount: 0,
          completed: new Set<string>(),
        },
      };
    case 'SET_SPIN_STATE':
      return {
        ...state,
        spinState: {
          activeCount: action.state.activeCount,
          completed: cloneStringSet(action.state.completed),
        },
      };
    case 'ADD_SPIN_COMPLETED': {
      if (state.spinState.completed.has(action.participantId)) return state;
      const completed = cloneStringSet(state.spinState.completed);
      completed.add(action.participantId);
      return {
        ...state,
        spinState: {
          ...state.spinState,
          completed,
        },
      };
    }
    case 'SET_PLAYER_SYMBOLS':
      return {
        ...state,
        playerSymbols: action.symbols,
      };
    case 'RESET_PLAYER_SYMBOLS':
      if (Object.keys(state.playerSymbols).length === 0) return state;
      return {
        ...state,
        playerSymbols: {},
      };
    case 'SET_SLOT_KEY_SUFFIX':
      return {
        ...state,
        slotMachineKeySuffix: { ...action.suffixMap },
      };
    case 'RESET_SLOT_KEY_SUFFIX':
      if (Object.keys(state.slotMachineKeySuffix).length === 0) return state;
      return {
        ...state,
        slotMachineKeySuffix: {},
      };
    case 'SET_CURRENT_ROUND_PRIZES':
      return {
        ...state,
        currentRoundPrizes: { ...action.prizes },
      };
    case 'RESET_CURRENT_ROUND_PRIZES':
      if (Object.keys(state.currentRoundPrizes).length === 0) return state;
      return {
        ...state,
        currentRoundPrizes: {},
      };
    case 'PUSH_ROUND_EVENT':
      return {
        ...state,
        roundEventLog: [...state.roundEventLog, action.event],
      };
    case 'RESET_ROUND_EVENT_LOG':
      if (state.roundEventLog.length === 0) return state;
      return { ...state, roundEventLog: [] };
    case 'APPLY_PROGRESS_SNAPSHOT':
      return {
        currentRound: action.snapshot.currentRound,
        totalRounds: action.snapshot.totalRounds,
        participantValues: { ...action.snapshot.participantValues },
        roundResults: { ...action.snapshot.roundResults },
        completedRounds: cloneCompletedRounds(action.snapshot.completedRounds),
        spinState: {
          activeCount: action.snapshot.spinState?.activeCount ?? 0,
          completed: action.snapshot.spinState
            ? cloneStringSet(action.snapshot.spinState.completed)
            : new Set<string>(),
        },
        playerSymbols: { ...action.snapshot.playerSymbols },
        slotMachineKeySuffix: { ...action.snapshot.slotMachineKeySuffix },
        currentRoundPrizes: { ...action.snapshot.currentRoundPrizes },
        roundExecutionFlags: { ...action.snapshot.roundExecutionFlags },
        roundEventLog: [...(action.snapshot.roundEventLog ?? [])],
      };
    case 'SET_ROUND_FLAG': {
      const prevFlags = state.roundExecutionFlags[action.roundIndex] ?? {};
      if (prevFlags[action.flag] === action.value) return state;
      return {
        ...state,
        roundExecutionFlags: {
          ...state.roundExecutionFlags,
          [action.roundIndex]: { ...prevFlags, [action.flag]: action.value },
        },
      };
    }
    case 'RESET_ROUND_FLAGS': {
      if (!state.roundExecutionFlags[action.roundIndex]) return state;
      const nextFlags = { ...state.roundExecutionFlags };
      delete nextFlags[action.roundIndex];
      return { ...state, roundExecutionFlags: nextFlags };
    }
    case 'RESET_ALL_ROUND_FLAGS':
      if (Object.keys(state.roundExecutionFlags).length === 0) return state;
      return { ...state, roundExecutionFlags: {} };
    default:
      return state;
  }
}

// 🎯 状态数据结构
function createTimelinePlan(config: BattleConfigPayload): TimelinePlan {
  const { startAt, countdownMs, roundDurationMs, roundsTotal, specialRules } = config;
  return {
    startAt,
    countdownMs,
    roundDurationMs,
    totalRounds: roundsTotal,
    fastMode: specialRules.fast,
    getRoundByTimestamp(ts: number): TimelineCursor {
      if (ts < startAt) {
        return { phase: 'COUNTDOWN', roundIndex: 0, roundElapsedMs: countdownMs };
      }
      const elapsed = ts - startAt;
      if (elapsed < countdownMs) {
        return { phase: 'COUNTDOWN', roundIndex: 0, roundElapsedMs: countdownMs - elapsed };
      }
      const afterCountdown = elapsed - countdownMs;
      if (roundsTotal === 0) {
        return { phase: 'COMPLETED', roundIndex: 0, roundElapsedMs: 0 };
      }
      const totalRoundDuration = roundDurationMs * roundsTotal;
      if (afterCountdown >= totalRoundDuration) {
        return { phase: 'COMPLETED', roundIndex: roundsTotal - 1, roundElapsedMs: roundDurationMs };
      }
      const roundIndex = Math.floor(afterCountdown / roundDurationMs);
      const roundElapsedMs = afterCountdown - roundIndex * roundDurationMs;
      return { phase: 'ROUND', roundIndex, roundElapsedMs };
    },
  };
}

function buildBattleRuntime(payload: BackendBattlePayload): BattleRuntime {
  const participantState = payload.participants.reduce<Record<string, ParticipantRuntimeState>>((acc, participant) => {
    acc[participant.id] = {
      id: participant.id,
      name: participant.name,
      avatar: participant.avatar,
      teamId: participant.teamId,
      totalValue: 0,
      sprintScore: 0,
      roundHistory: [],
    };
    return acc;
  }, {});

  return {
    config: payload.config,
    participants: participantState,
    rounds: payload.rounds,
    timeline: createTimelinePlan(payload.config),
    jackpot: payload.jackpot,
    sprint: payload.sprint,
    classic: payload.classic,
    eliminationMeta: payload.eliminationMeta,
  };
}

function convertRuntimeRoundToLegacy(runtimeRound: RuntimeRoundPlan): BattleStateData['game']['rounds'][number] {
  const results: Record<string, { itemId: string; qualityId: string | null; poolType: 'normal' | 'legendary'; needsSecondSpin: boolean }> = {};
  Object.entries(runtimeRound.drops).forEach(([playerId, drop]) => {
    results[playerId] = {
      itemId: drop.itemId,
      qualityId: drop.rarity === 'legendary' ? 'legendary' : drop.rarity,
      poolType: drop.rarity === 'legendary' ? 'legendary' : 'normal',
      needsSecondSpin: drop.needsSecondStage,
    };
  });

  return {
    pools: {
      normal: runtimeRound.pools.normal,
      legendary: runtimeRound.pools.legendary,
      placeholder: runtimeRound.pools.placeholder,
    },
    results,
    spinStatus: {
      firstStage: {
        completed: new Set(),
        gotLegendary: new Set(),
      },
      secondStage: {
        active: new Set(),
        completed: new Set(),
      },
    },
  };
}

// 修改為 0 表示從倒數 321 開始；改成 5 代表直接從第 5 輪開局

// 🎵 全局Web Audio API上下文
let audioContext: AudioContext | null = null;
let tickAudioBuffer: AudioBuffer | null = null;
let basicWinAudioBuffer: AudioBuffer | null = null;

export default function BattleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const routeBattleId = params?.id ?? null;

  const activeSource = useMemo<BattleDataSourceConfig>(() => {
    return getDynamicBattleSource(routeBattleId);
  }, [routeBattleId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.info('[BattleDetail] 使用数据源', {
        routeBattleId,
        activeId: activeSource.id,
      });
    }
  }, [routeBattleId, activeSource.id]);
  const battleData = useMemo(() => activeSource.buildData(), [activeSource]);
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);
  const [allSlotsFilled, setAllSlotsFilled] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const declaredWinnerIds = useMemo(
    () =>
      (battleData.participants || [])
        .filter((participant) => Boolean(participant?.isWinner && participant?.id))
        .map((participant) => String(participant!.id)),
    [battleData.participants],
  );
  const hasMultipleDeclaredWinners = declaredWinnerIds.length > 1;
  
  // 💰 玩家累计金额映射 (participantId -> totalValue)
  const [progressState, dispatchProgressState] = useReducer(
    battleProgressReducer,
    undefined,
    createBattleProgressInitialState,
  );
  const {
    currentRound: progressCurrentRound,
    totalRounds: progressTotalRounds,
    participantValues,
    roundResults,
    completedRounds,
    spinState: spinningState,
    playerSymbols,
    slotMachineKeySuffix,
    currentRoundPrizes,
    roundExecutionFlags,
    roundEventLog,
  } = progressState;
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
  const completedWinnerSetRef = useRef(false); // 🎯 防止COMPLETED状态下重复设置获胜者
  const battleRuntimeRef = useRef<BattleRuntime | null>(null);
  const detailedResultsRef = useRef<Record<number, Record<string, any>>>({});
  const jackpotWinnerRef = useRef<JackpotRuntimeData | null>(null);
  const sprintDataRef = useRef<SprintRuntimeData | null>(null);
  const eliminationDataRef = useRef<EliminationRuntimeData | null>(null);
  
  // 🎉 烟花动画 ref
  const winnerFireworkRef = useRef<FireworkAreaHandle>(null);
  
  // 🎵 播放胜利音效的辅助函数
  const playWinSound = useCallback(() => {
    if (typeof window !== 'undefined') {
      const ctx = (window as any).__audioContext;
      const buffer = (window as any).__winAudioBuffer;
      if (ctx && buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    }
  }, []);

  
  // 🎉 大奖模式：动画完成回调（稳定引用）
  const handleJackpotAnimationComplete = useCallback(() => {
    setTimeout(() => {
      setJackpotPhase('winner');
      
      // 🎉 播放烟花动画 + 🎵 音效
      setTimeout(() => {
        playWinSound();
        winnerFireworkRef.current?.triggerFirework();
      }, 100);
    }, 1000);
  }, [playWinSound]);
  
  // 🔥 淘汰模式：已淘汰的玩家ID集合
  const [eliminatedPlayerIds, setEliminatedPlayerIds] = useState<Set<string>>(new Set());
  
  // 🔥 淘汰模式：玩家ID -> 被淘汰的轮次索引（0-based）
  const [eliminationRounds, setEliminationRounds] = useState<Record<string, number>>({});
  
  // 🔥 淘汰模式：当前轮次的淘汰数据
  const [currentEliminationData, setCurrentEliminationData] = useState<{
    eliminatedPlayerId: string;
    eliminatedPlayerName: string;
    needsSlotMachine: boolean;
    tiedPlayerIds?: string[];
    roundIndex: number; // 🔥 添加轮次索引
  } | null>(null);
  
  // 🔥 淘汰模式：淘汰老虎机ref
  const eliminationSlotMachineRef = useRef<EliminationSlotMachineHandle>(null);
  
  // 🏃 积分冲刺模式：玩家/团队积分
  const [sprintScores, setSprintScores] = useState<Record<string, number>>({});
  
  // 🔥 淘汰模式：淘汰老虎机完成回调
  const handleEliminationSlotComplete = useCallback(() => {
    
    // 🔥 立即添加淘汰玩家到已淘汰集合（在老虎机组件内已经渲染了淘汰 UI）
    if (currentEliminationData) {
      setEliminatedPlayerIds(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(currentEliminationData.eliminatedPlayerId)) {
          newSet.add(currentEliminationData.eliminatedPlayerId);
        }
        return newSet;
      });
      
      // 🔥 记录淘汰轮次
      setEliminationRounds(prev => {
        const newRounds = {
          ...prev,
          [currentEliminationData.eliminatedPlayerId]: currentEliminationData.roundIndex
        };
        return newRounds;
      });
    }
    
    setRoundState('ROUND_ELIMINATION_RESULT');
  }, [currentEliminationData]);
  
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
  }, [isTeamMode, allParticipants.length]);

  const teamLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    teamGroups.forEach((group, index) => {
      const teamId = group[0]?.teamId;
      if (teamId) {
        map.set(teamId, `Team ${index + 1}`);
      }
    });
    return map;
  }, [teamGroups]);

  const sprintLeaderboard = useMemo(() => {
    if (gameMode !== 'sprint') return [];
    const entries = Object.entries(sprintScores || {});
    if (!entries.length) return [];

    return entries
      .map(([entityId, score]) => {
        if (isTeamMode) {
          const members = allParticipants.filter((participant) => participant?.teamId === entityId);
          return {
            id: entityId,
            score,
            label: teamLabelMap.get(entityId) || `Team ${entityId}`,
            avatars: members.slice(0, 3),
            subtitle: members.length ? `${members.length} 名成员` : undefined,
          };
        }

        const participant = allParticipants.find((p) => p?.id === entityId);
        return {
          id: entityId,
          score,
          label: participant?.name || '未知玩家',
          avatars: participant ? [participant] : [],
          subtitle: participant?.teamId ? teamLabelMap.get(participant.teamId) || participant.teamId : undefined,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [gameMode, sprintScores, allParticipants, isTeamMode, teamLabelMap]);
  
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
      
      // 加载special_win.mp3
      let specialWinAudioBuffer = (window as any).__specialWinAudioBuffer;
      if (!specialWinAudioBuffer) {
        try {
          const response = await fetch('/special_win.mp3');
          const arrayBuffer = await response.arrayBuffer();
          specialWinAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          (window as any).__specialWinAudioBuffer = specialWinAudioBuffer;
        } catch (err) {
        }
      }
    };
    
    initAudio();
  }, []);
  
  // 🎯 状态机核心状态
  const [viewState, dispatchViewState] = useReducer(battleViewReducer, battleViewInitialState);
  const mainState = viewState.main;
  const roundState = viewState.round;
  const countdownValue = viewState.countdown;
  const setMainState = useCallback(
    (next: MainState) => {
      dispatchViewState({ type: 'SET_MAIN', next });
    },
    [dispatchViewState],
  );
  const setRoundState = useCallback(
    (next: RoundState) => {
      dispatchViewState({ type: 'SET_ROUND', next });
    },
    [dispatchViewState],
  );
  const setCountdownValue = useCallback(
    (value: CountdownUpdater) => {
      dispatchViewState({ type: 'SET_COUNTDOWN', value });
    },
    [dispatchViewState],
  );
  const roundStateRef = useRef<RoundState>(battleViewInitialState.round); // 实时状态ref
  
 
  
  // 🎯 游戏数据（优化：rounds 放在 ref，避免深度比对）
  const gameData = useMemo(
    () => ({
      currentRound: progressCurrentRound,
      totalRounds: progressTotalRounds,
    }),
    [progressCurrentRound, progressTotalRounds],
  );
  const currentRound = gameData.currentRound;
  const totalRounds = gameData.totalRounds;
  
  const gameRoundsRef = useRef<Array<ReturnType<typeof convertRuntimeRoundToLegacy>>>([]);
  
  // 🚀 缓存 roundResults 的转换结果，避免每次渲染都重新 map
  const roundResultsArray = useMemo(() => 
    Object.entries(roundResults).map(([round, results]) => ({
      roundId: `round-${parseInt(round)}`,
      playerItems: results
    })), 
    [roundResults]
  );

  const triggerWinnerCelebration = useCallback(() => {
    setTimeout(() => {
      playWinSound();
      winnerFireworkRef.current?.triggerFirework();
    }, 100);
  }, [playWinSound]);

  const markParticipantsAsWinners = useCallback(
    (predicate: (participant: any) => boolean) => {
      setAllParticipants((prev) =>
        prev.map((participant) => {
          if (!participant) return participant;
          if (hasMultipleDeclaredWinners) {
            return {
              ...participant,
              isWinner: declaredWinnerIds.includes(String(participant.id)),
            };
          }
          return {
            ...participant,
            isWinner: Boolean(predicate(participant)),
          };
        }),
      );
    },
    [declaredWinnerIds, hasMultipleDeclaredWinners, setAllParticipants],
  );

  const recordRoundEvent = useCallback(
    (roundIndex: number, type: RoundEventType) => {
      dispatchProgressState({
        type: 'PUSH_ROUND_EVENT',
        event: {
          id: `${roundIndex}-${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          roundIndex,
          type,
          timestamp: Date.now(),
        },
      });
    },
    [dispatchProgressState],
  );

  const triggerFirstStageSpin = useCallback(() => {
    const participantIds = allParticipants
      .map((participant) => participant?.id)
      .filter(Boolean) as string[];
    if (!participantIds.length) return;

    setTimeout(() => {
      participantIds.forEach((participantId) => {
        const slotRef = slotMachineRefs.current[participantId];
        if (slotRef && typeof slotRef.startSpin === 'function') {
          slotRef.startSpin();
        }
      });
    }, 600);
  }, [allParticipants]);

  const triggerSecondStageSpin = useCallback(() => {
    const roundData = gameRoundsRef.current[gameData.currentRound];
    if (!roundData) return;
    const goldenPlayers = Array.from(roundData.spinStatus.firstStage.gotLegendary);
    if (!goldenPlayers.length) return;

    setTimeout(() => {
      goldenPlayers.forEach((participantId) => {
        const slotRef = slotMachineRefs.current[participantId];
        if (slotRef && typeof slotRef.startSpin === 'function') {
          slotRef.startSpin();
        }
      });
    }, 100);
  }, [gameData.currentRound]);

  const getClassicComparisonValues = useCallback(() => {
    const valueMap: Record<string, number> = {};
    if (!allParticipants.length) return valueMap;

    if (isLastChance) {
      const lastRoundIndex = Math.max(gameData.totalRounds - 1, 0);
      const lastRoundResult = roundResults[lastRoundIndex] || {};
      allParticipants.forEach((participant) => {
        if (!participant?.id) return;
        const lastPrize = lastRoundResult[participant.id] as SlotSymbol | undefined;
        const rawPrice = lastPrize ? (lastPrize.price ?? (lastPrize as any)?.value ?? 0) : 0;
        valueMap[participant.id] = Number(rawPrice) || 0;
      });
    } else {
      allParticipants.forEach((participant) => {
        if (!participant?.id) return;
        valueMap[participant.id] = participantValues[participant.id] || 0;
      });
    }

    return valueMap;
  }, [allParticipants, gameData.totalRounds, isLastChance, participantValues, roundResults]);

  const determineClassicWinnerParticipantId = useCallback(
    (comparisonMap?: Record<string, number>) => {
      const valueMap = comparisonMap ?? getClassicComparisonValues();
      if (!Object.keys(valueMap).length) return null;

      let targetValue = isInverted ? Infinity : -Infinity;
      let winnerId: string | null = null;

      allParticipants.forEach((participant) => {
        if (!participant?.id) return;
        const value = valueMap[participant.id] ?? 0;
        const shouldReplace = isInverted ? value < targetValue : value > targetValue;
        if (shouldReplace) {
          targetValue = value;
          winnerId = participant.id;
        }
      });

      return winnerId;
    },
    [allParticipants, getClassicComparisonValues, isInverted],
  );

  const getLastChanceValueMap = useCallback(() => {
    const map: Record<string, number> = {};
    if (!Object.keys(roundResults).length) return map;
    const lastRoundIndex = Math.max(gameData.totalRounds - 1, 0);
    const lastRoundResult = roundResults[lastRoundIndex];
    if (!lastRoundResult) {
      return map;
    }

    Object.entries(lastRoundResult).forEach(([participantId, slot]) => {
      const rawPrice = slot ? (slot.price ?? (slot as any)?.value ?? 0) : 0;
      map[participantId] = Number(rawPrice) || 0;
    });
    return map;
  }, [roundResults, gameData.totalRounds]);

  const resolveEntityForDisplay = useCallback(
    (id: string) => {
      return (
        allParticipants.find((participant) => participant?.id === id) ||
        allParticipants.find((participant) => participant?.teamId === id) ||
        null
      );
    },
    [allParticipants],
  );

  const evaluateTieBreakerPlan = useCallback((): TieBreakerPlan | null => {
    if (!allParticipants.length) return null;

    if (hasMultipleDeclaredWinners) {
      // 已經有多位獲勝者，直接顯示結果，不需要決勝
      return null;
    }

    const declaredWinnerId = declaredWinnerIds.length === 1 ? declaredWinnerIds[0] : null;

    if (gameMode === 'sprint') {
      const sprintData = sprintDataRef.current;
      if (
        sprintData?.needsTiebreaker &&
        sprintData.tiebreakerPlayers.length > 1 &&
        sprintData.finalWinnerId
      ) {
        return {
          mode: 'sprint',
          contenderIds: sprintData.tiebreakerPlayers,
          winnerId: sprintData.finalWinnerId,
        };
      }
    }

    if (gameMode === 'classic') {
      const comparison = getClassicComparisonValues();
      const values = Object.values(comparison);
      if (!values.length) return null;
      const comparator = isInverted ? Math.min : Math.max;
      const computedWinnerValue =
        declaredWinnerId && comparison[declaredWinnerId] !== undefined
          ? comparison[declaredWinnerId]
          : comparator(...values);

      const contenders = Object.entries(comparison)
        .filter(([, value]) => value === computedWinnerValue)
        .map(([id]) => id);

      if (contenders.length > 1) {
        const winnerId =
          declaredWinnerId ?? determineClassicWinnerParticipantId(comparison);
        if (!winnerId) return null;
        return {
          mode: 'classic',
          contenderIds: contenders,
          winnerId,
        };
      }
    }

    if (gameMode === 'jackpot' && isLastChance) {
      const comparison = getLastChanceValueMap();
      const values = Object.values(comparison);
      if (!values.length) return null;
      const comparator = isInverted ? Math.min : Math.max;
      const computedWinnerValue =
        declaredWinnerId && comparison[declaredWinnerId] !== undefined
          ? comparison[declaredWinnerId]
          : comparator(...values);
      const contenders = Object.entries(comparison)
        .filter(([, value]) => value === computedWinnerValue)
        .map(([id]) => id);
      if (contenders.length > 1) {
        const winnerPayload = jackpotWinnerRef.current;
        const winnerId =
          (declaredWinnerId && contenders.includes(declaredWinnerId) && declaredWinnerId) ||
          (winnerPayload?.id && contenders.includes(winnerPayload.id)
            ? winnerPayload.id
            : contenders[0]);
        return {
          mode: 'jackpot',
          contenderIds: contenders,
          winnerId,
        };
      }
    }

    return null;
  }, [
    allParticipants.length,
    declaredWinnerIds,
    determineClassicWinnerParticipantId,
    gameMode,
    getClassicComparisonValues,
    getLastChanceValueMap,
    hasMultipleDeclaredWinners,
    isInverted,
    isLastChance,
  ]);

  const resolveClassicModeWinner = useCallback(() => {
    if (!allParticipants.length) return false;

    const playerCompareValues = getClassicComparisonValues();
    if (!Object.keys(playerCompareValues).length) return false;

    const winnerParticipantId = determineClassicWinnerParticipantId(playerCompareValues);
    if (!winnerParticipantId) return false;

    if (isTeamMode) {
      const winnerParticipant = allParticipants.find((participant) => participant?.id === winnerParticipantId);
      if (!winnerParticipant?.teamId) {
        return false;
      }

      const winnerTeamId = winnerParticipant.teamId;
      markParticipantsAsWinners((participant) => Boolean(participant && participant.teamId === winnerTeamId));
      return true;
    }

    markParticipantsAsWinners((participant) => Boolean(participant && participant.id === winnerParticipantId));
    return true;
  }, [
    allParticipants,
    determineClassicWinnerParticipantId,
    getClassicComparisonValues,
    isTeamMode,
    markParticipantsAsWinners,
  ]);

  const resolveJackpotWinner = useCallback(() => {
    if (jackpotWinnerSet.current) return true;
    const winnerPayload = jackpotWinnerRef.current;
    if (!winnerPayload) return false;

    const winnerIds = winnerPayload.teamIds?.length
      ? winnerPayload.teamIds
      : winnerPayload.id
      ? [winnerPayload.id]
      : [];

    if (!winnerIds.length) return false;

    markParticipantsAsWinners((participant) => Boolean(participant && winnerIds.includes(participant.id)));
    jackpotWinnerSet.current = true;
    return true;
  }, [markParticipantsAsWinners]);

  const resolveSprintWinner = useCallback(() => {
    const sprintData = sprintDataRef.current;
    if (!sprintData?.finalWinnerId) return false;
    const winnerKey = sprintData.finalWinnerId;

    if (isTeamMode) {
      markParticipantsAsWinners((participant) => Boolean(participant && participant.teamId === winnerKey));
    } else {
      markParticipantsAsWinners((participant) => Boolean(participant && participant.id === winnerKey));
    }

    return true;
  }, [isTeamMode, markParticipantsAsWinners]);

  const resolveEliminationWinner = useCallback(() => {
    const eliminationData = eliminationDataRef.current;
    if (!eliminationData?.finalWinnerId) return false;
    const winnerId = eliminationData.finalWinnerId;

    if (isTeamMode) {
      const winnerParticipant = allParticipants.find((participant) => participant?.id === winnerId);
      const teamId = winnerParticipant?.teamId;
      if (!teamId) return false;

      markParticipantsAsWinners((participant) => Boolean(participant && participant.teamId === teamId));
      return true;
    }

    markParticipantsAsWinners((participant) => Boolean(participant && participant.id === winnerId));
    return true;
  }, [allParticipants, isTeamMode, markParticipantsAsWinners]);

  const resolveShareWinners = useCallback(() => {
    if (!allParticipants.length) return false;
    markParticipantsAsWinners(() => true);
    return true;
  }, [allParticipants.length, markParticipantsAsWinners]);

  const resolveWinnersByMode = useCallback(() => {
    if (!allParticipants.length) return false;

    switch (gameMode) {
      case 'share':
        return resolveShareWinners();
      case 'jackpot':
        return resolveJackpotWinner();
      case 'sprint':
        return resolveSprintWinner();
      case 'elimination':
        return resolveEliminationWinner();
      default:
        return resolveClassicModeWinner();
    }
  }, [
    allParticipants.length,
    gameMode,
    resolveClassicModeWinner,
    resolveEliminationWinner,
    resolveJackpotWinner,
    resolveShareWinners,
    resolveSprintWinner,
  ]);

  const hydrateRoundsProgress = useCallback((targetRound: number) => {
    const runtime = battleRuntimeRef.current;
    if (!runtime) return;
    const totals: Record<string, number> = {};
    const nextRoundResults: Record<number, Record<string, SlotSymbol>> = {};
    const completed = new Set<number>();

    runtime.rounds.slice(0, targetRound).forEach((roundPlan) => {
      completed.add(roundPlan.roundIndex);
      const perRoundSymbols: Record<string, SlotSymbol> = {};
      Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
        totals[playerId] = (totals[playerId] ?? 0) + drop.value;
        perRoundSymbols[playerId] = {
          id: drop.itemId,
          name: drop.itemName,
          image: drop.image,
          price: drop.value,
          qualityId: drop.rarity === 'legendary' ? 'legendary' : 'normal',
        };
      });
      nextRoundResults[roundPlan.roundIndex] = perRoundSymbols;
    });

    const safeRound = Math.min(targetRound, runtime.config.roundsTotal);
    dispatchProgressState({
      type: 'APPLY_PROGRESS_SNAPSHOT',
      snapshot: {
        currentRound: safeRound,
        totalRounds: runtime.config.roundsTotal,
        participantValues: totals,
        roundResults: nextRoundResults,
        completedRounds: completed,
        spinState: {
          activeCount: 0,
          completed: new Set<string>(),
        },
        playerSymbols: {},
        slotMachineKeySuffix: {},
        currentRoundPrizes: {},
        roundExecutionFlags: {},
        roundEventLog: [],
      },
    });
    currentRoundRef.current = safeRound;
  }, [dispatchProgressState]);
  
  // UI状态
  const [galleryAlert, setGalleryAlert] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const slotMachineRefs = useRef<Record<string, any>>({});
  const processedRoundEventIdsRef = useRef<Set<string>>(new Set());
  const lastRoundLogRef = useRef<string>('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [activeTeam, setActiveTeam] = useState(0); // 团队模式小屏幕tabs切换
  const [tieBreakerPlan, setTieBreakerPlan] = useState<TieBreakerPlan | null>(null);
  const [tieBreakerGateOpen, setTieBreakerGateOpen] = useState(false);
  const tieBreakerSymbols = useMemo<HorizontalSlotSymbol[]>(() => {
    if (!tieBreakerPlan) return [];
    return tieBreakerPlan.contenderIds.map((id) => {
      const entity = resolveEntityForDisplay(id);
      return {
        id,
        name: entity?.name ?? `玩家 ${id}`,
        description: '',
        image: entity?.avatar || TRANSPARENT_PIXEL,
        price: 0,
        qualityId: null,
      };
    });
  }, [tieBreakerPlan, resolveEntityForDisplay]);
  
  // 兼容旧代码的状态变量（会被状态机同步更新）
  const [allRoundsCompleted, setAllRoundsCompleted] = useState(false);
  const [hidePacks, setHidePacks] = useState(false);
  const [showSlotMachines, setShowSlotMachines] = useState(false);
  const currentRoundRef = useRef(0);
  
  // 🎵 初始化胜利音效（win.wav）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initWinAudio = async () => {
      // 初始化 AudioContext
      if (!(window as any).__audioContext) {
        (window as any).__audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // 加载 win.wav
      if (!(window as any).__winAudioBuffer) {
        try {
          const response = await fetch('/win.wav');
          const arrayBuffer = await response.arrayBuffer();
          const ctx = (window as any).__audioContext;
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          (window as any).__winAudioBuffer = audioBuffer;
        } catch (error) {
          console.error('加载 win.wav 失败:', error);
        }
      }
    };
    
    initWinAudio();
  }, []);

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

  // 🔑 缓存淘汰老虎机的玩家数据，避免每次渲染都重新生成
  const eliminationPlayers = useMemo(() => {
    if (!currentEliminationData?.tiedPlayerIds) return [];
    
    return allParticipants
      .filter(p => currentEliminationData.tiedPlayerIds!.includes(p.id))
      .map(p => {
        // 对于机器人，生成SVG字符串；对于真实玩家，使用avatar URL
        const isBot = p.id.startsWith('bot-') || !p.avatar;
        let avatarData = p.avatar;
        
        if (isBot) {
          // 生成机器人SVG字符串
          const maskId = `mask-${p.id}`;
          avatarData = `<svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
            <mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
              <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#${maskId})">
              <rect width="36" height="36" fill="#333333"></rect>
              <rect x="0" y="0" width="36" height="36" transform="translate(-1 5) rotate(305 18 18) scale(1.2)" fill="#0C8F8F" rx="36"></rect>
              <g transform="translate(-1 1) rotate(5 18 18)">
                <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
                <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
              </g>
            </g>
          </svg>`;
        }
        
        return {
          id: p.id,
          name: p.name,
          avatar: avatarData
        };
      });
  }, [currentEliminationData?.tiedPlayerIds, allParticipants.length]);

  // Pre-generate all results when countdown starts
  const hasGeneratedResultsRef = useRef(false); // Track if results have been generated
const timelineHydratedRef = useRef(false);
const skipDirectlyToCompletedRef = useRef(false);
const forceFullReplayRef = useRef(false);
  
  const generateAllResults = useCallback((allParticipants: any[]): BattleStateData['game']['rounds'] => {
    const runtimePayload = activeSource.buildPayload();
    const runtime = buildBattleRuntime(runtimePayload);
    battleRuntimeRef.current = runtime;

    if (typeof window !== 'undefined') {
      const totalsDebug: Record<string, number> = {};
      runtime.rounds.forEach((roundPlan) => {
        Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
          totalsDebug[playerId] = (totalsDebug[playerId] ?? 0) + drop.value;
        });
      });
      console.table(
        Object.entries(totalsDebug).map(([playerId, total]) => ({
          玩家: allParticipants.find((p) => p.id === playerId)?.name || playerId,
          playerId,
          累计金额: total.toFixed(2),
        })),
      );
      if (runtime.classic?.tieBreakerIds?.length) {
        console.info('[BattleDetail] 经典模式平局玩家', runtime.classic.tieBreakerIds);
      } else {
        console.info('[BattleDetail] 没有平局玩家');
      }
    }

    const detailedResults: Record<number, Record<string, any>> = {};
    runtime.rounds.forEach((roundPlan) => {
      const roundResult: Record<string, any> = {};
      Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
        roundResult[playerId] = {
          道具: drop.itemName,
          品质: drop.rarity === 'legendary' ? 'legendary' : 'normal',
          价格: `¥${drop.value}`,
          需要二段: drop.needsSecondStage ? '是 💛' : '否',
        };
      });
      detailedResults[roundPlan.roundIndex] = roundResult;
    });
    detailedResultsRef.current = detailedResults;

    if (runtime.config.gameplay === 'jackpot') {
      const participantMeta: Record<string, { name: string; totalValue: number }> = {};
      allParticipants.forEach((p) => {
        if (p && p.id) {
          participantMeta[p.id] = { name: p.name, totalValue: 0 };
        }
      });

      const specialRules = runtime.config.specialRules || { lastChance: false, inverted: false };
      const useLastChance = Boolean(specialRules.lastChance);
      const invertedJackpot = Boolean(specialRules.inverted);
      const comparisonValues: Record<string, number> = {};

      if (useLastChance && runtime.rounds.length > 0) {
        const lastRoundPlan = runtime.rounds[runtime.rounds.length - 1];
        Object.entries(lastRoundPlan.drops).forEach(([playerId, drop]) => {
          comparisonValues[playerId] = drop.value;
          if (!participantMeta[playerId]) {
            const participant = allParticipants.find((p) => p.id === playerId);
            participantMeta[playerId] = { name: participant?.name ?? 'Unknown', totalValue: 0 };
            }
          });
        }

      if (!useLastChance || Object.keys(comparisonValues).length === 0) {
        runtime.rounds.forEach((roundPlan) => {
          Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
            comparisonValues[playerId] = (comparisonValues[playerId] || 0) + drop.value;
            if (!participantMeta[playerId]) {
              const participant = allParticipants.find((p) => p.id === playerId);
              participantMeta[playerId] = { name: participant?.name ?? 'Unknown', totalValue: 0 };
            }
            participantMeta[playerId].totalValue += drop.value;
          });
        });
      }

      const valueEntries = Object.entries(comparisonValues);
      if (valueEntries.length > 0) {
        const comparator = invertedJackpot ? Math.min : Math.max;
        const targetValue = comparator(...valueEntries.map(([, value]) => value));
        const candidateIds = valueEntries.filter(([, value]) => value === targetValue).map(([id]) => id);
        const topPlayerId = candidateIds[0] ?? valueEntries[0][0];
        let winnerIds = [topPlayerId];
        const topPlayer = allParticipants.find((p) => p.id === topPlayerId);
        if (topPlayer?.teamId) {
          winnerIds = allParticipants.filter((p) => p.teamId === topPlayer.teamId).map((p) => p.id);
        }

        jackpotWinnerRef.current = {
        id: topPlayerId, 
          name: participantMeta[topPlayerId]?.name ?? '',
          totalValue: targetValue,
          teamIds: winnerIds,
          contenderIds: candidateIds,
          usedLastChance: useLastChance,
        };
      }
    }
    
    if (runtime.config.gameplay === 'sprint') {
      const scores: Record<string, number> = {};
      const roundWinners: Record<number, string[]> = {};
      const isTeam = battleData.battleType === 'team';

      if (isTeam) {
        const teams = new Set(allParticipants.map((p) => p.teamId).filter(Boolean) as string[]);
        teams.forEach((teamId) => {
          scores[teamId] = 0;
        });
      } else {
        allParticipants.forEach((p) => {
          if (p?.id) scores[p.id] = 0;
        });
      }
      
      runtime.rounds.forEach((roundPlan) => {
        const roundIdx = roundPlan.roundIndex;
        const roundPrices: Record<string, number> = {};
        
        if (isTeam) {
          const teamTotals: Record<string, number> = {};
          allParticipants.forEach((participant) => {
            if (!participant?.id || !participant.teamId) return;
            const drop = roundPlan.drops[participant.id];
            if (!drop) return;
            teamTotals[participant.teamId] = (teamTotals[participant.teamId] || 0) + drop.value;
          });
          Object.assign(roundPrices, teamTotals);
        } else {
          Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
            roundPrices[playerId] = drop.value;
          });
        }

        if (Object.keys(roundPrices).length === 0) {
          roundWinners[roundIdx] = [];
          return;
        }

        const comparator = runtime.config.specialRules.inverted ? Math.min : Math.max;
        const targetPrice = comparator(...Object.values(roundPrices));
        const winners = Object.entries(roundPrices)
          .filter(([, price]) => price === targetPrice)
          .map(([id]) => id);

        winners.forEach((id) => {
            scores[id] = (scores[id] || 0) + 1;
        });
        
        roundWinners[roundIdx] = winners;
      });
      
      const maxScore = Math.max(...Object.values(scores));
      const topScorers = Object.entries(scores)
        .filter(([, score]) => score === maxScore)
        .map(([id]) => id);
      const needsTiebreaker = topScorers.length > 1;
      const finalWinnerId = topScorers[0];

      sprintDataRef.current = {
        scores,
        roundWinners,
        finalWinnerId,
        needsTiebreaker,
        tiebreakerPlayers: needsTiebreaker ? topScorers : [],
      };
    }

    if (runtime.config.gameplay === 'elimination') {
      const totalRounds = runtime.rounds.length;
      const playersCount = allParticipants.length;
      const eliminationStartRound = totalRounds - (playersCount - 1);
      const eliminations: Record<number, {
        eliminatedPlayerId: string;
        eliminatedPlayerName: string;
        needsSlotMachine: boolean;
        tiedPlayerIds?: string[];
      }> = {};
      let activePlayerIds = allParticipants.map((p) => p.id);

      const eliminationCount = Math.max(0, playersCount - 1);
      for (let i = 0; i < eliminationCount && eliminationStartRound + i < totalRounds; i++) {
        const roundIdx = eliminationStartRound + i;
        const roundResult = detailedResults[roundIdx];
        if (!roundResult) continue;
        
        const playerPrices = activePlayerIds
          .map((playerId) => {
          const item = roundResult[playerId];
            if (!item || !item.价格) return null;
            return {
              id: playerId,
              name: allParticipants.find((p) => p.id === playerId)?.name || 'Unknown',
              price: parseFloat(item.价格.replace('¥', '')),
            };
          })
          .filter(Boolean) as Array<{ id: string; name: string; price: number }>;

        if (playerPrices.length === 0) continue;

        const targetPrice = runtime.config.specialRules.inverted
          ? Math.max(...playerPrices.map((p) => p.price))
          : Math.min(...playerPrices.map((p) => p.price));
        const targetPlayers = playerPrices.filter((p) => p.price === targetPrice);
        
        if (targetPlayers.length === 1) {
          const eliminated = targetPlayers[0];
          eliminations[roundIdx] = {
            eliminatedPlayerId: eliminated.id,
            eliminatedPlayerName: eliminated.name,
            needsSlotMachine: false,
          };
        } else {
          const chosen = targetPlayers[Math.floor(Math.random() * targetPlayers.length)];
          eliminations[roundIdx] = {
            eliminatedPlayerId: chosen.id,
            eliminatedPlayerName: chosen.name,
            needsSlotMachine: true,
            tiedPlayerIds: targetPlayers.map((p) => p.id),
          };
        }
        
        activePlayerIds = activePlayerIds.filter((id) => id !== eliminations[roundIdx].eliminatedPlayerId);
      }
      
      eliminationDataRef.current = {
        eliminations,
        eliminationStartRound,
        finalWinnerId: activePlayerIds[0],
      };
    }
    return runtime.rounds.map(convertRuntimeRoundToLegacy);
  }, [activeSource, battleData.battleType]);

  // 🎨 大奖模式：在所有插槽填满后分配颜色（只执行一次）
  const colorsAssignedRef = useRef(false);
  
  useEffect(() => {
    if (allSlotsFilled && allParticipants.length > 0 && gameMode === 'jackpot' && !colorsAssignedRef.current) {
      colorsAssignedRef.current = true;
      
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
      });
      
      setPlayerColors(colorMap);
    }
  }, [allSlotsFilled, allParticipants.length, gameMode]);

  // 🎯 STATE TRANSITION: IDLE → LOADING
  useEffect(() => {
    if (mainState === 'IDLE' && allSlotsFilled && allParticipants.length > 0) {
      // 🛡️ 守卫1：确保参与者数量正确
      if (allParticipants.length !== battleData.playersCount) {
        return;
      }
      
      // 🛡️ 守卫2：确保有真实用户（不是全部都是机器人）
      const hasRealUser = allParticipants.some(p => p && p.id && !String(p.id).startsWith('bot-'));
      if (!hasRealUser) {
        return;
      }
      
      setMainState('LOADING');
    } else if (mainState !== 'IDLE' && mainState !== 'COMPLETED' && !allSlotsFilled) {
      // 状态守卫：玩家离开，重置到IDLE（但COMPLETED状态不重置）
      setMainState('IDLE');
      setRoundState(null);
      gameRoundsRef.current = [];
      dispatchProgressState({ type: 'RESET_PROGRESS' });
      dispatchProgressState({ type: 'RESET_SPIN_STATE' });
      setCountdownValue(null);
      setGalleryAlert(false);
      hasGeneratedResultsRef.current = false;
      timelineHydratedRef.current = false;
      colorsAssignedRef.current = false;
      dispatchProgressState({ type: 'RESET_ALL_ROUND_FLAGS' });
      dispatchProgressState({ type: 'RESET_ROUND_EVENT_LOG' });
    }
  }, [mainState, allSlotsFilled, allParticipants.length, dispatchProgressState]);

  // 🎯 STATE TRANSITION: LOADING → COUNTDOWN（只执行一次）
  const participantsSnapshotRef = useRef<any[]>([]);
  
  useEffect(() => {
    if (mainState === 'LOADING' && !hasGeneratedResultsRef.current) {
      // 🔒 标记已生成，防止重复执行
      hasGeneratedResultsRef.current = true;
      
      // 🔒 关键：锁定当前的 allParticipants 快照
      participantsSnapshotRef.current = [...allParticipants];
      
      // 生成所有轮次数据（使用快照）
      const rounds = generateAllResults(participantsSnapshotRef.current);
      
      // 🚀 性能优化：rounds 放在 ref，避免深度比对
      gameRoundsRef.current = rounds;
      
      dispatchProgressState({
        type: 'APPLY_PROGRESS_SNAPSHOT',
        snapshot: {
        currentRound: 0,
          totalRounds: rounds.length,
          participantValues: {},
          roundResults: {},
          completedRounds: new Set(),
          spinState: {
            activeCount: 0,
            completed: new Set<string>(),
          },
          playerSymbols: {},
          slotMachineKeySuffix: {},
          currentRoundPrizes: {},
          roundExecutionFlags: {},
          roundEventLog: [],
        },
      });
      const totalRounds = rounds.length;
      const entryRoundSetting = forceFullReplayRef.current ? 0 : activeSource.entryRound;
      const entryExceedsRounds = totalRounds > 0 && entryRoundSetting > totalRounds;
      skipDirectlyToCompletedRef.current = entryExceedsRounds;

      if (entryExceedsRounds) {
        hydrateRoundsProgress(totalRounds);
        setCountdownValue(null);
        setRoundState(null);
        setMainState('COMPLETED');
        timelineHydratedRef.current = true;
        return;
      }

      skipDirectlyToCompletedRef.current = false;
      forceFullReplayRef.current = false;

      const entryRoundIndex = resolveEntryRoundIndex(totalRounds, entryRoundSetting);
      if (entryRoundIndex !== null) {
        setCountdownValue(null);
        setRoundState('ROUND_RENDER');
        setMainState('ROUND_LOOP');
      } else {
        setMainState('COUNTDOWN');
        setCountdownValue(3);
      }
    }
  }, [
    mainState,
    generateAllResults,
    battleData.packs.length,
    dispatchProgressState,
    setMainState,
    setRoundState,
    activeSource.entryRound,
    hydrateRoundsProgress,
  ]);

  useEffect(() => {
    if (!battleRuntimeRef.current || !hasGeneratedResultsRef.current) return;
    if (timelineHydratedRef.current) return;

    const runtime = battleRuntimeRef.current;
    const totalRounds = runtime.config.roundsTotal;
    const entryRoundSetting = forceFullReplayRef.current ? 0 : activeSource.entryRound;
    const entryExceedsRounds = totalRounds > 0 && entryRoundSetting > totalRounds;
    skipDirectlyToCompletedRef.current = entryExceedsRounds;

    if (entryExceedsRounds) {
      hydrateRoundsProgress(totalRounds);
      setCountdownValue(null);
      setMainState('COMPLETED');
      setRoundState(null);
      timelineHydratedRef.current = true;
      return;
    }

    skipDirectlyToCompletedRef.current = false;
    forceFullReplayRef.current = false;

    const entryRoundIndex = resolveEntryRoundIndex(totalRounds, entryRoundSetting);
    if (entryRoundIndex !== null) {
      hydrateRoundsProgress(entryRoundIndex);
      setCountdownValue(null);
      setMainState('ROUND_LOOP');
      setRoundState('ROUND_RENDER');
      timelineHydratedRef.current = true;
      return;
    }

    const cursor = runtime.timeline.getRoundByTimestamp(Date.now());

    if (cursor.phase === 'COUNTDOWN') {
      const remainSeconds = Math.max(0, Math.ceil(cursor.roundElapsedMs / 1000));
      setCountdownValue(remainSeconds);
      setMainState('COUNTDOWN');
      return;
    }

    if (cursor.phase === 'ROUND') {
      const targetRound = Math.min(cursor.roundIndex, runtime.config.roundsTotal);
      hydrateRoundsProgress(targetRound);
      setCountdownValue(null);
      setMainState('ROUND_LOOP');
      setRoundState('ROUND_RENDER');
      timelineHydratedRef.current = true;
      return;
    }

    if (cursor.phase === 'COMPLETED') {
      hydrateRoundsProgress(runtime.config.roundsTotal);
      setCountdownValue(null);
      setMainState('COMPLETED');
      timelineHydratedRef.current = true;
    }
  }, [hydrateRoundsProgress, setCountdownValue, setMainState, setRoundState, activeSource.entryRound]);

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
      
      // 防止重复执行
      const hasRendered = roundExecutionFlags[currentRound]?.renderStarted;
      if (hasRendered) {
        return;
      }
      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'renderStarted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_RENDER_START');
      
      // 状态守卫：检查轮次有效性
      if (currentRound >= gameData.totalRounds) {
        setMainState('COMPLETED');
        setRoundState(null);
        return;
      }
      
      const currentRoundData = gameRoundsRef.current[currentRound];
      if (!currentRoundData || currentRoundData.pools.normal.length === 0) {
        return;
      }
      
      
      // 🎯 重置这一轮的spinStatus（清除上一轮残留）
      currentRoundData.spinStatus.firstStage.completed.clear();
      currentRoundData.spinStatus.firstStage.gotLegendary.clear();
      currentRoundData.spinStatus.secondStage.active.clear();
      currentRoundData.spinStatus.secondStage.completed.clear();
      
      // 🎯 重置spinningState（关键！防止跨轮误触发）
      dispatchProgressState({ type: 'RESET_SPIN_STATE' });
      
      
      // 等待DOM渲染完成
      setTimeout(() => {
        setRoundState('ROUND_SPIN_FIRST');
      }, 100);
    }
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds, dispatchProgressState, roundExecutionFlags, recordRoundEvent]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_FIRST（第一段转动）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_FIRST') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameRoundsRef.current[currentRound];
      
      if (!currentRoundData) return;
      
      // 防止重复执行
      const firstSpinStarted = roundExecutionFlags[currentRound]?.firstSpinStarted;
      if (firstSpinStarted) {
        return;
      }
      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'firstSpinStarted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_SPIN_FIRST_START');
      
      
      // 重置转动状态
      dispatchProgressState({
        type: 'SET_SPIN_STATE',
        state: {
        activeCount: allParticipants.length,
          completed: new Set<string>(),
        },
      });
    }
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds, allParticipants.length, dispatchProgressState, roundExecutionFlags, recordRoundEvent]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_FIRST → ROUND_CHECK_LEGENDARY
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_FIRST') {
      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
      if (!currentRoundData) return;
      
      // 使用spinningState来监听（这个会正确触发）
      if (spinningState.completed.size === allParticipants.length && allParticipants.length > 0) {
        setRoundState('ROUND_CHECK_LEGENDARY');
        recordRoundEvent(gameData.currentRound, 'ROUND_SPIN_FIRST_STOP');
      }
    }
  }, [mainState, roundState, gameData.currentRound, allParticipants.length, spinningState.completed.size, recordRoundEvent]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_CHECK_LEGENDARY（检查legendary）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_CHECK_LEGENDARY') {
      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
      if (!currentRoundData) {
        return;
      }
      
      const gotLegendary = currentRoundData.spinStatus.firstStage.gotLegendary;
      
      
      if (gotLegendary.size > 0) {
        // 🎵 有人中legendary，播放 special_win 音效
        if (typeof window !== 'undefined') {
          const ctx = (window as any).__audioContext;
          const buffer = (window as any).__specialWinAudioBuffer;
          if (ctx && buffer) {
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
          }
        }
        
        // 等待0.5秒让玩家看清金色占位符
        setTimeout(() => {
          setRoundState('ROUND_PREPARE_SECOND');
        }, 500); // 0.5秒延迟
      } else {
        // 无人中legendary，立即结算
        setRoundState('ROUND_SETTLE');
      }
    }
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_PREPARE_SECOND（准备第二段）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_PREPARE_SECOND') {
      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
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
      
      dispatchProgressState({ type: 'SET_PLAYER_SYMBOLS', symbols: newPlayerSymbols });
      
      // 🎯 为金色玩家改变key，触发老虎机重新挂载
      const newKeySuffix: Record<string, string> = {};
      goldenPlayers.forEach(participantId => {
        newKeySuffix[participantId] = '-second'; // 添加后缀
      });
      dispatchProgressState({ type: 'SET_SLOT_KEY_SUFFIX', suffixMap: newKeySuffix });
      
      
      // 等待老虎机重新挂载完成
      setTimeout(() => {
        setRoundState('ROUND_SPIN_SECOND');
      }, 800); // 更长延迟等待重新挂载
    
    }
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds, allParticipants.length, currentRoundPrizes, dispatchProgressState]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_SECOND（第二段转动）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_SECOND') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameRoundsRef.current[currentRound];
      if (!currentRoundData) return;
      
      // 防止重复执行
      const secondSpinStarted = roundExecutionFlags[currentRound]?.secondSpinStarted;
      if (secondSpinStarted) {
        return;
      }
      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'secondSpinStarted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_SPIN_SECOND_START');
      
      const goldenPlayers = Array.from(currentRoundData.spinStatus.firstStage.gotLegendary);
      
      
      // 🎯 现在更新奖品为真实legendary道具ID
      const newPrizes: Record<string, string> = { ...currentRoundPrizes };
      goldenPlayers.forEach(participantId => {
        const result = currentRoundData.results[participantId];
        if (result) {
          newPrizes[participantId] = result.itemId;
        }
      });
      dispatchProgressState({ type: 'SET_CURRENT_ROUND_PRIZES', prizes: newPrizes });
      
      // 重置第二段状态
      currentRoundData.spinStatus.secondStage.active = new Set(goldenPlayers);
      currentRoundData.spinStatus.secondStage.completed.clear();
      
      // 重置spinning状态（只追踪金色玩家）
      dispatchProgressState({
        type: 'SET_SPIN_STATE',
        state: {
        activeCount: goldenPlayers.length,
          completed: new Set<string>(),
        },
      });
    }
  }, [mainState, roundState, gameData.currentRound, currentRoundPrizes, dispatchProgressState, roundExecutionFlags, recordRoundEvent]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SPIN_SECOND → ROUND_SETTLE
  useEffect(() => {
    if (mainState !== 'ROUND_LOOP' || roundState !== 'ROUND_SPIN_SECOND') {
      return;
    }
      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
      if (!currentRoundData) return;
      
      const activeCount = currentRoundData.spinStatus.secondStage.active.size;
    if (activeCount <= 0) {
      // 等待 second-stage spinner 正式初始化完畢
      return;
    }
    const completedCount = currentRoundData.spinStatus.secondStage.completed.size;
    if (completedCount < activeCount) {
      return;
    }

    recordRoundEvent(gameData.currentRound, 'ROUND_SPIN_SECOND_STOP');
    setRoundState('ROUND_SETTLE');
    dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' }); // 清空玩家数据源
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    spinningState.completed.size,
    dispatchProgressState,
    recordRoundEvent,
  ]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_SETTLE（统一记录所有道具）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SETTLE') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameRoundsRef.current[currentRound];
      
      if (!currentRoundData) return;
      
      // 防止重复执行
      const settleExecuted = roundExecutionFlags[currentRound]?.settleExecuted;
      if (settleExecuted) {
        return;
      }
      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'settleExecuted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_SETTLE_START');
      
      // 🎵 播放回正音效（只播放一次）
      if (typeof window !== 'undefined') {
        const ctx = (window as any).__audioContext;
        const buffer = (window as any).__basicWinAudioBuffer;
        if (ctx && buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }
      }
      
      
      // 🎯 记录所有玩家的最终道具
      const finalResults: Record<string, SlotSymbol> = {};
      const valueDeltas: Record<string, number> = {};
      
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
          const prizeValue = parseFloat(String(item.price || '0')) || 0;
          valueDeltas[participant.id] = (valueDeltas[participant.id] || 0) + prizeValue;
        }
      });
      
      // 🚀 性能优化：标记轮次完成（轻量级state更新）
      dispatchProgressState({ type: 'MARK_ROUND_COMPLETED', roundIndex: currentRound });
      
      // 保存结果（但不触发 ParticipantsWithPrizes 重新渲染）
      dispatchProgressState({
        type: 'UPSERT_ROUND_RESULT',
        roundIndex: currentRound,
        results: finalResults,
      });
      
      // 💰 累加玩家金额
      dispatchProgressState({
        type: 'ACCUMULATE_PARTICIPANT_VALUES',
        deltas: valueDeltas,
      });
      
      // 🏃 积分冲刺模式：从预计算数据更新本轮积分
      if (gameMode === 'sprint') {
    const sprintData = sprintDataRef.current;
        
        if (sprintData && sprintData.roundWinners && sprintData.roundWinners[currentRound]) {
          const roundWinners = sprintData.roundWinners[currentRound];
          
          // 更新积分（从预计算的数据中读取）
          setSprintScores(prev => {
            const newScores = { ...prev };
            
            roundWinners.forEach((winnerId: string) => {
              newScores[winnerId] = (newScores[winnerId] || 0) + 1;
            });
            
            return newScores;
          });
        } 
      }
      
      // 清空玩家数据源（准备下一轮）
      dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });
      
      // 🔥 结果已预设，立即进入下一阶段
      setTimeout(() => {
        // 🔥 淘汰模式：检查是否需要淘汰
        if (gameMode === 'elimination') {
          setRoundState('ROUND_CHECK_ELIMINATION');
        } else {
          setRoundState('ROUND_NEXT');
        }
      }, 100);
    }
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds, allParticipants.length, gameMode, isTeamMode, dispatchProgressState, roundExecutionFlags, recordRoundEvent]);

  useEffect(() => {
    if (!roundEventLog.length) {
      processedRoundEventIdsRef.current.clear();
      return;
    }
    const pendingEvents = roundEventLog.filter(
      (event) => !processedRoundEventIdsRef.current.has(event.id),
    );
    if (!pendingEvents.length) return;
    pendingEvents.forEach((event) => {
      processedRoundEventIdsRef.current.add(event.id);
      switch (event.type) {
        case 'ROUND_SPIN_FIRST_START':
          triggerFirstStageSpin();
          break;
        case 'ROUND_SPIN_SECOND_START':
          triggerSecondStageSpin();
          break;
        case 'ROUND_SPIN_FIRST_STOP':
          dispatchProgressState({
            type: 'SET_SPIN_STATE',
            state: {
              activeCount: allParticipants.length,
              completed: new Set<string>(allParticipants.map((participant) => participant.id!).filter(Boolean)),
            },
          });
          break;
        case 'ROUND_SPIN_SECOND_STOP': {
          const roundData = gameRoundsRef.current[event.roundIndex];
          if (!roundData) break;
          const goldenPlayers = Array.from(roundData.spinStatus.firstStage.gotLegendary);
          dispatchProgressState({
            type: 'SET_SPIN_STATE',
            state: {
              activeCount: goldenPlayers.length,
              completed: new Set<string>(goldenPlayers),
            },
          });
          break;
        }
        default:
          break;
      }
    });
  }, [roundEventLog, triggerFirstStageSpin, triggerSecondStageSpin, allParticipants.length, allParticipants, dispatchProgressState]);

  // 🔥 ROUND_LOOP 子状态机: ROUND_CHECK_ELIMINATION（检查是否需要淘汰）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_CHECK_ELIMINATION') {
      const currentRound = gameData.currentRound;
      const eliminationData = eliminationDataRef.current;
      
      if (!eliminationData || !eliminationData.eliminations) {
        console.warn('⚠️ [淘汰检查] 未找到淘汰数据，跳过淘汰环节');
        setRoundState('ROUND_NEXT');
        return;
      }
      
      const { eliminations, eliminationStartRound } = eliminationData;
      
      // 检查当前轮次是否在淘汰轮次范围内
      // 淘汰应该从 eliminationStartRound 开始，一直到只剩一个人（totalRounds - 1 轮）
      if (currentRound < eliminationStartRound) {
        setRoundState('ROUND_NEXT');
        return;
      }
      
      // 🔥 不应该跳过最后一轮！淘汰要进行到只剩一个人
      // 检查是否已经只剩一个人没被淘汰
      const remainingPlayers = allParticipants.filter(p => !eliminatedPlayerIds.has(p.id));
      if (remainingPlayers.length <= 1) {
        setRoundState('ROUND_NEXT');
        return;
      }
      
      const eliminationInfo = eliminations[currentRound];
      if (!eliminationInfo) {
        setRoundState('ROUND_NEXT');
        return;
      }
      
   
      
      // 保存当前淘汰数据（添加轮次索引）
      setCurrentEliminationData({
        ...eliminationInfo,
        roundIndex: currentRound
      });
      
      if (eliminationInfo.needsSlotMachine) {
        // 🔥 需要老虎机动画 - 不在这里添加淘汰玩家，等老虎机完成后再添加
        setTimeout(() => {
          setRoundState('ROUND_ELIMINATION_SLOT');
        }, 100); // 🔥 结果已预设，立即播放动画
      } else {
        setEliminatedPlayerIds(prev => {
          const newSet = new Set(prev);
          newSet.add(eliminationInfo.eliminatedPlayerId);
          return newSet;
        });
        
        // 🔥 记录淘汰轮次（使用 currentEliminationData 中的 roundIndex）
        setEliminationRounds(prev => {
          const newRounds = {
            ...prev,
            [eliminationInfo.eliminatedPlayerId]: currentRound
          };
          return newRounds;
        });
        
        setTimeout(() => {
          setRoundState('ROUND_ELIMINATION_RESULT');
        }, 100); // 🔥 结果已预设，立即显示
      }
    }
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds, dispatchProgressState]);
  
  // 🔥 ROUND_LOOP 子状态机: ROUND_ELIMINATION_SLOT（播放淘汰老虎机动画）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_ELIMINATION_SLOT') {
      
      // 触发淘汰老虎机组件的动画
      if (eliminationSlotMachineRef.current) {
        eliminationSlotMachineRef.current.startSpin();
      } else {
        setTimeout(() => {
          setRoundState('ROUND_ELIMINATION_RESULT');
        }, 1000);
      }
    }
  }, [mainState, roundState]);
  
  // 🔥 ROUND_LOOP 子状态机: ROUND_ELIMINATION_RESULT（显示淘汰结果）
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_ELIMINATION_RESULT') {
      if (!currentEliminationData) {
        setRoundState('ROUND_NEXT');
        return;
      }
      
      
      // 将玩家添加到已淘汰列表（如果还没添加的话）
      setEliminatedPlayerIds(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(currentEliminationData.eliminatedPlayerId)) {
          newSet.add(currentEliminationData.eliminatedPlayerId);
        }
        return newSet;
      });
      
      // 🔥 记录淘汰轮次（如果还没记录的话）
      setEliminationRounds(prev => {
        if (!(currentEliminationData.eliminatedPlayerId in prev)) {
          const newRounds = {
            ...prev,
            [currentEliminationData.eliminatedPlayerId]: currentEliminationData.roundIndex
          };
          return newRounds;
        }
        return prev;
      });
      
      // 🔥 结果已预设，快速进入下一轮（给用户短暂时间看到淘汰效果）
      setTimeout(() => {
        setCurrentEliminationData(null); // 清空当前淘汰数据
        setRoundState('ROUND_NEXT');
      }, 500);
    }
  }, [mainState, roundState, currentEliminationData]);

  // 🎯 ROUND_LOOP 子状态机: ROUND_NEXT
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_NEXT') {
      const currentRound = gameData.currentRound;
      const nextRound = currentRound + 1;
      
      if (nextRound < gameData.totalRounds) {
        // 🎯 提前准备下一轮的奖品数据（避免竞态条件）
        const nextRoundData = gameRoundsRef.current[nextRound];
        if (nextRoundData) {
          const nextPrizes: Record<string, string> = {};
          
          // 🎯 为所有参与者设置奖品ID
          Object.keys(nextRoundData.results).forEach(participantId => {
            const result = nextRoundData.results[participantId];
            // 第一段期间显示占位符，第二段显示真实ID
            if (result.needsSecondSpin) {
              nextPrizes[participantId] = 'golden_placeholder';
            } else {
              nextPrizes[participantId] = result.itemId;
            }
          });
          
          dispatchProgressState({ type: 'SET_CURRENT_ROUND_PRIZES', prizes: nextPrizes });
        }
        
        // 重置玩家数据源和key后缀
        dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });
        dispatchProgressState({ type: 'RESET_SLOT_KEY_SUFFIX' });
        dispatchProgressState({ type: 'RESET_ROUND_FLAGS', roundIndex: currentRound });
        
        // 更新游戏数据到下一轮
        dispatchProgressState({ type: 'SET_CURRENT_ROUND', currentRound: nextRound });
        
        // 回到ROUND_RENDER开始新一轮
        setRoundState('ROUND_RENDER');
      } else {
        setMainState('COMPLETED');
        setRoundState(null);
      }
    }
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds]);

  useEffect(() => {
    currentRoundRef.current = gameData.currentRound;
  }, [gameData.currentRound]);
  
  useEffect(() => {
    roundStateRef.current = roundState;
  }, [roundState]);
  
  useEffect(() => {
    setHidePacks(mainState !== 'IDLE');
    setShowSlotMachines(mainState === 'ROUND_LOOP');
    setAllRoundsCompleted(mainState === 'COMPLETED');
  }, [mainState]);
  
  useEffect(() => {
    const participantList = battleData.participants || [];
    const roundEntries = Object.entries(roundResults);
    if (!participantList.length || !roundEntries.length) return;

    const signature = roundEntries
      .map(([roundIndex, entries]) => `${roundIndex}:${Object.keys(entries || {}).length}`)
      .sort()
      .join('|');
    if (lastRoundLogRef.current === signature) return;
    lastRoundLogRef.current = signature;

    roundEntries
      .map(([roundIndex]) => Number(roundIndex))
      .sort((a, b) => a - b)
      .forEach((roundIndex) => {
        const perRound = roundResults[roundIndex] || {};
        const tableRows = participantList.map((participant) => {
          const prize = perRound[participant.id];
          return {
            玩家: participant.name,
            道具: prize?.name ?? '尚未揭晓',
            金额: prize ? `¥${Number(prize.price ?? 0).toFixed(2)}` : '—',
          };
        });
        console.groupCollapsed(`【Battle Playback】第 ${roundIndex + 1} 轮结果`);
        console.table(tableRows);
        console.groupEnd();
      });
  }, [battleData.participants, roundResults]);
  

  
  const lastPrizesUpdateRef = useRef<string>('');
  
  useEffect(() => {
    const updateKey = `${gameData.currentRound}-${roundState}`;
    
    if (lastPrizesUpdateRef.current === updateKey) {
      return;
    }
    lastPrizesUpdateRef.current = updateKey;
    
    const currentRoundData = gameRoundsRef.current[gameData.currentRound];
    if (!currentRoundData) return;
    
    
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
    dispatchProgressState({ type: 'SET_CURRENT_ROUND_PRIZES', prizes });
  }, [gameData.currentRound, roundState, dispatchProgressState]);

  // 旧的自动启动逻辑已被状态机接管，删除

  // 🚀 使用 ref 来获取最新的 mainState，避免依赖变化导致回调重新创建
  const mainStateRef = useRef(mainState);
  mainStateRef.current = mainState;
  
  // 🚀 使用 ref 追踪上一次的值，避免不必要的状态更新
  const prevAllSlotsFilledRef = useRef<boolean>(false);
  const prevParticipantsLengthRef = useRef<number>(0);
  
  // Handle when all slots are filled
  const handleAllSlotsFilledChange = useCallback((filled: boolean, participants?: any[]) => {
    // 🔒 守卫1：只在值真正变化时更新
    if (prevAllSlotsFilledRef.current !== filled) {
      prevAllSlotsFilledRef.current = filled;
      setAllSlotsFilled(filled);
    }
    
    if (participants) {
      // 🔒 守卫2：一旦进入 LOADING 或之后的状态，就不再更新参与者列表
      if (mainStateRef.current !== 'IDLE') {
        return;
      }
      
      // 🔒 守卫3：只在参与者数量变化时更新
      if (prevParticipantsLengthRef.current !== participants.length) {
        prevParticipantsLengthRef.current = participants.length;
        setAllParticipants(participants);
      }
    }
  }, []);

  const handleTieBreakerComplete = useCallback(() => {
    const delay = isFastMode ? 120 : 400;
    setTimeout(() => {
      setTieBreakerPlan(null);
      setTieBreakerGateOpen(true);
    }, delay);
  }, [isFastMode, setTieBreakerGateOpen, setTieBreakerPlan]);

  // Handle when a slot machine completes
  const handleSlotComplete = useCallback((participantId: string, result: SlotSymbol) => {
    const round = gameData.currentRound;
    const currentRoundData = gameRoundsRef.current[round];
    
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
      dispatchProgressState({ type: 'ADD_SPIN_COMPLETED', participantId });
      
    } else if (currentRoundState === 'ROUND_SPIN_SECOND') {
      // 🎯 第二段完成处理
      
      // 记录到第二段完成
      currentRoundData.spinStatus.secondStage.completed.add(participantId);
      
      // 更新spinning状态
      dispatchProgressState({ type: 'ADD_SPIN_COMPLETED', participantId });
    }
  }, [gameData, roundState, dispatchProgressState]);

  useEffect(() => {
    if (skipDirectlyToCompletedRef.current) {
      if (tieBreakerPlan !== null) {
        setTieBreakerPlan(null);
      }
      if (!tieBreakerGateOpen) {
        setTieBreakerGateOpen(true);
      }
      return;
    }

    if (mainState !== 'COMPLETED') {
      if (tieBreakerPlan !== null) {
        setTieBreakerPlan(null);
      }
      if (tieBreakerGateOpen) {
        setTieBreakerGateOpen(false);
      }
      return;
    }

    if (tieBreakerGateOpen || tieBreakerPlan) {
      return;
    }

    const plan = evaluateTieBreakerPlan();
    if (plan) {
      setTieBreakerPlan(plan);
    } else {
      setTieBreakerGateOpen(true);
    }
  }, [mainState, tieBreakerGateOpen, tieBreakerPlan, evaluateTieBreakerPlan]);

  // 旧的完成检查和轮次切换逻辑已被状态机接管
  
  // 🎯 COMPLETED状态：显示最终统计和判定获胜者
  useEffect(() => {
    if (mainState === 'COMPLETED') {
      if (gameMode === 'jackpot') {
        if (!jackpotInitialized.current || jackpotPlayerSegments.length === 0) {
          jackpotInitialized.current = true;
          
          let totalPrize = 0;
          allParticipants.forEach((p) => {
            if (p && p.id) {
              totalPrize += participantValues[p.id] || 0;
            }
          });
          
          const segments = allParticipants.map((p) => ({
            id: p.id,
            name: p.name,
            percentage: totalPrize > 0 ? ((participantValues[p.id] || 0) / totalPrize) * 100 : 0,
            color: playerColors[p.id] || 'rgb(128, 128, 128)',
          }));
          
          const preCalculatedWinner = jackpotWinnerRef.current;
          const winnerId = preCalculatedWinner?.id || '';
          
          setJackpotPlayerSegments(segments);
          setJackpotWinnerId(winnerId);
          setJackpotPhase('rolling');
        } else {
          setJackpotPhase('rolling');
        }
      }
      
      const preGenerated = detailedResultsRef.current;
      
      if (preGenerated && roundResults) {
        let matchCount = 0;
        let totalCount = 0;
        
        Object.keys(preGenerated).forEach((roundStr) => {
          const round = parseInt(roundStr, 10);
          
          Object.keys(preGenerated[round] || {}).forEach((participantId) => {
            const expected = preGenerated[round][participantId];
            const actual = roundResults[round]?.[participantId];
            totalCount++;
            
            if (actual) {
              const match = expected.id === actual.id;
              if (match) matchCount++;
            }
          });
        });
      }
    }
  }, [
    mainState,
    roundResults,
    allParticipants,
    gameMode,
    participantValues,
    playerColors,
    jackpotPlayerSegments.length,
  ]);

  useEffect(() => {
    if (mainState !== 'COMPLETED' || !tieBreakerGateOpen) return;
    if (completedWinnerSetRef.current) return;

    const resolved = resolveWinnersByMode();
    if (resolved) {
      completedWinnerSetRef.current = true;
      triggerWinnerCelebration();
    }
  }, [mainState, tieBreakerGateOpen, resolveWinnersByMode, triggerWinnerCelebration]);

  
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
              <div className="flex flex-col items-center justify-center gap-6 w-[1280px] relative" style={{ minHeight: '450px' }}>
                {/* 🎉 烟花动画层 */}
                <FireworkArea ref={winnerFireworkRef} />
                
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
                        forceFullReplayRef.current = true;
                        skipDirectlyToCompletedRef.current = false;
                        
                        // 清除获胜者标记
                        setAllParticipants(prev => prev.map(p => ({
                          ...p,
                          isWinner: false
                        })));
                        timelineHydratedRef.current = false;
                        
                        // 重置 gameData 的当前轮次到第一轮
                        dispatchProgressState({
                          type: 'APPLY_PROGRESS_SNAPSHOT',
                          snapshot: {
                            currentRound: 0,
                            totalRounds: gameData.totalRounds,
                            participantValues: {},
                            roundResults: {},
                            completedRounds: new Set(),
                            spinState: {
                              activeCount: 0,
                              completed: new Set<string>(),
                            },
                            playerSymbols: {},
                            slotMachineKeySuffix: {},
                            currentRoundPrizes: {},
                            roundExecutionFlags: {},
                            roundEventLog: [],
                          },
                        });
                        
                        // 🏃 清空冲刺模式状态
                        setSprintScores({});
                        
                        // 🔥 清空淘汰模式状态
                        setEliminatedPlayerIds(new Set());
                        setEliminationRounds({});
                        setCurrentEliminationData(null);
                        
                        // 🎯 重置COMPLETED状态的防重复标记
                        completedWinnerSetRef.current = false;
                        
                        setMainState('COUNTDOWN');
                        setRoundState(null);
                        setCountdownValue(3);
                        dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });
                        dispatchProgressState({ type: 'RESET_SLOT_KEY_SUFFIX' });
                        dispatchProgressState({ type: 'RESET_SPIN_STATE' });
                        dispatchProgressState({ type: 'RESET_ALL_ROUND_FLAGS' });
                        dispatchProgressState({ type: 'RESET_ROUND_EVENT_LOG' });
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
                <div className="flex gap-4 px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px', position: 'relative' }}>
                  {teamGroups.map((teamMembers, teamIndex) => (
                    <div
                      key={`team-${teamIndex}`}
                      className="flex gap-0 md:gap-4 justify-around flex-1"
                      style={{ height: '450px' }}
                    >
                      {teamMembers.map((participant) => {
                        if (!participant || !participant.id) return null;
                        
                        const currentRoundData = gameRoundsRef.current[gameData.currentRound];
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
                      
                      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
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
                      
                      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
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
                      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
                      if (!currentRoundData) return null;
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      return (
                        <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ marginTop: `${-(450 - 130) / 2}px` }}>
                          <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: !keySuffix ? 1 : 0, pointerEvents: !keySuffix ? 'auto' : 'none', zIndex: !keySuffix ? 1 : 0 }}>
                            <LuckySlotMachine key={`${participant.id}-first`} ref={(ref) => { if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.normal} selectedPrizeId={!keySuffix ? selectedPrizeId : null} height={450}   spinDuration={spinDuration} onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)} />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                              <LuckySlotMachine key={`${participant.id}-second`} ref={(ref) => { if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.legendary} selectedPrizeId={keySuffix ? selectedPrizeId : null} height={450}   spinDuration={spinDuration} onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)} />
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
                      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
                      if (!currentRoundData) return null;
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      return (
                        <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ marginTop: `${-(450 - 130) / 2}px` }}>
                          <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: !keySuffix ? 1 : 0, pointerEvents: !keySuffix ? 'auto' : 'none', zIndex: !keySuffix ? 1 : 0 }}>
                            <LuckySlotMachine key={`${participant.id}-first`} ref={(ref) => { if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.normal} selectedPrizeId={!keySuffix ? selectedPrizeId : null} height={450}   spinDuration={spinDuration} onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)} />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                              <LuckySlotMachine key={`${participant.id}-second`} ref={(ref) => { if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.legendary} selectedPrizeId={keySuffix ? selectedPrizeId : null} height={450}   spinDuration={spinDuration} onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)} />
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
                      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
                      if (!currentRoundData) return null;
                      const selectedPrizeId = currentRoundPrizes[participant.id];
                      const keySuffix = slotMachineKeySuffix[participant.id] || '';
                      const isGoldenPlayer = currentRoundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                      return (
                        <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ marginTop: `${-(450 - 130) / 2}px` }}>
                          <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: !keySuffix ? 1 : 0, pointerEvents: !keySuffix ? 'auto' : 'none', zIndex: !keySuffix ? 1 : 0 }}>
                            <LuckySlotMachine key={`${participant.id}-first`} ref={(ref) => { if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.normal} selectedPrizeId={!keySuffix ? selectedPrizeId : null} height={450}   spinDuration={spinDuration} onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)} />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                              <LuckySlotMachine key={`${participant.id}-second`} ref={(ref) => { if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref; }} symbols={currentRoundData.pools.legendary} selectedPrizeId={keySuffix ? selectedPrizeId : null} height={450}   spinDuration={spinDuration} onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)} />
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
                        {/* 🚀 只渲染当前轮次的老虎机 - 性能优化 */}
                        {(() => {
                          const roundIndex = gameData.currentRound;
                          const roundData = gameRoundsRef.current[roundIndex];
                          if (!roundData) return null;
                          
                          const selectedPrizeId = currentRoundPrizes[participant.id];
                          
                          // 🛡️ 守卫：如果奖品ID未设置，不渲染老虎机
                          if (!selectedPrizeId) {
                            console.warn(`⚠️ selectedPrizeId 未设置，参与者: ${participant.name}, 轮次: ${roundIndex}`);
                            return null;
                          }
                          
                          const keySuffix = slotMachineKeySuffix[participant.id] || '';
                          const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                          
                          return (
                            <div key={`round-${roundIndex}`} className="absolute inset-0">
                              {/* 第一段老虎机 */}
                              <div 
                                className="w-full transition-opacity duration-300 absolute inset-0" 
                                style={{ 
                                  opacity: !keySuffix ? 1 : 0,
                                  pointerEvents: !keySuffix ? 'auto' : 'none',
                                  zIndex: !keySuffix ? 1 : 0
                                }}
                              >
                                <LuckySlotMachine
                                  key={`${participant.id}-first`}
                                  ref={(ref) => {
                                    if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  symbols={roundData.pools.normal}
                                  selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                                  height={450}
                                  spinDuration={spinDuration}
                                  onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                                />
                              </div>
                              
                              {/* 第二段老虎机 */}
                              {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
                                <div 
                                  className="w-full transition-opacity duration-300 absolute inset-0" 
                                  style={{ 
                                    opacity: keySuffix ? 1 : 0,
                                    pointerEvents: keySuffix ? 'auto' : 'none',
                                    zIndex: keySuffix ? 1 : 0
                                  }}
                                >
                                  <LuckySlotMachine
                                    key={`${participant.id}-second`}
                                    ref={(ref) => {
                                      if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    symbols={roundData.pools.legendary}
                                    selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    spinDuration={spinDuration}
                                    onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                        {/* 🚀 只渲染当前轮次的老虎机 - 性能优化 */}
                        {(() => {
                          const roundIndex = gameData.currentRound;
                          const roundData = gameRoundsRef.current[roundIndex];
                          if (!roundData) return null;
                          
                          const selectedPrizeId = currentRoundPrizes[participant.id];
                          
                          // 🛡️ 守卫：如果奖品ID未设置，不渲染老虎机
                          if (!selectedPrizeId) {
                            console.warn(`⚠️ selectedPrizeId 未设置，参与者: ${participant.name}, 轮次: ${roundIndex}`);
                            return null;
                          }
                          
                          const keySuffix = slotMachineKeySuffix[participant.id] || '';
                          const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                          
                          return (
                            <div key={`round-${roundIndex}`} className="absolute inset-0">
                              {/* 第一段老虎机 */}
                              <div 
                                className="w-full transition-opacity duration-300 absolute inset-0" 
                                style={{ 
                                  opacity: !keySuffix ? 1 : 0,
                                  pointerEvents: !keySuffix ? 'auto' : 'none',
                                  zIndex: !keySuffix ? 1 : 0
                                }}
                              >
                                <LuckySlotMachine
                                  key={`${participant.id}-first`}
                                  ref={(ref) => {
                                    if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  symbols={roundData.pools.normal}
                                  selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                                  height={450}
                                  spinDuration={spinDuration}
                                  onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                                />
                              </div>
                              
                              {/* 第二段老虎机 */}
                              {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
                                <div 
                                  className="w-full transition-opacity duration-300 absolute inset-0" 
                                  style={{ 
                                    opacity: keySuffix ? 1 : 0,
                                    pointerEvents: keySuffix ? 'auto' : 'none',
                                    zIndex: keySuffix ? 1 : 0
                                  }}
                                >
                                  <LuckySlotMachine
                                    key={`${participant.id}-second`}
                                    ref={(ref) => {
                                      if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    symbols={roundData.pools.legendary}
                                    selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    spinDuration={spinDuration}
                                    onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex gap-0 md:gap-4 px-4 overflow-x-hidden w-full max-w-[1248px] justify-around" style={{ height: '450px', position: 'relative' }}>
                {allParticipants.map((participant) => {
                  if (!participant || !participant.id) return null;
                  
                  return (
                    <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ height: '450px' }}>
                      {/* 🚀 只渲染当前轮次的老虎机 - 性能优化 */}
                      {(() => {
                        const roundIndex = gameData.currentRound;
                        const roundData = gameRoundsRef.current[roundIndex];
                        if (!roundData) return null;
                        
                        const selectedPrizeId = currentRoundPrizes[participant.id];
                        const keySuffix = slotMachineKeySuffix[participant.id] || '';
                        const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                        
                        return (
                          <div key={`round-${roundIndex}`} className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
                            {/* 第一段老虎机 */}
                            <div 
                              className="w-full transition-opacity duration-300 absolute inset-0" 
                              style={{ 
                                opacity: !keySuffix ? 1 : 0,
                                pointerEvents: !keySuffix ? 'auto' : 'none',
                                zIndex: !keySuffix ? 1 : 0
                              }}
                            >
                             <LuckySlotMachine
                               key={`${participant.id}-${roundIndex}-first`}
                               ref={(ref) => {
                                 if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                               }}
                               symbols={roundData.pools.normal}
                               selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                               height={450}
                               spinDuration={spinDuration}
                              onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                            />
                            </div>
                            
                            {/* 第二段老虎机 */}
                            {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
                              <div 
                                className="w-full transition-opacity duration-300 absolute inset-0" 
                                style={{ 
                                  opacity: keySuffix ? 1 : 0,
                                  pointerEvents: keySuffix ? 'auto' : 'none',
                                  zIndex: keySuffix ? 1 : 0
                                }}
                              >
                                <LuckySlotMachine
                                  key={`${participant.id}-${roundIndex}-second`}
                                  ref={(ref) => {
                                    if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  symbols={roundData.pools.legendary}
                                  selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                  height={450}
                                  spinDuration={spinDuration}
                                  onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        
        {/* 🔥 横向决胜老虎机 - 经典 / Jackpot Last Chance / Sprint */}
        {tieBreakerPlan &&
         mainState === 'COMPLETED' &&
         tieBreakerSymbols.length > 1 && (
          <div
            className="flex absolute justify-center items-center flex-col"
            style={{
              height: '450px',
              width: '100vw',
              backgroundColor: '#191d21',
              zIndex: 55,
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <HorizontalLuckySlotMachine
              key={`tie-breaker-${tieBreakerPlan.mode}`}
              symbols={tieBreakerSymbols}
              selectedPrizeId={tieBreakerPlan.winnerId}
              onSpinComplete={handleTieBreakerComplete}
              width={9999}
              spinDuration={isFastMode ? 1000 : 4500}
              isEliminationMode={true}
            />
          </div>
        )}
        
        {/* 🔥 淘汰老虎机覆盖层 - 统一覆盖所有模式 */}
        {gameMode === 'elimination' && 
         roundState === 'ROUND_ELIMINATION_SLOT' && 
         currentEliminationData && 
         currentEliminationData.needsSlotMachine && 
         currentEliminationData.tiedPlayerIds && (
          <div className="flex absolute justify-center items-center flex-col" style={{ 
            height: '450px',
            width: '100vw',
            backgroundColor: '#191d21',
            zIndex: 50,
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <EliminationSlotMachine
              ref={eliminationSlotMachineRef}
              players={eliminationPlayers}
              selectedPlayerId={currentEliminationData.eliminatedPlayerId}
              onSpinComplete={handleEliminationSlotComplete}
              isFastMode={isFastMode}
            />
          </div>
        )}
        </div>
        <div className="w-full ">
          <div className="flex w-full max-w-[1280px] mx-auto flex-col gap-6">
            <ParticipantsWithPrizes
              battleData={battleData}
              onAllSlotsFilledChange={handleAllSlotsFilledChange}
              roundResults={roundResultsArray}
              participantValues={participantValues}
              gameMode={gameMode}
              playerColors={playerColors}
              eliminatedPlayerIds={eliminatedPlayerIds}
              eliminationRounds={eliminationRounds}
              sprintScores={sprintScores}
              currentRound={gameData.currentRound}
              completedRounds={completedRounds}
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
