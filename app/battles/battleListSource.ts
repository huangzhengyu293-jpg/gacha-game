import { battleListData } from '@/app/components/bettlesListData';
import type { RawBattleListItem } from '@/app/components/bettlesListData';
import type { BattleGameMode, SpecialOptionFlags } from './modeVisuals';

export type ParticipantPreview = {
  id: string;
  name: string;
  avatar: string;
};

export type BattleListCard = {
  id: string;
  title: string;
  mode: BattleGameMode;
  specialOptions: SpecialOptionFlags;
  isTeamBattle: boolean;
  teamStructure?: string | null;
  participants: ParticipantPreview[];
  teams?: Array<{ id: string; members: ParticipantPreview[] }>;
  connectorStyle: 'share' | 'default';
  entryCost: number;
  totalOpenedValue: number;
  packImages: Array<{ src: string; alt: string }>;
  packCount: number;
  createdAt: number;
  updatedAt: number;
  status: number;
  raw: RawBattleListItem;
};

const BOX_PLACEHOLDER_IMAGE =
  'https://oss.66images.com/storage/nn/admin/images/20250814/02e3cdee3bb9bc6f46bc679c863a7757.webp';

function formatNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function buildTeamStructure(entry: RawBattleListItem, participants: ParticipantPreview[]) {
  const isTeamBattle = entry.fight_user_type === 2;
  if (!isTeamBattle) {
    return { isTeamBattle: false as const, teams: undefined, teamStructure: null };
  }
  const teamSize = Math.max(1, Math.floor((entry.num || participants.length) / 2));
  const teams = [
    { id: `${entry.id}-team-a`, members: participants.slice(0, teamSize) },
    { id: `${entry.id}-team-b`, members: participants.slice(teamSize) },
  ].filter((team) => team.members.length > 0);
  const normalizedStructure =
    teams.length === 2 ? `${teams[0].members.length}v${teams[1].members.length}` : null;
  return { isTeamBattle: true as const, teams, teamStructure: normalizedStructure };
}

function buildPackImages(entry: RawBattleListItem) {
  if (!Array.isArray(entry.boxs)) {
    return [];
  }
  return entry.boxs.map((boxId, index) => ({
    src: BOX_PLACEHOLDER_IMAGE,
    alt: `卡包 ${boxId} - #${index + 1}`,
  }));
}

function buildSpecialOptions(entry: RawBattleListItem): SpecialOptionFlags {
  // 真实接口会返回具体标志。这里预留字段，未来可直接映射。
  const flags: SpecialOptionFlags = {};
  if (entry.type === 1) {
    flags.isInverted = true;
  }
  return flags;
}

export function buildBattleListCards(): BattleListCard[] {
  return battleListData.map((entry) => {
    const participants: ParticipantPreview[] = Array.isArray(entry.users)
      ? entry.users
          .map((u) => ({
            id: String(u.user?.id ?? u.id),
            name: u.user?.name ?? `玩家 ${u.id}`,
            avatar: u.user?.avatar ?? '',
          }))
          .filter((u) => Boolean(u.id))
      : [];

    const mode: BattleGameMode = 'classic';
    const { isTeamBattle, teams, teamStructure } = buildTeamStructure(entry, participants);

    const createdAt = Date.parse(entry.created_at ?? '') || 0;
    const updatedAt =
      entry.updated_at_time ?? (Date.parse(entry.updated_at ?? '') || 0);

    return {
      id: String(entry.id),
      title: entry.title || `对战 #${entry.id}`,
      mode,
      specialOptions: buildSpecialOptions(entry),
      isTeamBattle,
      teamStructure,
      participants,
      teams,
      connectorStyle: 'default',
      entryCost: formatNumber(entry.bean),
      totalOpenedValue: formatNumber(entry.win_bean),
      packImages: buildPackImages(entry),
      packCount: Array.isArray(entry.boxs) ? entry.boxs.length : 0,
      createdAt,
      updatedAt,
      status: entry.status ?? 0,
      raw: entry,
    };
  });
}

