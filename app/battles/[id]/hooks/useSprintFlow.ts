"use client";

import { useCallback, useMemo, useState, type MutableRefObject } from "react";
import type { SprintRuntimeData } from "./useBattleRuntime";
import type { Participant } from "../types";

type UseSprintFlowArgs = {
  gameMode: string;
  sprintDataRef: MutableRefObject<SprintRuntimeData | null>;
  allParticipants: Participant[];
  isTeamMode: boolean;
  teamLabelMap: Map<string, string>;
};

export function useSprintFlow({
  gameMode,
  sprintDataRef,
  allParticipants,
  isTeamMode,
  teamLabelMap,
}: UseSprintFlowArgs) {
  const [sprintScores, setSprintScores] = useState<Record<string, number>>({});

  const applySprintRoundScores = useCallback(
    (roundIndex: number) => {
      if (gameMode !== 'sprint') return;
      const sprintData = sprintDataRef.current;
      if (!sprintData?.roundWinners?.[roundIndex]) return;
      const roundWinners = sprintData.roundWinners[roundIndex];

      setSprintScores((prev) => {
        const next = { ...prev };
        roundWinners.forEach((winnerId) => {
          next[winnerId] = (next[winnerId] || 0) + 1;
        });
        return next;
      });
    },
    [gameMode, sprintDataRef],
  );

  const resetSprintScores = useCallback(() => {
    setSprintScores({});
  }, []);

  const sprintLeaderboard = useMemo(() => {
    if (gameMode !== 'sprint') return [];
    const entries = Object.entries(sprintScores || {});

    if (!entries.length) {
      return allParticipants
        .filter(Boolean)
        .map((participant) => ({
          id: participant.id,
          name: isTeamMode ? teamLabelMap.get(participant.teamId || '') || participant.name : participant.name,
          score: 0,
        }));
    }

    return entries
      .map(([id, score]) => {
        const participant = allParticipants.find((p) => p?.id === id);
        if (!participant) {
          return {
            id,
            name: id,
            score,
          };
        }
        const label = isTeamMode ? teamLabelMap.get(participant.teamId || '') || participant.name : participant.name;
        return {
          id,
          name: label,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [gameMode, sprintScores, allParticipants, isTeamMode, teamLabelMap]);

  return {
    sprintScores,
    sprintLeaderboard,
    applySprintRoundScores,
    resetSprintScores,
  };
}

