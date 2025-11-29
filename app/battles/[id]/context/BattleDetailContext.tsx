"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BattleData } from "../types";
import type { MainState, RoundState, CountdownUpdater } from "../state/viewState";

export interface BattleDetailContextValue {
  battleData: BattleData;
  mainState: MainState;
  roundState: RoundState;
  countdownValue: number | null;
  setMainState: (next: MainState) => void;
  setRoundState: (next: RoundState) => void;
  setCountdownValue: (value: CountdownUpdater) => void;
}

const BattleDetailContext = createContext<BattleDetailContextValue | null>(null);

export function BattleDetailProvider({
  value,
  children,
}: {
  value: BattleDetailContextValue;
  children: ReactNode;
}) {
  return <BattleDetailContext.Provider value={value}>{children}</BattleDetailContext.Provider>;
}

export function useBattleDetailContext(): BattleDetailContextValue {
  const context = useContext(BattleDetailContext);
  if (!context) {
    throw new Error("useBattleDetailContext must be used within BattleDetailProvider");
  }
  return context;
}

