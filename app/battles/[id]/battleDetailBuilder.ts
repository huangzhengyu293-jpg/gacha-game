import type { BattleData } from './types';
import type { SlotSymbol } from '@/app/components/SlotMachine/LuckySlotMachine';
import type {
  BackendBattlePayload,
  BackendRoundDrop,
  GameplayMode,
  SoloSeatSize,
} from './battlePayloadTypes';
import type { FightDetailRaw, FightDetailWinBoxEntry } from '@/types/fight';

export type RawBattleDetail = FightDetailRaw;

type RawBox = NonNullable<RawBattleDetail['box']>[number];
type WinBoxEntry = FightDetailWinBoxEntry;

const QUALITY_MAP: Record<number, string> = {
  1: 'legendary',
  2: 'mythic',
  3: 'epic',
  4: 'rare',
  5: 'common',
};

const PLACEHOLDER_SYMBOL: SlotSymbol = {
  id: 'golden_placeholder',
  name: '金色神秘',
  image: '/theme/default/hidden-gold.png',
  price: 0,
  qualityId: 'placeholder',
};

const MODE_GAMEPLAY_MAP: Record<number, GameplayMode> = {
  0: 'classic',
  1: 'share',
  2: 'sprint',
  3: 'jackpot',
  4: 'elimination',
};

const TEAM_STRUCTURE_MAP: Record<number, '2v2' | '3v3' | '2v2v2'> = {
  0: '2v2',
  1: '3v3',
  2: '2v2v2',
};

function normalizeEliminationEntry(entry: unknown): string | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof entry === 'number') {
    if (!Number.isFinite(entry)) return null;
    return String(entry);
  }
  if (typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    const preferredKeys = ['id', 'user_id', 'userId', 'player_id', 'playerId', 'belong_id', 'value', 'target'];
    for (const key of preferredKeys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        const value = String(obj[key] as string | number).trim();
        if (value.length) {
          return value;
        }
      }
    }
    const firstValue = Object.values(obj)[0];
    if (firstValue !== undefined && firstValue !== null) {
      const value = String(firstValue).trim();
      return value.length ? value : null;
    }
  }
  return null;
}

function normalizeEliminationSource(source: unknown): string[] {
  if (!source) return [];
  if (Array.isArray(source)) {
    return source
      .map((entry) => normalizeEliminationEntry(entry))
      .filter((id): id is string => Boolean(id));
  }
  if (typeof source === 'object') {
    const entries = Object.entries(source as Record<string, unknown>);
    const sorted = entries.sort(([keyA], [keyB]) => {
      const numA = Number(keyA);
      const numB = Number(keyB);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return numA - numB;
      }
      return keyA.localeCompare(keyB);
    });
    return sorted
      .map(([, value]) => normalizeEliminationEntry(value))
      .filter((id): id is string => Boolean(id));
  }
  const normalized = normalizeEliminationEntry(source);
  return normalized ? [normalized] : [];
}

function extractEliminationSequence(raw: RawBattleDetail): string[] {
  const dataLayer = (raw.data as any) ?? {};
  const nestedData = dataLayer?.data ?? {};
  const winLayer = dataLayer?.win ?? {};
  const candidateSources = [
    nestedData?.eliminate,
    winLayer?.eliminate,
    dataLayer?.eliminate,
    (raw as any)?.eliminate,
  ];

  for (const source of candidateSources) {
    const sequence = normalizeEliminationSource(source);
    if (sequence.length) {
      return sequence;
    }
  }
  return [];
}

export type BattleSpecialOptions = {
  fast?: boolean;
  lastChance?: boolean;
  inverted?: boolean;
};

type TeamStructure = '2v2' | '3v3' | '2v2v2';

type BuildOptions = {
  battleId?: string;
  specialOptions?: BattleSpecialOptions;
};

function parseNumber(value: string | number | null | undefined): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseEpochMs(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value > 1e12 ? value : value * 1000;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric > 1e12 ? numeric : numeric * 1000;
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return parsed;
  const normalized = trimmed.replace('T', ' ');
  const parsedNormalized = Date.parse(normalized);
  return Number.isNaN(parsedNormalized) ? null : parsedNormalized;
}

