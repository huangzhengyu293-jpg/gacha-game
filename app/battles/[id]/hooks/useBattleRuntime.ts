"use client";

import { useReducer, type MutableRefObject } from "react";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import type { MainState, RoundState } from "../state/viewState";
import type {
  BackendBattlePayload,
  BackendRoundPlan,
  BattleConfigPayload,
} from "../battlePayloadTypes";
import type { BattleData } from "../types";

export type BattleDataSourceConfig = {
  id: string;
  entryRound: number;
  buildData: () => BattleData;
  buildPayload: () => BackendBattlePayload;
};

export type RuntimeRoundPlan = BackendRoundPlan;

export interface TimelineCursor {
  phase: 'COUNTDOWN' | 'ROUND' | 'COMPLETED';
  roundIndex: number;
  roundElapsedMs: number;
}

export interface TimelinePlan {
  startAt: number;
  countdownMs: number;
  roundDurationMs: number;
  totalRounds: number;
  fastMode: boolean;
  getRoundByTimestamp: (ts: number) => TimelineCursor;
}

export interface ParticipantRuntimeState {
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

export interface BattleStateData {
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
      results: Record<
        string,
        {
          itemId: string;
          qualityId: string | null;
          poolType: 'normal' | 'legendary';
          needsSecondSpin: boolean;
        }
      >;
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

export interface BattleRuntime {
  config: BattleConfigPayload;
  participants: Record<string, ParticipantRuntimeState>;
  rounds: RuntimeRoundPlan[];
  timeline: TimelinePlan;
  jackpot?: BackendBattlePayload['jackpot'];
  sprint?: BackendBattlePayload['sprint'];
  classic?: BackendBattlePayload['classic'];
  eliminationMeta?: BackendBattlePayload['eliminationMeta'];
}

export type JackpotRuntimeData = {
  id: string;
  name: string;
  totalValue: number;
  teamIds: string[];
  contenderIds?: string[];
  usedLastChance?: boolean;
};

export type SprintRuntimeData = {
  scores: Record<string, number>;
  roundWinners: Record<number, string[]>;
  finalWinnerId: string;
  needsTiebreaker: boolean;
  tiebreakerPlayers: string[];
};

export type EliminationRuntimeData = {
  eliminations: Record<
    number,
    {
      eliminatedPlayerId: string;
      eliminatedPlayerName: string;
      needsSlotMachine: boolean;
      tiedPlayerIds?: string[];
    }
  >;
  eliminationStartRound: number;
  finalWinnerId?: string;
};

export type RoundEventType =
  | 'ROUND_RENDER_START'
  | 'ROUND_SPIN_FIRST_START'
  | 'ROUND_SPIN_SECOND_START'
  | 'ROUND_SETTLE_START'
  | 'ROUND_SPIN_FIRST_STOP'
  | 'ROUND_SPIN_SECOND_STOP';

export type RoundEvent = {
  id: string;
  roundIndex: number;
  type: RoundEventType;
  timestamp: number;
};

export type TieBreakerPlan = {
  mode: 'classic' | 'jackpot' | 'sprint';
  contenderIds: string[];
  winnerId: string;
};

export type BattleProgressState = {
  currentRound: number;
  totalRounds: number;
  participantValues: Record<string, number>;
  roundResults: Record<number, Record<string, SlotSymbol>>;
  completedRounds: Set<number>;
  spinState: {
    activeCount: number;
    completed: Set<string>;
  };
  playerSymbols: Record<string, SlotSymbol[]>;
  slotMachineKeySuffix: Record<string, string>;
  currentRoundPrizes: Record<string, string>;
  roundExecutionFlags: Record<
    number,
    {
      renderStarted?: boolean;
      firstSpinStarted?: boolean;
      secondSpinStarted?: boolean;
      settleExecuted?: boolean;
    }
  >;
  roundEventLog: RoundEvent[];
};

export type BattleProgressAction =
  | { type: 'RESET_PROGRESS' }
  | { type: 'SET_TOTAL_ROUNDS'; totalRounds: number }
  | { type: 'SET_CURRENT_ROUND'; currentRound: number }
  | { type: 'SET_PARTICIPANT_VALUES'; values: Record<string, number> }
  | { type: 'ACCUMULATE_PARTICIPANT_VALUES'; deltas: Record<string, number> }
  | { type: 'SET_ROUND_RESULTS'; roundResults: Record<number, Record<string, SlotSymbol>> }
  | { type: 'UPSERT_ROUND_RESULT'; roundIndex: number; results: Record<string, SlotSymbol> }
  | { type: 'SET_COMPLETED_ROUNDS'; completedRounds: Set<number> }
  | { type: 'MARK_ROUND_COMPLETED'; roundIndex: number }
  | { type: 'RESET_SPIN_STATE' }
  | {
      type: 'SET_SPIN_STATE';
      state: { activeCount: number; completed: Set<string> };
    }
  | { type: 'ADD_SPIN_COMPLETED'; participantId: string }
  | { type: 'SET_PLAYER_SYMBOLS'; symbols: Record<string, SlotSymbol[]> }
  | { type: 'RESET_PLAYER_SYMBOLS' }
  | { type: 'SET_SLOT_KEY_SUFFIX'; suffixMap: Record<string, string> }
  | { type: 'RESET_SLOT_KEY_SUFFIX' }
  | { type: 'SET_CURRENT_ROUND_PRIZES'; prizes: Record<string, string> }
  | { type: 'RESET_CURRENT_ROUND_PRIZES' }
  | { type: 'PUSH_ROUND_EVENT'; event: RoundEvent }
  | { type: 'RESET_ROUND_EVENT_LOG' }
  | {
      type: 'SET_ROUND_FLAG';
      roundIndex: number;
      flag: keyof BattleProgressState['roundExecutionFlags'][number];
      value: boolean;
    }
  | { type: 'RESET_ROUND_FLAGS'; roundIndex: number }
  | { type: 'RESET_ALL_ROUND_FLAGS' }
  | { type: 'APPLY_PROGRESS_SNAPSHOT'; snapshot: BattleProgressState };

export function createBattleProgressInitialState(): BattleProgressState {
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

export function battleProgressReducer(
  state: BattleProgressState,
  action: BattleProgressAction,
): BattleProgressState {
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

export function useBattleProgress() {
  const [progressState, dispatchProgressState] = useReducer(
    battleProgressReducer,
    undefined,
    createBattleProgressInitialState,
  );
  return { progressState, dispatchProgressState };
}

export function createTimelinePlan(config: BattleConfigPayload): TimelinePlan {
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

export function buildBattleRuntime(payload: BackendBattlePayload): BattleRuntime {
  const participantState = payload.participants.reduce<Record<string, ParticipantRuntimeState>>(
    (acc, participant) => {
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
    },
    {},
  );

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

export function convertRuntimeRoundToLegacy(
  runtimeRound: RuntimeRoundPlan,
): BattleStateData['game']['rounds'][number] {
  const results: Record<
    string,
    {
      itemId: string;
      qualityId: string | null;
      poolType: 'normal' | 'legendary';
      needsSecondSpin: boolean;
    }
  > = {};
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

export interface GenerateBattleRoundsArgs {
  participants: Array<{ id: string; name: string; teamId?: string }>;
  battleData: BattleData;
  activeSource: BattleDataSourceConfig;
  battleRuntimeRef: MutableRefObject<BattleRuntime | null>;
  detailedResultsRef: MutableRefObject<Record<number, Record<string, any>>>;
  jackpotWinnerRef: MutableRefObject<JackpotRuntimeData | null>;
  sprintDataRef: MutableRefObject<SprintRuntimeData | null>;
  eliminationDataRef: MutableRefObject<EliminationRuntimeData | null>;
}

export function generateBattleRounds({
  participants,
  battleData,
  activeSource,
  battleRuntimeRef,
  detailedResultsRef,
  jackpotWinnerRef,
  sprintDataRef,
  eliminationDataRef,
}: GenerateBattleRoundsArgs): BattleStateData['game']['rounds'] {
  const runtimePayload = activeSource.buildPayload();
  const runtime = buildBattleRuntime(runtimePayload);
  battleRuntimeRef.current = runtime;

  logTotalsForDebug(runtime, participants);

  const detailedResults = buildDetailedResults(runtime);
  detailedResultsRef.current = detailedResults;

  if (runtime.config.gameplay === 'jackpot') {
    jackpotWinnerRef.current = computeJackpotWinner(runtime, battleData, participants, detailedResults);
  } else {
    jackpotWinnerRef.current = null;
  }

  if (runtime.config.gameplay === 'sprint') {
    sprintDataRef.current = computeSprintMetadata(runtime, battleData.battleType === 'team', participants);
  } else {
    sprintDataRef.current = null;
  }

  if (runtime.config.gameplay === 'elimination') {
    eliminationDataRef.current = computeEliminationMetadata(runtime, participants);
  } else {
    eliminationDataRef.current = null;
  }

  return runtime.rounds.map(convertRuntimeRoundToLegacy);
}

function logTotalsForDebug(runtime: BattleRuntime, participants: Array<{ id: string; name: string }>) {
  if (typeof window === 'undefined') return;
  const totalsDebug: Record<string, number> = {};
  runtime.rounds.forEach((roundPlan) => {
    Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
      totalsDebug[playerId] = (totalsDebug[playerId] ?? 0) + drop.value;
    });
  });
  console.table(
    Object.entries(totalsDebug).map(([playerId, total]) => ({
      玩家: participants.find((p) => p.id === playerId)?.name || playerId,
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

function buildDetailedResults(runtime: BattleRuntime) {
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
  return detailedResults;
}

function computeJackpotWinner(
  runtime: BattleRuntime,
  battleData: BattleData,
  participants: Array<{ id: string; name: string; teamId?: string }>,
  detailedResults: Record<number, Record<string, any>>,
): JackpotRuntimeData | null {
  const participantMeta: Record<string, { name: string; totalValue: number }> = {};
  participants.forEach((p) => {
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
        const participant = participants.find((p) => p.id === playerId);
        participantMeta[playerId] = { name: participant?.name ?? 'Unknown', totalValue: 0 };
      }
    });
  }

  if (!useLastChance || Object.keys(comparisonValues).length === 0) {
    runtime.rounds.forEach((roundPlan) => {
      Object.entries(roundPlan.drops).forEach(([playerId, drop]) => {
        comparisonValues[playerId] = (comparisonValues[playerId] || 0) + drop.value;
        if (!participantMeta[playerId]) {
          const participant = participants.find((p) => p.id === playerId);
          participantMeta[playerId] = { name: participant?.name ?? 'Unknown', totalValue: 0 };
        }
        participantMeta[playerId].totalValue += drop.value;
      });
    });
  }

  const valueEntries = Object.entries(comparisonValues);
  if (!valueEntries.length) {
    return null;
  }
  const comparator = invertedJackpot ? Math.min : Math.max;
  const targetValue = comparator(...valueEntries.map(([, value]) => value));
  const candidateIds = valueEntries
    .filter(([, value]) => value === targetValue)
    .map(([id]: [string, number]) => id);
  const topPlayerId = candidateIds[0] ?? valueEntries[0][0];
  let winnerIds = [topPlayerId];
  const topPlayer = participants.find((p) => p.id === topPlayerId);
  if (topPlayer?.teamId) {
    winnerIds = participants.filter((p) => p.teamId === topPlayer.teamId).map((p) => p.id);
  }

  return {
    id: topPlayerId,
    name: participantMeta[topPlayerId]?.name ?? '',
    totalValue: targetValue,
    teamIds: winnerIds,
    contenderIds: candidateIds,
    usedLastChance: useLastChance,
  };
}

function computeSprintMetadata(
  runtime: BattleRuntime,
  isTeamBattle: boolean,
  participants: Array<{ id: string; teamId?: string }>,
): SprintRuntimeData {
  const scores: Record<string, number> = {};
  const roundWinners: Record<number, string[]> = {};

  if (isTeamBattle) {
    const teams = new Set(participants.map((p) => p.teamId).filter(Boolean) as string[]);
    teams.forEach((teamId) => {
      scores[teamId] = 0;
    });
  } else {
    participants.forEach((p) => {
      if (p?.id) scores[p.id] = 0;
    });
  }

  runtime.rounds.forEach((roundPlan) => {
    const roundIdx = roundPlan.roundIndex;
    const roundPrices: Record<string, number> = {};

    if (isTeamBattle) {
      const teamTotals: Record<string, number> = {};
      participants.forEach((participant) => {
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
      .map(([id]: [string, number]) => id);

    winners.forEach((id) => {
      scores[id] = (scores[id] || 0) + 1;
    });

    roundWinners[roundIdx] = winners;
  });

  const maxScore = Math.max(...Object.values(scores));
  const topScorers = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([id]: [string, number]) => id);
  const needsTiebreaker = topScorers.length > 1;
  const finalWinnerId = topScorers[0];

  return {
    scores,
    roundWinners,
    finalWinnerId,
    needsTiebreaker,
    tiebreakerPlayers: needsTiebreaker ? topScorers : [],
  };
}

function computeEliminationMetadata(
  runtime: BattleRuntime,
  participants: Array<{ id: string; name: string }>,
): EliminationRuntimeData {
  const totalRounds = runtime.rounds.length;
  const playersCount = participants.length;
  const eliminationStartRound = totalRounds - (playersCount - 1);
  const eliminations: Record<
    number,
    {
      eliminatedPlayerId: string;
      eliminatedPlayerName: string;
      needsSlotMachine: boolean;
      tiedPlayerIds?: string[];
    }
  > = {};
  let activePlayerIds = participants.map((p) => p.id);

  const eliminationCount = Math.max(0, playersCount - 1);
  for (let i = 0; i < eliminationCount && eliminationStartRound + i < totalRounds; i++) {
    const roundIdx = eliminationStartRound + i;
    const roundResult = runtime.rounds[roundIdx];
    if (!roundResult) continue;

    const playerPrices = activePlayerIds
      .map((playerId) => {
        const drop = roundResult.drops[playerId];
        if (!drop) return null;
        return {
          id: playerId,
          name: participants.find((p) => p.id === playerId)?.name || 'Unknown',
          price: drop.value,
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

  return {
    eliminations,
    eliminationStartRound,
    finalWinnerId: activePlayerIds[0],
  };
}

export interface HydrateProgressArgs {
  targetRound: number;
  runtimeRef: MutableRefObject<BattleRuntime | null>;
  dispatch: React.Dispatch<BattleProgressAction>;
  currentRoundRef: MutableRefObject<number>;
}

export function hydrateBattleProgress({
  targetRound,
  runtimeRef,
  dispatch,
  currentRoundRef,
}: HydrateProgressArgs) {
  const runtime = runtimeRef.current;
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
  dispatch({
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
}

