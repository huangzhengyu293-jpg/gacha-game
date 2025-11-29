"use client";

import { useCallback, useRef, type MutableRefObject, type Dispatch } from "react";
import type { Participant } from "../types";
import type { SlotSymbol, LuckySlotMachineHandle } from "@/app/components/SlotMachine/LuckySlotMachine";
import type { BattleProgressAction, BattleStateData } from "./useBattleRuntime";
import type { RoundState } from "../state/viewState";

interface UseSlotMachineRuntimeArgs {
  allParticipants: Participant[];
  gameData: Pick<BattleStateData['game'], 'currentRound'>;
  gameRoundsRef: MutableRefObject<BattleStateData['game']['rounds']>;
  dispatchProgressState: Dispatch<BattleProgressAction>;
  roundStateRef: MutableRefObject<RoundState | null>;
}

export function useSlotMachineRuntime({
  allParticipants,
  gameData,
  gameRoundsRef,
  dispatchProgressState,
  roundStateRef,
}: UseSlotMachineRuntimeArgs) {
  const slotMachineRefs = useRef<Record<string, LuckySlotMachineHandle | null>>({});

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
  }, [gameData.currentRound, gameRoundsRef]);

  const handleSlotComplete = useCallback(
    (participantId: string, result: SlotSymbol) => {
      const round = gameData.currentRound;
      const currentRoundData = gameRoundsRef.current[round];
      if (!currentRoundData) return;

      const currentRoundState = roundStateRef.current;

      if (currentRoundState === 'ROUND_SPIN_FIRST') {
        currentRoundData.spinStatus.firstStage.completed.add(participantId);
        if (result.id === 'golden_placeholder') {
          currentRoundData.spinStatus.firstStage.gotLegendary.add(participantId);
        }
        dispatchProgressState({ type: 'ADD_SPIN_COMPLETED', participantId });
      } else if (currentRoundState === 'ROUND_SPIN_SECOND') {
        currentRoundData.spinStatus.secondStage.completed.add(participantId);
        dispatchProgressState({ type: 'ADD_SPIN_COMPLETED', participantId });
      }
    },
    [dispatchProgressState, gameData.currentRound, gameRoundsRef, roundStateRef],
  );

  return {
    slotMachineRefs,
    triggerFirstStageSpin,
    triggerSecondStageSpin,
    handleSlotComplete,
  };
}