function mapModeToGameplay(mode?: number | string | null): GameplayMode {
  const numeric = parseNumber(mode);
  return MODE_GAMEPLAY_MAP[numeric] ?? 'classic';
}

function mapTeamStructure(value?: number | string | null) {
  const numeric = parseNumber(value);
  return TEAM_STRUCTURE_MAP[numeric] ?? '2v2';
}

function mapSoloSeatSize(players: number): SoloSeatSize {
  if (players >= 6) return 6;
  if (players >= 4) return 4;
  if (players >= 3) return 3;
  return 2;
}

function resolveDeclaredPlayerCount(raw: RawBattleDetail): number {
  const fromNum = parseNumber(raw.num);
  if (fromNum > 0) return fromNum;
  const fromPeoples = parseNumber((raw as any)?.peoples);
  if (fromPeoples > 0) return fromPeoples;
  return 0;
}

function formatCurrency(value: string | number | null | undefined): string {
  return `$${parseNumber(value).toFixed(2)}`;
}

function mapQualityFromLv(lv?: number | string | null): string | null {
  const numeric = parseNumber(lv);
  return QUALITY_MAP[numeric] ?? null;
}

function isLegendaryLv(lv?: number | string | null): boolean {
  return parseNumber(lv) === 1;
}

function buildLookups(raw: RawBattleDetail) {
  const boxLookup = new Map<number, RawBox>();
  (raw.box ?? []).forEach((box) => {
    const numericId = Number(box.id);
    if (!Number.isNaN(numericId)) {
      boxLookup.set(numericId, box);
    }
  });

  const winBoxLookup: Record<string, WinBoxEntry[]> = {};
  const winBoxEntries = raw.data?.win?.box ?? {};
  Object.entries(winBoxEntries).forEach(([key, value]) => {
    winBoxLookup[String(key)] = Array.isArray(value) ? value : [];
  });

  const userBeanMap: Record<string, number> = {};
  Object.entries(raw.data?.win?.bean ?? {}).forEach(([key, value]) => {
    userBeanMap[String(key)] = parseNumber(value);
  });

  return { boxLookup, winBoxLookup, userBeanMap };
}

function buildSlotSymbolsForBox(box?: RawBox): SlotSymbol[] {
  if (!box) return [];
  const awards = box.box_award ?? [];
  return awards.map((entry) => {
    const award = entry.awards;
   
    
    return {
      id: String(award?.id ?? entry.id ?? ''),
      name: award?.name ?? `Award ${entry.id ?? ''}`,
      description: award?.item_name ?? award?.name ?? '',
      image: award?.cover ?? '',
      price: parseNumber(award?.bean),
      qualityId: mapQualityFromLv(award?.lv ?? entry.lv),
      dropProbability: parseNumber((award as any)?.bili ?? (entry as any)?.bili),
    };
   
    
  });
}

function getRoundResultForUser(winBoxLookup: Record<string, WinBoxEntry[]>, userId: string, roundIndex: number) {
  const results = winBoxLookup[userId] ?? [];
  return results[roundIndex];
}

function mapParticipantTeamId(slotIndex: number, teamStructure?: TeamStructure) {
  if (!teamStructure) return undefined;
  const membersPerTeam = teamStructure === '3v3' ? 3 : 2;
  const teamCount = teamStructure === '2v2v2' ? 3 : 2;
  const teamIndex = Math.floor(slotIndex / membersPerTeam);
  if (teamIndex >= teamCount) return undefined;
  return `team-${teamIndex + 1}`;
}

