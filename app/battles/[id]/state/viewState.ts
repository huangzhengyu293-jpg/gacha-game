export type MainState = 'IDLE' | 'LOADING' | 'COUNTDOWN' | 'ROUND_LOOP' | 'COMPLETED';

export type RoundState =
  | 'ROUND_RENDER'
  | 'ROUND_SPIN_FIRST'
  | 'ROUND_CHECK_LEGENDARY'
  | 'ROUND_PREPARE_SECOND'
  | 'ROUND_SPIN_SECOND'
  | 'ROUND_SETTLE'
  | 'ROUND_CHECK_ELIMINATION'
  | 'ROUND_ELIMINATION_SLOT'
  | 'ROUND_ELIMINATION_RESULT'
  | 'ROUND_NEXT'
  | null;

export type CountdownUpdater = number | null | ((prev: number | null) => number | null);

export interface BattleViewContext {
  main: MainState;
  round: RoundState;
  countdown: number | null;
}

export const battleViewInitialContext: BattleViewContext = {
  main: 'IDLE',
  round: null,
  countdown: null,
};


