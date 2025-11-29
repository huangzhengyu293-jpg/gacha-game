"use client";

import { useEffect, useState } from "react";
import type { MainState } from "../state/viewState";

interface UseBattleVisibilityStateArgs {
  mainState: MainState;
  isPendingBattle: boolean;
}

export function useBattleVisibilityState({ mainState, isPendingBattle }: UseBattleVisibilityStateArgs) {
  const [hidePacks, setHidePacks] = useState(false);
  const [showSlotMachines, setShowSlotMachines] = useState(false);
  const [allRoundsCompleted, setAllRoundsCompleted] = useState(false);

  useEffect(() => {
    if (isPendingBattle) {
      setHidePacks(false);
      setShowSlotMachines(false);
      setAllRoundsCompleted(false);
      return;
    }

    setHidePacks(mainState !== 'IDLE');
    setShowSlotMachines(mainState === 'ROUND_LOOP');
    setAllRoundsCompleted(mainState === 'COMPLETED');
  }, [mainState, isPendingBattle]);

  return { hidePacks, showSlotMachines, allRoundsCompleted };
}

