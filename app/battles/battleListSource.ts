import type { RawBattleListItem } from '@/app/components/bettlesListData';
import type { BattleGameMode, SpecialOptionFlags } from './modeVisuals';

export type ParticipantPreview = {
  id: string;
  name: string;
  avatar: string;
  slotIndex?: number;
  vipLevel?: number;
};

export type BattleListCard = {
  id: string;
  title: string;
  mode: BattleGameMode;
  specialOptions: SpecialOptionFlags;
  isTeamBattle: boolean;
  teamStructure?: string | null;
  participants: ParticipantPreview[];
  participantSlots: Array<ParticipantPreview | null>;
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
const BOX_COVER_KEYS = ['cover', 'image', 'img', 'url', 'src', 'value'];

const MODE_MAP: Record<number, BattleGameMode> = {
  0: 'classic',
  1: 'share',
  2: 'sprint',
  3: 'jackpot',
  4: 'elimination',
};

function formatNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function resolveBattleMode(entry: RawBattleListItem): BattleGameMode {
  const rawValue = entry.mode;
  const normalized = rawValue === undefined || rawValue === null ? NaN : Number(rawValue);
  if (Number.isFinite(normalized) && MODE_MAP[normalized as number]) {
    return MODE_MAP[normalized as number];
  }
  return 'classic';
}

function resolveTeamStructureLabel(entry: RawBattleListItem) {
  const raw = entry.team_size;
  if (raw === undefined || raw === null) return null;
  const normalized = Number(raw);
  if (!Number.isFinite(normalized)) return null;
  switch (normalized) {
    case 0:
      return '2v2';
    case 1:
      return '3v3';
    case 2:
      return '2v2v2';
    default:
      return null;
  }
}

function resolveConnectorStyle(mode: BattleGameMode): 'share' | 'default' {
  return mode === 'share' ? 'share' : 'default';
}

function buildTeamStructure(entry: RawBattleListItem, participants: ParticipantPreview[]) {
  const teamFlag = entry.person_team ?? entry.fight_user_type;
  const isTeamBattle = Number(teamFlag) === 1 || entry.fight_user_type === 2;
  if (!isTeamBattle) {
    return { isTeamBattle: false as const, teams: undefined, teamStructure: null };
  }
  const teamSize = Math.max(1, Math.floor((entry.num || participants.length) / 2));
  const teams = [
    { id: `${entry.id}-team-a`, members: participants.slice(0, teamSize) },
    { id: `${entry.id}-team-b`, members: participants.slice(teamSize) },
  ].filter((team) => team.members.length > 0);
  const normalizedStructure =
    resolveTeamStructureLabel(entry) ??
    (teams.length === 2 ? `${teams[0].members.length}v${teams[1].members.length}` : null);
  return { isTeamBattle: true as const, teams, teamStructure: normalizedStructure };
}

function extractCoverValue(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of BOX_COVER_KEYS) {
      const candidate = record[key];
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }
  }
  return null;
}

function parseCoverSource(source: RawBattleListItem['boxs_cover']): RawBattleListItem['boxs_cover'] {
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) return null;
    const looksJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (looksJson) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  return source ?? null;
}

function resolveBoxCover(
  source: RawBattleListItem['boxs_cover'],
  boxId: number | string,
  index: number,
): string | null {
  if (!source) {
    return null;
  }
  const idKey = String(boxId);
  if (Array.isArray(source)) {
    for (const entry of source) {
      if (entry && typeof entry === 'object') {
        const entryId =
          (entry as Record<string, unknown>).box_id ??
          (entry as Record<string, unknown>).id ??
          (entry as Record<string, unknown>).boxId;
        if (entryId !== undefined && String(entryId) === idKey) {
          const cover = extractCoverValue(entry);
          if (cover) return cover;
        }
      }
    }
    const positionalCover = extractCoverValue(source[index]);
    if (positionalCover) return positionalCover;
    return null;
  }
  if (typeof source === 'object') {
    const objectSource = source as Record<string, unknown>;
    const direct = extractCoverValue(objectSource[idKey]);
    if (direct) return direct;
    const indexKey = String(index);
    const positional = extractCoverValue(objectSource[indexKey]);
    if (positional) return positional;
    return null;
  }
  if (typeof source === 'string') {
    return extractCoverValue(source);
  }
  return null;
}