function buildBattleParticipants(
  raw: RawBattleDetail,
  userBeanMap: Record<string, number>,
  teamStructure?: TeamStructure,
) {
  const winners = new Set(
    Array.isArray(raw.win_user) ? raw.win_user.map((id) => String(id)) : [],
  );

  const userEntries = Array.isArray(raw.users) ? raw.users.filter(Boolean) : [];
  const sortedEntries = [...userEntries].sort((a, b) => {
    const orderA = parseNumber((a as any)?.order ?? 0);
    const orderB = parseNumber((b as any)?.order ?? 0);
    return orderA - orderB;
  });

  const participantWrappers = sortedEntries
    .map((wrapper) => ({ wrapper, user: wrapper?.user }))
    .filter((item): item is { wrapper: NonNullable<typeof item.wrapper>; user: NonNullable<typeof item.user> } => {
      return Boolean(item.wrapper && item.user && item.user.id);
    });

  return participantWrappers.map(({ wrapper, user }, index) => {
    const userId = String(user.id);
      const rawOrder = parseNumber((wrapper as any)?.order ?? index + 1);
    const fallbackIndex = index >= 0 ? index : 0;
    const slotFromWrapper = parseNumber((wrapper as any)?.slot ?? fallbackIndex);
    const slotIndex =
      Number.isFinite(rawOrder) && rawOrder > 0
        ? rawOrder - 1
        : Number.isFinite(slotFromWrapper)
        ? slotFromWrapper
        : fallbackIndex;
      const inferredTeamId =
      mapParticipantTeamId(slotIndex, teamStructure) ??
        (wrapper as any)?.team_id ??
        (wrapper as any)?.teamId ??
        (wrapper as any)?.team ??
        (wrapper as any)?.group_id ??
        (wrapper as any)?.groupId ??
        null;
    return {
        id: userId,
        name: user.name ?? `Player ${userId}`,
        avatar: user.avatar ?? '',
        totalValue: formatCurrency(userBeanMap[userId] ?? 0),
        isWinner: winners.has(userId),
        teamId: inferredTeamId != null ? String(inferredTeamId) : undefined,
        vipLevel:
          parseNumber((wrapper as any)?.user?.vip ?? (wrapper as any)?.vip ?? (wrapper as any)?.user?.user_vip) || 0,
        robot: parseNumber((user as any)?.robot ?? (wrapper as any)?.robot ?? (wrapper as any)?.user?.robot ?? 0),
        items: [],
        slotIndex,
      };
  });
}

function buildBattlePacks(raw: RawBattleDetail, boxLookup: Map<number, RawBox>) {
  return (raw.data?.box || []).map((boxId) => {
    const numericId = parseNumber(boxId);
    const box = boxLookup.get(numericId);
    const slotSymbols = buildSlotSymbolsForBox(box);
    return {
      id: String(boxId),
      image: box?.cover ?? '',
      name: box?.name ?? `Box ${boxId}`,
      value: formatCurrency(box?.bean ?? 0),
      openedBy: undefined,
      slotSymbols,
    };
  });
}

function deriveWinnerIds(
  participants: ReturnType<typeof buildBattleParticipants>,
  primaryWinnerId: string | null,
  isTeamBattle: boolean,
  teamStructure?: TeamStructure,
) {
  if (!participants.length || !primaryWinnerId) return [];
  const winnerIndex = participants.findIndex((participant) => participant.id === primaryWinnerId);
  if (winnerIndex === -1) return [];
  if (isTeamBattle && teamStructure) {
    const membersPerTeam = teamStructure === '3v3' ? 3 : 2;
    const teamIndex = Math.floor(winnerIndex / membersPerTeam);
    const start = teamIndex * membersPerTeam;
    const end = Math.min(start + membersPerTeam, participants.length);
    return participants.slice(start, end).map((participant) => participant.id);
  }
  return [primaryWinnerId];
}

