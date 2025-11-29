"use client";

import { useCallback, useMemo, useRef, useState, useEffect, type MutableRefObject } from "react";
import type { Participant } from "../types";
import type { MainState, RoundState } from "../state/viewState";
import type { EliminationRuntimeData } from "./useBattleRuntime";
import type { PlayerSymbol, EliminationSlotMachineHandle } from "../components/EliminationSlotMachine";

type CurrentEliminationData = {
  eliminatedPlayerId: string;
  eliminatedPlayerName: string;
  needsSlotMachine: boolean;
  tiedPlayerIds?: string[];
  roundIndex: number;
};

type UseEliminationFlowArgs = {
  gameMode: string;
  mainState: MainState;
  roundState: RoundState | null;
  setRoundState: (state: RoundState | null) => void;
  currentRound: number;
  allParticipants: Participant[];
  eliminationDataRef: MutableRefObject<EliminationRuntimeData | null>;
};

export function useEliminationFlow({
  gameMode,
  mainState,
  roundState,
  setRoundState,
  currentRound,
  allParticipants,
  eliminationDataRef,
}: UseEliminationFlowArgs) {
  const [eliminatedPlayerIds, setEliminatedPlayerIds] = useState<Set<string>>(new Set());
  const [eliminationRounds, setEliminationRounds] = useState<Record<string, number>>({});
  const [currentEliminationData, setCurrentEliminationData] = useState<CurrentEliminationData | null>(null);
  const eliminationSlotMachineRef = useRef<EliminationSlotMachineHandle>(null);

  const eliminationPlayers = useMemo<PlayerSymbol[]>(() => {
    if (!currentEliminationData?.tiedPlayerIds) return [];

    return allParticipants
      .filter((participant) => Boolean(participant && currentEliminationData.tiedPlayerIds?.includes(participant.id)))
      .map((participant) => {
        if (!participant) {
          return { id: '', name: '', avatar: '' };
        }

        const isBot = participant.id.startsWith('bot-') || !participant.avatar;

        if (!isBot) {
          return {
            id: participant.id,
            name: participant.name,
            avatar: participant.avatar,
          };
        }

        const maskId = `mask-${participant.id}`;
        const avatarData = `<svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
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

        return {
          id: participant.id,
          name: participant.name,
          avatar: avatarData,
        };
      });
  }, [currentEliminationData?.tiedPlayerIds, allParticipants]);

  const handleEliminationSlotComplete = useCallback(() => {
    if (!currentEliminationData) {
      setRoundState('ROUND_ELIMINATION_RESULT');
      return;
    }

    setEliminatedPlayerIds((prev) => {
      const next = new Set(prev);
      next.add(currentEliminationData.eliminatedPlayerId);
      return next;
    });

    setEliminationRounds((prev) => ({
      ...prev,
      [currentEliminationData.eliminatedPlayerId]: currentEliminationData.roundIndex,
    }));

    setTimeout(() => {
      setRoundState('ROUND_ELIMINATION_RESULT');
    }, 300);
  }, [currentEliminationData, setRoundState]);

  const resetEliminationState = useCallback(() => {
    setEliminatedPlayerIds(new Set());
    setEliminationRounds({});
    setCurrentEliminationData(null);
  }, []);

  useEffect(() => {
    if (gameMode !== 'elimination') return;
    if (mainState !== 'ROUND_LOOP' || roundState !== 'ROUND_CHECK_ELIMINATION') return;

    const currentRoundIndex = currentRound;
    const eliminationData = eliminationDataRef.current;

    if (!eliminationData?.eliminations) {
      setRoundState('ROUND_NEXT');
      return;
    }

    const { eliminations, eliminationStartRound } = eliminationData;
    if (currentRoundIndex < eliminationStartRound) {
      setRoundState('ROUND_NEXT');
      return;
    }

    const remainingPlayers = allParticipants.filter((participant) => participant && !eliminatedPlayerIds.has(participant.id));
    if (remainingPlayers.length <= 1) {
      setRoundState('ROUND_NEXT');
      return;
    }

    const eliminationInfo = eliminations[currentRoundIndex];
    if (!eliminationInfo) {
      setRoundState('ROUND_NEXT');
      return;
    }

    setCurrentEliminationData({
      ...eliminationInfo,
      roundIndex: currentRoundIndex,
    });

    if (eliminationInfo.needsSlotMachine) {
      setTimeout(() => {
        setRoundState('ROUND_ELIMINATION_SLOT');
      }, 100);
    } else {
      setEliminatedPlayerIds((prev) => {
        const next = new Set(prev);
        next.add(eliminationInfo.eliminatedPlayerId);
        return next;
      });
      setEliminationRounds((prev) => ({
        ...prev,
        [eliminationInfo.eliminatedPlayerId]: currentRoundIndex,
      }));
      setTimeout(() => {
        setRoundState('ROUND_ELIMINATION_RESULT');
      }, 100);
    }
  }, [
    gameMode,
    mainState,
    roundState,
    currentRound,
    eliminationDataRef,
    allParticipants,
    eliminatedPlayerIds,
    setRoundState,
  ]);

  useEffect(() => {
    if (roundState !== 'ROUND_ELIMINATION_SLOT' || mainState !== 'ROUND_LOOP') return;
    if (eliminationSlotMachineRef.current) {
      eliminationSlotMachineRef.current.startSpin();
      return;
    }
    setTimeout(() => setRoundState('ROUND_ELIMINATION_RESULT'), 1000);
  }, [mainState, roundState, setRoundState]);

  useEffect(() => {
    if (roundState !== 'ROUND_ELIMINATION_RESULT' || mainState !== 'ROUND_LOOP') return;
    if (!currentEliminationData) {
      setRoundState('ROUND_NEXT');
      return;
    }

    setEliminatedPlayerIds((prev) => {
      const next = new Set(prev);
      next.add(currentEliminationData.eliminatedPlayerId);
      return next;
    });

    setEliminationRounds((prev) => {
      if (currentEliminationData.eliminatedPlayerId in prev) {
        return prev;
      }
      return {
        ...prev,
        [currentEliminationData.eliminatedPlayerId]: currentEliminationData.roundIndex,
      };
    });

    setTimeout(() => {
      setCurrentEliminationData(null);
      setRoundState('ROUND_NEXT');
    }, 500);
  }, [currentEliminationData, mainState, roundState, setRoundState]);

  return {
    eliminatedPlayerIds,
    eliminationRounds,
    currentEliminationData,
    eliminationPlayers,
    eliminationSlotMachineRef,
    handleEliminationSlotComplete,
    resetEliminationState,
  };
}

