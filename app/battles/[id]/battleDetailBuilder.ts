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
  3: 'rare',
  4: 'uncommon',
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

  return sortedEntries
    .map((entry) => entry?.user)
    .filter((user): user is NonNullable<typeof user> => Boolean(user && user.id))
    .map((user, index) => {
      const userId = String(user.id);
      const wrapper = sortedEntries[index];
      const inferredTeamId =
        mapParticipantTeamId(index, teamStructure) ??
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
        items: [],
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
  const requestedPlayers = Math.max(parseNumber(raw.num), participants.length);
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
  const gameplayModeRaw = mapModeToGameplay(raw.mode);
  const gameplayMode = isTeamBattle && gameplayModeRaw === 'share' ? 'classic' : gameplayModeRaw;
  const requestedPlayers = Math.max(parseNumber(raw.num), participants.length);
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
    startAt: parseNumber(raw.open_at) * 1000,
    countdownMs: 3000,
    roundDurationMs: 5000,
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