export function buildBattleDataFromRaw(raw: RawBattleDetail, options?: BuildOptions): BattleData {
  const { boxLookup, userBeanMap } = buildLookups(raw);
  const packsWithSymbols = buildBattlePacks(raw, boxLookup);
  const packs = packsWithSymbols.map(({ slotSymbols, ...pack }) => pack);
  const specialOptions = options?.specialOptions ?? {};
  const isTeamBattle = parseNumber(raw.person_team) === 1;
  const teamStructure = isTeamBattle ? mapTeamStructure(raw.team_size) : undefined;
  const participants = buildBattleParticipants(raw, userBeanMap, teamStructure);
  const battleDeclaredWinnerIds = Array.isArray(raw.win_user) ? raw.win_user.map((id) => String(id)) : [];
  const battlePrimaryWinnerId = battleDeclaredWinnerIds[0] ?? null;
  const gameplayModeRaw = mapModeToGameplay(raw.mode);
  const shareWinnerOverride =
    gameplayModeRaw === 'share' && battleDeclaredWinnerIds.length ? battleDeclaredWinnerIds : null;
  const battleDerivedWinnerIds =
    shareWinnerOverride ?? deriveWinnerIds(participants, battlePrimaryWinnerId, isTeamBattle, teamStructure);
  const participantsWithWinners = participants.map((participant) => ({
    ...participant,
    isWinner: battleDerivedWinnerIds.includes(participant.id),
  }));
  const explicitCost = parseNumber(raw.bean);
  const fallbackCost = packsWithSymbols.reduce((sum, pack) => sum + parseNumber(pack.value.replace('$', '')), 0);
  const totalOpened = Object.values(userBeanMap).reduce((sum, value) => sum + value, 0);
  const battleId = options?.battleId ?? String(raw.id);
  const declaredPlayersCount = resolveDeclaredPlayerCount(raw);
  const requestedPlayers = declaredPlayersCount > 0 ? declaredPlayersCount : Math.max(participants.length, 1);
  const gameplayMode = isTeamBattle && gameplayModeRaw === 'share' ? 'classic' : gameplayModeRaw;

  return {
    id: battleId,
    title: raw.title || `Battle #${raw.id}`,
    mode: gameplayMode,
    status: 'pending',
    cost: formatCurrency(explicitCost || fallbackCost),
    totalOpened: formatCurrency(totalOpened),
    battleType: isTeamBattle ? 'team' : 'solo',
    teamStructure,
    packs,
    participants: participantsWithWinners,
    createdAt: raw.created_at ?? '',
    playersCount: requestedPlayers,
    isFastMode: Boolean(specialOptions.fast),
    isLastChance: Boolean(specialOptions.lastChance),
    isInverted: Boolean(specialOptions.inverted),
  };
}

