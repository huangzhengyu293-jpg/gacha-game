"use client";

import { useRef, useEffect } from "react";
import type { Dispatch, MutableRefObject } from "react";
import type { RoundState } from "../state/viewState";
import type { BattleProgressAction, BattleStateData } from "./useBattleRuntime";

interface UseRoundPrizeSyncArgs {
  roundState: RoundState | null;
  gameData: Pick<BattleStateData['game'], 'currentRound'>;
  gameRoundsRef: MutableRefObject<BattleStateData['game']['rounds']>;
  dispatchProgressState: Dispatch<BattleProgressAction>;
}

export function useRoundPrizeSync({
  roundState,
  gameData,
  gameRoundsRef,
  dispatchProgressState,
}: UseRoundPrizeSyncArgs) {
  const lastPrizesUpdateRef = useRef<string>('');

  useEffect(() => {
    const updateKey = `${gameData.currentRound}-${roundState}`;
    if (lastPrizesUpdateRef.current === updateKey) {
      return;
    }
    lastPrizesUpdateRef.current = updateKey;

    const currentRoundData = gameRoundsRef.current[gameData.currentRound];
    if (!currentRoundData) return;

    const isFirstStage =
      roundState === 'ROUND_RENDER' ||
      roundState === 'ROUND_SPIN_FIRST' ||
      roundState === 'ROUND_CHECK_LEGENDARY';

    const prizes: Record<string, string> = {};
    Object.keys(currentRoundData.results).forEach((participantId) => {
      const result = currentRoundData.results[participantId];
      if (!result) return;

      if (result.needsSecondSpin && isFirstStage) {
        prizes[participantId] = 'golden_placeholder';
      } else {
        prizes[participantId] = result.itemId;
      }
    });

    dispatchProgressState({ type: 'SET_CURRENT_ROUND_PRIZES', prizes });
  }, [gameData.currentRound, roundState, dispatchProgressState, gameRoundsRef]);
}

