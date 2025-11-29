"use client";

import { useCallback } from "react";
import { useMachine } from "@xstate/react";
import { battleViewMachine } from "../state/battleViewMachine";
import type { CountdownUpdater, MainState, RoundState } from "../state/viewState";

export function useBattleViewMachine() {
  const [state, send] = useMachine(battleViewMachine);

  const setMainState = useCallback(
    (next: MainState) => {
      send({ type: 'SET_MAIN', next });
    },
    [send],
  );

  const setRoundState = useCallback(
    (next: RoundState) => {
      send({ type: 'SET_ROUND', next });
    },
    [send],
  );

  const setCountdownValue = useCallback(
    (value: CountdownUpdater) => {
      send({ type: 'SET_COUNTDOWN', value });
    },
    [send],
  );

  return {
    mainState: state.context.main,
    roundState: state.context.round,
    countdownValue: state.context.countdown,
    setMainState,
    setRoundState,
    setCountdownValue,
  };
}

