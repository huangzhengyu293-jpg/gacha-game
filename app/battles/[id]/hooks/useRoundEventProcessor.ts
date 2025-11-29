"use client";

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { BattleStateData, RoundEvent } from "./useBattleRuntime";
import type { Participant } from "../types";

type UseRoundEventProcessorArgs = {
  roundEventLog: RoundEvent[];
  processedEventIdsRef: MutableRefObject<Set<string>>;
  gameRoundsRef: MutableRefObject<BattleStateData['game']['rounds']>;
  allParticipants: Participant[];
  triggerFirstStageSpin: () => void;
  triggerSecondStageSpin: () => void;
  dispatchProgressState: (action: any) => void;
};

export function useRoundEventProcessor({
  roundEventLog,
  processedEventIdsRef,
  gameRoundsRef,
  allParticipants,
  triggerFirstStageSpin,
  triggerSecondStageSpin,
  dispatchProgressState,
}: UseRoundEventProcessorArgs) {
  useEffect(() => {
    if (!roundEventLog.length) {
      processedEventIdsRef.current.clear();
      return;
    }

    const pendingEvents = roundEventLog.filter((event) => !processedEventIdsRef.current.has(event.id));
    if (!pendingEvents.length) {
      return;
    }

    pendingEvents.forEach((event) => {
      processedEventIdsRef.current.add(event.id);
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
              completed: new Set<string>(
                allParticipants.map((participant) => participant?.id).filter((id): id is string => Boolean(id)),
              ),
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
  }, [
    roundEventLog,
    processedEventIdsRef,
    gameRoundsRef,
    allParticipants,
    triggerFirstStageSpin,
    triggerSecondStageSpin,
    dispatchProgressState,
  ]);
}

