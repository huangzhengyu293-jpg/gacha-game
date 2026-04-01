import type { RawBattleListItem } from '@/app/components/bettlesListData';
import type { BattleGameMode, SpecialOptionFlags } from './modeVisuals';

export type ParticipantPreview = {
  id: string;
  name: string;
  avatar: string;
  slotIndex?: number;
  vipLevel?: number;
  promotion?: number;
  robot?: number;
};

/** 列表行：按礼包 ID 合并重复槽位（数量 + 单价便于算礼包总价） */
export type PackAggregateRow = {
  boxId: string;
  quantity: number;
  imageSrc: string;
  imageAlt: string;
  name: string;
  /** 来自 boxs_cover 等后端字段；缺失则靠礼包 catalog 补 */
  unitPrice: number | null;
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
  teams?: Array<{ id: string; members: Array<ParticipantPreview | null> }>;
  connectorStyle: 'share' | 'default';
  entryCost: number;
  totalOpenedValue: number;
  packImages: Array<{ src: string; alt: string }>;
  packCount: number;
  /** 去重后的礼包展示行（与 packImages 顺序无关，按战场出现顺序） */
  packAggregates: PackAggregateRow[];
  totalRounds?: number;
  currentRound?: number; // 1-based, derived from time
  createdAt: number;
  updatedAt: number;
  status: number;
  raw: RawBattleListItem;
  currentPackIndex?: number;
};

const BOX_PLACEHOLDER_IMAGE =
  'https://oss.66images.com/storage/flamedraw/images/20251217/c068146d2ee1892fd5273a3f3e3c6688.webp';
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
  // 只根据 person_team 判断：0=单人模式，1=团队模式
  const personTeam = Number(entry.person_team);
  const isTeamBattle = Number.isFinite(personTeam) && personTeam === 1;
  if (!isTeamBattle) {
    return { isTeamBattle: false as const, teams: undefined, teamStructure: null };
  }
  
  // 根据 team_size 确定团队结构
  const teamSizeRaw = entry.team_size;
  const teamSizeNum = teamSizeRaw !== undefined && teamSizeRaw !== null ? Number(teamSizeRaw) : NaN;
  const normalizedStructure = resolveTeamStructureLabel(entry);
  
  let teams: Array<{ id: string; members: Array<ParticipantPreview | null> }> = [];
  let membersPerTeam = 2; // 默认每队2人
  let teamCount = 2; // 默认2队
  
  if (Number.isFinite(teamSizeNum)) {
    if (teamSizeNum === 0) {
      // 2v2: 2队，每队2人
      membersPerTeam = 2;
      teamCount = 2;
    } else if (teamSizeNum === 1) {
      // 3v3: 2队，每队3人
      membersPerTeam = 3;
      teamCount = 2;
    } else if (teamSizeNum === 2) {
      // 2v2v2: 3队，每队2人
      membersPerTeam = 2;
      teamCount = 3;
    }
  }
  
  // 如果 team_size 无效，使用默认逻辑（向后兼容）
  if (!Number.isFinite(teamSizeNum)) {
    const totalSlots = resolveSlotCount(entry, participants.length);
    membersPerTeam = Math.max(1, Math.floor(totalSlots / 2));
    teamCount = 2;
  }
  
  // 为每个队伍创建固定数量的槽位
  const totalSlots = membersPerTeam * teamCount;
  const teamSlots: Array<Array<ParticipantPreview | null>> = Array.from({ length: teamCount }, () => 
    Array.from({ length: membersPerTeam }, () => null)
  );
  
  // 根据参与者的 slotIndex 分配到对应的队伍和槽位
  participants.forEach((participant) => {
    const slotIndex = typeof participant.slotIndex === 'number' && Number.isFinite(participant.slotIndex)
      ? participant.slotIndex
      : null;
    
    if (slotIndex !== null && slotIndex >= 0 && slotIndex < totalSlots) {
      const teamIdx = Math.floor(slotIndex / membersPerTeam);
      const memberIdx = slotIndex % membersPerTeam;
      if (teamIdx >= 0 && teamIdx < teamCount && memberIdx >= 0 && memberIdx < membersPerTeam) {
        teamSlots[teamIdx][memberIdx] = participant;
      }
    }
  });
  
  // 构建 teams 数组
  teams = teamSlots.map((slots, teamIdx) => ({
    id: `${entry.id}-team-${String.fromCharCode(97 + teamIdx)}`, // team-a, team-b, team-c
    members: slots,
  }));
  
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

function extractBoxMetaFromCover(
  coverSource: ReturnType<typeof parseCoverSource>,
  boxId: number | string,
  firstIndex: number,
): { name: string | null; unitPrice: number | null } {
  const tryRecord = (rec: unknown): { name: string | null; unitPrice: number | null } => {
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return { name: null, unitPrice: null };
    const r = rec as Record<string, unknown>;
    const nameRaw = r.name ?? r.title ?? r.box_name ?? r.goods_name;
    const name = typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : null;
    const rawBean = r.bean ?? r.price ?? r.box_bean;
    let unitPrice: number | null = null;
    if (rawBean !== undefined && rawBean !== null) {
      const n = typeof rawBean === 'number' ? rawBean : Number(rawBean);
      if (Number.isFinite(n)) unitPrice = n;
    }
    return { name, unitPrice };
  };

  const idKey = String(boxId);
  if (!coverSource) return { name: null, unitPrice: null };

  if (Array.isArray(coverSource)) {
    for (const item of coverSource) {
      if (item && typeof item === 'object') {
        const e = item as Record<string, unknown>;
        const bid = e.box_id ?? e.id ?? e.boxId;
        if (bid !== undefined && String(bid) === idKey) {
          return tryRecord(item);
        }
      }
    }
    return tryRecord(coverSource[firstIndex]);
  }

  if (typeof coverSource === 'object') {
    const o = coverSource as Record<string, unknown>;
    const direct = o[idKey];
    if (direct) return tryRecord(direct);
    return tryRecord(o[String(firstIndex)]);
  }

  return { name: null, unitPrice: null };
}

