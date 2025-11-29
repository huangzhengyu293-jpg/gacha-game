"use client";

import { useEffect, type MutableRefObject } from "react";
import type { MainState } from "../state/viewState";
import type { TieBreakerPlan } from "./useBattleRuntime";

type Params = {
  mainState: MainState;
  tieBreakerPlan: TieBreakerPlan | null;
  setTieBreakerPlan: (value: TieBreakerPlan | null) => void;
  tieBreakerGateOpen: boolean;
  setTieBreakerGateOpen: (value: boolean) => void;
  evaluateTieBreakerPlan: () => TieBreakerPlan | null;
  skipDirectlyToCompletedRef: MutableRefObject<boolean>;
};

export function useTieBreakerGate({
  mainState,
  tieBreakerPlan,
  setTieBreakerPlan,
  tieBreakerGateOpen,
  setTieBreakerGateOpen,
  evaluateTieBreakerPlan,
  skipDirectlyToCompletedRef,
}: Params) {
  useEffect(() => {
    if (skipDirectlyToCompletedRef.current) {
      if (tieBreakerPlan !== null) {
        setTieBreakerPlan(null);
      }
      if (!tieBreakerGateOpen) {
        setTieBreakerGateOpen(true);
      }
      return;
    }

    if (mainState !== 'COMPLETED') {
      if (tieBreakerPlan !== null) {
        setTieBreakerPlan(null);
      }
      if (tieBreakerGateOpen) {
        setTieBreakerGateOpen(false);
      }
      return;
    }

    if (tieBreakerGateOpen || tieBreakerPlan) {
      return;
    }

    const plan = evaluateTieBreakerPlan();
    if (plan) {
      setTieBreakerPlan(plan);
    } else {
      setTieBreakerGateOpen(true);
    }
  }, [
    mainState,
    tieBreakerGateOpen,
    tieBreakerPlan,
    evaluateTieBreakerPlan,
    setTieBreakerGateOpen,
    setTieBreakerPlan,
    skipDirectlyToCompletedRef,
  ]);
}

