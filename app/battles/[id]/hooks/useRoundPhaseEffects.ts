"use client";

import { useEffect, type MutableRefObject, type Dispatch } from "react";
import type { MainState, RoundState } from "../state/viewState";
import type {
  BattleProgressAction,
  BattleProgressState,
  BattleStateData,
  RoundEventType,
} from "./useBattleRuntime";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import type { Participant } from "../types";

type Args = {
  mainState: MainState;
  roundState: RoundState | null;
  setMainState: (value: MainState) => void;
  setRoundState: (value: RoundState | null) => void;
  gameData: Pick<BattleStateData['game'], 'currentRound' | 'totalRounds'>;
  gameRoundsRef: MutableRefObject<BattleStateData['game']['rounds']>;
  allParticipants: Participant[];
  roundExecutionFlags: BattleProgressState['roundExecutionFlags'];
  spinningState: BattleProgressState['spinState'];
  currentRoundPrizes: BattleProgressState['currentRoundPrizes'];
  dispatchProgressState: Dispatch<BattleProgressAction>;
  recordRoundEvent: (roundIndex: number, type: RoundEventType) => void;
  applySprintRoundScores: (roundIndex: number) => void;
  playSpecialWinSound: () => void;
  playBasicWinSound: () => void;
  gameMode: string;
};