function buildPackImages(entry: RawBattleListItem) {
  if (!Array.isArray(entry.boxs)) {
    return [];
  }
  const coverSource = parseCoverSource(entry.boxs_cover);
  return entry.boxs.map((boxId, index) => {
    const cover = resolveBoxCover(coverSource, boxId, index) ?? BOX_PLACEHOLDER_IMAGE;
    return {
      src: cover,
      alt: `卡包 ${boxId} - #${index + 1}`,
    };
  });
}

function clampSlotIndex(value: number, totalSlots: number) {
  if (!Number.isFinite(value)) return 0;
  if (totalSlots <= 0) return 0;
  if (value < 0) return 0;
  const maxIndex = Math.max(totalSlots - 1, 0);
  return value > maxIndex ? maxIndex : value;
}

function resolveSlotCount(entry: RawBattleListItem, participantCount: number) {
  const fromNum = Number(entry.num);
  if (Number.isFinite(fromNum) && fromNum > 0) {
    return fromNum;
  }
  const fromPeoples = Number((entry as any).peoples);
  if (Number.isFinite(fromPeoples) && fromPeoples > 0) {
    return fromPeoples;
  }
  return Math.max(participantCount, 1);
}

function allocateParticipantSlots(participants: ParticipantPreview[], slotCount: number) {
  if (slotCount <= 0) {
    return [];
  }
  const slots: Array<ParticipantPreview | null> = Array.from({ length: slotCount }, () => null);
  participants.forEach((participant, fallbackIndex) => {
    const preferred = typeof participant.slotIndex === 'number' ? participant.slotIndex : fallbackIndex;
    const target = clampSlotIndex(preferred, slotCount);
    if (!slots[target]) {
      slots[target] = participant;
    }
  });
  return slots;
}

function buildSpecialOptions(entry: RawBattleListItem): SpecialOptionFlags {
  const flags: SpecialOptionFlags = {};
  if (Number(entry.fast) === 1) {
    flags.isFastMode = true;
  }
  if (Number(entry.finally) === 1) {
    flags.isLastChance = true;
  }
  if (entry.type === 1) {
    flags.isInverted = true;
  }
  return flags;
}

export function buildBattleListCards(sourceEntries?: RawBattleListItem[]): BattleListCard[] {
  if (!Array.isArray(sourceEntries) || !sourceEntries.length) {
    return [];
  }
  return sourceEntries.map((entry) => {
    const participants: ParticipantPreview[] = Array.isArray(entry.users)
      ? entry.users
          .map((candidate) => {
            if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
              return null;
            }
            const wrapper = candidate as {
              user?: { id?: number | string; name?: string; avatar?: string; vip?: number };
              id?: number | string;
              user_id?: number | string;
              order?: number | string;
              vip?: number;
            };
            const userInfo = wrapper.user ?? {};
            const rawId = userInfo.id ?? wrapper.user_id ?? wrapper.id;
            if (rawId === undefined || rawId === null) {
              return null;
            }
            const rawOrder = Number(wrapper.order);
            return {
              id: String(rawId),
              name: userInfo.name ?? `玩家 ${rawId}`,
              avatar: userInfo.avatar ?? '',
              slotIndex: Number.isFinite(rawOrder) && rawOrder > 0 ? rawOrder - 1 : undefined,
              vipLevel: Number(userInfo.vip ?? wrapper.vip ?? 0) || undefined,
            } as ParticipantPreview;
          })
          .filter((participant): participant is ParticipantPreview => Boolean(participant))
      : [];

    const slotCount = resolveSlotCount(entry, participants.length);
    const participantSlots = allocateParticipantSlots(participants, slotCount);

    const mode = resolveBattleMode(entry);
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
      participantSlots,
      teams,
      connectorStyle: resolveConnectorStyle(mode),
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

