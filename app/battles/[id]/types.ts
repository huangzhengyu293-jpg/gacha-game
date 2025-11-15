import type { CatalogItem } from '@/app/lib/api';

export type PackItem = {
  id: string;
  image: string;
  name: string;
  value: string;
  openedBy?: string;
  items?: CatalogItem[];
};

export type PrizeItem = {
  id: string;
  name: string;
  image: string;
  price: string;
  percentage: string;
};

export type Participant = {
  id: string;
  name: string;
  avatar: string;
  totalValue: string;
  isWinner: boolean;
  teamId?: string;
  items?: PrizeItem[];
};

export type BattleStatus = 'active' | 'completed' | 'pending';

export type BattleData = {
  id: string | string[];
  title: string;
  mode: string;
  status: BattleStatus;
  cost: string;
  totalOpened: string;
  participants: Participant[];
  packs: PackItem[];
  createdAt: string;
  completedAt?: string;
  battleType: 'solo' | 'team';
  teamStructure?: '2v2' | '3v3' | '2v2v2';
  playersCount: number;
  isFastMode?: boolean;
  isLastChance?: boolean;
  isInverted?: boolean;
};