export function buildPackAggregateRows(entry: RawBattleListItem): PackAggregateRow[] {
  if (!Array.isArray(entry.boxs) || entry.boxs.length === 0) {
    return [];
  }
  const coverSource = parseCoverSource(entry.boxs_cover);
  const order: string[] = [];
  const counts = new Map<string, number>();
  const firstIndex = new Map<string, number>();

  entry.boxs.forEach((rawId, idx) => {
    const boxId = String(rawId);
    if (!counts.has(boxId)) {
      order.push(boxId);
      firstIndex.set(boxId, idx);
    }
    counts.set(boxId, (counts.get(boxId) ?? 0) + 1);
  });

  return order.map((boxId) => {
    const idx = firstIndex.get(boxId)!;
    const numId = Number(boxId);
    const imageSrc =
      resolveBoxCover(coverSource, Number.isFinite(numId) ? numId : boxId, idx) ?? BOX_PLACEHOLDER_IMAGE;
    const meta = extractBoxMetaFromCover(coverSource, boxId, idx);
    const name = meta.name ?? `Pack ${boxId}`;
    return {
      boxId,
      quantity: counts.get(boxId)!,
      imageSrc,
      imageAlt: name,
      name,
      unitPrice: meta.unitPrice,
    };
  });
}

/** 礼包总价：单价 × 数量；单价优先行内 unitPrice，否则 catalog；仍无则退回 entryCost（bean） */
export function computeScenarioPackTotalUsd(
  card: BattleListCard,
  catalogBeanById: Map<string, number>,
): number {
  if (!card.packAggregates.length) {
    return card.entryCost;
  }
  let sum = 0;
  for (const row of card.packAggregates) {
    const unit =
      row.unitPrice !== null && row.unitPrice !== undefined && Number.isFinite(row.unitPrice)
        ? row.unitPrice
        : catalogBeanById.get(row.boxId);
    if (typeof unit !== 'number' || !Number.isFinite(unit)) {
      return card.entryCost;
    }
    sum += unit * row.quantity;
  }
  return sum;
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

export function buildBattleListCards(
  sourceEntries?: RawBattleListItem[],
  serverTimestampSec?: number,
): BattleListCard[] {
  if (!Array.isArray(sourceEntries) || !sourceEntries.length) {
    return [];
  }
  const nowSec = Number.isFinite(serverTimestampSec) ? Number(serverTimestampSec) : Math.floor(Date.now() / 1000);
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
              promotion: ((userInfo as any).promotion !== undefined) 
                ? Number((userInfo as any).promotion) 
                : ((wrapper as any).promotion !== undefined)
                ? Number((wrapper as any).promotion)
                : undefined,
              robot: ((userInfo as any).robot !== undefined) 
                ? Number((userInfo as any).robot) 
                : ((wrapper as any).robot !== undefined)
                ? Number((wrapper as any).robot)
                : undefined,
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

    const packImages = buildPackImages(entry);
    const packAggregates = buildPackAggregateRows(entry);
    const roundsTotal = packImages.length > 0 ? packImages.length : entry.boxs_num || entry.boxs?.length || 0;
    const isFast = Number(entry.fast) === 1;
    const roundDuration = isFast ? 1 : 6;
    const countdownSec = 5;
    let currentPackIndex: number | undefined;
    let currentRound: number | undefined;
    let totalRounds: number | undefined;
    const currentStatus = Number(entry.status);
    const updatedAtTime = Number(entry.updated_at_time);
    if (currentStatus === 2 && Number.isFinite(updatedAtTime) && roundsTotal > 0) {
      const diffSecRaw = Math.max(0, nowSec - updatedAtTime);
      const diffAfterCountdown = Math.max(0, diffSecRaw - countdownSec);
      const roundIdxRaw = Math.floor(diffAfterCountdown / roundDuration); // 0-based
      currentRound = roundIdxRaw + 1; // 1-based
      totalRounds = roundsTotal;
      currentPackIndex = Math.min(roundsTotal - 1, Math.max(0, roundIdxRaw));
    }

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
      // 已开启金额：使用后端字段 sum_bean（兼容旧字段 win_bean）
      totalOpenedValue: formatNumber((entry as any).sum_bean ?? entry.win_bean),
      packImages,
      packAggregates,
      packCount: Array.isArray(entry.boxs) ? entry.boxs.length : 0,
      totalRounds,
      currentRound,
      createdAt,
      updatedAt,
      status: entry.status ?? 0,
      raw: entry,
      currentPackIndex,
    };
  });
}

