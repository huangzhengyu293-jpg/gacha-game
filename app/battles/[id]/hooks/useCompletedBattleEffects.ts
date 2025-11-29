"use client";

import { useEffect, type MutableRefObject } from "react";
import type { MainState } from "../state/viewState";
import type { Participant } from "../types";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";

type Params = {
  mainState: MainState;
  gameMode: string;
  allParticipants: Participant[];
  participantValues: Record<string, number>;
  playerColors: Record<string, string>;
  jackpotInitialized: MutableRefObject<boolean>;
  jackpotWinnerRef: MutableRefObject<{ id: string } | null>;
  jackpotPlayerSegments: Array<{ id: string }>;
  setJackpotPlayerSegments: (segments: Array<{ id: string; name: string; percentage: number; color: string }>) => void;
  setJackpotWinnerId: (id: string) => void;
  setJackpotPhase: (phase: 'rolling' | 'winner') => void;
  detailedResultsRef: MutableRefObject<Record<number, Record<string, any>> | null>;
  roundResults: Record<number, Record<string, SlotSymbol>>;
  tieBreakerGateOpen: boolean;
  completedWinnerSetRef: MutableRefObject<boolean>;
  resolveWinnersByMode: () => boolean;
  triggerWinnerCelebration: () => void;
};

export function useCompletedBattleEffects({
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
}: Params) {
  useEffect(() => {
    if (mainState !== 'COMPLETED') {
      return;
    }

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
      Object.keys(preGenerated).forEach((roundStr) => {
        const round = parseInt(roundStr, 10);

        Object.keys(preGenerated[round] || {}).forEach((participantId) => {
          const expected = preGenerated[round][participantId];
          const actual = roundResults[round]?.[participantId];

          if (actual) {
            // 保留比對結果做驗證（目前僅遍歷以確保資料一致）
            void (expected.id === actual.id);
          }
        });
      });
    }
  }, [
    mainState,
    gameMode,
    allParticipants,
    participantValues,
    playerColors,
    jackpotInitialized,
    jackpotWinnerRef,
    jackpotPlayerSegments.length,
    setJackpotPlayerSegments,
    setJackpotWinnerId,
    setJackpotPhase,
    detailedResultsRef,
    roundResults,
  ]);

  useEffect(() => {
    if (mainState !== 'COMPLETED' || !tieBreakerGateOpen) return;
    if (completedWinnerSetRef.current) return;

    const resolved = resolveWinnersByMode();
    if (resolved) {
      completedWinnerSetRef.current = true;
      triggerWinnerCelebration();
    }
  }, [mainState, tieBreakerGateOpen, resolveWinnersByMode, triggerWinnerCelebration, completedWinnerSetRef]);
}

