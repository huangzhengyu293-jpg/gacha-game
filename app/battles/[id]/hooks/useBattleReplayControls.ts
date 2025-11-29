"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BattleData } from "../types";

interface UseBattleReplayControlsArgs {
  gameMode: string;
  gameDataTotalRounds: number;
  battleData: Pick<BattleData, 'battleType' | 'teamStructure' | 'playersCount' | 'packs'>;
  isFastMode: boolean;
  isLastChance: boolean;
  isInverted: boolean;
  setJackpotPhase: (phase: 'rolling' | 'winner') => void;
  setJackpotAnimationKey: (updater: (prev: number) => number) => void;
  jackpotWinnerSetRef: React.MutableRefObject<boolean>;
  setAllParticipants: React.Dispatch<React.SetStateAction<any[]>>;
  dispatchProgressState: React.Dispatch<any>;
  resetSprintScores: () => void;
  resetEliminationState: () => void;
  setMainState: (state: any) => void;
  setRoundState: (state: any) => void;
  setCountdownValue: (value: number | null) => void;
  forceFullReplayRef: React.MutableRefObject<boolean>;
  skipDirectlyToCompletedRef: React.MutableRefObject<boolean>;
  timelineHydratedRef: React.MutableRefObject<boolean>;
  completedWinnerSetRef: React.MutableRefObject<boolean>;
}

export function useBattleReplayControls({
  gameMode,
  gameDataTotalRounds,
  battleData,
  isFastMode,
  isLastChance,
  isInverted,
  setJackpotPhase,
  setJackpotAnimationKey,
  jackpotWinnerSetRef,
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
}: UseBattleReplayControlsArgs) {
  const router = useRouter();

  const handleReplayBattle = useCallback(() => {
    if (gameMode === 'jackpot') {
      setJackpotPhase('rolling');
      setJackpotAnimationKey((prev) => prev + 1);
      jackpotWinnerSetRef.current = false;
    }

    forceFullReplayRef.current = true;
    skipDirectlyToCompletedRef.current = false;
    setAllParticipants((prev) =>
      prev.map((participant) => (participant ? { ...participant, isWinner: false } : participant)),
    );
    timelineHydratedRef.current = false;

    dispatchProgressState({
      type: 'APPLY_PROGRESS_SNAPSHOT',
      snapshot: {
        currentRound: 0,
        totalRounds: gameDataTotalRounds,
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

    resetSprintScores();
    resetEliminationState();
    completedWinnerSetRef.current = false;

    setMainState('COUNTDOWN');
    setRoundState(null);
    setCountdownValue(3);
    dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });
    dispatchProgressState({ type: 'RESET_SLOT_KEY_SUFFIX' });
    dispatchProgressState({ type: 'RESET_SPIN_STATE' });
    dispatchProgressState({ type: 'RESET_ALL_ROUND_FLAGS' });
    dispatchProgressState({ type: 'RESET_ROUND_EVENT_LOG' });
  }, [
    gameMode,
    setJackpotPhase,
    setJackpotAnimationKey,
    jackpotWinnerSetRef,
    setAllParticipants,
    dispatchProgressState,
    gameDataTotalRounds,
    resetSprintScores,
    resetEliminationState,
    setMainState,
    setRoundState,
    setCountdownValue,
    forceFullReplayRef,
    skipDirectlyToCompletedRef,
    timelineHydratedRef,
    completedWinnerSetRef,
  ]);

  const handleCreateBattleClick = useCallback(() => {
    router.push('/create-battle');
  }, [router]);

  const handleCopySetupClick = useCallback(() => {
    const params = new URLSearchParams();
    const packIds = battleData.packs.map((pack) => pack.id).join(',');
    params.set('packIds', packIds);

    if (battleData.battleType === 'team') {
      params.set('type', 'team');
      if (battleData.teamStructure) {
        params.set('teamStructure', battleData.teamStructure);
      }
    } else {
      params.set('type', 'solo');
      params.set('playersInSolo', String(battleData.playersCount));
    }

    params.set('gameMode', gameMode);
    if (isFastMode) params.set('fastBattle', 'true');
    if (isLastChance) params.set('lastChance', 'true');
    if (isInverted) params.set('upsideDown', 'true');

    router.push(`/create-battle?${params.toString()}`);
  }, [
    battleData.battleType,
    battleData.teamStructure,
    battleData.playersCount,
    battleData.packs,
    gameMode,
    isFastMode,
    isLastChance,
    isInverted,
    router,
  ]);

  return {
    handleReplayBattle,
    handleCreateBattleClick,
    handleCopySetupClick,
  };
}

