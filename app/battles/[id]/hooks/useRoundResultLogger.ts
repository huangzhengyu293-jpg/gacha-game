"use client";

import { useEffect, useRef } from "react";
import type { Participant } from "../types";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";

interface UseRoundResultLoggerArgs {
  participants: Participant[];
  roundResults: Record<number, Record<string, SlotSymbol>>;
}

export function useRoundResultLogger({ participants, roundResults }: UseRoundResultLoggerArgs) {
  const lastRoundLogRef = useRef<string>('');

  useEffect(() => {
    const participantList = participants || [];
    const roundEntries = Object.entries(roundResults);
    if (!participantList.length || !roundEntries.length) return;

    const signature = roundEntries
      .map(([roundIndex, entries]) => `${roundIndex}:${Object.keys(entries || {}).length}`)
      .sort()
      .join('|');

    if (lastRoundLogRef.current === signature) return;
    lastRoundLogRef.current = signature;

    roundEntries
      .map(([roundIndex]) => Number(roundIndex))
      .sort((a, b) => a - b)
      .forEach((roundIndex) => {
        const perRound = roundResults[roundIndex] || {};
        const tableRows = participantList.map((participant) => {
          const prize = perRound[participant.id];
          return {
            玩家: participant.name,
            道具: prize?.name ?? '尚未揭晓',
            金额: prize ? `¥${Number(prize.price ?? 0).toFixed(2)}` : '—',
          };
        });
        console.groupCollapsed(`【Battle Playback】第 ${roundIndex + 1} 轮结果`);
        console.table(tableRows);
        console.groupEnd();
      });
  }, [participants, roundResults]);
}

