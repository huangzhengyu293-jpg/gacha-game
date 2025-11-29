"use client";

import { assign, createMachine } from "xstate";
import type { BattleViewContext, MainState, RoundState, CountdownUpdater } from "./viewState";
import { battleViewInitialContext } from "./viewState";

type SetMainEvent = {
  type: 'SET_MAIN';
  next: MainState;
};

type SetRoundEvent = {
  type: 'SET_ROUND';
  next: RoundState;
};

type SetCountdownEvent = {
  type: 'SET_COUNTDOWN';
  value: CountdownUpdater;
};

type BattleViewEvent = SetMainEvent | SetRoundEvent | SetCountdownEvent;

const matchMainState = (expected: MainState) =>
  ({ event }: { event?: BattleViewEvent }): boolean =>
    !!event && event.type === 'SET_MAIN' && event.next === expected;

const updateMainState = assign((_: BattleViewContext, event: BattleViewEvent) => {
  if (event.type !== 'SET_MAIN') {
    return {};
  }
  return { main: event.next };
}) as any;

const updateRoundState = assign((_: BattleViewContext, event: BattleViewEvent) => {
  if (event.type !== 'SET_ROUND') {
    return {};
  }
  return { round: event.next };
}) as any;

const updateCountdown = assign((context: BattleViewContext, event: BattleViewEvent) => {
  if (event.type !== 'SET_COUNTDOWN') {
    return {};
  }
  const nextValue =
    typeof event.value === 'function' ? event.value(context.countdown) : event.value;
  return { countdown: nextValue };
}) as any;

export const battleViewMachine = createMachine({
  types: {
    context: {} as BattleViewContext,
    events: {} as BattleViewEvent,
  },
  id: 'battleView',
  context: battleViewInitialContext,
  initial: 'IDLE',
  states: {
    IDLE: {},
    LOADING: {},
    COUNTDOWN: {},
    ROUND_LOOP: {},
    COMPLETED: {},
  },
  on: {
    SET_MAIN: [
      { guard: matchMainState('LOADING'), target: '.LOADING', actions: updateMainState },
      { guard: matchMainState('COUNTDOWN'), target: '.COUNTDOWN', actions: updateMainState },
      { guard: matchMainState('ROUND_LOOP'), target: '.ROUND_LOOP', actions: updateMainState },
      { guard: matchMainState('COMPLETED'), target: '.COMPLETED', actions: updateMainState },
      { guard: matchMainState('IDLE'), target: '.IDLE', actions: updateMainState },
    ],
    SET_ROUND: {
      actions: updateRoundState,
    },
    SET_COUNTDOWN: {
      actions: updateCountdown,
    },
  },
});