export function useRoundPhaseEffects({
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
}: Args) {
  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_RENDER') {
      const currentRound = gameData.currentRound;
      const hasRendered = roundExecutionFlags[currentRound]?.renderStarted;
      if (hasRendered) return;

      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'renderStarted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_RENDER_START');

      if (currentRound >= gameData.totalRounds) {
        setMainState('COMPLETED');
        setRoundState(null);
        return;
      }

      const currentRoundData = gameRoundsRef.current[currentRound];
      if (!currentRoundData || currentRoundData.pools.normal.length === 0) {
        return;
      }

      currentRoundData.spinStatus.firstStage.completed.clear();
      currentRoundData.spinStatus.firstStage.gotLegendary.clear();
      currentRoundData.spinStatus.secondStage.active.clear();
      currentRoundData.spinStatus.secondStage.completed.clear();

      dispatchProgressState({ type: 'RESET_SPIN_STATE' });

      setTimeout(() => {
        setRoundState('ROUND_SPIN_FIRST');
      }, 100);
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    gameData.totalRounds,
    roundExecutionFlags,
    dispatchProgressState,
    recordRoundEvent,
    setMainState,
    setRoundState,
  ]);

  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_FIRST') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameRoundsRef.current[currentRound];
      if (!currentRoundData) return;

      const firstSpinStarted = roundExecutionFlags[currentRound]?.firstSpinStarted;
      if (firstSpinStarted) return;

      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'firstSpinStarted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_SPIN_FIRST_START');

      dispatchProgressState({
        type: 'SET_SPIN_STATE',
        state: {
          activeCount: allParticipants.length,
          completed: new Set<string>(),
        },
      });
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    roundExecutionFlags,
    dispatchProgressState,
    recordRoundEvent,
    allParticipants.length,
  ]);

  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_FIRST') {
      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
      if (!currentRoundData) return;
      if (allParticipants.length === 0) return;
      if (spinningState.completed.size !== allParticipants.length) return;

      setRoundState('ROUND_CHECK_LEGENDARY');
      recordRoundEvent(gameData.currentRound, 'ROUND_SPIN_FIRST_STOP');
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    spinningState.completed.size,
    allParticipants.length,
    setRoundState,
    recordRoundEvent,
  ]);

  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_CHECK_LEGENDARY') {
      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
      if (!currentRoundData) return;

      const gotLegendary = currentRoundData.spinStatus.firstStage.gotLegendary;

      if (gotLegendary.size > 0) {
        playSpecialWinSound();
        setTimeout(() => {
          setRoundState('ROUND_PREPARE_SECOND');
        }, 500);
      } else {
        setRoundState('ROUND_SETTLE');
      }
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    setRoundState,
    playSpecialWinSound,
  ]);

  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_PREPARE_SECOND') {
      const currentRoundData = gameRoundsRef.current[gameData.currentRound];
      if (!currentRoundData) return;

      const goldenPlayers = Array.from(currentRoundData.spinStatus.firstStage.gotLegendary);
      const newPlayerSymbols: Record<string, SlotSymbol[]> = {};

      allParticipants.forEach((participant) => {
        if (!participant?.id) return;
        newPlayerSymbols[participant.id] = goldenPlayers.includes(participant.id)
          ? currentRoundData.pools.legendary
          : currentRoundData.pools.normal;
      });

      dispatchProgressState({ type: 'SET_PLAYER_SYMBOLS', symbols: newPlayerSymbols });

      const newKeySuffix: Record<string, string> = {};
      goldenPlayers.forEach((participantId) => {
        newKeySuffix[participantId] = '-second';
      });
      dispatchProgressState({ type: 'SET_SLOT_KEY_SUFFIX', suffixMap: newKeySuffix });

      setTimeout(() => {
        setRoundState('ROUND_SPIN_SECOND');
      }, 800);
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    allParticipants,
    dispatchProgressState,
    setRoundState,
    gameRoundsRef,
  ]);

  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SPIN_SECOND') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameRoundsRef.current[currentRound];
      if (!currentRoundData) return;

      const secondSpinStarted = roundExecutionFlags[currentRound]?.secondSpinStarted;
      if (secondSpinStarted) return;

      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'secondSpinStarted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_SPIN_SECOND_START');

      const goldenPlayers = Array.from(currentRoundData.spinStatus.firstStage.gotLegendary);
      const newPrizes: Record<string, string> = { ...currentRoundPrizes };
      goldenPlayers.forEach((participantId) => {
        const result = currentRoundData.results[participantId];
        if (result) {
          newPrizes[participantId] = result.itemId;
        }
      });
      dispatchProgressState({ type: 'SET_CURRENT_ROUND_PRIZES', prizes: newPrizes });

      currentRoundData.spinStatus.secondStage.active = new Set(goldenPlayers);
      currentRoundData.spinStatus.secondStage.completed.clear();

      dispatchProgressState({
        type: 'SET_SPIN_STATE',
        state: {
          activeCount: goldenPlayers.length,
          completed: new Set<string>(),
        },
      });
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    gameRoundsRef,
    roundExecutionFlags,
    dispatchProgressState,
    recordRoundEvent,
    currentRoundPrizes,
  ]);

  useEffect(() => {
    if (mainState !== 'ROUND_LOOP' || roundState !== 'ROUND_SPIN_SECOND') {
      return;
    }
    const currentRoundData = gameRoundsRef.current[gameData.currentRound];
    if (!currentRoundData) return;

    const activeCount = currentRoundData.spinStatus.secondStage.active.size;
    if (activeCount <= 0) return;

    const completedCount = currentRoundData.spinStatus.secondStage.completed.size;
    if (completedCount < activeCount) return;

    recordRoundEvent(gameData.currentRound, 'ROUND_SPIN_SECOND_STOP');
    setRoundState('ROUND_SETTLE');
    dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    gameRoundsRef,
    dispatchProgressState,
    recordRoundEvent,
  ]);

  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_SETTLE') {
      const currentRound = gameData.currentRound;
      const currentRoundData = gameRoundsRef.current[currentRound];
      if (!currentRoundData) return;

      const settleExecuted = roundExecutionFlags[currentRound]?.settleExecuted;
      if (settleExecuted) return;

      dispatchProgressState({
        type: 'SET_ROUND_FLAG',
        roundIndex: currentRound,
        flag: 'settleExecuted',
        value: true,
      });
      recordRoundEvent(currentRound, 'ROUND_SETTLE_START');
      playBasicWinSound();

      const finalResults: Record<string, SlotSymbol> = {};
      const valueDeltas: Record<string, number> = {};

      allParticipants.forEach((participant) => {
        if (!participant?.id) return;
        const result = currentRoundData.results[participant.id];
        if (!result) return;

        const pools = result.needsSecondSpin ? currentRoundData.pools.legendary : currentRoundData.pools.normal;
        const item = pools.find((symbol) => symbol.id === result.itemId && symbol.id !== 'golden_placeholder');
        if (!item) return;

        finalResults[participant.id] = item;
        const prizeValue = parseFloat(String(item.price ?? '0')) || 0;
        valueDeltas[participant.id] = (valueDeltas[participant.id] || 0) + prizeValue;
      });

      dispatchProgressState({ type: 'MARK_ROUND_COMPLETED', roundIndex: currentRound });
      dispatchProgressState({ type: 'UPSERT_ROUND_RESULT', roundIndex: currentRound, results: finalResults });
      dispatchProgressState({ type: 'ACCUMULATE_PARTICIPANT_VALUES', deltas: valueDeltas });

      if (gameMode === 'sprint') {
        applySprintRoundScores(currentRound);
      }

      dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });

      setTimeout(() => {
        if (gameMode === 'elimination') {
          setRoundState('ROUND_CHECK_ELIMINATION');
        } else {
          setRoundState('ROUND_NEXT');
        }
      }, 100);
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    gameRoundsRef,
    roundExecutionFlags,
    dispatchProgressState,
    recordRoundEvent,
    allParticipants,
    gameMode,
    applySprintRoundScores,
    playBasicWinSound,
    setRoundState,
  ]);

  useEffect(() => {
    if (mainState === 'ROUND_LOOP' && roundState === 'ROUND_NEXT') {
      const currentRound = gameData.currentRound;
      const nextRound = currentRound + 1;

      if (nextRound < gameData.totalRounds) {
        const nextRoundData = gameRoundsRef.current[nextRound];
        if (nextRoundData) {
          const nextPrizes: Record<string, string> = {};
          Object.keys(nextRoundData.results).forEach((participantId) => {
            const result = nextRoundData.results[participantId];
            nextPrizes[participantId] = result.needsSecondSpin ? 'golden_placeholder' : result.itemId;
          });
          dispatchProgressState({ type: 'SET_CURRENT_ROUND_PRIZES', prizes: nextPrizes });
        }

        dispatchProgressState({ type: 'RESET_PLAYER_SYMBOLS' });
        dispatchProgressState({ type: 'RESET_SLOT_KEY_SUFFIX' });
        dispatchProgressState({ type: 'RESET_ROUND_FLAGS', roundIndex: currentRound });
        dispatchProgressState({ type: 'SET_CURRENT_ROUND', currentRound: nextRound });
        setRoundState('ROUND_RENDER');
      } else {
        setMainState('COMPLETED');
        setRoundState(null);
      }
    }
  }, [
    mainState,
    roundState,
    gameData.currentRound,
    gameData.totalRounds,
    gameRoundsRef,
    dispatchProgressState,
    setRoundState,
    setMainState,
  ]);
}

