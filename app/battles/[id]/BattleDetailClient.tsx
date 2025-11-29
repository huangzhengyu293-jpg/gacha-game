'use client';

import { Fragment, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { gsap } from "gsap";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import PackDetailModal from "./components/PackDetailModal";
import PendingBattleScreen from "./components/PendingBattleScreen";
import CompletedBattleContent from "./components/CompletedBattleContent";
import SlotMachineBoard from "./components/SlotMachineBoard";
import TeamSlotBoard from "./components/TeamSlotBoard";
import CompactSlotGrid from "./components/CompactSlotGrid";
import JackpotBanner from "./components/JackpotBanner";
import type { PackItem, Participant, BattleData, BattleSlot } from "./types";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import FireworkArea, { FireworkAreaHandle } from '@/app/components/FireworkArea';
import type { SlotSymbol as HorizontalSlotSymbol } from '@/app/components/SlotMachine/HorizontalLuckySlotMachine';
import TieBreakerOverlay from "./components/TieBreakerOverlay";
import EliminationOverlay from "./components/EliminationOverlay";
import { showGlobalToast } from "@/app/components/ToastProvider";
import { api } from "@/app/lib/api";
import { useBattleViewMachine } from "./hooks/useBattleViewMachine";
import { useTieBreakerGate } from "./hooks/useTieBreakerGate";
import { useCompletedBattleEffects } from "./hooks/useCompletedBattleEffects";
import { useWinSound } from "./hooks/useWinSound";
import { useEliminationFlow } from "./hooks/useEliminationFlow";
import { useSprintFlow } from "./hooks/useSprintFlow";
import { useBattleAudio } from "./hooks/useBattleAudio";
import { useRoundEventProcessor } from "./hooks/useRoundEventProcessor";
import { useRoundPhaseEffects } from "./hooks/useRoundPhaseEffects";
import { useRoundPrizeSync } from "./hooks/useRoundPrizeSync";
import { useSlotMachineRuntime } from "./hooks/useSlotMachineRuntime";
import { useBattleVisibilityState } from "./hooks/useBattleVisibilityState";
import { useRoundResultLogger } from "./hooks/useRoundResultLogger";
import { useBattleReplayControls } from "./hooks/useBattleReplayControls";
import { useBattleDetailSource } from "./hooks/useBattleDetailSource";
import type { MainState, RoundState, CountdownUpdater } from "./state/viewState";
import { battleViewInitialContext } from "./state/viewState";
import { BattleDetailProvider } from "./context/BattleDetailContext";
import {
  useBattleProgress,
  type BattleRuntime,
  type JackpotRuntimeData,
  type SprintRuntimeData,
  type EliminationRuntimeData,
  type RuntimeRoundPlan,
  type BattleStateData,
  type RoundEventType,
  type TieBreakerPlan,
  generateBattleRounds,
  hydrateBattleProgress,
} from "./hooks/useBattleRuntime";
import type {
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

const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

// 修改為 0 表示從倒數 321 開始；改成 5 代表直接從第 5 輪開局

type BattleDetailClientProps = {
  battleId?: string | null;
};

type RemoteProgressInfo =
  | { phase: 'countdown'; countdown: number }
  | { phase: 'round'; targetRound: number }
  | { phase: 'completed' };

export default function BattleDetailClient({ battleId }: BattleDetailClientProps) {
  const routeBattleId = battleId ?? null;
  const queryClient = useQueryClient();
  const detailQueryKey = useMemo(() => ['battleDetail', routeBattleId], [routeBattleId]);
  const { activeSource } = useBattleDetailSource(routeBattleId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.info('[BattleDetail] 使用数据源', {
        routeBattleId,
        activeId: activeSource.id,
      });
    }
  }, [routeBattleId, activeSource.id]);
  const battleData = useMemo(() => activeSource.buildData(), [activeSource]);
  const resolvedBattleId = useMemo(() => {
    const rawId = battleData?.id;
    if (Array.isArray(rawId)) {
      return rawId[0] ?? routeBattleId;
    }
    return rawId ?? routeBattleId;
  }, [battleData?.id, routeBattleId]);
  const rawStatusCode =
    typeof battleData.rawStatusCode === 'number' ? battleData.rawStatusCode : undefined;
  const isPendingBattle = rawStatusCode !== undefined
    ? rawStatusCode === 0
    : battleData.status === 'pending';
  const isCompletedBattle = rawStatusCode !== undefined
    ? rawStatusCode === 2
    : battleData.status === 'completed';
  const isActiveBattle = rawStatusCode !== undefined
    ? rawStatusCode === 1
    : battleData.status === 'active';
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const parsed = JSON.parse(storedUser);
      const resolvedId =
        parsed?.userInfo?.id ??
        parsed?.id ??
        parsed?.data?.id ??
        parsed?.user?.id;
      if (resolvedId !== undefined && resolvedId !== null) {
        setCurrentUserId(String(resolvedId));
      }
    } catch (error) {
      console.warn('[BattleDetail] Failed to parse local user data', error);
    }
  }, []);
  const isOwnerView = Boolean(currentUserId && battleData.hostUserId && currentUserId === battleData.hostUserId);
  const [allSlotsFilled, setAllSlotsFilled] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  useEffect(() => {
    if (battleData.participants && battleData.participants.length) {
      setAllParticipants(battleData.participants);
    } else {
      setAllParticipants([]);
    }
  }, [battleData.participants]);
  const declaredWinnerIds = useMemo(
    () =>
      (battleData.participants || [])
        .filter((participant) => Boolean(participant?.isWinner && participant?.id))
        .map((participant) => String(participant!.id)),
    [battleData.participants],
  );
  const hasMultipleDeclaredWinners = declaredWinnerIds.length > 1;
  
  // 💰 玩家累计金额映射 (participantId -> totalValue)
  const { progressState, dispatchProgressState } = useBattleProgress();
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
  const slotAssignments = useMemo<BattleSlot[]>(() => {
    if (Array.isArray(battleData.slots) && battleData.slots.length > 0) {
      return battleData.slots;
    }
    const totalSlots = battleData.playersCount || battleData.participants.length || 1;
    return Array.from({ length: totalSlots }, (_, index) => ({
      participant: battleData.participants[index] ?? null,
      userId: battleData.participants[index]?.id,
      order: index + 1,
    }));
  }, [battleData.slots, battleData.playersCount, battleData.participants]);
  // 🎯 最后的机会模式（从battleData读取）
  const isLastChance = battleData.isLastChance || false;
  
  // 🔄 倒置模式（从battleData读取）
  const isInverted = battleData.isInverted || false;
  
  const activeParticipants = useMemo(
    () =>
      allParticipants.filter(
        (participant): participant is Participant => Boolean(participant),
      ) as Participant[],
    [allParticipants],
  );
  // 🎯 团队模式相关
  const isTeamMode = battleData.battleType === 'team';
  const teamStructure = battleData.teamStructure;
  
  // 🎮 游戏模式
  const gameMode = battleData.mode;
  const shouldShowSoloSlotSeparators = useMemo(
    () => !isTeamMode && activeParticipants.length > 1 && activeParticipants.length <= 4,
    [isTeamMode, activeParticipants.length],
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
  const sprintDataRef = useRef<SprintRuntimeData | null>(null);
  const eliminationDataRef = useRef<EliminationRuntimeData | null>(null);
  
  // 🎉 烟花动画 ref
  const winnerFireworkRef = useRef<FireworkAreaHandle>(null);
  
  const playWinSound = useWinSound();
  const { playTickSound, playBasicWinSound, playSpecialWinSound } = useBattleAudio();

  
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
  
  // 🏃 积分冲刺模式：玩家/团队积分
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
  
  // 🎯 状态机核心状态
  const {
    mainState,
    roundState,
    countdownValue,
    setMainState,
    setRoundState,
    setCountdownValue,
  } = useBattleViewMachine();
  const roundStateRef = useRef<RoundState>(battleViewInitialContext.round); // 实时状态ref

  const battleDetailContextValue = useMemo(
    () => ({
      battleData,
      mainState,
      roundState,
      countdownValue,
      setMainState,
      setRoundState,
      setCountdownValue,
    }),
    [
      battleData,
      mainState,
      roundState,
      countdownValue,
      setMainState,
      setRoundState,
      setCountdownValue,
    ],
  );
  
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
  
  const {
    eliminatedPlayerIds,
    eliminationRounds,
    currentEliminationData,
    eliminationPlayers,
    eliminationSlotMachineRef,
    handleEliminationSlotComplete,
    resetEliminationState,
  } = useEliminationFlow({
    gameMode,
    mainState,
    roundState,
    setRoundState,
    currentRound,
    allParticipants,
    eliminationDataRef,
  });

  const {
    sprintScores,
    applySprintRoundScores,
    resetSprintScores,
  } = useSprintFlow({
    gameMode,
    sprintDataRef,
    allParticipants,
    isTeamMode,
    teamLabelMap,
  });
  
  const gameRoundsRef = useRef<BattleStateData['game']['rounds']>([]);
  const currentRoundRef = useRef(0);

  const {
    slotMachineRefs,
    triggerFirstStageSpin,
    triggerSecondStageSpin,
    handleSlotComplete,
  } = useSlotMachineRuntime({
    allParticipants,
    gameData,
    gameRoundsRef,
    dispatchProgressState,
    roundStateRef,
  });

  
  // 🚀 缓存 roundResults 的转换结果，避免每次渲染都重新 map
  const roundResultsArray = useMemo(() => 
    Object.entries(roundResults).map(([round, results]) => ({
      roundId: `round-${parseInt(round)}`,
      playerItems: results
    })), 
    [roundResults]
  );

  const winners = useMemo(
    () => activeParticipants.filter((participant) => participant.isWinner),
    [activeParticipants],
  );

  const totalPrizeValue = useMemo(
    () =>
      activeParticipants.reduce(
        (sum, participant) => sum + (participantValues[participant.id] || 0),
        0,
      ),
    [activeParticipants, participantValues],
  );

  const prizePerParticipantValue = useMemo(() => {
    if (!winners.length) {
      return 0;
    }
    if (gameMode === 'share') {
      const playerCount = activeParticipants.length || 1;
      return playerCount ? totalPrizeValue / playerCount : 0;
    }
    if (isTeamMode) {
      return winners.length ? totalPrizeValue / winners.length : 0;
    }
    return totalPrizeValue;
  }, [winners.length, gameMode, isTeamMode, totalPrizeValue, activeParticipants.length]);

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
        .map(([id]: [string, number]) => id);

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
        .map(([id]: [string, number]) => id);
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
  
  // UI状态
  const [galleryAlert, setGalleryAlert] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const processedRoundEventIdsRef = useRef<Set<string>>(new Set());
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
  const remoteProgressInfo = useMemo<RemoteProgressInfo | null>(() => {
    if (isPendingBattle) return null;
    if (isCompletedBattle) {
      return { phase: 'completed' };
    }
    const updatedSeconds = battleData.updatedTimestamp;
    if (!updatedSeconds || updatedSeconds <= 0) return null;
    const nowSeconds = Date.now() / 1000;
    const diffSeconds = Math.max(0, nowSeconds - updatedSeconds);
    const countdownDuration = 3;
    if (diffSeconds < countdownDuration) {
      return {
        phase: 'countdown' as const,
        countdown: Math.max(1, Math.ceil(countdownDuration - diffSeconds)),
      };
    }
    const effectiveSeconds = diffSeconds - countdownDuration;
    const roundDurationSeconds = Math.max(0.1, spinDuration / 1000);
    const totalRounds = Math.max(1, battleData.packs.length);
    const rawRound = effectiveSeconds / roundDurationSeconds;
    if (rawRound >= totalRounds) {
      return { phase: 'completed' as const };
    }
    return {
      phase: 'round' as const,
      targetRound: Math.max(0, Math.floor(rawRound)),
    };
  }, [isPendingBattle, isCompletedBattle, battleData.updatedTimestamp, spinDuration, battleData.packs.length]);

  const battleStatusLabel = (() => {
    if (isPendingBattle) return '等待玩家';
    if (remoteProgressInfo?.phase === 'countdown') return '倒计时';
    if (remoteProgressInfo?.phase === 'round') return '对战进行中';
    if (remoteProgressInfo?.phase === 'completed') return '对战已结束';
    if (isCompletedBattle) return '对战已结束';
    return '对战进行中';
  })();

  const shouldShowCompletedView = useMemo(
    () =>
      mainState === 'COMPLETED' ||
      (!isPendingBattle && remoteProgressInfo?.phase === 'completed'),
    [mainState, isPendingBattle, remoteProgressInfo?.phase],
  );

  const { hidePacks, showSlotMachines, allRoundsCompleted } = useBattleVisibilityState({
    mainState,
    isPendingBattle,
  });

  useEffect(() => {
    if (!isPendingBattle) {
      setAllSlotsFilled(true);
    }
  }, [isPendingBattle]);

  // Pre-generate all results when countdown starts
  const hasGeneratedResultsRef = useRef(false); // Track if results have been generated
  const pendingRemoteProgressRef = useRef<RemoteProgressInfo | null>(null);
  const [runtimeReadyTick, setRuntimeReadyTick] = useState(0);

  const syncRemoteViewState = useCallback(
    (info: RemoteProgressInfo) => {
      if (info.phase === 'countdown') {
        if (mainState !== 'COUNTDOWN') {
          setMainState('COUNTDOWN');
        }
        setRoundState('ROUND_RENDER');
        setCountdownValue(info.countdown);
        return;
      }
      if (info.phase === 'round') {
        if (mainState !== 'ROUND_LOOP') {
          setMainState('ROUND_LOOP');
        }
        setRoundState('ROUND_RENDER');
        setCountdownValue(null);
        return;
      }
      if (mainState !== 'COMPLETED') {
        setMainState('COMPLETED');
      }
      setRoundState(null);
      setCountdownValue(null);
    },
    [mainState, setMainState, setRoundState, setCountdownValue],
  );

  

  const jackpotBannerVisible = useMemo(
    () =>
      !shouldShowCompletedView &&
      gameMode === 'jackpot' &&
      showSlotMachines &&
      !allRoundsCompleted,
    [shouldShowCompletedView, gameMode, showSlotMachines, allRoundsCompleted],
  );

  const jackpotBannerValue = useMemo(
    () => Object.values(participantValues).reduce((sum, val) => sum + val, 0),
    [participantValues],
  );
  useEffect(() => {
    if (!isPendingBattle) {
      return;
    }
    setMainState('IDLE');
    setRoundState(null);
    setCountdownValue(null);
    setGalleryAlert(false);
    hasGeneratedResultsRef.current = false;
    timelineHydratedRef.current = false;
    colorsAssignedRef.current = false;
    dispatchProgressState({ type: 'RESET_PROGRESS' });
    dispatchProgressState({ type: 'RESET_SPIN_STATE' });
    dispatchProgressState({ type: 'RESET_ROUND_EVENT_LOG' });
    dispatchProgressState({ type: 'RESET_ALL_ROUND_FLAGS' });
  }, [isPendingBattle, dispatchProgressState, setCountdownValue, setMainState, setRoundState]);

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

  const createBattleRounds = useCallback(
    (participantSnapshot: any[]) =>
      generateBattleRounds({
        participants: participantSnapshot,
        battleData,
        activeSource,
        battleRuntimeRef,
        detailedResultsRef,
        jackpotWinnerRef,
        sprintDataRef,
        eliminationDataRef,
      }),
    [
      activeSource,
      battleData,
      battleRuntimeRef,
      detailedResultsRef,
      jackpotWinnerRef,
      sprintDataRef,
      eliminationDataRef,
    ],
  );

  const hydrateRoundsProgress = useCallback(
    (targetRound: number) =>
      hydrateBattleProgress({
        targetRound,
        runtimeRef: battleRuntimeRef,
        dispatch: dispatchProgressState,
        currentRoundRef,
      }),
    [dispatchProgressState],
  );

  const hydrateRemoteProgress = useCallback(
    (info: RemoteProgressInfo) => {
      if (!hasGeneratedResultsRef.current || !battleRuntimeRef.current) {
        return;
      }
      if (info.phase === 'countdown') {
        hydrateRoundsProgress(0);
        return;
      }
      if (info.phase === 'round') {
        hydrateRoundsProgress(info.targetRound);
        return;
      }
      hydrateRoundsProgress(battleData.packs.length);
    },
    [hydrateRoundsProgress, battleData.packs.length],
  );

  useEffect(() => {
    if (isPendingBattle) return;
    if (!remoteProgressInfo) return;
    pendingRemoteProgressRef.current = remoteProgressInfo;
    if (!hasGeneratedResultsRef.current || !battleRuntimeRef.current) {
      return;
    }
    syncRemoteViewState(remoteProgressInfo);
    hydrateRemoteProgress(remoteProgressInfo);
    pendingRemoteProgressRef.current = null;
  }, [
    isPendingBattle,
    remoteProgressInfo,
    syncRemoteViewState,
    hydrateRemoteProgress,
  ]);

  useEffect(() => {
    if (!pendingRemoteProgressRef.current) return;
    if (!hasGeneratedResultsRef.current || !battleRuntimeRef.current) return;
    const info = pendingRemoteProgressRef.current;
    pendingRemoteProgressRef.current = null;
    syncRemoteViewState(info);
    hydrateRemoteProgress(info);
  }, [runtimeReadyTick, syncRemoteViewState, hydrateRemoteProgress]);
const timelineHydratedRef = useRef(false);
const skipDirectlyToCompletedRef = useRef(false);
const forceFullReplayRef = useRef(false);
  

  // 🎨 大奖模式：在所有插槽填满后分配颜色（只执行一次）
  const colorsAssignedRef = useRef(false);

  const {
    handleReplayBattle,
    handleCreateBattleClick,
    handleCopySetupClick,
  } = useBattleReplayControls({
    gameMode,
    gameDataTotalRounds: gameData.totalRounds,
    battleData: {
      battleType: battleData.battleType,
      teamStructure: battleData.teamStructure,
      playersCount: battleData.playersCount,
      packs: battleData.packs,
    },
    isFastMode,
    isLastChance,
    isInverted,
    setJackpotPhase,
    setJackpotAnimationKey,
    jackpotWinnerSetRef: jackpotWinnerSet,
    setAllParticipants,
    dispatchProgressState,
    resetSprintScores,
    resetEliminationState,
    setMainState,
    setRoundState,
    setCountdownValue,
    forceFullReplayRef,
    skipDirectlyToCompletedRef,
    timelineHydratedRef,
    completedWinnerSetRef,
  });
  
  useEffect(() => {
    if (isPendingBattle) {
      return;
    }
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
  }, [allSlotsFilled, allParticipants.length, gameMode, isPendingBattle]);

  // 🎯 STATE TRANSITION: IDLE → LOADING
  useEffect(() => {
    const bypassGuards = !isPendingBattle;
    const participantsReady = allParticipants.length > 0;
    const slotsReady = bypassGuards || allSlotsFilled;

    if (mainState === 'IDLE' && participantsReady && slotsReady) {
      const seatsMatch = bypassGuards || allParticipants.length === battleData.playersCount;
      if (!seatsMatch) return;

      const hasRealUser =
        bypassGuards ||
        allParticipants.some((p) => p && p.id && !String(p.id).startsWith('bot-'));
      if (!hasRealUser) return;

      setMainState('LOADING');
      return;
    }

    if (
      isPendingBattle &&
      mainState !== 'IDLE' &&
      mainState !== 'COMPLETED' &&
      !allSlotsFilled
    ) {
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
  }, [
    mainState,
    allSlotsFilled,
    allParticipants.length,
    dispatchProgressState,
    battleData.playersCount,
    isPendingBattle,
  ]);

  // 🎯 STATE TRANSITION: LOADING → COUNTDOWN（只执行一次）
  const participantsSnapshotRef = useRef<any[]>([]);
  const markRuntimeReady = useCallback(() => {
    setRuntimeReadyTick((tick) => tick + 1);
  }, []);
  
  useEffect(() => {
    if (isPendingBattle) {
      return;
    }
    if (mainState === 'LOADING' && !hasGeneratedResultsRef.current) {
      // 🔒 标记已生成，防止重复执行
      hasGeneratedResultsRef.current = true;
      
      // 🔒 关键：锁定当前的 allParticipants 快照
      participantsSnapshotRef.current = [...allParticipants];
      
      // 生成所有轮次数据（使用快照）
      const rounds = createBattleRounds(participantsSnapshotRef.current);
      
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
        markRuntimeReady();
        return;
      }

      skipDirectlyToCompletedRef.current = false;
      forceFullReplayRef.current = false;

      const entryRoundIndex = resolveEntryRoundIndex(totalRounds, entryRoundSetting);
      if (entryRoundIndex !== null) {
        setCountdownValue(null);
        setRoundState('ROUND_RENDER');
        setMainState('ROUND_LOOP');
        markRuntimeReady();
      } else {
        setMainState('COUNTDOWN');
        setCountdownValue(3);
        markRuntimeReady();
      }
    }
  }, [
    isPendingBattle,
    mainState,
    createBattleRounds,
    battleData.packs.length,
    dispatchProgressState,
    setMainState,
    setRoundState,
    activeSource.entryRound,
    hydrateRoundsProgress,
    markRuntimeReady,
  ]);

  useEffect(() => {
    if (isPendingBattle) return;
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
  }, [isPendingBattle, hydrateRoundsProgress, setCountdownValue, setMainState, setRoundState, activeSource.entryRound]);

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
      playTickSound();
      
      const timer = setTimeout(() => {
        setCountdownValue(prev => (prev ?? 0) - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mainState, countdownValue, playTickSound]);

  useRoundPhaseEffects({
    mainState,
    roundState,
    setMainState,
    setRoundState,
    gameData,
    gameRoundsRef,
    allParticipants,
    roundExecutionFlags,
    spinningState,
    currentRoundPrizes,
    dispatchProgressState,
    recordRoundEvent,
    applySprintRoundScores,
    playSpecialWinSound,
    playBasicWinSound,
    gameMode,
  });

  useRoundEventProcessor({
    roundEventLog,
    processedEventIdsRef: processedRoundEventIdsRef,
    gameRoundsRef,
    allParticipants,
    triggerFirstStageSpin,
    triggerSecondStageSpin,
    dispatchProgressState,
  });

  useEffect(() => {
    currentRoundRef.current = gameData.currentRound;
  }, [gameData.currentRound]);
  
  useEffect(() => {
    roundStateRef.current = roundState;
  }, [roundState]);
  
  useRoundResultLogger({
    participants: battleData.participants || [],
    roundResults,
  });
  
  useRoundPrizeSync({
    roundState,
    gameData,
    gameRoundsRef,
    dispatchProgressState,
  });

  // 旧的自动启动逻辑已被状态机接管，删除

  // 🚀 使用 ref 来获取最新的 mainState，避免依赖变化导致回调重新创建
  const mainStateRef = useRef(mainState);
  mainStateRef.current = mainState;
  
  // 🚀 使用 ref 追踪上一次的值，避免不必要的状态更新
  const prevAllSlotsFilledRef = useRef<boolean>(false);
  const prevParticipantsLengthRef = useRef<number>(0);
  
  // Handle when all slots are filled
  const handleAllSlotsFilledChange = useCallback(
    (filled: boolean, participants?: any[]) => {
      if (!isPendingBattle) {
        return;
      }
      if (prevAllSlotsFilledRef.current !== filled) {
        prevAllSlotsFilledRef.current = filled;
        setAllSlotsFilled(filled);
      }
      
      if (participants) {
        if (mainStateRef.current !== 'IDLE') {
          return;
        }
        
        if (prevParticipantsLengthRef.current !== participants.length) {
          prevParticipantsLengthRef.current = participants.length;
          setAllParticipants(participants);
        }
      }
    },
    [isPendingBattle],
  );

  const handleTieBreakerComplete = useCallback(() => {
    const delay = isFastMode ? 120 : 400;
    setTimeout(() => {
      setTieBreakerPlan(null);
      setTieBreakerGateOpen(true);
    }, delay);
  }, [isFastMode, setTieBreakerGateOpen, setTieBreakerPlan]);

  const inviteRobotMutation = useMutation({
    mutationFn: async (order: number) => {
      if (!resolvedBattleId) {
        throw new Error('缺少对战 ID');
      }
      return api.inviteBattleRobot(resolvedBattleId, order);
    },
    onSuccess: () => {
      showGlobalToast({
        title: "机器人已加入",
        description: "召唤请求已提交",
        durationMs: 1800,
      });
      queryClient.invalidateQueries(detailQueryKey);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : '召唤失败，请稍后再试';
      showGlobalToast({
        title: "召唤失败",
        description: message,
        variant: 'error',
        durationMs: 2200,
      });
    },
  });

  const handleJoinSlotRequest = useCallback(
    (slotIndex: number, teamId?: string) => {
      if (!isPendingBattle) {
        showGlobalToast({
          title: "提示",
          description: "对战已开始，无法召唤机器人",
          durationMs: 2000,
        });
        return;
      }
      if (inviteRobotMutation.isPending) {
        return;
      }
      if (!resolvedBattleId) {
        showGlobalToast({
          title: "提示",
          description: "缺少对战 ID，无法召唤机器人",
          durationMs: 2000,
        });
        return;
      }
      inviteRobotMutation.mutate(slotIndex + 1);
    },
    [isPendingBattle, inviteRobotMutation, resolvedBattleId],
  );
  const handleFairnessClick = useCallback(() => {
    showGlobalToast({
      title: "提示",
      description: "公平性資訊即將開放",
      durationMs: 1800,
    });
  }, []);
  const handleShareClick = useCallback(() => {
    showGlobalToast({
      title: "提示",
      description: "分享功能即將開放",
      durationMs: 1800,
    });
  }, []);

  useTieBreakerGate({
    mainState,
    tieBreakerPlan,
    setTieBreakerPlan,
    tieBreakerGateOpen,
    setTieBreakerGateOpen,
    evaluateTieBreakerPlan,
    skipDirectlyToCompletedRef,
  });

  useCompletedBattleEffects({
    mainState,
    gameMode,
    allParticipants,
    participantValues,
    playerColors,
    jackpotInitialized,
    jackpotWinnerRef,
    jackpotPlayerSegments,
    setJackpotPlayerSegments,
    setJackpotWinnerId,
    setJackpotPhase,
    detailedResultsRef,
    roundResults,
    tieBreakerGateOpen,
    completedWinnerSetRef,
    resolveWinnersByMode,
    triggerWinnerCelebration,
  });

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

  if (isPendingBattle) {
    const filledSlots = slotAssignments.filter((slot) => Boolean(slot?.participant)).length;
    const pendingStatusMessage = isOwnerView
      ? `等待玩家加入... (${filledSlots}/${battleData.playersCount})`
      : `等待房主开始对战... (${filledSlots}/${battleData.playersCount})`;
    const firstPackName = battleData.packs[0]?.name || '';
    const firstPackPrice = battleData.packs[0]?.value || battleData.cost;

    return (
      <BattleDetailProvider value={battleDetailContextValue}>
        <PendingBattleScreen
          battleData={battleData}
            packImages={packImages}
          firstPackName={firstPackName}
          firstPackPrice={firstPackPrice}
          pendingStatusMessage={pendingStatusMessage}
            gameMode={gameMode}
            isFastMode={isFastMode}
            isLastChance={isLastChance}
            isInverted={isInverted}
            roundResults={roundResultsArray}
            participantValues={participantValues}
            playerColors={playerColors}
            eliminatedPlayerIds={eliminatedPlayerIds}
            eliminationRounds={eliminationRounds}
            sprintScores={sprintScores}
            completedRounds={completedRounds}
            slotAssignments={slotAssignments}
            currentUserId={currentUserId}
          onAllSlotsFilledChange={handleAllSlotsFilledChange}
            onJoinSlot={handleJoinSlotRequest}
          onFairnessClick={handleFairnessClick}
          onShareClick={handleShareClick}
          />
      </BattleDetailProvider>
    );
  }

  return (
    <BattleDetailProvider value={battleDetailContextValue}>
      <div className="flex flex-col flex-1 items-stretch relative">
    
      <div className="flex flex-col items-center gap-0 pb-20 w-full" style={{ marginTop: "-32px" }}>
        <BattleHeader
            packImages={packImages}
            highlightedIndices={highlightedIndices}
              statusText={battleStatusLabel}
            totalCost={battleData.cost}
          isCountingDown={countdownValue !== null && countdownValue > 0}
              isPlaying={showSlotMachines && !shouldShowCompletedView}
              isCompleted={shouldShowCompletedView}
          currentRound={currentRound}
          totalRounds={battleData.packs.length}
          currentPackName={battleData.packs[currentRound]?.name || ''}
          currentPackPrice={`$${(battleData.packs[currentRound] as any)?.cost?.toFixed(2) || '0.00'}`}
          gameMode={gameMode}
          isFastMode={isFastMode}
          isLastChance={isLastChance}
          isInverted={isInverted}
            onFairnessClick={handleFairnessClick}
            onShareClick={handleShareClick}
        />
        <div 
          className="flex self-stretch relative justify-center items-center flex-col w-full" 
          style={{ 
            minHeight: '450px',
            backgroundColor: galleryAlert ? '#B91C1C' : '#191d21'
          }}
        >
        <JackpotBanner visible={jackpotBannerVisible} totalValue={jackpotBannerValue} />
            {shouldShowCompletedView ? (
          <CompletedBattleContent
            winners={winners}
            gameMode={gameMode}
            isTeamMode={isTeamMode}
            prizePerParticipant={prizePerParticipantValue}
            playerColors={playerColors}
            jackpotPhase={jackpotPhase}
            jackpotPlayerSegments={jackpotPlayerSegments}
            jackpotAnimationKey={jackpotAnimationKey}
            jackpotWinnerId={jackpotWinnerId}
            onJackpotAnimationComplete={handleJackpotAnimationComplete}
            winnerFireworkRef={winnerFireworkRef}
            onReplay={handleReplayBattle}
            onCreateNewBattle={handleCreateBattleClick}
            onCopySetup={handleCopySetupClick}
            battleCost={battleData.cost}
          />
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
          
            {isTeamMode && teamGroups.length > 0 ? (
              <TeamSlotBoard
                teamGroups={teamGroups}
                teamStructure={teamStructure}
                isSmallScreen={isSmallScreen}
                roundData={gameRoundsRef.current[gameData.currentRound]}
                slotMachineRefs={slotMachineRefs}
                slotMachineKeySuffix={slotMachineKeySuffix}
                currentRoundPrizes={currentRoundPrizes}
                                spinDuration={spinDuration}
                onSlotComplete={handleSlotComplete}
                activeParticipants={activeParticipants}
              />
            ) : isSmallScreen && activeParticipants.length === 6 ? (
              <CompactSlotGrid
                participants={activeParticipants}
                roundData={gameRoundsRef.current[gameData.currentRound]}
                slotMachineRefs={slotMachineRefs}
                slotMachineKeySuffix={slotMachineKeySuffix}
                currentRoundPrizes={currentRoundPrizes}
                                  spinDuration={spinDuration}
                onSlotComplete={handleSlotComplete}
              />
            ) : (
              <SlotMachineBoard
                participants={activeParticipants}
                roundData={gameRoundsRef.current[gameData.currentRound]}
                slotMachineRefs={slotMachineRefs}
                slotMachineKeySuffix={slotMachineKeySuffix}
                currentRoundPrizes={currentRoundPrizes}
                              spinDuration={spinDuration}
                onSlotComplete={handleSlotComplete}
                shouldShowSoloSlotSeparators={shouldShowSoloSlotSeparators}
              />
            )}
            
           
          </>
        )}
        
        {/* 🔥 横向决胜老虎机 - 经典 / Jackpot Last Chance / Sprint */}
        <TieBreakerOverlay
          isVisible={
            Boolean(tieBreakerPlan) && mainState === 'COMPLETED' && tieBreakerSymbols.length > 1
          }
              symbols={tieBreakerSymbols}
          winnerId={tieBreakerPlan?.winnerId || ''}
              onSpinComplete={handleTieBreakerComplete}
          isFastMode={isFastMode}
        />

        <EliminationOverlay
              ref={eliminationSlotMachineRef}
          isVisible={
            gameMode === 'elimination' &&
            roundState === 'ROUND_ELIMINATION_SLOT' &&
            Boolean(currentEliminationData?.needsSlotMachine && currentEliminationData.tiedPlayerIds)
          }
              players={eliminationPlayers}
          selectedPlayerId={currentEliminationData?.eliminatedPlayerId || ''}
              onSpinComplete={handleEliminationSlotComplete}
              isFastMode={isFastMode}
            />
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
              slotAssignments={slotAssignments}
              currentUserId={currentUserId}
              onJoinSlot={handleJoinSlotRequest}
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
    </BattleDetailProvider>
  );
}