export function buildBattlePayloadFromRaw(raw: RawBattleDetail, options?: BuildOptions): BackendBattlePayload {
  const { boxLookup, winBoxLookup, userBeanMap } = buildLookups(raw);
  const isTeamBattle = parseNumber(raw.person_team) === 1;
  const teamStructure = isTeamBattle ? mapTeamStructure(raw.team_size) : undefined;
  const participantDetails = buildBattleParticipants(raw, userBeanMap, teamStructure);
  const participants = participantDetails.map((participant) => ({
    id: participant.id,
    name: participant.name,
    avatar: participant.avatar,
    teamId: participant.teamId,
  }));

  const battleId = options?.battleId ?? String(raw.id);
  const specialOptions = options?.specialOptions ?? {};
  // 对战详情轮次推进：以服务端对战更新时间(updated_at)作为起算点（与页面内 computeEntryRoundSetting 的逻辑一致）
  // 注意：open_at 在部分对战里可能为空/0，会导致时间轴直接判定 COMPLETED
  const startAtMs =
    parseEpochMs(raw.updated_at) ??
    parseEpochMs(raw.open_at) ??
    parseEpochMs(raw.created_at) ??
    Date.now();
  const roundDurationMs = specialOptions.fast ? 1000 : 6000;
  const gameplayModeRaw = mapModeToGameplay(raw.mode);
  const gameplayMode = isTeamBattle && gameplayModeRaw === 'share' ? 'classic' : gameplayModeRaw;
  const declaredPlayersCount = resolveDeclaredPlayerCount(raw);
  const requestedPlayers = declaredPlayersCount > 0 ? declaredPlayersCount : Math.max(participants.length, 1);
  const eliminationSequence = extractEliminationSequence(raw);

  const config: BackendBattlePayload['config'] = {
    battleId,
    matchVariant: isTeamBattle ? 'duo' : 'solo',
    soloSize: !isTeamBattle ? mapSoloSeatSize(requestedPlayers) : undefined,
    duoVariant: isTeamBattle ? teamStructure : undefined,
    gameplay: gameplayMode,
    specialRules: {
      fast: Boolean(specialOptions.fast),
      lastChance: Boolean(specialOptions.lastChance),
      inverted: Boolean(specialOptions.inverted),
    },
    startAt: startAtMs,
    countdownMs: 3000,
    roundDurationMs,
    roundsTotal: (raw.data?.box || []).length,
    packs: (raw.data?.box || []).map((boxId) => String(boxId)),
  };

  let eliminationMeta: BackendBattlePayload['eliminationMeta'] | undefined;
  if (gameplayMode === 'elimination' && eliminationSequence.length) {
    const startRoundIndex = Math.max(
      0,
      config.roundsTotal - Math.max(0, participants.length - 1),
    );
    eliminationMeta = {
      startRoundIndex,
      eliminationOrder: eliminationSequence,
    };
  }

  const payloadDeclaredWinnerIds = Array.isArray(raw.win_user) ? raw.win_user.map((id) => String(id)) : [];
  const payloadPrimaryWinnerId = payloadDeclaredWinnerIds[0] ?? null;
  const shareWinnerOverride =
    gameplayModeRaw === 'share' && payloadDeclaredWinnerIds.length ? payloadDeclaredWinnerIds : null;
  const payloadDerivedWinnerIds =
    shareWinnerOverride ??
    deriveWinnerIds(participantDetails, payloadPrimaryWinnerId, isTeamBattle, teamStructure);

  const ensureSymbolExists = (pool: SlotSymbol[], drop: BackendRoundDrop, isLegendary: boolean) => {
    if (pool.some((symbol) => symbol.id === drop.itemId)) {
      return;
    }
    pool.push({
      id: drop.itemId,
      name: drop.itemName,
      image: drop.image,
      price: drop.value,
      qualityId: isLegendary ? 'legendary' : null,
    });
  };

  const rounds = config.packs.map((packId, roundIndex) => {
    const box = boxLookup.get(parseNumber(packId));
    const slotSymbols = buildSlotSymbolsForBox(box);
    const legendaryPool = slotSymbols.filter((symbol) => symbol.qualityId === 'legendary');
    const normalPool = slotSymbols.filter((symbol) => symbol.qualityId !== 'legendary');
    const drops: Record<string, BackendRoundDrop> = {};

    participants.forEach((participant) => {
      const result = getRoundResultForUser(winBoxLookup, participant.id, roundIndex);
      if (!result) return;
      const value = parseNumber(result.bean);
      const legendary = isLegendaryLv(result.lv);
      const itemId = String(result.awards_id ?? result.box_awards_id ?? `${participant.id}-${roundIndex}`);
      drops[participant.id] = {
        itemId,
        itemName: result.name ?? `奖品 ${itemId}`,
        image: result.cover ?? '',
        value,
        rarity: legendary ? 'legendary' : 'normal',
        needsSecondStage: legendary,
        dropProbability: parseNumber((result as any).bili),
      };

      if (legendary) {
        ensureSymbolExists(legendaryPool, drops[participant.id], true);
      } else {
        ensureSymbolExists(normalPool, drops[participant.id], false);
      }
    });

    return {
      roundIndex,
      packId,
      pools: {
        normal: legendaryPool.length ? [...normalPool, { ...PLACEHOLDER_SYMBOL }] : normalPool,
        legendary: legendaryPool,
        placeholder: { ...PLACEHOLDER_SYMBOL },
      },
      drops,
    };
  });



  const beanEntries = Object.entries(raw.data?.win?.bean || {});
  const highestValue = beanEntries.length ? Math.max(...beanEntries.map(([, value]) => parseNumber(value))) : 0;
  const tiedIds = beanEntries
    .map(([id, value]) => [id, parseNumber(value)] as const)
    .filter(([, value]) => value === highestValue && highestValue > 0)
    .map(([id]) => id);
  const winnerId =
    payloadDerivedWinnerIds[0] ??
    tiedIds[0] ??
    participantDetails[0]?.id ??
    battleId;

  return {
    config,
    participants,
    rounds,
    classic: {
      winnerId,
      tieBreakerIds: tiedIds.length > 1 ? tiedIds : undefined,
    },
    eliminationMeta,
  };
}

