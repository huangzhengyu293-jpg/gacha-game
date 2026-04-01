"use client";

import { Fragment, useEffect, useState, useRef, useCallback, useMemo, useReducer } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { gsap } from "gsap";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import type { PackItem, Participant, BattleData } from "./types";
import LuckySlotMachine, { type SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import EliminationSlotMachine, { type PlayerSymbol, type EliminationSlotMachineHandle } from "./components/EliminationSlotMachine";
import BattleSlotDivider from "../components/BattleSlotDivider";
import FireworkArea, { FireworkAreaHandle } from '@/app/components/FireworkArea';
import HorizontalLuckySlotMachine, { type SlotSymbol as HorizontalSlotSymbol } from '@/app/components/SlotMachine/HorizontalLuckySlotMachine';
import LoadingSpinnerIcon from '@/app/components/icons/LoadingSpinner';
import { api, type CreateBattlePayload } from '@/app/lib/api';
import { BATTLE_LIST_PATH } from '@/app/lib/battleRoutes';
import { useAuth } from '@/app/hooks/useAuth';
import { buildBattleDataFromRaw, buildBattlePayloadFromRaw, type BattleSpecialOptions } from './battleDetailBuilder';
import { allocateJackpotPercentageBps } from './utils';
import { useI18n } from '../../components/I18nProvider';
import { showGlobalToast } from '../../components/ToastProvider';
import type { FightDetailRaw } from '@/types/fight';
import type {
  BackendBattlePayload,
  BackendRoundPlan,
  BattleConfigPayload,
} from './battlePayloadTypes';

function resolveEntryRoundIndex(totalRounds: number, entryRoundSetting: number): number | null {
  if (totalRounds <= 0 || entryRoundSetting <= 0) {
    return null;
  }
  const zeroBased = Math.min(entryRoundSetting - 1, totalRounds - 1);
  return Math.max(0, zeroBased);
}

const GAMEPLAY_TO_MODE_MAP: Record<string, CreateBattlePayload['mode']> = {
  classic: 0,
  share: 1,
  sprint: 2,
  jackpot: 3,
  elimination: 4,
};

const TEAM_STRUCTURE_TO_SIZE_MAP: Record<string, CreateBattlePayload['team_size']> = {
  '2v2': 0,
  '3v3': 1,
  '2v2v2': 2,
};

function normalizeNumericValue(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type BattleDataSourceConfig = {
  id: string;
  entryRound: number;
  buildData: () => BattleData;
  buildPayload: () => BackendBattlePayload;
};

dayjs.extend(customParseFormat);

const KNOWN_TIME_FORMATS = ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'];
const NORMAL_ROUND_DURATION_MS = 6000;
const FAST_ROUND_DURATION_MS = 1000;
const ENTRY_DELAY_MS = 5000;
const SECOND_STAGE_RESULT_PAUSE_MS = 500;
type DayjsInstance = ReturnType<typeof dayjs>;

function buildBattleSlotPoolSignature(symbols: SlotSymbol[]): string {
  // 作为 seed 的一部分：同一场对战中若池内容变化，滚动表现变化也“可解释”
  return symbols.map((s) => s.id).join(',');
}

function buildBattleSlotRngSeed(args: {
  battleId: string | null;
  roundIndex: number;
  participantId: string;
  pool: 'normal' | 'legendary';
  stage: 'first' | 'second';
  symbols: SlotSymbol[];
}): string | undefined {
  if (!args.battleId) return undefined;
  const poolSig = buildBattleSlotPoolSignature(args.symbols);
  return `battle:${args.battleId}|round:${args.roundIndex}|player:${args.participantId}|pool:${args.pool}|stage:${args.stage}|poolSig:${poolSig}`;
}

function xfnv1a32(input: string): number {
  // 32-bit FNV-1a：跨设备/跨刷新稳定
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seedToUnitFloat(seed: string): number {
  // [0, 1)
  return xfnv1a32(seed) / 4294967296;
}

function buildJackpotSegmentsSignature(
  segments: Array<{ id: string; percentage: number; color: string }>,
): string {
  // 作为 seed 的一部分：确保同一局同一段数据得到同一停点
  // 注意：保持顺序敏感（顺序变化时 seed 也会变化）
  return segments.map((s) => `${s.id}:${s.percentage}:${s.color}`).join('|');
}

function buildJackpotRngSeed(args: {
  battleId: string | null;
  roundIndex: number;
  winnerId: string;
  segments: Array<{ id: string; percentage: number; color: string }>;
}): string | undefined {
  if (!args.battleId) return undefined;
  const sig = buildJackpotSegmentsSignature(args.segments);
  return `battle:${args.battleId}|round:${args.roundIndex}|mode:jackpot|winner:${args.winnerId}|segments:${sig}`;
}



function parseTimestampToDayjs(value: unknown): DayjsInstance | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    const ms = value > 1e12 ? value : value * 1000;
    const parsed = dayjs(ms);
    return parsed.isValid() ? parsed : null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d+$/.test(trimmed)) {
    const numericParsed = dayjs.unix(Number(trimmed));
    return numericParsed.isValid() ? numericParsed : null;
  }
  const normalized = trimmed.replace('T', ' ');
  const parsedWithFormat = dayjs(normalized, KNOWN_TIME_FORMATS, true);
  if (parsedWithFormat.isValid()) {
    return parsedWithFormat;
  }
  const parsed = dayjs(normalized);
  return parsed.isValid() ? parsed : null;
}

function computeEntryRoundSetting(rawDetail: FightDetailRaw | null | undefined, specialOptions: BattleSpecialOptions): number {
  if (!rawDetail) {
    return 0;
  }
  const status = Number(rawDetail.status ?? 0);
  if (status === 0) {
    return 0;
  }

  // 只用 now_at 与 updated_at 计算轮次
  const startAt = parseTimestampToDayjs(rawDetail.updated_at);
  if (!startAt) {
    return 0;
  }

  let nowAt = parseTimestampToDayjs(rawDetail.now_at);
  if (!nowAt || nowAt.isBefore(startAt)) {
    nowAt = dayjs();
  }

  const diffMs = Math.max(0, nowAt.diff(startAt));
  const adjustedMs = Math.max(0, diffMs - ENTRY_DELAY_MS);
  const roundDuration = specialOptions.fast ? FAST_ROUND_DURATION_MS : NORMAL_ROUND_DURATION_MS;
  const computed = roundDuration > 0 ? Math.floor(adjustedMs / roundDuration) : 0;

  if (!Number.isFinite(computed) || computed <= 0) {
    return 0;
  }
  return computed;
}

const SlotEdgePointer = ({ side }: { side: 'left' | 'right' | 'top' | 'bottom' }) => {
  const rotationMap: Record<'left' | 'right' | 'top' | 'bottom', number> = {
    left: 0,
    right: 180,
    top: 90, // arrow points downward toward center
    bottom: -90, // arrow points upward toward center
  };
  const positionStyle =
    side === 'left'
      ? { top: '50%', left: '12px', transform: 'translateY(-50%)' }
      : side === 'right'
        ? { top: '50%', right: '12px', transform: 'translateY(-50%)' }
        : side === 'top'
          ? { left: '50%', top: '0px', transform: 'translateX(-50%)' }
          : { left: '50%', bottom: '0px', transform: 'translateX(-50%)' };

  return (
    <div
      className="pointer-events-none absolute flex h-6 w-6 items-center justify-center text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
      style={positionStyle}
    >
      <svg
        viewBox="0 0 14 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        style={{ transform: `rotate(${rotationMap[side]}deg)` }}
      >
        <path
          d="M3.00255 0.739429L12.1147 6.01823C13.4213 6.77519 13.4499 8.65172 12.1668 9.44808L3.05473 15.1039C1.72243 15.9309 0 14.9727 0 13.4047V2.47C0 0.929093 1.66922 -0.0329925 3.00255 0.739429Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

// 🎰 大奖模式内联进度条组件（避免重复挂载问题）
function JackpotProgressBarInline({ 
  players, 
  winnerId, 
  onComplete,
  rngSeed,
}: { 
  players: Array<{id: string; name: string; percentage: number; color: string}>; 
  winnerId: string; 
  onComplete: () => void;
  rngSeed?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const executed = useRef(false);
  const loggedOnce = useRef(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  // 只在组件首次渲染时打印一次
  if (!loggedOnce.current) {
    loggedOnce.current = true;
  }

  // 让“渲染用宽度”和“动画用宽度”完全一致（尤其是移动端小宽度时）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
    const measure = () => {
      const currentEl = containerRef.current;
      if (!currentEl) return;
      const nextWidth = currentEl.getBoundingClientRect().width;
      if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;

      // 避免过于频繁的 setState（移动端地址栏伸缩时可能触发很多次）
      setContainerWidth((prev) => (Math.abs(prev - nextWidth) < 0.5 ? prev : nextWidth));
    };

    const scheduleMeasure = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    scheduleMeasure();

    // ResizeObserver 不可用时回退到 window resize
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', scheduleMeasure);
      return () => {
        window.removeEventListener('resize', scheduleMeasure);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(el);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
  
  useEffect(() => {
    if (
      executed.current ||
      !containerRef.current ||
      !segmentsRef.current ||
      !Array.isArray(players) ||
      players.length === 0 ||
      !winnerId ||
      !Number.isFinite(containerWidth) ||
      containerWidth <= 0
    ) {
      return;
    }
    
    executed.current = true;
    
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
    
    // 🎲 在获胜者色块内选择停止位置，但要避开边界，避免视觉上像“隔壁色块中奖”
    const unit = rngSeed ? seedToUnitFloat(`${rngSeed}|stopPercent`) : Math.random();
    const winnerRangePercent = Math.max(0, winnerEndPercent - winnerStartPercent);
    const winnerRangePixels = (winnerRangePercent / 100) * containerWidth;
    // 安全内缩：至少 3px；常规按 12% 内缩；最多不超过 18px
    const edgeInsetPx = Math.min(18, Math.max(3, winnerRangePixels * 0.12));
    let randomPixelsInWinner: number;
    if (winnerRangePixels > edgeInsetPx * 2 + 1) {
      const safeStartPx = edgeInsetPx;
      const safeEndPx = winnerRangePixels - edgeInsetPx;
      randomPixelsInWinner = safeStartPx + unit * (safeEndPx - safeStartPx);
    } else {
      // 区段太窄时退回中心，尽可能远离边界
      randomPixelsInWinner = winnerRangePixels / 2;
    }
    const randomPercent = winnerStartPercent + (randomPixelsInWinner / containerWidth) * 100;
    
    // 计算这个随机位置在第 N 份色条中的绝对像素位置
    // 注意：这里必须和渲染时每份色条的宽度保持一致（用同一个 containerWidth）
    const TOTAL_COPIES = 10;
    const TARGET_COPY_INDEX = 6; // 0-based：越大滚动越长
    const safeCopyIndex = Math.min(Math.max(0, TARGET_COPY_INDEX), Math.max(0, TOTAL_COPIES - 1));
    const randomPixels = (randomPercent / 100) * containerWidth;
    const randomAbsolutePos = (safeCopyIndex * containerWidth) + randomPixels;
    
    // 需要移动的距离 = 随机位置 - 屏幕中心
    const moveDistance = randomAbsolutePos - screenCenter;
    
    gsap.set(segmentsRef.current, { x: 0 });
    const timeoutId = window.setTimeout(() => {
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

    return () => {
      window.clearTimeout(timeoutId);
      if (segmentsRef.current) {
        gsap.killTweensOf(segmentsRef.current);
      }
    };
  }, [players, winnerId, onComplete, containerWidth, rngSeed]);
  
  // 渲染色块（使用 flex 布局形成连续的色条）
  const renderSegments = (width: number) => {
    const segments = [];
    
    for (let copy = 0; copy < 10; copy++) {
      for (const player of players) {
        const widthPx = (player.percentage / 100) * width;
        const lighter = adjustColor(player.color, 20);
        
        segments.push(
          <div
            key={`${copy}-${player.id}`}
            className="h-full flex-shrink-0"
            style={{
              width: `${widthPx}px`,
              // 用 inset 內框替代 border，避免改變實際寬度造成停點映射偏移
              boxShadow: `inset 0 0 0 1px ${player.color}`,
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
            {containerWidth > 0 ? renderSegments(containerWidth) : null}
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

const QUALITY_MAP_WIN: Record<number, string> = {
  1: 'legendary',
  2: 'mythic',
  3: 'epic',
  4: 'rare',
  5: 'common',
};

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
  | 'ROUND_JACKPOT_ROLL'         // 🎰 大奖模式：色条滚动阶段
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
const audioInitPromiseRef: { current: Promise<void> | null } = { current: null };

const isSiteMuted = () => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).__siteMuted);
};

function initAudioOnce(): Promise<void> {
  if (audioInitPromiseRef.current) return audioInitPromiseRef.current;
  audioInitPromiseRef.current = (async () => {
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
  })();
  return audioInitPromiseRef.current;
}

function collectAllImageUrls(rounds: Array<ReturnType<typeof convertRuntimeRoundToLegacy>>, participants: any[], battleData: BattleData): string[] {
  const urls: string[] = [];

  // 来自回合奖池
  rounds.forEach((round) => {
    const pools: Array<SlotSymbol[] | SlotSymbol | undefined> = [
      round.pools.normal,
      round.pools.legendary,
      round.pools.placeholder,
    ];
    pools.forEach((pool) => {
      const list = Array.isArray(pool) ? pool : pool ? [pool] : [];
      list.forEach((symbol: SlotSymbol) => {
        if (symbol?.image) {
          urls.push(symbol.image);
        }
      });
    });
  });

  // 参与者头像
  participants.forEach((p) => {
    if (p?.avatar) {
      urls.push(p.avatar);
    }
  });

  // 卡包与道具
  (battleData?.packs ?? []).forEach((pack) => {
    if (!pack) return;
    const packUrls = [(pack as any)?.image, (pack as any)?.cover, (pack as any)?.banner].filter(Boolean) as string[];
    urls.push(...packUrls);
    const items: any[] = Array.isArray((pack as any)?.items) ? (pack as any).items : [];
    items.forEach((item) => {
      const itemUrls = [item?.image, item?.cover].filter(Boolean) as string[];
      urls.push(...itemUrls);
    });
  });

  return Array.from(new Set(urls));
}

function preloadImages(urls: string[]): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!urls.length) return Promise.resolve();
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => {});
}

export default function BattleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const routeBattleId = params?.id ?? null;
  const { user, fetchUserBean } = useAuth();
  const { t } = useI18n();
  const currentUserId = user?.userInfo?.id ?? user?.id ?? null;
  const normalizedCurrentUserId = currentUserId !== null && currentUserId !== undefined ? String(currentUserId) : null;
  const previousStatusRef = useRef<number | null>(null);
  const postStartSyncStatusRef = useRef<number | null>(null);
  const pendingPollIntervalRef = useRef<ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null>(null);
  const previousRouteBattleIdRef = useRef<string | null>(null);
  const [isDetailUiReady, setIsDetailUiReady] = useState(false);

  useEffect(() => {
    if (!routeBattleId) {
      router.push(BATTLE_LIST_PATH);
    }
  }, [routeBattleId, router]);

  const queryClient = useQueryClient();

  // 🔥 强制刷新：每次 routeBattleId 变化时（从列表页点击进入时），清除缓存并强制刷新
  useEffect(() => {
    const prevId = previousRouteBattleIdRef.current;
    // 切换详情时，优先清掉“上一个 id”的查询，避免遗留 observer/轮询引用
    if (prevId && prevId !== routeBattleId) {
      queryClient.removeQueries({ queryKey: ['fightDetail', prevId], exact: true });
    }
    // 进入详情时，清掉当前 id 的旧缓存（强制重新拉取）
    if (routeBattleId) {
      queryClient.removeQueries({ queryKey: ['fightDetail', routeBattleId], exact: true });
    }
    previousRouteBattleIdRef.current = routeBattleId;
  }, [routeBattleId, queryClient]);

  // 切换详情时，重置“内容初始化完成”标记，确保首屏 loading 覆盖整段初始化期
  useEffect(() => {
    setIsDetailUiReady(false);
  }, [routeBattleId]);

  const { data: fightDetailResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['fightDetail', routeBattleId],
    enabled: Boolean(routeBattleId),
    queryFn: async () => {
      if (!routeBattleId) {
        throw new Error('缺少對戰 ID');
      }
      return api.getFightDetail(routeBattleId);
    },
    keepPreviousData: false, // 🔥 不使用缓存数据，每次都获取最新数据
    refetchOnMount: false, // 🔥 禁用自动刷新，由轮询逻辑统一控制
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0, // 🔥 数据立即过期，强制重新获取
    cacheTime: 0, // 🔥 不使用缓存
  });

  const refetchRef = useRef(refetch);
  const currentRouteBattleIdRef = useRef(routeBattleId); // 🔥 存储当前的 routeBattleId，用于轮询时检查
  const rawDetail = fightDetailResponse?.data;
  const rawStatus = Number(rawDetail?.status ?? 0);
  const hasWinBoxData = useMemo(() => {
    const winBox = rawDetail?.data?.win?.box;
    if (!winBox || typeof winBox !== 'object') {
      return false;
    }
    return Object.values(winBox).some((entries) => Array.isArray(entries) && entries.length > 0);
  }, [rawDetail?.data?.win?.box]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const wasPending = postStartSyncStatusRef.current === 0;
    // 仅在从待开局(0)切换到进行中(1)时做一次同步，结束态(>=2)不再重复请求
    if (wasPending && rawStatus === 1) {
      timeout = setTimeout(() => {
        refetch().catch(() => {});
      }, 500);
    }
    postStartSyncStatusRef.current = rawStatus;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [rawStatus, refetch]);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // 🔥 更新当前的 routeBattleId ref
  useEffect(() => {
    currentRouteBattleIdRef.current = routeBattleId;
  }, [routeBattleId]);

  useEffect(() => {
    // 关键：路由切换/组件卸载时，用 cancelled 阻止“未完成的 pollOnce”在 await 结束后继续 setTimeout
    let cancelled = false;

    // 🔥 清除之前的轮询（无论是 interval 还是 timeout）
    if (pendingPollIntervalRef.current) {
      if (typeof pendingPollIntervalRef.current === 'number') {
        clearTimeout(pendingPollIntervalRef.current);
      } else {
        clearInterval(pendingPollIntervalRef.current);
      }
      pendingPollIntervalRef.current = null;
    }

    // 轮询进行中：等待开局或等待掉落数据生成（win.box 未就绪时继续）
    // 🔥 修复：status >= 2 时（已完成），应该停止轮询
    const shouldPoll =
      Boolean(routeBattleId) && 
      (rawStatus < 2 || !hasWinBoxData);
    
    if (!shouldPoll) {
      return undefined;
    }

    // 🔥 优化：改为串行轮询，只有在上一次请求成功返回后才发起下一次请求
    // 这样可以避免请求堆积，确保读取到最新的数据
    const pollOnce = async () => {
      if (cancelled) return;
      // 🔥 修复：检查 routeBattleId 是否变化，如果变化了则停止轮询
      const currentId = currentRouteBattleIdRef.current;
      if (!currentId || currentId !== routeBattleId) {
        // routeBattleId 已经变化，停止轮询
        pendingPollIntervalRef.current = null;
        return;
      }

      try {
        const result = await refetchRef.current?.();
        if (cancelled) return;
        
        // 🔥 再次检查 routeBattleId 是否变化（可能在请求过程中变化了）
        if (currentRouteBattleIdRef.current !== routeBattleId) {
          pendingPollIntervalRef.current = null;
          return;
        }
        
        // 🔥 使用 refetch 返回的最新数据来判断是否继续轮询
        // refetch 返回的 result.data 就是 ApiResponse<FightDetailRaw>，result.data.data 才是 FightDetailRaw
        const latestDetail = result?.data?.data;
        if (latestDetail) {
          const currentStatus = Number(latestDetail.status ?? 0);
          const currentWinBox = latestDetail.data?.win?.box;
          const currentHasWinBoxData = currentWinBox && typeof currentWinBox === 'object' 
            ? Object.values(currentWinBox).some((entries) => Array.isArray(entries) && entries.length > 0)
            : false;
          
          // 🔥 再次检查 routeBattleId 是否变化
          if (currentRouteBattleIdRef.current !== routeBattleId) {
            pendingPollIntervalRef.current = null;
            return;
          }
          
          const shouldContinuePoll =
            Boolean(routeBattleId) && 
            (currentStatus < 2 || !currentHasWinBoxData);
          
          if (shouldContinuePoll) {
            // 🔥 如果返回结果没达到要求，1秒后发起下一次查询
            if (cancelled) return;
            pendingPollIntervalRef.current = setTimeout(pollOnce, 1000);
          } else {
            // 停止轮询
            pendingPollIntervalRef.current = null;
          }
        } else {
          // 🔥 再次检查 routeBattleId 是否变化
          if (currentRouteBattleIdRef.current !== routeBattleId) {
            pendingPollIntervalRef.current = null;
            return;
          }
          // 如果没有返回数据，1秒后继续轮询（可能是网络问题或数据未准备好）
          if (cancelled) return;
          pendingPollIntervalRef.current = setTimeout(pollOnce, 1000);
        }
      } catch (err) {
        if (cancelled) return;
        // 🔥 再次检查 routeBattleId 是否变化
        if (currentRouteBattleIdRef.current !== routeBattleId) {
          pendingPollIntervalRef.current = null;
          return;
        }
        // 请求失败也1秒后继续轮询，避免网络问题导致停止
        if (cancelled) return;
        pendingPollIntervalRef.current = setTimeout(pollOnce, 1000);
      }
    };

    // 🔥 修复：延迟开始第一次轮询，避免与 useQuery 的初始查询冲突
    // 同时检查是否已经有轮询在进行，避免重复启动
    if (pendingPollIntervalRef.current) {
      // 已经有轮询在进行，不重复启动
      return;
    }
    
    // 延迟启动，确保 useQuery 的初始查询完成
    const initialTimeout = setTimeout(() => {
      if (cancelled) return;
      // 🔥 再次检查 routeBattleId 是否变化（可能在延迟期间变化了）
      if (currentRouteBattleIdRef.current === routeBattleId && !pendingPollIntervalRef.current) {
        pollOnce();
      }
    }, 100);

    return () => {
      cancelled = true;
      // 清除初始轮询的 timeout
      clearTimeout(initialTimeout);
      
      // 清除轮询的 timeout/interval
      if (pendingPollIntervalRef.current) {
        if (typeof pendingPollIntervalRef.current === 'number') {
          clearTimeout(pendingPollIntervalRef.current);
        } else {
          clearInterval(pendingPollIntervalRef.current);
        }
        pendingPollIntervalRef.current = null;
      }
    };
  }, [routeBattleId, rawStatus, hasWinBoxData]);

  const normalizedBattleId = String(rawDetail?.id ?? routeBattleId ?? '');
  const battleOwnerId = rawDetail?.user_id !== undefined && rawDetail?.user_id !== null ? String(rawDetail.user_id) : null;
  const activeSource = useMemo<BattleDataSourceConfig | null>(() => {
    if (!rawDetail || !normalizedBattleId) {
      return null;
    }
    const specialOptions: BattleSpecialOptions = {
      fast: Number(rawDetail.fast) === 1,
      lastChance: Number(rawDetail.finally) === 1,
      inverted: Number(rawDetail.type) === 1,
    };
    const currentStatus = rawStatus;
    const wasPreviouslyPending = previousStatusRef.current === 0 && currentStatus !== 0;
    previousStatusRef.current = currentStatus;
    const entryRoundSetting = wasPreviouslyPending
      ? 0
      : computeEntryRoundSetting(rawDetail, specialOptions);
    return {
      id: normalizedBattleId,
      entryRound: entryRoundSetting,
      buildData: () => buildBattleDataFromRaw(rawDetail, { battleId: normalizedBattleId, specialOptions }),
      buildPayload: () => buildBattlePayloadFromRaw(rawDetail, { battleId: normalizedBattleId, specialOptions }),
    };
  }, [normalizedBattleId, rawDetail, rawStatus]);

  const battleData = useMemo(() => (activeSource ? activeSource.buildData() : null), [activeSource]);
  const isPendingBattle = rawStatus === 0;
  const isBattleOwner = Boolean(normalizedCurrentUserId && battleOwnerId && normalizedCurrentUserId === battleOwnerId);
  const canSummonRobots = isPendingBattle && isBattleOwner;
  const canJoinBattle = isPendingBattle && !isBattleOwner;
  const handleSummonRobot = useCallback(
    async (order: number) => {
      if (!canSummonRobots) return false;
      try {
        const res = await api.inviteRobots({ id: normalizedBattleId, order });
        if (res?.code !== 100000) {
          throw new Error(res?.message || 'inviteRobots failed');
        }
        // 🔥 不需要手动调用 refetch，轮询逻辑会自动更新数据
        return true;
      } catch (err) {
        throw err;
      }
    },
    [canSummonRobots, normalizedBattleId],
  );
  const handleJoinBattle = useCallback(
    async (order: number) => {
      if (!canJoinBattle) return false;
      if (!normalizedCurrentUserId) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:show-login'));
        }
        // 未登录：仅弹登录，不应让 UI 进入“持续 loading”
        return false;
      }
      try {
        const res = await api.joinFight({ id: normalizedBattleId, order, user_id: normalizedCurrentUserId, debug: 1 });
        if (res?.code !== 100000) {
          throw new Error(res?.message || 'joinFight failed');
        }
        // ✅ 玩家加入对战成功后需要刷新钱包余额（召唤机器人不需要）
        fetchUserBean?.();
        // 🔥 不需要手动调用 refetch，轮询逻辑会自动更新数据
        return true;
      } catch (err) {
        throw err;
      }
    },
    [canJoinBattle, normalizedBattleId, normalizedCurrentUserId, fetchUserBean],
  );
  const pendingSlotActionHandler = canSummonRobots ? handleSummonRobot : canJoinBattle ? handleJoinBattle : undefined;
  const pendingSlotActionLabel = canSummonRobots ? t('summonBot') : canJoinBattle ? t('joinBattle') : undefined;

  if (!routeBattleId) {
    return null;
  }

  if (isError) {
    return null;
  }

  if ((isLoading && !fightDetailResponse) || !rawDetail || !activeSource || !battleData) {
    return (
      <div className="fixed inset-0 z-[100000] grid place-items-center" style={{ backgroundColor: '#191d21' }}>
        <span className="font-semibold text-base" style={{ color: '#FFFFFF' }}>
          {t('loading')}
        </span>
      </div>
    );
  }

  return (
    <>
      {!isDetailUiReady ? (
        <div className="fixed inset-0 z-[100000] grid place-items-center" style={{ backgroundColor: '#191d21' }}>
          <span className="font-semibold text-base" style={{ color: '#FFFFFF' }}>
            {t('loading')}
          </span>
        </div>
      ) : null}
      <div className={isDetailUiReady ? '' : 'invisible pointer-events-none'}>
        <BattleDetailContent
          routeBattleId={normalizedBattleId}
          activeSource={activeSource}
          battleData={battleData}
          rawDetail={rawDetail}
          isPendingBattle={isPendingBattle}
          onPendingSlotAction={pendingSlotActionHandler}
          pendingSlotActionLabel={pendingSlotActionLabel}
          onInitialUiReadyChange={setIsDetailUiReady}
        />
      </div>
    </>
  );
}

function BattleDetailContent({
  routeBattleId,
  activeSource,
  battleData,
  rawDetail,
  isPendingBattle,
  onPendingSlotAction,
  pendingSlotActionLabel,
  onInitialUiReadyChange,
}: {
  routeBattleId: string;
  activeSource: BattleDataSourceConfig;
  battleData: BattleData;
  rawDetail: FightDetailRaw;
  isPendingBattle: boolean;
  // 返回值表示“是否真正发起了动作”（例如：未登录仅弹登录则返回 false）
  onPendingSlotAction?: (order: number) => boolean | Promise<boolean>;
  pendingSlotActionLabel?: string;
  onInitialUiReadyChange?: (ready: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    // no-op placeholder to keep consistent effect lifecycle if future side effects are needed
  }, [routeBattleId, activeSource.id]);
  const hasWinBoxData = useMemo(() => {
    const winBox = rawDetail?.data?.win?.box;
    if (!winBox || typeof winBox !== 'object') {
      return false;
    }
    return Object.values(winBox).some((entries) => Array.isArray(entries) && entries.length > 0);
  }, [rawDetail?.data?.win?.box]);
  const [allSlotsFilled, setAllSlotsFilled] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const hasGeneratedResultsRef = useRef(false); // Track if results have been generated
  const timelineHydratedRef = useRef(false);
  // 记录首次进入页面时是否处于 pending（等待加入）阶段：
  // - 如果是从 pending 走到开局(status!=0)的“页面内状态变化”，不应该再触发首屏初始化遮罩
  // - 只有首次进入页面就已经是非 pending 的情况，才需要用遮罩屏蔽中间闪屏
  const initiallyPendingRef = useRef<boolean>(isPendingBattle);
  const skipDirectlyToCompletedRef = useRef(false);
  const forceFullReplayRef = useRef(false);
  const [runtimeReadyVersion, setRuntimeReadyVersion] = useState(0);
  const initializationEntryRoundRef = useRef<number | null>(null); // 记录初始化时的 entryRound，避免重复初始化
  const previousPendingStatusRef = useRef(isPendingBattle);
  // 🔥 使用 useMemo 创建稳定的 status 值，避免依赖项数组大小变化
  const rawDetailStatus = useMemo(() => Number(rawDetail?.status ?? 0), [rawDetail?.status]);
  const { fetchUserBean } = useAuth();
  const [isRecreatingBattle, setIsRecreatingBattle] = useState(false);
  const handleRecreateBattle = useCallback(async () => {
    if (isRecreatingBattle) return;
    setIsRecreatingBattle(true);
    try {
      const resolvedBoxIds = (() => {
        if (Array.isArray(rawDetail.data?.box) && rawDetail.data.box.length) {
          return rawDetail.data.box.map((boxId) => String(boxId));
        }
        return battleData.packs.map((pack) => pack.id);
      })();

      const fallbackPlayers = battleData.playersCount || resolvedBoxIds.length || 2;

      const payload: CreateBattlePayload = {
        num: (() => {
          const normalized = normalizeNumericValue(rawDetail.num, fallbackPlayers);
          return normalized > 0 ? normalized : fallbackPlayers;
        })(),
        person_team:
          normalizeNumericValue(rawDetail.person_team, battleData.battleType === 'team' ? 1 : 0) === 1 ? 1 : 0,
        team_size: (() => {
          const teamSizeRaw = normalizeNumericValue(rawDetail.team_size, Number.NaN);
          if (teamSizeRaw === 0 || teamSizeRaw === 1 || teamSizeRaw === 2) {
            return teamSizeRaw as CreateBattlePayload['team_size'];
          }
          const fallbackStructure = battleData.teamStructure ? TEAM_STRUCTURE_TO_SIZE_MAP[battleData.teamStructure] : 0;
          return (fallbackStructure ?? 0) as CreateBattlePayload['team_size'];
        })(),
        mode: (() => {
          const modeRaw = normalizeNumericValue(rawDetail.mode, Number.NaN);
          if (modeRaw >= 0 && modeRaw <= 4) {
            return modeRaw as CreateBattlePayload['mode'];
          }
          return GAMEPLAY_TO_MODE_MAP[battleData.mode] ?? 0;
        })(),
        fast: normalizeNumericValue(rawDetail.fast, battleData.isFastMode ? 1 : 0) ? 1 : 0,
        finally: normalizeNumericValue(rawDetail.finally, battleData.isLastChance ? 1 : 0) ? 1 : 0,
        type: normalizeNumericValue(rawDetail.type, battleData.isInverted ? 1 : 0) ? 1 : 0,
        boxs: resolvedBoxIds.length ? resolvedBoxIds : battleData.packs.map((pack) => pack.id),
      };

      const response = await api.createBattle(payload);
      if (response?.code === 100000) {
        const rawCreated: any = response?.data ?? null;
        const createdId =
          rawCreated && typeof rawCreated === 'object'
            ? (rawCreated.id ?? rawCreated.fight_id ?? rawCreated.fightId ?? null)
            : rawCreated;

        showGlobalToast({
          title: t('createBattleSuccessTitle'),
          description: t('createBattleRedirectingDesc'),
          variant: 'success',
          durationMs: 2000,
        });

        // ✅ 更新钱包余额
        fetchUserBean?.();

        if (createdId !== null && createdId !== undefined && createdId !== '') {
          router.replace(`/battles/${createdId}`);
        } else {
          showGlobalToast({
            title: t('error'),
            description: response?.message || t('retryLater'),
            variant: 'error',
            durationMs: 2200,
          });
        }
      } else {
        showGlobalToast({
          title: t('error'),
          description: response?.message || t('retryLater'),
          variant: 'error',
          durationMs: 2200,
        });
      }
    } catch (error) {
      showGlobalToast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('retryLater'),
        variant: 'error',
        durationMs: 2200,
      });
    } finally {
      setIsRecreatingBattle(false);
    }
  }, [isRecreatingBattle, rawDetail, battleData, router, t, fetchUserBean]);


useEffect(() => {
  if (previousPendingStatusRef.current && !isPendingBattle) {
    hasGeneratedResultsRef.current = false;
    timelineHydratedRef.current = false;
    skipDirectlyToCompletedRef.current = false;
    forceFullReplayRef.current = false;
    initializationEntryRoundRef.current = null; // 🔥 重置初始化记录
  }
  previousPendingStatusRef.current = isPendingBattle;
}, [isPendingBattle, routeBattleId]);
  const predeterminedWinnerIds = useMemo(() => {
    if (!Array.isArray(battleData.participants)) {
      return [];
    }
    return battleData.participants
      .filter((participant) => participant?.isWinner)
      .map((participant) => String(participant.id));
  }, [battleData.participants]);
  const primaryRawWinnerId = useMemo(() => {
    const rawWinners = Array.isArray(rawDetail?.win_user) ? rawDetail!.win_user : [];
    if (!rawWinners.length) return null;
    const firstWinner = rawWinners[0];
    if (firstWinner === null || firstWinner === undefined) return null;
    return String(firstWinner);
  }, [rawDetail]);

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
  const spinDuration = isFastMode ? 1000 : 6000;
  
  // 🎯 最后的机会模式（从battleData读取）
  const isLastChance = battleData.isLastChance || false;
  
  // 🔄 倒置模式（从battleData读取）
  const isInverted = battleData.isInverted || false;
  // 🎯 团队模式相关
  const isTeamMode = battleData.battleType === 'team';
  const teamStructure = battleData.teamStructure;
  
  // 🎮 游戏模式
  const gameMode = battleData.mode;
  const gameModeLabel = useMemo(() => {
    switch (gameMode) {
      case 'classic':
        return t('battleModeClassic');
      case 'share':
        return t('battleModeShare');
      case 'sprint':
        return t('battleModeSprint');
      case 'jackpot':
        return t('battleModeJackpot');
      case 'elimination':
        return t('battleModeElimination');
      default:
        return t('battleModeClassic');
    }
  }, [gameMode, t]);
  const shareWinnerIds = useMemo(
    () =>
      (battleData.participants ?? [])
        .map((participant) => {
          if (!participant || participant.id === undefined || participant.id === null) {
            return null;
          }
          return participant.isWinner ? String(participant.id) : null;
        })
        .filter((id): id is string => Boolean(id)),
    [battleData.participants],
  );
  const participantIdList = useMemo(
    () =>
      (battleData.participants ?? [])
        .map((participant) => {
          if (!participant || participant.id === undefined || participant.id === null) {
            return null;
          }
          return String(participant.id);
        })
        .filter((id): id is string => Boolean(id)),
    [battleData.participants],
  );
  const isJackpotWithLastChance = gameMode === 'jackpot' && isLastChance;
  const shouldShowSoloSlotSeparators = useMemo(
    () =>
      !isTeamMode &&
      allParticipants.length > 1 &&
      (allParticipants.length <= 4 || allParticipants.length === 6),
    [isTeamMode, allParticipants.length],
  );
  
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
  const jackpotRollTriggeredRef = useRef(false);
  const sprintDataRef = useRef<SprintRuntimeData | null>(null);
  const eliminationDataRef = useRef<EliminationRuntimeData | null>(null);
  
  // 🎉 烟花动画 ref
  const winnerFireworkRef = useRef<FireworkAreaHandle>(null);
  // 避免烟花提前触发：确保获胜者组件已渲染后再放烟花
  const winnerCelebrationFiredRef = useRef(false);
  
  // 🎵 播放胜利音效的辅助函数
  const playWinSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isSiteMuted()) return;
    const ctx = (window as any).__audioContext;
    const buffer = (window as any).__winAudioBuffer;
    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  }, []);

  const resetJackpotUiState = useCallback(() => {
    jackpotRollTriggeredRef.current = false;
    jackpotInitialized.current = false;
    setJackpotPlayerSegments([]);
    setJackpotWinnerId('');
    setJackpotPhase('rolling');
  }, []);

  useEffect(() => {
    resetJackpotUiState();
  }, [battleData.id, resetJackpotUiState]);

  const prepareJackpotDisplayData = useCallback(() => {
    if (jackpotInitialized.current) {
      return;
    }
    const validParticipants = allParticipants.filter(
      (participant): participant is { id: string; name: string } => Boolean(participant && participant.id),
    );
    if (!validParticipants.length) {
      return;
    }

    const isJackpotInverted = battleData.isInverted;
    const isLastChanceMode = Boolean(battleData.isLastChance);
    const runtime = battleRuntimeRef.current;
    const lastRoundPlan =
      isLastChanceMode && runtime?.rounds?.length
        ? runtime.rounds[runtime.rounds.length - 1]
        : null;
    const contributions = validParticipants.map((participant) => {
      const rawValue = isLastChanceMode
        ? Number(lastRoundPlan?.drops?.[participant.id]?.value ?? 0) || 0
        : Number(participantValues[participant.id]) || 0;
      return {
        id: participant.id,
        name: participant.name,
        rawValue,
        inverseWeight: rawValue > 0 ? 1 / rawValue : 0,
      };
    });

    const weightEntries = contributions.map((entry) => ({
      id: entry.id,
      weight: isJackpotInverted ? entry.inverseWeight : entry.rawValue,
    }));
    const bpsById = allocateJackpotPercentageBps(weightEntries);

    const segments = contributions.map((entry) => {
      const bps = bpsById?.[entry.id] ?? 0;
      return {
        id: entry.id,
        name: entry.name,
        percentage: bps / 100,
        color: playerColors[entry.id] || 'rgb(128, 128, 128)',
      };
    });
    // 🔒 确保色块排序稳定：按 battleData.participants 的顺序（participantIdList）锁定
    if (participantIdList.length > 0) {
      const indexById = new Map<string, number>();
      participantIdList.forEach((id, idx) => indexById.set(id, idx));
      segments.sort((a, b) => (indexById.get(a.id) ?? 1e9) - (indexById.get(b.id) ?? 1e9));
    }

    const preCalculatedWinner = jackpotWinnerRef.current;
    const winnerId = predeterminedWinnerIds[0] || preCalculatedWinner?.id || validParticipants[0]?.id || '';

    setJackpotPlayerSegments(segments);
    setJackpotWinnerId(winnerId);
    jackpotInitialized.current = true;
  }, [
    allParticipants,
    participantValues,
    playerColors,
    predeterminedWinnerIds,
    participantIdList,
    battleData.isInverted,
    battleData.isLastChance,
  ]);

  
  // 🎉 大奖模式：动画完成回调（稳定引用）
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

  // ✅ 最终回合桥接：淘汰老虎机结束后不应短暂回退到纵向老虎机（Y 轴），而应直接衔接获胜者 UI
  // 这里用一个“覆盖层保持”锁，直到获胜者已确定/可渲染再释放（对齐 Jackpot 的丝滑体验）
  const [eliminationFinalOverlayHold, setEliminationFinalOverlayHold] = useState(false);
  const eliminationFinalOverlayDataRef = useRef<{
    eliminatedPlayerId: string;
    eliminatedPlayerName: string;
    needsSlotMachine: boolean;
    tiedPlayerIds?: string[];
    roundIndex: number;
  } | null>(null);
  
  // 🏃 积分冲刺模式：玩家/团队积分
  const [sprintScores, setSprintScores] = useState<Record<string, number>>({});

  // 🕒 记录标签页离开/返回时间与轮次
  const lastHiddenAtRef = useRef<number | null>(null);
  const lastHiddenRoundRef = useRef<number | null>(null);
  const totalRoundsRef = useRef<number>(0);
  const isFastModeRef = useRef<boolean>(false);
  
  // 🔥 淘汰模式：回正音效触发时立即渲染淘汰UI（与音效同步）
  const handleEliminationSlotSettled = useCallback(() => {
    if (currentEliminationData) {
      // 🔥 立即添加淘汰玩家到已淘汰集合（在回正音效触发时同步渲染）
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
  }, [currentEliminationData]);
  
  // 🔥 淘汰模式：淘汰老虎机完成回调（用于状态转换）
  const handleEliminationSlotComplete = useCallback(() => {
    // 淘汰UI已经在 handleEliminationSlotSettled 中渲染了
    // 关键：如果这是最后一轮，需要把“淘汰老虎机”作为获胜者 UI 的衔接桥梁，避免回退到纵向老虎机闪一下
    const totalRounds = totalRoundsRef.current;
    const eliminatedRoundIndex = currentEliminationData?.roundIndex;
    const isFinalRound =
      Number.isFinite(totalRounds) &&
      totalRounds > 0 &&
      typeof eliminatedRoundIndex === 'number' &&
      eliminatedRoundIndex >= totalRounds - 1;

    if (isFinalRound) {
      // 立即进入 COMPLETED，让获胜者 UI 准备渲染；覆盖层会由 eliminationFinalOverlayHold 保持到 winners ready
      setMainState('COMPLETED');
      setRoundState(null);
      return;
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
          label: participant?.name || t('unknownPlayer'),
          avatars: participant ? [participant] : [],
          subtitle: participant?.teamId ? teamLabelMap.get(participant.teamId) || participant.teamId : undefined,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [gameMode, sprintScores, allParticipants, isTeamMode, teamLabelMap]);
  
  // 🎵 使用Web Audio API加载音频（零延迟播放）
  useEffect(() => {
    initAudioOnce();
  }, []);

  // 🎵 首次用户交互时解锁 AudioContext（避免自动播放限制）
  useEffect(() => {
    const unlock = () => {
    if (isSiteMuted()) return;
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
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
  
  const handleJackpotAnimationComplete = useCallback(() => {
    setTimeout(() => {
      setJackpotPhase('winner');
      if (roundStateRef.current === 'ROUND_JACKPOT_ROLL') {
        setRoundState('ROUND_NEXT');
      }
    }, 1000);
  }, [setRoundState]);

 
  
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

  // ✅ 淘汰模式：中途进入/跳轮次时补齐“已淘汰”UI状态
  // hydrateRoundsProgress 只会补齐 roundResults/participantValues/currentRound/completedRounds，
  // 不会自动把 eliminatedPlayerIds/eliminationRounds 推导出来，导致中途进入看不到淘汰遮罩。
  useEffect(() => {
    if (gameMode !== 'elimination') return;
    const eliminationData = eliminationDataRef.current;
    const eliminations = eliminationData?.eliminations;
    if (!eliminations || typeof eliminations !== 'object') return;

    const safeCurrentRound = Number.isFinite(Number(currentRound)) ? Number(currentRound) : 0;

    const computedEliminatedIds = new Set<string>();
    const computedEliminationRounds: Record<string, number> = {};

    Object.entries(eliminations).forEach(([roundKey, info]) => {
      const roundIdx = Number(roundKey);
      if (!Number.isFinite(roundIdx)) return;
      if (!info || typeof info !== 'object') return;
      const eliminatedPlayerIdRaw = (info as any).eliminatedPlayerId;
      if (eliminatedPlayerIdRaw === null || eliminatedPlayerIdRaw === undefined) return;
      // ✅ 关键：补齐逻辑只用于“中途进入/跳轮次”
      // 正常播放淘汰老虎机时，绝不能在本轮（roundIdx === currentRound）提前标记淘汰，
      // 否则会在老虎机揭晓前就把淘汰遮罩打到玩家信息区（提前暴露结果）。
      // 所以这里不使用 completedRounds，而是严格要求 roundIdx < currentRound，或已进入 COMPLETED。
      const eliminationHasHappened = roundIdx < safeCurrentRound || mainState === 'COMPLETED';
      if (!eliminationHasHappened) return;

      const eliminatedPlayerId = String(eliminatedPlayerIdRaw);
      if (!eliminatedPlayerId) return;
      computedEliminatedIds.add(eliminatedPlayerId);
      computedEliminationRounds[eliminatedPlayerId] = roundIdx;
    });

    if (computedEliminatedIds.size === 0) return;

    setEliminatedPlayerIds((prev) => {
      const next = new Set(prev);
      computedEliminatedIds.forEach((id) => next.add(id));
      return next;
    });

    setEliminationRounds((prev) => {
      const next = { ...(prev || {}) };
      Object.entries(computedEliminationRounds).forEach(([playerId, roundIdx]) => {
        if (next[playerId] === undefined) {
          next[playerId] = roundIdx;
        }
      });
      return next;
    });
  }, [gameMode, currentRound, completedRounds, mainState]);
  
  const gameRoundsRef = useRef<Array<ReturnType<typeof convertRuntimeRoundToLegacy>>>([]);
  
  // 🚀 缓存 roundResults 的转换结果，避免每次渲染都重新 map
  const roundResultsArray = useMemo(() => 
    Object.entries(roundResults).map(([round, results]) => ({
      roundId: `round-${parseInt(round)}`,
      playerItems: results
    })), 
    [roundResults]
  );

  const mainStateRef = useRef(mainState);
  mainStateRef.current = mainState;

  const prevAllSlotsFilledRef = useRef<boolean>(false);
  const prevParticipantsLengthRef = useRef<number>(0);

  const triggerWinnerCelebration = useCallback(() => {
    setTimeout(() => {
      playWinSound();
      winnerFireworkRef.current?.triggerFirework();
    }, 100);
  }, [playWinSound]);

  const applyPredeterminedWinners = useCallback(() => {
    if (!predeterminedWinnerIds.length) {
      return false;
    }
    setAllParticipants((prev) =>
      prev.map((participant) => {
        if (!participant) return participant;
        return {
          ...participant,
          isWinner: predeterminedWinnerIds.includes(String(participant.id)),
        };
      }),
    );
    return true;
  }, [predeterminedWinnerIds]);

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

  const expandSprintContenders = useCallback(
    (contenderIds: string[]) => {
      if (!isTeamMode || !contenderIds.length) {
        return contenderIds;
      }
      const targetSet = new Set(contenderIds);
      const expanded: string[] = [];
      allParticipants.forEach((participant) => {
        if (!participant?.id) return;
        if (targetSet.has(participant.id)) {
          expanded.push(participant.id);
          return;
        }
        if (participant.teamId && targetSet.has(participant.teamId)) {
          expanded.push(participant.id);
        }
      });
      const uniqueExpanded = Array.from(new Set(expanded));
      return uniqueExpanded.length ? uniqueExpanded : contenderIds;
    },
    [allParticipants, isTeamMode],
  );

  const sprintScoreLeaders = useMemo(() => {
    if (gameMode !== 'sprint') return [];
    const entries = Object.entries(sprintScores || {});
    if (!entries.length) return [];
    const normalized = entries.map(([id, score]) => [id, Number(score ?? 0)] as [string, number]);
    if (!normalized.length) return [];
    const maxScore = Math.max(...normalized.map(([, value]) => value));
    if (!Number.isFinite(maxScore)) return [];
    return normalized.filter(([, value]) => value === maxScore).map(([id]) => id);
  }, [gameMode, sprintScores]);

  const evaluateTieBreakerPlan = useCallback((): TieBreakerPlan | null => {
    if (!allParticipants.length) return null;

    // if (hasMultipleDeclaredWinners) {
    //   // 已經有多位獲勝者，直接顯示結果，不需要決勝
    //   return null;
    // }

    const declaredWinnerId = declaredWinnerIds.length === 1 ? declaredWinnerIds[0] : null;
    const primaryDeclaredWinnerId = declaredWinnerIds[0] ?? null;

    if (gameMode === 'sprint') {
      const sprintData = sprintDataRef.current;
      const scoreMap = sprintScores || sprintData?.scores || {};
      const precomputedContenders =
        sprintData?.needsTiebreaker && sprintData.tiebreakerPlayers.length > 1
          ? sprintData.tiebreakerPlayers
          : [];

      // 团队模式：按队伍总分判定平分，平分队伍的全体成员进入老虎机
      if (isTeamMode) {
        // sprint 团队积分现在直接以 teamId 作为 key 存储（每轮按最高/倒置最低玩家给队伍 +1）
        const teamTotals: Record<string, number> = {};
        Object.entries(scoreMap || {}).forEach(([teamId, score]) => {
          if (!teamId) return;
          teamTotals[teamId] = Number(score ?? 0);
        });

        if (Object.keys(teamTotals).length) {
          // ✅ 关键：Sprint 团队模式是否需要决胜，只取“实际最高分队伍”来判断
          // 后端返回的 winner（可能落在非最高分队伍）绝不能影响 leaderValue，否则会错误触发决胜（例如 2/4/2 被判成 2/2 并列）。
          const leaderValue = Math.max(...Object.values(teamTotals));

          const contenderTeamIds = Object.entries(teamTotals)
            .filter(([, value]) => value === leaderValue)
            .map(([teamId]) => teamId);

          if (contenderTeamIds.length > 1) {
            const contenderIds = allParticipants
              .filter((participant) => participant?.id && participant.teamId && contenderTeamIds.includes(participant.teamId))
              .map((participant) => participant.id);

            if (contenderIds.length > 1) {
              const resolveCandidate = (candidate?: string | null) => {
                if (!candidate) return null;
                const member = allParticipants.find((p) => p?.id === candidate);
                if (member?.teamId && contenderTeamIds.includes(member.teamId) && contenderIds.includes(member.id)) {
                  return member.id;
                }
                return null;
              };

              const resolvedWinnerId =
                resolveCandidate(primaryRawWinnerId) ??
                resolveCandidate(primaryDeclaredWinnerId) ??
                resolveCandidate(sprintData?.finalWinnerId ?? null) ??
                contenderIds[0];

              const safeWinnerId = contenderIds.includes(resolvedWinnerId) ? resolvedWinnerId : contenderIds[0];

              return {
                mode: 'sprint',
                contenderIds,
                winnerId: safeWinnerId,
              };
            }
          }

          // 团队模式下如果队伍总分没有出现平分（只有一个领先队伍），则不应该进入后续“个人平分”逻辑
          // 否则会在队伍总分不平分时，因为个人最高分平分而错误触发决胜老虎机
          return null;
        }
      }

      // 单人模式：保留原有平分决胜逻辑
      const contenderSource =
        sprintScoreLeaders.length > 1 ? sprintScoreLeaders : precomputedContenders;
      if (contenderSource.length > 1) {
        const contenderIds = expandSprintContenders(contenderSource);
        if (contenderIds.length <= 1) {
          return null;
        }
        const resolveCandidate = (candidate?: string | null) => {
          if (!candidate) return null;
          if (contenderIds.includes(candidate)) {
            return candidate;
          }
          if (isTeamMode) {
            const member = allParticipants.find(
              (participant) => participant?.teamId && participant.teamId === candidate,
            );
            if (member && contenderIds.includes(member.id)) {
              return member.id;
            }
          }
          return null;
        };
        const resolvedWinnerId =
          resolveCandidate(primaryRawWinnerId) ??
          resolveCandidate(primaryDeclaredWinnerId) ??
          resolveCandidate(sprintData?.finalWinnerId ?? null) ??
          contenderIds[0];
        return {
          mode: 'sprint',
          contenderIds,
          winnerId: resolvedWinnerId,
        };
      }
    }

    if (gameMode === 'classic') {
      const toCents = (value: unknown) => {
        const num = Number(value ?? 0);
        if (!Number.isFinite(num)) return 0;
        return Math.round(num * 100);
      };

      const rawComparison = getClassicComparisonValues();
      const comparison: Record<string, number> = {};
      Object.entries(rawComparison).forEach(([id, value]) => {
        if (!id) return;
        comparison[id] = toCents(value);
      });
      const values = Object.values(comparison);
      if (!values.length) return null;
      const comparator = isInverted ? Math.min : Math.max;
      const computedWinnerValue =
        declaredWinnerId && comparison[declaredWinnerId] !== undefined
          ? comparison[declaredWinnerId]
          : comparator(...values);

      // 团队模式：先按队伍总金额判定是否需要决胜
      if (isTeamMode) {
        const teamTotals: Record<string, number> = {};
        allParticipants.forEach((participant) => {
          if (!participant?.id || !participant.teamId) return;
          const val = comparison[participant.id];
          if (val === undefined) return;
          teamTotals[participant.teamId] = (teamTotals[participant.teamId] ?? 0) + val;
        });

        if (Object.keys(teamTotals).length) {
          const resolveTeamIdByPlayer = (playerId?: string | null) => {
            if (!playerId) return null;
            const member = allParticipants.find((p) => p?.id === playerId);
            return member?.teamId ?? null;
          };

          const declaredWinnerTeamId = resolveTeamIdByPlayer(primaryDeclaredWinnerId ?? declaredWinnerId);
          const rawWinnerTeamId = resolveTeamIdByPlayer(primaryRawWinnerId);

          const leaderValue =
            (declaredWinnerTeamId && teamTotals[declaredWinnerTeamId] !== undefined
              ? teamTotals[declaredWinnerTeamId]
              : null) ??
            (rawWinnerTeamId && teamTotals[rawWinnerTeamId] !== undefined
              ? teamTotals[rawWinnerTeamId]
              : null) ??
            comparator(...Object.values(teamTotals));

          const contenderTeamIds = Object.entries(teamTotals)
            .filter(([, value]) => value === leaderValue)
            .map(([teamId]) => teamId);

          if (contenderTeamIds.length > 1) {
            const contenderIds = allParticipants
              .filter((participant) => participant?.id && participant.teamId && contenderTeamIds.includes(participant.teamId))
              .map((participant) => participant.id);

            if (contenderIds.length > 1) {
              const resolveCandidate = (candidate?: string | null) => {
                if (!candidate) return null;
                const member = allParticipants.find((p) => p?.id === candidate);
                if (member?.teamId && contenderTeamIds.includes(member.teamId) && contenderIds.includes(member.id)) {
                  return member.id;
                }
                return null;
              };

              const fallbackWinnerTeamId = declaredWinnerTeamId ?? rawWinnerTeamId ?? contenderTeamIds[0];
              const fallbackWinnerId =
                allParticipants.find(
                  (p) => p?.id && p.teamId === fallbackWinnerTeamId && contenderIds.includes(p.id),
                )?.id ?? contenderIds[0];

              const resolvedWinnerId =
                resolveCandidate(primaryRawWinnerId) ??
                resolveCandidate(primaryDeclaredWinnerId) ??
                resolveCandidate(declaredWinnerId) ??
                fallbackWinnerId;

              if (!resolvedWinnerId || !contenderIds.includes(resolvedWinnerId)) {
                return null;
              }

              return {
                mode: 'classic',
                contenderIds,
                winnerId: resolvedWinnerId,
              };
            }
          }
        }

        // 团队模式无平局则不需要决胜，直接返回
        return null;
      }

      const contenders = Object.entries(comparison)
        .filter(([, value]) => value === computedWinnerValue)
        .map(([id]) => id);

      if (contenders.length > 1) {
        // 经典模式下，团队模式和单人模式的判断逻辑相同（都是看个人金额）
        // 区别只是团队模式会根据获胜者所在的队伍来分享奖励
        // 所以这里不需要区分团队模式和单人模式，直接使用参与者ID
        const resolveCandidate = (candidate?: string | null) => {
          if (!candidate) return null;
          // 如果候选ID直接在竞争者列表中，直接返回
          if (contenders.includes(candidate)) {
            return candidate;
          }
          // 如果是团队模式，尝试通过团队ID找到对应的参与者
          if (isTeamMode) {
            const member = allParticipants.find(
              (participant) => participant?.teamId && participant.teamId === candidate,
            );
            if (member && contenders.includes(member.id)) {
              return member.id;
            }
          }
          return null;
        };

        const resolvedWinnerId =
          resolveCandidate(declaredWinnerId) ??
          resolveCandidate(primaryDeclaredWinnerId) ??
          resolveCandidate(primaryRawWinnerId) ??
          determineClassicWinnerParticipantId(comparison) ??
          contenders[0];

        // 确保 resolvedWinnerId 在 contenders 中
        if (!resolvedWinnerId || !contenders.includes(resolvedWinnerId)) {
          return null;
        }

        return {
          mode: 'classic',
          contenderIds: contenders,
          winnerId: resolvedWinnerId,
        };
      }
    }

    // 🎰 大奖模式：不使用决胜老虎机（即使 Last Chance 最后一轮出现并列也不走 tie-breaker）

    return null;
  }, [
    allParticipants,
    declaredWinnerIds,
    determineClassicWinnerParticipantId,
    expandSprintContenders,
    gameMode,
    getClassicComparisonValues,
    getLastChanceValueMap,
    hasMultipleDeclaredWinners,
    isInverted,
    isLastChance,
    isTeamMode,
    primaryRawWinnerId,
    sprintScoreLeaders,
    sprintScores,
  ]);

  const resolveClassicModeWinner = useCallback(() => {
    if (!allParticipants.length) return false;

    if (declaredWinnerIds.length) {
      if (isTeamMode) {
        const primaryWinnerId = declaredWinnerIds[0];
        const winnerParticipant = allParticipants.find((participant) => participant?.id === primaryWinnerId);
        const winnerTeamId = winnerParticipant?.teamId;
        if (winnerTeamId) {
          markParticipantsAsWinners((participant) => Boolean(participant && participant.teamId === winnerTeamId));
          return true;
        }
      }
      markParticipantsAsWinners((participant) => Boolean(participant && declaredWinnerIds.includes(participant.id)));
      return true;
    }

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
    declaredWinnerIds,
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
    if (!shareWinnerIds.length) {
      markParticipantsAsWinners(() => true);
      return true;
    }
    const winnerSet = new Set(shareWinnerIds);
    markParticipantsAsWinners((participant) => Boolean(participant && winnerSet.has(String(participant.id))));
    return true;
  }, [allParticipants.length, markParticipantsAsWinners, shareWinnerIds]);

  const resolveWinnersByMode = useCallback(() => {
    if (!allParticipants.length) return false;

    if (applyPredeterminedWinners()) {
      return true;
    }

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
    applyPredeterminedWinners,
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
    const applyShareTotals = (source: Record<string, number>) => {
      const winners = shareWinnerIds.length ? shareWinnerIds : participantIdList;
      if (!winners.length) {
        return source;
      }
      const totalValue = winners.reduce((sum, id) => sum + (source[id] ?? 0), 0);
      const shareValue = winners.length ? totalValue / winners.length : 0;
      const distributed: Record<string, number> = {};
      const winnerSet = new Set(winners);
      const targets = participantIdList.length ? participantIdList : Object.keys(source);
      targets.forEach((id) => {
        distributed[id] = winnerSet.has(id) ? shareValue : 0;
      });
      return distributed;
    };

    runtime.rounds.slice(0, targetRound).forEach((roundPlan) => {
      completed.add(roundPlan.roundIndex);
      const perRoundSymbols: Record<string, SlotSymbol> = {};
      Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
        totals[playerId] = (totals[playerId] ?? 0) + drop.value;
        const winEntry =
          (rawDetail as any)?.data?.win?.box?.[playerId]?.[roundPlan.roundIndex] ??
          null;
        const winSymbol = mapWinEntryToSlotSymbol(winEntry);
        perRoundSymbols[playerId] = winSymbol ?? {
          id: drop.itemId,
          name: drop.itemName,
          image: drop.image,
          price: drop.value,
          qualityId: drop.rarity === 'legendary' ? 'legendary' : 'normal',
          dropProbability: drop.dropProbability,
        };
      });
      nextRoundResults[roundPlan.roundIndex] = perRoundSymbols;
    });

    const safeRound = Math.min(targetRound, runtime.config.roundsTotal);
    const adjustedTotals = gameMode === 'share' ? applyShareTotals(totals) : totals;
    dispatchProgressState({
      type: 'APPLY_PROGRESS_SNAPSHOT',
      snapshot: {
        currentRound: safeRound,
        totalRounds: runtime.config.roundsTotal,
        participantValues: adjustedTotals,
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

    // 🏃 积分冲刺模式：补轮次时同步补齐累计积分（否则只会补金额，不会补分）
    if (gameMode === 'sprint') {
      const sprintData = sprintDataRef.current;
      const winnersByRound = sprintData?.roundWinners || {};
      const nextScores: Record<string, number> = {};

      runtime.rounds.slice(0, safeRound).forEach((roundPlan) => {
        const winners = (winnersByRound as any)?.[roundPlan.roundIndex];
        if (!Array.isArray(winners) || !winners.length) return;
        winners.forEach((winnerId: any) => {
          const key = winnerId !== undefined && winnerId !== null ? String(winnerId) : '';
          if (!key) return;
          nextScores[key] = (nextScores[key] ?? 0) + 1;
        });
      });

      setSprintScores(nextScores);
    }
  }, [dispatchProgressState, gameMode, participantIdList, shareWinnerIds]);
  
  // UI状态
  const [galleryAlert, setGalleryAlert] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const slotMachineRefs = useRef<Record<string, any>>({});
  const processedRoundEventIdsRef = useRef<Set<string>>(new Set());
  const lastRoundLogRef = useRef<string>('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [tieBreakerPlan, setTieBreakerPlan] = useState<TieBreakerPlan | null>(null);
  const tieBreakerPlanRef = useRef<TieBreakerPlan | null>(null);
  tieBreakerPlanRef.current = tieBreakerPlan;
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
  const [prepareDelay, setPrepareDelay] = useState(false);
  const prepareTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mapWinEntryToSlotSymbol = useCallback((entry: any): SlotSymbol | null => {
    if (!entry) return null;
    const award = entry.awards;
    const qualityId = QUALITY_MAP_WIN[Number(award?.lv ?? entry?.lv ?? 0)] ?? null;
    const price = Number(award?.bean ?? entry?.bean ?? 0);
    return {
      id: String(award?.id ?? entry?.awards_id ?? entry?.box_awards_id ?? entry?.box_id ?? entry?.item_id ?? ''),
      name: award?.name ?? entry?.name ?? `Award ${entry?.awards_id ?? entry?.box_awards_id ?? ''}`,
      description: award?.item_name ?? entry?.item_name ?? award?.name ?? '',
      image: award?.cover ?? entry?.cover ?? entry?.image ?? '',
      price: Number.isFinite(price) ? price : 0,
      qualityId,
      dropProbability: Number(award?.bili ?? entry?.bili ?? 0),
    };
  }, []);

  // 清理准备阶段定时器
  useEffect(() => {
    return () => {
      if (prepareTimerRef.current) {
        clearTimeout(prepareTimerRef.current);
        prepareTimerRef.current = null;
      }
    };
  }, []);

  // 启动 2 秒准备态，再进入 3-2-1
  const startCountdownWithPrepare = useCallback(() => {
    if (prepareTimerRef.current) {
      clearTimeout(prepareTimerRef.current);
      prepareTimerRef.current = null;
    }
    setPrepareDelay(true);
    setMainState('COUNTDOWN');
    setRoundState(null);
    setCountdownValue(null);
    prepareTimerRef.current = setTimeout(() => {
      setPrepareDelay(false);
      setCountdownValue(3);
    }, 2000);
  }, [setCountdownValue, setMainState, setRoundState]);

  // 直接进入 3-2-1（用于回放/无须准备）
  const startCountdownDirect = useCallback(() => {
    if (prepareTimerRef.current) {
      clearTimeout(prepareTimerRef.current);
      prepareTimerRef.current = null;
    }
    setPrepareDelay(false);
    setMainState('COUNTDOWN');
    setRoundState(null);
    setCountdownValue(3);
  }, [setCountdownValue, setMainState, setRoundState]);
  
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
    
    const tiedIds = currentEliminationData.tiedPlayerIds;
    
    return tiedIds.map(id => {
      const p = allParticipants.find(player => player.id === id);
      const nameFallback = id === currentEliminationData.eliminatedPlayerId
        ? currentEliminationData.eliminatedPlayerName
        : undefined;
      
      // 对于机器人，生成SVG字符串；对于真实玩家，使用avatar URL
      const isBot = p?.id?.startsWith('bot-') || !p?.avatar;
      let avatarData = p?.avatar ?? TRANSPARENT_PIXEL;
      
      if (isBot) {
        // 生成机器人SVG字符串
        const maskId = `mask-${id}`;
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
        id,
        name: p?.name ?? nameFallback ?? `玩家 ${id}`,
        avatar: avatarData
      };
    });
  }, [currentEliminationData, allParticipants]);

  const participantsSignatureRef = useRef<string>('');
  const participantsSignature = useMemo(() => {
    const participants = battleData.participants || [];
    if (!participants.length) return '';
    return participants.map((participant, index) => participant?.id ?? `slot-${index}`).join('|');
  }, [battleData.participants]);

  const lastPlayersCountRef = useRef<number>(battleData.playersCount);

  useEffect(() => {
    const signature = participantsSignature;
    const playersCount = battleData.playersCount;

    if (participantsSignatureRef.current === signature && lastPlayersCountRef.current === playersCount) {
      return;
    }

    participantsSignatureRef.current = signature;
    lastPlayersCountRef.current = playersCount;

    const syncedParticipants = Array.isArray(battleData.participants) ? battleData.participants : [];
    setAllParticipants(syncedParticipants);
    prevParticipantsLengthRef.current = syncedParticipants.length;

    const filled = playersCount > 0 ? syncedParticipants.length >= playersCount : syncedParticipants.length > 0;
    prevAllSlotsFilledRef.current = filled;
    setAllSlotsFilled(filled);
  }, [participantsSignature, battleData.participants, battleData.playersCount]);

  const generateAllResults = useCallback((allParticipants: any[]): BattleStateData['game']['rounds'] => {
    const runtimePayload = activeSource.buildPayload();
    const runtime = buildBattleRuntime(runtimePayload);
    battleRuntimeRef.current = runtime;
    setRuntimeReadyVersion((prev) => prev + 1);

    const detailedResults: Record<number, Record<string, any>> = {};
    runtime.rounds.forEach((roundPlan) => {
      const roundResult: Record<string, any> = {};
      Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
        roundResult[playerId] = {
          道具: drop.itemName,
          品质: drop.rarity === 'legendary' ? 'legendary' : 'normal',
          价格: `$${drop.value}`,
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
        
        if (isTeam) {
          // 新规则（团队）：按“本轮每个队伍总金额”比较来给团队积分
          // - 非倒置：总金额最高的队伍/队伍们各 +1
          // - 倒置：总金额最低的队伍/队伍们各 +1
          // - 平局：并列的队伍都 +1；若全部相同则全部 +1
          const teamTotals: Record<string, number> = {};
          const teamHasEntry: Record<string, boolean> = {};

          allParticipants.forEach((participant) => {
            if (!participant?.id || !participant.teamId) return;
            const drop = (roundPlan.drops as any)?.[participant.id];
            if (!drop) return;
            const value = Number(drop.value ?? 0);
            teamTotals[participant.teamId] = (teamTotals[participant.teamId] ?? 0) + (Number.isFinite(value) ? value : 0);
            teamHasEntry[participant.teamId] = true;
          });

          const eligibleTeamEntries = Object.entries(teamTotals).filter(([teamId]) => Boolean(teamHasEntry[teamId]));
          if (!eligibleTeamEntries.length) {
            roundWinners[roundIdx] = [];
            return;
          }

          const comparator = runtime.config.specialRules.inverted ? Math.min : Math.max;
          const targetTotal = comparator(...eligibleTeamEntries.map(([, total]) => total));
          const winningTeamIds = eligibleTeamEntries
            .filter(([, total]) => total === targetTotal)
            .map(([teamId]) => teamId)
            .filter(Boolean);

          winningTeamIds.forEach((teamId) => {
            scores[teamId] = (scores[teamId] || 0) + 1;
          });
          roundWinners[roundIdx] = winningTeamIds;
          return;
        } else {
          const roundPrices: Record<string, number> = {};
          Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
            roundPrices[playerId] = drop.value;
          });

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
        }
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
      const fallbackStartRound = Math.max(0, totalRounds - Math.max(0, playersCount - 1));
      const eliminationSequence = runtime.eliminationMeta?.eliminationOrder;

      if (Array.isArray(eliminationSequence) && eliminationSequence.length > 0) {
        const startRoundIndex =
          typeof runtime.eliminationMeta?.startRoundIndex === 'number'
            ? runtime.eliminationMeta.startRoundIndex
            : fallbackStartRound;
        const eliminations: Record<number, {
          eliminatedPlayerId: string;
          eliminatedPlayerName: string;
          needsSlotMachine: boolean;
          tiedPlayerIds?: string[];
        }> = {};
        const eliminatedSet = new Set<string>();

        eliminationSequence.forEach((playerIdRaw, idx) => {
          const playerId = String(playerIdRaw);
          const participant = allParticipants.find((p) => String(p.id) === playerId);
          const roundIdx = startRoundIndex + idx;
          eliminations[roundIdx] = {
            eliminatedPlayerId: playerId,
            eliminatedPlayerName: participant?.name ?? `玩家 ${playerId}`,
            needsSlotMachine: false,
          };
          eliminatedSet.add(playerId);
        });

        const finalWinnerId =
          allParticipants.find((p) => !eliminatedSet.has(p.id))?.id ??
          runtime.classic?.winnerId ??
          allParticipants[0]?.id ??
          '';

        eliminationDataRef.current = {
          eliminations,
          eliminationStartRound: startRoundIndex,
          finalWinnerId,
        };
      } else {
        const eliminations: Record<number, {
          eliminatedPlayerId: string;
          eliminatedPlayerName: string;
          needsSlotMachine: boolean;
          tiedPlayerIds?: string[];
        }> = {};
        let activePlayerIds = allParticipants.map((p) => p.id);

        const eliminationCount = Math.max(0, playersCount - 1);
        for (let i = 0; i < eliminationCount && fallbackStartRound + i < totalRounds; i++) {
          const roundIdx = fallbackStartRound + i;
          const roundResult = detailedResults[roundIdx];
          if (!roundResult) continue;
          
          const playerPrices = activePlayerIds
            .map((playerId) => {
              const item = roundResult[playerId];
              if (!item || !item.价格) return null;
              return {
                id: playerId,
                name: allParticipants.find((p) => p.id === playerId)?.name || 'Unknown',
                price: parseFloat(item.价格.replace('$', '')),
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
          eliminationStartRound: fallbackStartRound,
          finalWinnerId: activePlayerIds[0],
        };
      }
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

  // 🕒 监听标签页可见性，记录离开时轮次与停留时长，并在返回时补齐轮次
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibility = () => {
      // 只允许在正式对战进行中补轮次：等待区 / 倒计时 / 已完成（展示获胜者）都不应触发
      const canHydrateTimeline =
        mainStateRef.current === 'ROUND_LOOP' && roundStateRef.current !== null;

      if (document.hidden) {
        if (!canHydrateTimeline) {
          lastHiddenAtRef.current = null;
          lastHiddenRoundRef.current = null;
          return;
        }
        lastHiddenAtRef.current = Date.now();
        lastHiddenRoundRef.current = currentRoundRef.current;
      } else {
        const hiddenAt = lastHiddenAtRef.current;
        const hiddenRound = lastHiddenRoundRef.current;
        if (!canHydrateTimeline) {
          lastHiddenAtRef.current = null;
          lastHiddenRoundRef.current = null;
          return;
        }
        if (hiddenAt !== null) {
          const deltaMs = Date.now() - hiddenAt;

          // 补齐轮次（基于回合时长推算）
          if (
            hiddenRound !== null &&
            Number.isFinite(hiddenRound) &&
            typeof totalRoundsRef.current === 'number' &&
            totalRoundsRef.current > 0
          ) {
            const roundDurationMs = isFastModeRef.current
              ? FAST_ROUND_DURATION_MS
              : NORMAL_ROUND_DURATION_MS;
            const skipped = Math.floor(deltaMs / roundDurationMs);
            if (skipped > 0) {
              const targetRound = Math.min(totalRoundsRef.current, hiddenRound + skipped);
              hydrateRoundsProgress(targetRound);
              if (targetRound >= totalRoundsRef.current) {
                setCountdownValue(null);
                setRoundState(null);
                setMainState('COMPLETED');
              } else {
                setRoundState('ROUND_RENDER');
                setMainState('ROUND_LOOP');
              }
            }
          }
        }
        lastHiddenAtRef.current = null;
        lastHiddenRoundRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [hydrateRoundsProgress, setCountdownValue, setMainState, setRoundState]);

  // 🎯 STATE TRANSITION: IDLE → LOADING
  useEffect(() => {
    if (isPendingBattle) {
      return;
    }
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
    } else if (mainState !== 'IDLE' && mainState !== 'COMPLETED' && !allSlotsFilled && !timelineHydratedRef.current) {
      // ⚠️ 已经完成进场回放（timelineHydratedRef），不要因人数抖动重置到第一轮
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
      initializationEntryRoundRef.current = null; // 🔥 重置初始化记录
      dispatchProgressState({ type: 'RESET_ALL_ROUND_FLAGS' });
      dispatchProgressState({ type: 'RESET_ROUND_EVENT_LOG' });
    }
  }, [mainState, allSlotsFilled, allParticipants.length, dispatchProgressState, battleData.playersCount, isPendingBattle]);

  // 🎯 STATE TRANSITION: LOADING → COUNTDOWN（只执行一次）
  const participantsSnapshotRef = useRef<any[]>([]);
  
  useEffect(() => {
    if (mainState !== 'LOADING' || hasGeneratedResultsRef.current) {
      return;
    }
    if (!hasWinBoxData) {
      return;
    }

    const run = async () => {
      // 🔒 标记已生成，防止重复执行
      hasGeneratedResultsRef.current = true;
      // 🔒 关键：锁定当前的 allParticipants 快照
      participantsSnapshotRef.current = [...allParticipants];
      
      // 生成所有轮次数据（使用快照）
      const rounds = generateAllResults(participantsSnapshotRef.current);
      
      // 🚀 性能优化：rounds 放在 ref，避免深度比对
      gameRoundsRef.current = rounds;

      // ✅ 关键修复：先写入进度快照（totalRounds 等关键状态），不要被资源预加载阻塞
      // 否则 runtime 先进入 COUNTDOWN，倒计时结束时 totalRounds 仍为 0，会误判已完成直接跳到 COMPLETED。
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

      // 预加载音频与图片（不阻塞主流程）
      void initAudioOnce().catch(() => {});
      try {
        const urls = collectAllImageUrls(rounds, participantsSnapshotRef.current, battleData);
        void preloadImages(urls).catch(() => {});
      } catch (err) {
      }
      const currentStatus = Number(rawDetail?.status ?? 0);
      const totalRounds = rounds.length;
      const entryRoundSetting = activeSource.entryRound;
      const shouldSkipPrepare = forceFullReplayRef.current;
      
      // 🔥 记录初始化时的 entryRound，避免后续变化导致重复初始化
      initializationEntryRoundRef.current = entryRoundSetting;
      
      
      if (currentStatus === 1) {
        if (entryRoundSetting > 0) {
          startCountdownDirect();
        } else {
          shouldSkipPrepare ? startCountdownDirect() : startCountdownWithPrepare();
        }
        timelineHydratedRef.current = true; // 标记已初始化
        return;
      }

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
       
        hydrateRoundsProgress(entryRoundIndex);
        timelineHydratedRef.current = true;
        setCountdownValue(null);
        setRoundState('ROUND_RENDER');
        setMainState('ROUND_LOOP');
      } else {
        startCountdownWithPrepare();
        timelineHydratedRef.current = true; // 标记已初始化
      }
    };

    run();
  }, [
    mainState,
    generateAllResults,
    battleData.packs.length,
    dispatchProgressState,
    setMainState,
    setRoundState,
    // 🔥 移除 activeSource.entryRound 依赖，避免数据更新导致的重复初始化
    // 使用 initializationEntryRoundRef 来跟踪初始化状态
    hydrateRoundsProgress,
    hasWinBoxData,
    startCountdownWithPrepare,
    startCountdownDirect,
    allParticipants, // 保留 allParticipants 依赖，因为需要锁定快照
  ]);

  useEffect(() => {
    if (!battleRuntimeRef.current) {
      return;
    }
    if (!hasGeneratedResultsRef.current) {
      return;
    }
    // 回放模式强制使用本地快照，不再按时间轴跳到已完成状态
    if (forceFullReplayRef.current) {
      return;
    }
    if (timelineHydratedRef.current) {
      return;
    }

    // 🔥 关键修复：如果游戏已经进入 COUNTDOWN 或 ROUND_LOOP 状态，不应该再执行初始化
    // 这可以避免在游戏进行中因为依赖项变化导致的重置
    // 使用 mainStateRef 来避免在依赖项中直接使用 mainState，防止依赖项数组大小变化
    const currentMainState = mainStateRef.current;
    if (currentMainState === 'COUNTDOWN' || currentMainState === 'ROUND_LOOP' || currentMainState === 'COMPLETED') {
      // 游戏已经开始了，不应该再执行初始化逻辑
      timelineHydratedRef.current = true; // 标记为已初始化，避免后续再次执行
      return;
    }

    const runtime = battleRuntimeRef.current;
    const currentStatus = rawDetailStatus; // 🔥 使用稳定的 status 值，避免依赖项数组大小变化
    const totalRounds = runtime.config.roundsTotal;
    const entryRoundSetting = activeSource.entryRound;
    const shouldSkipPrepare = forceFullReplayRef.current;
    
    // 🔥 防止重复初始化：如果 entryRound 变化但已经初始化过，且不是重放场景，则不执行
    // 这可以避免因为 activeSource 变化导致的重复初始化
    if (initializationEntryRoundRef.current !== null && 
        initializationEntryRoundRef.current !== entryRoundSetting &&
        !forceFullReplayRef.current) {
      // entryRound 变化了，但已经初始化过，且不是重放场景，说明是数据更新导致的
      // 不应该重新初始化，直接返回
      return;
    }
  
    // 🔥 记录初始化时的 entryRound（作为备用初始化路径）
    if (initializationEntryRoundRef.current === null) {
      initializationEntryRoundRef.current = entryRoundSetting;
    }
    
    if (currentStatus === 1) {
      if (entryRoundSetting > 0) {
        startCountdownDirect();
      } else {
        shouldSkipPrepare ? startCountdownDirect() : startCountdownWithPrepare();
      }
      timelineHydratedRef.current = true; // 标记已初始化
      return;
    }

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

    if (entryRoundSetting <= 0) {
      startCountdownWithPrepare();
      timelineHydratedRef.current = true; // 标记已初始化
      return;
    }

    // 对战详情轮次推进：优先使用后端提供的 now_at（服务端时间），避免客户端时间漂移导致轮次误判
    const serverNowAt = parseTimestampToDayjs(rawDetail?.now_at);
    const cursorNowMs = serverNowAt?.valueOf() ?? Date.now();
    const cursor = runtime.timeline.getRoundByTimestamp(cursorNowMs);

    if (cursor.phase === 'COUNTDOWN') {
      const remainSeconds = Math.max(0, Math.ceil(cursor.roundElapsedMs / 1000));
      setCountdownValue(remainSeconds);
      setMainState('COUNTDOWN');
      timelineHydratedRef.current = true; // 标记已初始化
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
  }, [
    hydrateRoundsProgress, 
    setCountdownValue, 
    setMainState, 
    setRoundState, 
    // 🔥 移除 activeSource.entryRound 依赖，使用 initializationEntryRoundRef 来防止重复初始化
    // 只在 runtimeReadyVersion 变化时执行（表示 runtime 已准备好）
    runtimeReadyVersion, 
    startCountdownWithPrepare, 
    startCountdownDirect,
    rawDetailStatus, // 🔥 使用稳定的 status 值，避免依赖项数组大小变化
  ]);

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
      if (!isSiteMuted()) {
        const ctx = (window as any).__audioContext;
        const buffer = (window as any).__tickAudioBuffer;
        if (ctx && buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }
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
      // 🔥 修复：不要立即设置为COMPLETED，而是检查是否所有轮次都已经完成滚动
      // 这样可以避免在倒计时刚结束时，轮次滚动还没开始就显示决胜老虎机
      if (currentRound >= gameData.totalRounds) {
        // 检查是否所有轮次都已经完成滚动
        const allRoundsCompleted = completedRounds.size >= gameData.totalRounds;
        
        // 🔥 关键检查：确保所有轮次都真正完成了滚动动画（通过 ROUND_SETTLE 阶段）
        // 而不是仅仅通过 hydrateRoundsProgress 填充的数据
        let allRoundsReallyCompleted = true;
        for (let i = 0; i < gameData.totalRounds; i++) {
          const settleExecuted = roundExecutionFlags[i]?.settleExecuted;
          if (!settleExecuted) {
            allRoundsReallyCompleted = false;
            break;
          }
        }
        
        if (allRoundsCompleted && allRoundsReallyCompleted) {
          // 所有轮次都已经完成滚动，可以安全地设置为COMPLETED
          setMainState('COMPLETED');
          setRoundState(null);
        } else {
          // 轮次还没有完成滚动，不应该设置为COMPLETED
          // 这种情况理论上不应该发生，但为了安全起见，我们直接返回
          // 让轮次正常进行，等待所有轮次完成后再通过ROUND_NEXT阶段设置为COMPLETED
          return;
        }
        return;
      }
      
      const currentRoundData = gameRoundsRef.current[currentRound];
      if (!currentRoundData || currentRoundData.pools.normal.length === 0) {
        return;
      }
      
      // 初始化当前轮的奖品（legendary 先显示占位符）
      const initialPrizes: Record<string, string> = {};
      Object.entries(currentRoundData.results).forEach(([participantId, result]) => {
        if (!result) return;
        initialPrizes[participantId] = result.needsSecondSpin ? 'golden_placeholder' : result.itemId;
      });
      dispatchProgressState({ type: 'SET_CURRENT_ROUND_PRIZES', prizes: initialPrizes });
      
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
  }, [mainState, roundState, gameData.currentRound, gameData.totalRounds, dispatchProgressState, roundExecutionFlags, recordRoundEvent, completedRounds.size]);

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
        if (typeof window !== 'undefined' && !isSiteMuted()) {
          const ctx = (window as any).__audioContext;
          const buffer = (window as any).__specialWinAudioBuffer;
          if (ctx && buffer) {
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
          }
        }
        
        // 轻微延迟，确保占位符渲染后立即进入第二阶段
        setTimeout(() => {
          setRoundState('ROUND_PREPARE_SECOND');
        }, 80);
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
      
      
      // 很短的延迟，确保关键数据写入后立即开始第二段
      setTimeout(() => {
        setRoundState('ROUND_SPIN_SECOND');
      }, 80);
    
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
        if (!result) {
          return;
        }
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
      const proceedToNextPhase = () => {
        if (gameMode === 'elimination') {
          setRoundState('ROUND_CHECK_ELIMINATION');
        } else {
          setRoundState('ROUND_NEXT');
        }
      };

      const hadLegendarySecondStage = currentRoundData.spinStatus.firstStage.gotLegendary.size > 0;
      const nextPhaseDelay = hadLegendarySecondStage ? SECOND_STAGE_RESULT_PAUSE_MS : 500;

      if (gameMode === 'elimination') {
        if (hadLegendarySecondStage) {
          setTimeout(proceedToNextPhase, SECOND_STAGE_RESULT_PAUSE_MS);
        } else {
          proceedToNextPhase();
        }
      } else {
        setTimeout(proceedToNextPhase, nextPhaseDelay);
      }
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
      
   
      
      const activeParticipantIds = allParticipants
        .filter((participant) => participant?.id && !eliminatedPlayerIds.has(participant.id))
        .map((participant) => participant.id);

      const deriveTieCandidates = () => {
        if (!activeParticipantIds.length) return [];

        const roundResultMap = roundResults[currentRound];
        const priceEntries: Array<{ id: string; price: number }> = [];

        if (roundResultMap) {
          activeParticipantIds.forEach((participantId) => {
            const slot = roundResultMap[participantId];
            if (!slot) return;
            const value = Number(slot.price ?? (slot as any)?.value ?? 0);
            if (Number.isFinite(value)) {
              priceEntries.push({ id: participantId, price: value });
            }
          });
        }

        if (!priceEntries.length) {
          const fallbackRound = detailedResultsRef.current?.[currentRound];
          if (fallbackRound) {
            activeParticipantIds.forEach((participantId) => {
              const record = fallbackRound[participantId];
              if (!record) return;
              const rawPrice =
                record?.价格 ??
                record?.price ??
                record?.bean ??
                record?.value ??
                (typeof record === 'number' ? record : null);
              if (rawPrice === null || rawPrice === undefined) return;
              const parsedValue = parseFloat(String(rawPrice).replace(/[^\d.-]/g, ''));
              if (Number.isFinite(parsedValue)) {
                priceEntries.push({ id: participantId, price: parsedValue });
              }
            });
          }
        }

        if (!priceEntries.length) return [];
        const comparator = isInverted ? Math.max : Math.min;
        const targetValue = comparator(...priceEntries.map((entry) => entry.price));
        return priceEntries
          .filter((entry) => entry.price === targetValue)
          .map((entry) => entry.id);
      };

      const derivedTieCandidates = deriveTieCandidates();
      const existingTieIds = Array.isArray(eliminationInfo.tiedPlayerIds)
        ? eliminationInfo.tiedPlayerIds
        : [];
      const mergedTieIds = Array.from(
        new Set(
          [...existingTieIds, ...derivedTieCandidates].filter((id) =>
            activeParticipantIds.includes(id),
          ),
        ),
      );
      if (
        mergedTieIds.length &&
        eliminationInfo.eliminatedPlayerId &&
        !mergedTieIds.includes(eliminationInfo.eliminatedPlayerId)
      ) {
        mergedTieIds.push(eliminationInfo.eliminatedPlayerId);
      }

      // 只在确有多人并列最低时才需要老虎机；否则强制不启用老虎机
      const needsSlotFromDerived = mergedTieIds.length > 1;
      const finalNeedsSlot = needsSlotFromDerived;
      const finalTiedPlayerIds = finalNeedsSlot ? mergedTieIds : undefined;

      const enhancedEliminationInfo = {
        ...eliminationInfo,
        needsSlotMachine: finalNeedsSlot,
        tiedPlayerIds: finalTiedPlayerIds,
      };

      // 保存当前淘汰数据（添加轮次索引）
      setCurrentEliminationData({
        ...enhancedEliminationInfo,
        roundIndex: currentRound,
      });
      
      if (enhancedEliminationInfo.needsSlotMachine) {
        // 🔥 需要老虎机动画 - 不在这里添加淘汰玩家，等老虎机完成后再添加
        // ✅ 若为最终回合，开启覆盖层保持锁：淘汰老虎机结束后直接衔接获胜者 UI
        if (currentRound >= gameData.totalRounds - 1) {
          setEliminationFinalOverlayHold(true);
          eliminationFinalOverlayDataRef.current = {
            ...enhancedEliminationInfo,
            roundIndex: currentRound,
          };
        }
        setRoundState('ROUND_ELIMINATION_SLOT');
      } else {
        // 🔥 直接进入淘汰结果阶段，让统一的结果处理逻辑负责标记淘汰玩家
        setRoundState('ROUND_ELIMINATION_RESULT');
      }
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    gameData.totalRounds,
    dispatchProgressState,
    roundResults,
    allParticipants,
    eliminatedPlayerIds,
    isInverted,
  ]);

  // ✅ 最终回合桥接：等“获胜者已确定/可渲染”后再释放淘汰老虎机覆盖层，避免闪出纵向老虎机
  useEffect(() => {
    if (!eliminationFinalOverlayHold) return;

    // 若流程被重置/离开最终态，直接释放
    if (mainState !== 'COMPLETED') {
      setEliminationFinalOverlayHold(false);
      eliminationFinalOverlayDataRef.current = null;
      return;
    }

    let rafId = 0;
    const startAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const maxWaitMs = isFastMode ? 300 : 800;

    const tick = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = now - startAt;

      // completedWinnerSetRef 会在 resolveWinnersByMode 成功后置 true
      if (completedWinnerSetRef.current || elapsed > maxWaitMs) {
        setEliminationFinalOverlayHold(false);
        eliminationFinalOverlayDataRef.current = null;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [eliminationFinalOverlayHold, isFastMode, mainState]);
  
  // 🔥 ROUND_LOOP 子状态机: ROUND_ELIMINATION_SLOT（播放淘汰老虎机动画）
  useEffect(() => {
    if (mainState !== 'ROUND_LOOP' || roundState !== 'ROUND_ELIMINATION_SLOT') {
      return;
    }
    if (currentEliminationData?.needsSlotMachine && !currentEliminationData.tiedPlayerIds?.length) {
      setRoundState('ROUND_ELIMINATION_RESULT');
    }
  }, [mainState, roundState, currentEliminationData]);
  
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
      
      setCurrentEliminationData(null); // 清空当前淘汰数据
      setRoundState('ROUND_NEXT');
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
        // 重置奖品、玩家数据源和key后缀
        dispatchProgressState({ type: 'RESET_CURRENT_ROUND_PRIZES' });
        dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });
        dispatchProgressState({ type: 'RESET_SLOT_KEY_SUFFIX' });
        dispatchProgressState({ type: 'RESET_ROUND_FLAGS', roundIndex: currentRound });
        
        // 更新游戏数据到下一轮
        dispatchProgressState({ type: 'SET_CURRENT_ROUND', currentRound: nextRound });
        
        // 回到ROUND_RENDER开始新一轮
        setRoundState('ROUND_RENDER');
      } else {
        // 🎰 大奖模式：结束后进入色条滚动阶段（包含 Last Chance：仅在最后一轮结束时按最后一轮金额计算百分比并滚动）
        if (gameMode === 'jackpot' && !jackpotRollTriggeredRef.current) {
          jackpotRollTriggeredRef.current = true;
          prepareJackpotDisplayData();
          setJackpotPhase('rolling');
          setRoundState('ROUND_JACKPOT_ROLL');
          return;
        }
        setMainState('COMPLETED');
        setRoundState(null);
      }
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    gameData.totalRounds,
    gameMode,
    prepareJackpotDisplayData,
    setJackpotPhase,
  ]);

  useEffect(() => {
    currentRoundRef.current = gameData.currentRound;
  }, [gameData.currentRound]);

  useEffect(() => {
    mainStateRef.current = mainState;
  }, [mainState]);
  
  useEffect(() => {
    totalRoundsRef.current = gameData.totalRounds;
  }, [gameData.totalRounds]);
  
  useEffect(() => {
    isFastModeRef.current = Boolean(isFastMode);
  }, [isFastMode]);
  
  useEffect(() => {
    roundStateRef.current = roundState;
  }, [roundState]);
  
  useEffect(() => {
    // 只在正式进入 ROUND_LOOP 时隐藏卡包，准备/倒计时阶段继续展示卡包
    setHidePacks(mainState === 'ROUND_LOOP');
    // 🎰 Jackpot：一旦进入色条/揭晓流程，就必须完全阻断老虎机 UI（避免色条结束到赢家出现的闪屏回退）
    const shouldBlockSlotMachinesForJackpot =
      gameMode === 'jackpot' &&
      Boolean(jackpotRollTriggeredRef.current) &&
      (mainState === 'ROUND_LOOP' || mainState === 'COMPLETED');

    setShowSlotMachines(
      mainState === 'ROUND_LOOP' &&
        roundState !== 'ROUND_JACKPOT_ROLL' &&
        !shouldBlockSlotMachinesForJackpot,
    );
    setAllRoundsCompleted(mainState === 'COMPLETED');
  }, [mainState, roundState, gameMode]);
  
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
            道具: prize?.name ?? t('notRevealed'),
            金额: prize ? `$${Number(prize.price ?? 0).toFixed(2)}` : '—',
          };
        });
      });
  }, [battleData.participants, roundResults]);
  

  
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
    window.setTimeout(() => {
      // 先打开 gate，让获胜者结算逻辑在本轮 effect 中完成（确保 winners 已标记）
      setTieBreakerGateOpen(true);

      // 再等 winners ready 后卸载决胜老虎机覆盖层，避免“覆盖层消失 -> 露出其它UI -> 再出现获胜者”的闪屏
      const startAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const maxWaitMs = isFastMode ? 300 : 900;
      let rafId = 0;

      const tick = () => {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const elapsed = now - startAt;
        if (completedWinnerSetRef.current || elapsed > maxWaitMs) {
          setTieBreakerPlan(null);
          return;
        }
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
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

  // 在已完成态回放/直达完成时，补齐缺失的 settleExecuted 标记，避免决胜老虎机被守卫拦截
  useEffect(() => {
    if (mainState !== 'COMPLETED') return;
    if (!gameData?.totalRounds) return;

    for (let i = 0; i < gameData.totalRounds; i++) {
      const alreadySettled = roundExecutionFlags[i]?.settleExecuted;
      if (alreadySettled) continue;

      if (!completedRounds.has(i)) continue;
      const roundData = roundResults?.[i];
      if (!roundData || !Object.keys(roundData).length) continue;

      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: i,
        flag: 'settleExecuted',
        value: true,
      });
    }
  }, [mainState, gameData?.totalRounds, completedRounds, roundResults, roundExecutionFlags, dispatchProgressState]);

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

    // 🔥 修复：确保所有轮次都已经完成滚动后再显示决胜老虎机
    // 避免在倒计时刚结束时，轮次滚动还没开始就显示决胜老虎机
    // 不仅要检查 completedRounds.size，还要检查所有轮次是否真正完成了 ROUND_SETTLE 阶段
    const allRoundsCompleted = completedRounds.size >= gameData.totalRounds;
    
    // 🔥 关键检查：确保所有轮次都真正完成了滚动动画（通过 ROUND_SETTLE 阶段）
    // 而不是仅仅通过 hydrateRoundsProgress 填充的数据
    let allRoundsReallyCompleted = true;
    for (let i = 0; i < gameData.totalRounds; i++) {
      const settleExecuted = roundExecutionFlags[i]?.settleExecuted;
      if (!settleExecuted) {
        allRoundsReallyCompleted = false;
        break;
      }
    }
    
    if (!allRoundsCompleted || !allRoundsReallyCompleted) {
      // 还有轮次没有完成滚动，不显示决胜老虎机
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
      if (gameMode === 'jackpot' && jackpotPhase !== 'winner') {
        return;
      }
      setTieBreakerGateOpen(true);
    }
  }, [mainState, tieBreakerGateOpen, tieBreakerPlan, evaluateTieBreakerPlan, gameMode, jackpotPhase, completedRounds.size, gameData.totalRounds, roundExecutionFlags]);

  // 旧的完成检查和轮次切换逻辑已被状态机接管
  
  // 🎯 COMPLETED状态：显示最终统计和判定获胜者
  useEffect(() => {
    if (mainState === 'COMPLETED') {
      if (gameMode === 'jackpot') {
        prepareJackpotDisplayData();
        if (isJackpotWithLastChance || !jackpotRollTriggeredRef.current) {
          setJackpotPhase('winner');
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
  }, [mainState, roundResults, allParticipants, gameMode, prepareJackpotDisplayData, isJackpotWithLastChance]);

  useEffect(() => {
    if (mainState !== 'COMPLETED') return;
    if (gameMode !== 'sprint') return;
    const sprintData = sprintDataRef.current;
    if (!sprintData?.scores || !Object.keys(sprintData.scores).length) return;
    setSprintScores((prev) => {
      if (Object.keys(prev).length) return prev;
      return { ...sprintData.scores };
    });
  }, [mainState, gameMode]);

  useEffect(() => {
    if (mainState !== 'COMPLETED' || gameMode !== 'elimination') return;
    const eliminationData = eliminationDataRef.current;
    if (!eliminationData?.eliminations) return;

    setEliminationRounds((prev) => {
      if (Object.keys(prev).length) return prev;
      const roundsMap: Record<string, number> = {};
      Object.entries(eliminationData.eliminations).forEach(([roundIdx, info]) => {
        if (info?.eliminatedPlayerId) {
          roundsMap[info.eliminatedPlayerId] = Number(roundIdx);
        }
      });
      return Object.keys(roundsMap).length ? roundsMap : prev;
    });

    setEliminatedPlayerIds((prev) => {
      if (prev.size > 0) return prev;
      const entries = Object.values(eliminationData.eliminations || {});
      if (!entries.length) return prev;
      const next = new Set(prev);
      entries.forEach((info) => {
        if (info?.eliminatedPlayerId) {
          next.add(info.eliminatedPlayerId);
        }
      });
      return next;
    });
  }, [mainState, gameMode]);

  useEffect(() => {
    if (mainState !== 'COMPLETED') return;
    if (completedWinnerSetRef.current) return;

    // 🔥 修复：不仅在有决胜老虎机时需要 tieBreakerGateOpen，没有决胜老虎机时也应该触发
    // 如果没有决胜老虎机，tieBreakerPlan 为 null，此时应该直接触发
    // 如果有决胜老虎机，需要等待 tieBreakerGateOpen 为 true（决胜老虎机完成）
    const shouldTrigger = tieBreakerPlan === null ? true : tieBreakerGateOpen;
    if (!shouldTrigger) return;

    const resolved = resolveWinnersByMode();
    if (resolved) {
      completedWinnerSetRef.current = true;
    }
  }, [mainState, tieBreakerGateOpen, tieBreakerPlan, resolveWinnersByMode, triggerWinnerCelebration]);

  // 在获胜者视图可见时再触发烟花，避免早于展示
  useEffect(() => {
    if (mainState !== 'COMPLETED') {
      winnerCelebrationFiredRef.current = false;
      return;
    }
    // 需要决胜老虎机完成（gate open）且不在决胜过程中
    if (tieBreakerPlanRef.current) return;
    if (!tieBreakerGateOpen) return;
    if (!completedWinnerSetRef.current) return;
    if (winnerCelebrationFiredRef.current) return;

    // 确认 FireworkArea 已挂载
    if (!winnerFireworkRef.current) return;

    winnerCelebrationFiredRef.current = true;
    triggerWinnerCelebration();
  }, [mainState, tieBreakerGateOpen, tieBreakerPlan, triggerWinnerCelebration]);

  
  // Symbols are now managed by state and only updated when round starts

  // ✅ 整页 loading 覆盖层：承接“时间轴/轮次初始化”的计算期（不 return，不改变原本状态机/时间轴推进逻辑）
  // 关键：不能用 return 提前返回，否则回放/初始化可能依赖子组件挂载而产生死锁。
  // 这里必须覆盖到 LOADING/COUNTDOWN 等中间态，否则会闪出 PacksGallery。
  // 回放会主动把 timelineHydratedRef 置为 false 用于重新执行动画，但这不应该触发“首屏初始化遮罩”
  // 否则回放流程不会再把它置回 true，会导致遮罩永远不消失。
  const shouldMaskInitialWaitingUi =
    !isPendingBattle &&
    !timelineHydratedRef.current &&
    !forceFullReplayRef.current &&
    !initiallyPendingRef.current;

  // 把“首屏初始化是否完成”的状态上报给父组件，用统一的首屏 loading 覆盖这一段计算期
  useEffect(() => {
    onInitialUiReadyChange?.(!shouldMaskInitialWaitingUi);
  }, [onInitialUiReadyChange, shouldMaskInitialWaitingUi]);

  const isJackpotRevealActive =
    gameMode === 'jackpot' &&
    Boolean(jackpotRollTriggeredRef.current) &&
    (mainState === 'ROUND_LOOP' || mainState === 'COMPLETED');

  const headerStatusText = isJackpotRevealActive
    ? jackpotPhase === 'rolling'
      ? t('jackpotRolling')
      : t('jackpotRevealing')
    : tieBreakerPlan
      ? t('tieBreakerInProgress')
    : prepareDelay
      ? t('preparingBlocks')
      : isPendingBattle
        ? t('waitingPlayers')
        : Number(rawDetail?.status ?? 0) === 1
          ? t('waitingBlocks')
          : t('waitingBlocks');
  const shouldShowGallery =
    !shouldMaskInitialWaitingUi &&
    !showSlotMachines &&
    (mainState === 'IDLE' || mainState === 'LOADING' || mainState === 'COUNTDOWN');

  return (
    <div className="flex flex-col flex-1 items-stretch relative">
      <div className="flex flex-col items-center gap-0 pb-20 w-full" style={{ marginTop: "-32px" }}>
          <BattleHeader
            packImages={packImages}
            highlightedIndices={highlightedIndices}
          statusText={headerStatusText}
          awardName={gameModeLabel}
          modeLabel={gameModeLabel}
            totalCost={battleData.cost}
          isCountingDown={countdownValue !== null && countdownValue > 0}
          // 避免 showSlotMachines（useEffect 更新）导致的“一帧滞后”闪烁：直接由状态机推导
          isPlaying={
            mainState === 'ROUND_LOOP' &&
            roundState !== 'ROUND_JACKPOT_ROLL' &&
            !(gameMode === 'jackpot' && Boolean(jackpotRollTriggeredRef.current)) &&
            !allRoundsCompleted
          }
          isCompleted={allRoundsCompleted}
          currentRound={currentRound}
          totalRounds={battleData.packs.length}
          currentPackName={battleData.packs[currentRound]?.name || ''}
          currentPackPrice={battleData.packs[currentRound]?.value ?? '$0.00'}
          gameMode={gameMode}
          isFastMode={isFastMode}
          isLastChance={isLastChance}
          isInverted={isInverted}
            onFairnessClick={() => {
              // Handle fairness click
            }}
            onShareClick={async () => {
              try {
                const url = window.location.href;
                await navigator.clipboard.writeText(url);
                showGlobalToast({
                  title: t('battleLinkCopied'),
                  description: t('battleLinkCopiedToClipboard'),
                  variant: 'success',
                  durationMs: 2000,
                });
              } catch (e) {
                showGlobalToast({
                  title: t('copyFailed'),
                  description: t('pleaseCopyBattleLinkManually'),
                  variant: 'error',
                  durationMs: 2000,
                });
              }
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
        {gameMode === 'jackpot' && !isJackpotWithLastChance && showSlotMachines && !allRoundsCompleted && (
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
                  <img
                    alt={participant.name}
                    src={participant.avatar}
                    className="absolute inset-0 w-full h-full pointer-events-none object-cover"
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
              <div
                className="flex flex-col items-center justify-center gap-6 w-full max-w-[1280px] mx-auto px-4 md:px-0 relative"
                style={{ minHeight: '450px' }}
              >
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
                        <span className="font-bold text-sm md:text-lg xl:text-xl text-center w-full truncate text-white">{member.name}</span>
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
                      color: '#ffffff',
                      opacity: isRecreatingBattle ? 0.6 : 1,
                      cursor: isRecreatingBattle ? 'not-allowed' : 'pointer',
                    }}
                    disabled={isRecreatingBattle}
                    onMouseEnter={(e) => {
                      if (isRecreatingBattle) return;
                      e.currentTarget.style.backgroundColor = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      if (isRecreatingBattle) return;
                      e.currentTarget.style.backgroundColor = '#10B981';
                    }}
                    onClick={handleRecreateBattle}
                  >
                    {isRecreatingBattle ? <LoadingSpinnerIcon size={20} /> : null}
                    <p className="text-base font-bold" style={{ color: '#ffffff' }}>
                      {isRecreatingBattle
                        ? t('creatingBattle')
                        : t('recreateBattleFor').replace('{price}', battleData.cost)}
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
                          resetJackpotUiState();
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
                        initializationEntryRoundRef.current = null; // 🔥 重置初始化记录，允许重新初始化
                        
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
                        setEliminationFinalOverlayHold(false);
                        eliminationFinalOverlayDataRef.current = null;
                        
                        // 🎯 重置COMPLETED状态的防重复标记
                        completedWinnerSetRef.current = false;
                        
                        // 🔥 重置决胜老虎机相关状态
                        setTieBreakerPlan(null);
                        setTieBreakerGateOpen(false);
                        
                        startCountdownDirect();
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
                        router.replace('/create-battle?type=solo&playersInSolo=2&gameMode=classic&fastBattle=false');
                      }}
                    >
                      <p className="text-base font-bold" style={{ color: '#ffffff' }}>{t('createNewBattle')}</p>
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
                        // 注意：这里应使用“对战创建时的 fast 配置”，不要被详情页内部播放快慢状态影响
                        const isFastBattleEnabled = normalizeNumericValue(rawDetail?.fast, 0) === 1;
                        if (isFastBattleEnabled) {
                          params.set('fastBattle', 'true');
                        } else {
                          params.set('fastBattle', 'false');
                        }
                        if (isLastChance) {
                          params.set('lastChance', 'true');
                        }
                        if (isInverted) {
                          params.set('upsideDown', 'true');
                        }
                        
                        router.replace(`/create-battle?${params.toString()}`);
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
                  <div className="flex flex-col items-center relative w-full py-4">
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
        ) : gameMode === 'jackpot' && mainState === 'ROUND_LOOP' && Boolean(jackpotRollTriggeredRef.current) ? (
          // 🎰 Jackpot：色条滚动 + 揭晓过渡期间，统一由这里接管渲染，避免回退到老虎机分支闪屏
          <div
            className="flex flex-col items-center justify-center gap-6 w-full max-w-[1280px]"
            style={{ minHeight: '450px' }}
          >
            {jackpotPhase === 'rolling' ? (
              jackpotPlayerSegments.length > 0 && jackpotWinnerId ? (
                <JackpotProgressBarInline
                  key={`jackpot-animation-${jackpotAnimationKey}`}
                  players={jackpotPlayerSegments}
                  winnerId={jackpotWinnerId}
                  rngSeed={buildJackpotRngSeed({
                    battleId: routeBattleId,
                    roundIndex: gameData.currentRound,
                    winnerId: jackpotWinnerId,
                    segments: jackpotPlayerSegments,
                  })}
                  onComplete={handleJackpotAnimationComplete}
                />
              ) : (
                <div />
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 w-full">
                <div className="h-6 w-full max-w-[900px] rounded-md bg-white/5" />
                <p className="text-xs tracking-[0.3em] uppercase text-white/60">
                  {t('jackpotRevealing')}
                </p>
              </div>
            )}
            {jackpotPhase === 'rolling' ? (
              <p className="text-xs tracking-[0.3em] uppercase text-white/60">{t('jackpotRolling')}</p>
            ) : null}
          </div>
        ) : shouldShowGallery ? (
          <div ref={galleryRef} className="w-full h-full flex">
            <PacksGallery
              packs={battleData.packs}
              countdownValue={mainState === 'COUNTDOWN' ? countdownValue : null}
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
                  <SlotEdgePointer side="left" />
                  <SlotEdgePointer side="right" />
                  {teamGroups.map((teamMembers, teamIndex) => (
                    <Fragment key={`team-${teamIndex}`}>
                      <div
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
                                  key={`${participant.id}-first-${gameData.currentRound}`}
                                  ref={(ref) => {
                                    if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  rngSeed={buildBattleSlotRngSeed({
                                    battleId: routeBattleId,
                                    roundIndex: gameData.currentRound,
                                    participantId: participant.id,
                                    pool: 'normal',
                                    stage: 'first',
                                    symbols: currentRoundData.pools.normal,
                                  })}
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
                                    key={`${participant.id}-second-${gameData.currentRound}`}
                                    ref={(ref) => {
                                      if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    rngSeed={buildBattleSlotRngSeed({
                                      battleId: routeBattleId,
                                      roundIndex: gameData.currentRound,
                                      participantId: participant.id,
                                      pool: 'legendary',
                                      stage: 'second',
                                      symbols: currentRoundData.pools.legendary,
                                    })}
                                    symbols={currentRoundData.pools.legendary}
                                    selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    spinDuration={NORMAL_ROUND_DURATION_MS}
                                    onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {teamIndex < teamGroups.length - 1 && (
                        <div className="flex items-center justify-center">
                          <BattleSlotDivider orientation="vertical" />
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              ) : teamStructure === '3v3' ? (
                // 小屏幕 3v3: 2行3列（和单人6人模式完全一样）
                <div className="flex flex-col justify-center px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
                  {/* First row: 3 slot machines */}
                  <div className="relative" style={{ height: '216.5px' }}>
                    <SlotEdgePointer side="left" />
                    <SlotEdgePointer side="right" />
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
                              rngSeed={buildBattleSlotRngSeed({
                                battleId: routeBattleId,
                                roundIndex: gameData.currentRound,
                                participantId: participant.id,
                                pool: 'normal',
                                stage: 'first',
                                symbols: currentRoundData.pools.normal,
                              })}
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
                                rngSeed={buildBattleSlotRngSeed({
                                  battleId: routeBattleId,
                                  roundIndex: gameData.currentRound,
                                  participantId: participant.id,
                                  pool: 'legendary',
                                  stage: 'second',
                                  symbols: currentRoundData.pools.legendary,
                                })}
                                symbols={currentRoundData.pools.legendary}
                                selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                height={450}
                                spinDuration={NORMAL_ROUND_DURATION_MS}
                                onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
              <BattleSlotDivider orientation="horizontal" className="my-1" />
                  {/* Second row: 3 slot machines */}
                  <div className="relative" style={{ height: '216.5px' }}>
                    <SlotEdgePointer side="left" />
                    <SlotEdgePointer side="right" />
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
                              rngSeed={buildBattleSlotRngSeed({
                                battleId: routeBattleId,
                                roundIndex: gameData.currentRound,
                                participantId: participant.id,
                                pool: 'normal',
                                stage: 'first',
                                symbols: currentRoundData.pools.normal,
                              })}
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
                                rngSeed={buildBattleSlotRngSeed({
                                  battleId: routeBattleId,
                                  roundIndex: gameData.currentRound,
                                  participantId: participant.id,
                                  pool: 'legendary',
                                  stage: 'second',
                                  symbols: currentRoundData.pools.legendary,
                                })}
                                symbols={currentRoundData.pools.legendary}
                                selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                height={450}
                                spinDuration={NORMAL_ROUND_DURATION_MS}
                                onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              ) : teamStructure === '2v2' ? (
                // 小屏幕 2v2: 2 行 2 列，沿用 450px 老虎机高度裁切
                <div className="flex flex-col justify-center px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
                  {[0, 2].map((startIndex, rowIndex) => (
                    <Fragment key={`team-2v2-row-${rowIndex}`}>
                      {rowIndex === 1 && <BattleSlotDivider orientation="horizontal" className="my-1" />}
                      <div className="relative" style={{ height: '216.5px' }}>
                        <SlotEdgePointer side="left" />
                        <SlotEdgePointer side="right" />
                        <div
                          className="flex gap-0 md:gap-4 justify-around"
                          style={{ height: '216.5px', overflow: 'hidden', pointerEvents: 'none' }}
                        >
                          {allParticipants.slice(startIndex, startIndex + 2).map((participant) => {
                            if (!participant || !participant.id) return null;
                            const roundIndex = gameData.currentRound;
                            const roundData = gameRoundsRef.current[roundIndex];
                            if (!roundData) return null;
                            const selectedPrizeId = currentRoundPrizes[participant.id];
                            const keySuffix = slotMachineKeySuffix[participant.id] || '';
                            const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);

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
                                    zIndex: !keySuffix ? 1 : 0,
                                  }}
                                >
                                  <LuckySlotMachine
                                    key={`${participant.id}-first-${roundIndex}`}
                                    ref={(ref) => {
                                      if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    rngSeed={buildBattleSlotRngSeed({
                                      battleId: routeBattleId,
                                      roundIndex,
                                      participantId: participant.id,
                                      pool: 'normal',
                                      stage: 'first',
                                      symbols: roundData.pools.normal,
                                    })}
                                    symbols={roundData.pools.normal}
                                    selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    spinDuration={spinDuration}
                                    onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                                  />
                                </div>

                                {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
                                  <div
                                    className="w-full h-full transition-opacity duration-300 absolute inset-0"
                                    style={{
                                      opacity: keySuffix ? 1 : 0,
                                      pointerEvents: keySuffix ? 'auto' : 'none',
                                      zIndex: keySuffix ? 1 : 0,
                                    }}
                                  >
                                    <LuckySlotMachine
                                      key={`${participant.id}-second-${roundIndex}`}
                                      ref={(ref) => {
                                        if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                      }}
                                      rngSeed={buildBattleSlotRngSeed({
                                        battleId: routeBattleId,
                                        roundIndex,
                                        participantId: participant.id,
                                        pool: 'legendary',
                                        stage: 'second',
                                        symbols: roundData.pools.legendary,
                                      })}
                                      symbols={roundData.pools.legendary}
                                      selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                      height={450}
                                      spinDuration={NORMAL_ROUND_DURATION_MS}
                                      onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              ) : teamStructure === '2v2v2' ? (
                // 小屏幕 2v2v2: 3行2列
                <div className="flex flex-col px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px', gap: 0, justifyContent: 'center' }}>
                  {/* Row 1: 2 slot machines */}
                  <div className="relative" style={{ height: '130px' }}>
                    <SlotEdgePointer side="left" />
                    <SlotEdgePointer side="right" />
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
                          <LuckySlotMachine
                            key={`${participant.id}-first-${gameData.currentRound}`}
                            ref={(ref) => {
                              if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                            }}
                            rngSeed={buildBattleSlotRngSeed({
                              battleId: routeBattleId,
                              roundIndex: gameData.currentRound,
                              participantId: participant.id,
                              pool: 'normal',
                              stage: 'first',
                              symbols: currentRoundData.pools.normal,
                            })}
                            symbols={currentRoundData.pools.normal}
                            selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                            height={450}
                            itemSizeOverride={100}
                            spinDuration={spinDuration}
                            onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                          />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                          <LuckySlotMachine
                            key={`${participant.id}-second-${gameData.currentRound}`}
                            ref={(ref) => {
                              if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                            }}
                            rngSeed={buildBattleSlotRngSeed({
                              battleId: routeBattleId,
                              roundIndex: gameData.currentRound,
                              participantId: participant.id,
                              pool: 'legendary',
                              stage: 'second',
                              symbols: currentRoundData.pools.legendary,
                            })}
                            symbols={currentRoundData.pools.legendary}
                            selectedPrizeId={keySuffix ? selectedPrizeId : null}
                            height={450}
                            itemSizeOverride={100}
                            spinDuration={NORMAL_ROUND_DURATION_MS}
                            onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                          />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                  <BattleSlotDivider orientation="horizontal" />
                  {/* Row 2: 2 slot machines */}
                  <div className="relative" style={{ height: '130px' }}>
                    <SlotEdgePointer side="left" />
                    <SlotEdgePointer side="right" />
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
                          <LuckySlotMachine
                            key={`${participant.id}-first-${gameData.currentRound}`}
                            ref={(ref) => {
                              if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                            }}
                            rngSeed={buildBattleSlotRngSeed({
                              battleId: routeBattleId,
                              roundIndex: gameData.currentRound,
                              participantId: participant.id,
                              pool: 'normal',
                              stage: 'first',
                              symbols: currentRoundData.pools.normal,
                            })}
                            symbols={currentRoundData.pools.normal}
                            selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                            height={450}
                            itemSizeOverride={100}
                            spinDuration={spinDuration}
                            onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                          />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                          <LuckySlotMachine
                            key={`${participant.id}-second-${gameData.currentRound}`}
                            ref={(ref) => {
                              if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                            }}
                            rngSeed={buildBattleSlotRngSeed({
                              battleId: routeBattleId,
                              roundIndex: gameData.currentRound,
                              participantId: participant.id,
                              pool: 'legendary',
                              stage: 'second',
                              symbols: currentRoundData.pools.legendary,
                            })}
                            symbols={currentRoundData.pools.legendary}
                            selectedPrizeId={keySuffix ? selectedPrizeId : null}
                            height={450}
                            itemSizeOverride={100}
                            spinDuration={NORMAL_ROUND_DURATION_MS}
                            onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                          />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                  <BattleSlotDivider orientation="horizontal" />
                  {/* Row 3: 2 slot machines */}
                  <div className="relative" style={{ height: '130px' }}>
                    <SlotEdgePointer side="left" />
                    <SlotEdgePointer side="right" />
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
                          <LuckySlotMachine
                            key={`${participant.id}-first-${gameData.currentRound}`}
                            ref={(ref) => {
                              if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                            }}
                            rngSeed={buildBattleSlotRngSeed({
                              battleId: routeBattleId,
                              roundIndex: gameData.currentRound,
                              participantId: participant.id,
                              pool: 'normal',
                              stage: 'first',
                              symbols: currentRoundData.pools.normal,
                            })}
                            symbols={currentRoundData.pools.normal}
                            selectedPrizeId={!keySuffix ? selectedPrizeId : null}
                            height={450}
                            itemSizeOverride={100}
                            spinDuration={spinDuration}
                            onSpinComplete={(result) => !keySuffix && handleSlotComplete(participant.id, result)}
                          />
                          </div>
                          {isGoldenPlayer && currentRoundData.pools.legendary.length > 0 && (
                            <div className="w-full h-full transition-opacity duration-300 absolute inset-0" style={{ opacity: keySuffix ? 1 : 0, pointerEvents: keySuffix ? 'auto' : 'none', zIndex: keySuffix ? 1 : 0 }}>
                          <LuckySlotMachine
                            key={`${participant.id}-second-${gameData.currentRound}`}
                            ref={(ref) => {
                              if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                            }}
                            rngSeed={buildBattleSlotRngSeed({
                              battleId: routeBattleId,
                              roundIndex: gameData.currentRound,
                              participantId: participant.id,
                              pool: 'legendary',
                              stage: 'second',
                              symbols: currentRoundData.pools.legendary,
                            })}
                            symbols={currentRoundData.pools.legendary}
                            selectedPrizeId={keySuffix ? selectedPrizeId : null}
                            height={450}
                            itemSizeOverride={100}
                            spinDuration={NORMAL_ROUND_DURATION_MS}
                            onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                          />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              ) : null
            ) : isSmallScreen && allParticipants.length === 6 ? (
              <div className="flex flex-col justify-center px-2 md:px-4 w-full max-w-[1248px]" style={{ height: '450px' }}>
                {/* First row: 3 slot machines - actual height 450px, visible height 216.5px (center area) */}
                <div className="relative" style={{ height: '216.5px' }}>
                  <SlotEdgePointer side="left" />
                  <SlotEdgePointer side="right" />
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
                                  key={`${participant.id}-first-${roundIndex}`}
                                  ref={(ref) => {
                                    if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  rngSeed={buildBattleSlotRngSeed({
                                    battleId: routeBattleId,
                                    roundIndex,
                                    participantId: participant.id,
                                    pool: 'normal',
                                    stage: 'first',
                                    symbols: roundData.pools.normal,
                                  })}
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
                                    key={`${participant.id}-second-${roundIndex}`}
                                    ref={(ref) => {
                                      if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    rngSeed={buildBattleSlotRngSeed({
                                      battleId: routeBattleId,
                                      roundIndex,
                                      participantId: participant.id,
                                      pool: 'legendary',
                                      stage: 'second',
                                      symbols: roundData.pools.legendary,
                                    })}
                                    symbols={roundData.pools.legendary}
                                    selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    spinDuration={NORMAL_ROUND_DURATION_MS}
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
                  <BattleSlotDivider orientation="horizontal" />

                {/* Second row: 3 slot machines - actual height 450px, visible height 216.5px (center area) */}
                <div className="relative" style={{ height: '216.5px' }}>
                  <SlotEdgePointer side="left" />
                  <SlotEdgePointer side="right" />
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
                                  key={`${participant.id}-first-${roundIndex}`}
                                  ref={(ref) => {
                                    if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
                                  }}
                                  rngSeed={buildBattleSlotRngSeed({
                                    battleId: routeBattleId,
                                    roundIndex,
                                    participantId: participant.id,
                                    pool: 'normal',
                                    stage: 'first',
                                    symbols: roundData.pools.normal,
                                  })}
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
                                    key={`${participant.id}-second-${roundIndex}`}
                                    ref={(ref) => {
                                      if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                                    }}
                                    rngSeed={buildBattleSlotRngSeed({
                                      battleId: routeBattleId,
                                      roundIndex,
                                      participantId: participant.id,
                                      pool: 'legendary',
                                      stage: 'second',
                                      symbols: roundData.pools.legendary,
                                    })}
                                    symbols={roundData.pools.legendary}
                                    selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                    height={450}
                                    spinDuration={NORMAL_ROUND_DURATION_MS}
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
              </div>
            ) : (
              <div className="flex gap-0 md:gap-4 px-4 overflow-x-hidden w-full max-w-[1248px] justify-around" style={{ height: '450px', position: 'relative' }}>
                <SlotEdgePointer side="left" />
                <SlotEdgePointer side="right" />
                {allParticipants.map((participant, index) => {
                  if (!participant || !participant.id) return null;
                  
                  const roundIndex = gameData.currentRound;
                  const roundData = gameRoundsRef.current[roundIndex];
                  if (!roundData) return null;
                  
                  const selectedPrizeId = currentRoundPrizes[participant.id];
                  const keySuffix = slotMachineKeySuffix[participant.id] || '';
                  const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
                  const showDivider = shouldShowSoloSlotSeparators && index < allParticipants.length - 1;
                  const isFinalLastChanceRound =
                    isLastChance && gameData.totalRounds > 0 && roundIndex >= gameData.totalRounds - 1;

                  return (
                    <Fragment key={participant.id}>
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ height: '450px' }}>
                        {/* 🚀 只渲染当前轮次的老虎机 - 性能优化 */}
                        <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
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
                              rngSeed={buildBattleSlotRngSeed({
                                battleId: routeBattleId,
                                roundIndex,
                                participantId: participant.id,
                                pool: 'normal',
                                stage: 'first',
                                symbols: roundData.pools.normal,
                              })}
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
                                rngSeed={buildBattleSlotRngSeed({
                                  battleId: routeBattleId,
                                  roundIndex,
                                  participantId: participant.id,
                                  pool: 'legendary',
                                  stage: 'second',
                                  symbols: roundData.pools.legendary,
                                })}
                                symbols={roundData.pools.legendary}
                                selectedPrizeId={keySuffix ? selectedPrizeId : null}
                                height={450}
                                spinDuration={NORMAL_ROUND_DURATION_MS}
                                onSpinComplete={(result) => keySuffix && handleSlotComplete(participant.id, result)}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {showDivider && (
                        <div className="relative w-0 flex items-center justify-center pointer-events-none">
                          {isFinalLastChanceRound ? (
                            <div
                              className="absolute h-full flex items-center"
                              style={{ left: '50%', transform: 'translateX(-50%)' }}
                            >
                              <div className="flex h-full w-6 flex-col self-center justify-center items-center">
                                <div
                                  className="flex transition-colors duration-300 animate-in tran justify-center items-center w-[1px] min-w-[1px] sm:w-[2px] sm:min-w-[2px] h-[175px] sm:h-[150px] mx-1 xs:mx-2 md:mx-3"
                                  style={{ background: 'linear-gradient(0deg, rgb(245, 101, 101) 4.24%, rgba(245, 101, 101, 0) 100%)' }}
                                />
                                <div className="flex justify-center items-center relative h-[32px] w-[1px]">
                                  <div className="hidden sm:flex absolute justify-center items-center size-[32px] bg-gradient-to-br from-[#F56565] to-[#F56565] rounded-full">
                                    <div className="flex justify-center items-center size-[28px] bg-gray-650 rounded-full overflow-clip">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="lucide lucide-skull size-4 min-h-4 min-w-4 text-gray-400"
                                      >
                                        <path d="m12.5 17-.5-1-.5 1h1z"></path>
                                        <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path>
                                        <circle cx="15" cy="12" r="1"></circle>
                                        <circle cx="9" cy="12" r="1"></circle>
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex sm:hidden absolute justify-center items-center h-[25px]">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-skull size-2.5 min-h-2.5 min-w-2.5 text-gray-400"
                                    >
                                      <path d="m12.5 17-.5-1-.5 1h1z"></path>
                                      <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path>
                                      <circle cx="15" cy="12" r="1"></circle>
                                      <circle cx="9" cy="12" r="1"></circle>
                                    </svg>
                                  </div>
                                </div>
                                <div
                                  className="flex transition-colors duration-300 animate-in justify-center items-center w-[1px] min-w-[1px] sm:w-[2px] sm:min-w-[2px] h-[175px] sm:h-[150px] mx-1 xs:mx-2 md:mx-3"
                                  style={{ background: 'linear-gradient(rgb(245, 101, 101) 4.24%, rgba(245, 101, 101, 0) 100%)' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <BattleSlotDivider
                              orientation="vertical"
                              className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                            />
                          )}
                        </div>
                      )}
                    </Fragment>
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
            {/* 箭头基于“横向转轮(reel)”容器，而不是整块覆盖层（避免离老虎机太远） */}
            <div className="relative w-full flex items-center justify-center" style={{ height: '250px' }}>
              <SlotEdgePointer side="top" />
              <SlotEdgePointer side="bottom" />
              <div className="relative w-full" style={{ height: '195px' }}>
                <HorizontalLuckySlotMachine
                  key={`tie-breaker-${tieBreakerPlan.mode}`}
                  symbols={tieBreakerSymbols}
                  selectedPrizeId={tieBreakerPlan.winnerId}
                  onSpinComplete={handleTieBreakerComplete}
                  width={9999}
                  spinDuration={isFastMode ? 1000 : 6000}
                  isEliminationMode={true}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 🔥 淘汰老虎机覆盖层 - 最终回合用作“获胜者 UI 桥接”，避免结束后闪回纵向老虎机 */}
        {(() => {
          const eliminationOverlayData = currentEliminationData ?? eliminationFinalOverlayDataRef.current;
          const shouldShowEliminationOverlay =
            gameMode === 'elimination' &&
            (roundState === 'ROUND_ELIMINATION_SLOT' || eliminationFinalOverlayHold) &&
            Boolean(eliminationOverlayData?.needsSlotMachine) &&
            Boolean(eliminationOverlayData?.tiedPlayerIds && eliminationOverlayData.tiedPlayerIds.length);

          if (!shouldShowEliminationOverlay || !eliminationOverlayData) {
            return null;
          }
          return (
          <div className="flex absolute justify-center items-center flex-col" style={{ 
            height: '450px',
            width: '100vw',
            backgroundColor: '#191d21',
            zIndex: 50,
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            {/* 箭头基于“淘汰老虎机本体容器”，而不是整块覆盖层（避免离老虎机太远） */}
            <div className="relative w-full" style={{ height: '250px' }}>
              <SlotEdgePointer side="top" />
              <SlotEdgePointer side="bottom" />
              <EliminationSlotMachine
                ref={eliminationSlotMachineRef}
                players={eliminationPlayers}
                selectedPlayerId={eliminationOverlayData.eliminatedPlayerId}
                onSpinComplete={handleEliminationSlotComplete}
                onSpinSettled={handleEliminationSlotSettled}
                isFastMode={isFastMode}
              />
            </div>
          </div>
          );
        })()}
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
              onPendingSlotAction={isPendingBattle ? onPendingSlotAction : undefined}
              pendingButtonLabel={pendingSlotActionLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
