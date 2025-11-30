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
  vipLevel?: number;
  slotIndex?: number;
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
  // 淘汰模式数据
  eliminations?: {
    [roundIndex: number]: {
      eliminatedPlayerId: string;
      eliminatedPlayerName: string;
      needsSlotMachine: boolean; // 是否需要老虎机动画（多人并列最低时为true）
      tiedPlayerIds?: string[]; // 如果需要老虎机，这里是所有并列最低的玩家ID列表
    };
  };
  eliminationStartRound?: number; // 淘汰开始的轮次（从0开始的索引）
};

