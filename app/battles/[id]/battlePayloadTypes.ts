import type { SlotSymbol } from '@/app/components/SlotMachine/LuckySlotMachine';

export type MatchVariant = 'solo' | 'duo';
export type SoloSeatSize = 2 | 3 | 4 | 6;
export type DuoVariant = '2v2' | '3v3' | '2v2v2';
export type GameplayMode = 'classic' | 'share' | 'jackpot' | 'sprint' | 'elimination';
export type SpecialOption = 'fast' | 'lastChance' | 'inverted';

export interface BattleConfigPayload {
  battleId: string;
  matchVariant: MatchVariant;
  soloSize?: SoloSeatSize;
  duoVariant?: DuoVariant;
  gameplay: GameplayMode;
  specialRules: Record<SpecialOption, boolean>;
  startAt: number;
  countdownMs: number;
  roundDurationMs: number;
  roundsTotal: number;
  packs: string[];
}

export interface BackendRoundDrop {
  itemId: string;
  itemName: string;
  image: string;
  value: number;
  rarity: 'normal' | 'legendary';
  needsSecondStage: boolean;
  dropProbability?: number;
}

export interface BackendRoundPlan {
  roundIndex: number;
  packId: string;
  pools: {
    normal: SlotSymbol[];
    legendary: SlotSymbol[];
    placeholder: SlotSymbol;
  };
  drops: Record<string, BackendRoundDrop>;
  elimination?: {
    happens: boolean;
    targetIds: string[];
    serverChosenId?: string;
  };
}

export interface BackendBattlePayload {
  config: BattleConfigPayload;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    teamId?: string;
  }>;
  rounds: BackendRoundPlan[];
  jackpot?: {
    potValue: number;
    percentageMap: Record<string, number>;
    winnerId: string;
  };
  sprint?: {
    winnersPerRound: Record<number, string[]>;
  };
  classic?: {
    winnerId: string;
    tieBreakerIds?: string[];
  };
  eliminationMeta?: {
    startRoundIndex: number;
    eliminationOrder: string[];
  };
}





