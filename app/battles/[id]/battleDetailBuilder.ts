import type { BattleData, BattleStatus, BattleSlot } from './types';
import type { SlotSymbol } from '@/app/components/SlotMachine/LuckySlotMachine';
import type { BackendBattlePayload, BackendRoundDrop } from './battlePayloadTypes';
import { battlesDetail } from '@/app/components/bettlesDetail';

export type RawBattleDetail = (typeof battlesDetail)[keyof typeof battlesDetail];

type RawBox = RawBattleDetail['box'][number];
type RawWinBox = RawBattleDetail['data'] extends { win: { box: infer T } } ? T : Record<string, never>;
type WinBoxEntry = RawWinBox[keyof RawWinBox];

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

export type BattleSpecialOptions = {
  fast?: boolean;
  lastChance?: boolean;
  inverted?: boolean;
};

type BuildOptions = {
  battleId?: string;
  specialOptions?: BattleSpecialOptions;
};

function parseNumber(value: string | number | null | undefined): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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
  (raw.box || []).forEach((box) => boxLookup.set(box.id, box));

  const winBoxLookup: Record<string, WinBoxEntry> = {};
  Object.entries(raw.data?.win?.box || {}).forEach(([key, value]) => {
    winBoxLookup[String(key)] = value as WinBoxEntry;
  });

  const userBeanMap: Record<string, number> = {};
  Object.entries(raw.data?.win?.bean || {}).forEach(([key, value]) => {
    userBeanMap[String(key)] = parseNumber(value);
  });

  return { boxLookup, winBoxLookup, userBeanMap };
}

function buildSlotSymbolsForBox(box?: RawBox): SlotSymbol[] {
  if (!box) return [];
  return box.box_award.map((entry) => {
    const award = entry.awards;
    return {
      id: String(award?.id ?? entry.id),
      name: award?.name ?? `Award ${entry.id}`,
      description: award?.item_name ?? award?.name ?? '',
      image: award?.cover ?? '',
      price: parseNumber(award?.bean),
      qualityId: mapQualityFromLv(award?.lv ?? entry.lv),
    };
  });
}

function getRoundResultForUser(winBoxLookup: Record<string, WinBoxEntry>, userId: string, roundIndex: number) {
  return winBoxLookup[userId]?.[roundIndex];
}

function normalizeUserEntry(entry: any) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  if (!entry.user || typeof entry.user !== 'object') return null;
  return entry;
}

function buildBattleParticipants(raw: RawBattleDetail, userBeanMap: Record<string, number>) {
  const winners = new Set(
    Array.isArray(raw.win_user) ? raw.win_user.map((id) => String(id)) : [],
  );

  const totalSlots =
    Number(raw.num) > 0
      ? Number(raw.num)
      : Math.max(
          Array.isArray(raw.users) ? raw.users.length : 0,
          (raw.data?.box?.length ?? 0) || 1,
        );
  const slots: BattleSlot[] = Array.from({ length: Math.max(totalSlots, 1) }, (_, index) => ({
    participant: null,
    userId: null,
    order: index + 1,
  }));

  const participants = (raw.users || [])
    .map(normalizeUserEntry)
    .filter(Boolean)
    .map((entry) => {
      const user = entry!.user;
      const userId = String(user.id);
      const participant = {
        id: userId,
        name: user.name || `玩家${userId}`,
        avatar: user.avatar || '',
        totalValue: formatCurrency(userBeanMap[userId] ?? 0),
        isWinner: winners.has(userId),
        teamId: undefined,
        items: [],
      };

      const seatIndex =
        typeof entry!.order === 'number' && entry!.order > 0
          ? entry!.order - 1
          : slots.findIndex((slot) => slot.participant === null);

      if (seatIndex >= 0 && seatIndex < slots.length) {
        slots[seatIndex] = {
          participant,
          userId: participant.id,
          order: seatIndex + 1,
          originalSlotMeta: entry!,
        };
      } else {
        slots.push({
          participant,
          userId: participant.id,
          order: slots.length + 1,
          originalSlotMeta: entry!,
        });
      }

      return participant;
    });

  return { participants, slots };
}

function buildBattlePacks(raw: RawBattleDetail, boxLookup: Map<number, RawBox>) {
  return (raw.data.box || []).map((boxId) => {
    const numericId = Number(boxId);
    const lookupKey = Number.isFinite(numericId) ? numericId : Number(boxId);
    const box = boxLookup.get(lookupKey);
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

export function buildBattleDataFromRaw(raw: RawBattleDetail, options?: BuildOptions): BattleData {
  const { boxLookup, userBeanMap } = buildLookups(raw);
  const packsWithSymbols = buildBattlePacks(raw, boxLookup);
  const packs = packsWithSymbols.map(({ slotSymbols, ...pack }) => pack);
  const { participants, slots } = buildBattleParticipants(raw, userBeanMap);
  const explicitCost = parseNumber(raw.bean);
  const fallbackCost = packsWithSymbols.reduce((sum, pack) => sum + parseNumber(pack.value.replace('$', '')), 0);
  const totalOpened = Object.values(userBeanMap).reduce((sum, value) => sum + value, 0);
  const battleId = options?.battleId ?? String(raw.id);
  const rawAny = raw as Record<string, any>;
  const updatedTimestamp = parseNumber(rawAny?.updated_at_time);
  const specialOptions = {
    fast: rawAny?.fast === 1,
    lastChance: rawAny?.finally === 1,
    inverted: rawAny?.type === 1,
    ...options?.specialOptions,
  };
  const modeMap: Record<number, string> = {
    0: 'classic',
    1: 'share',
    2: 'sprint',
    3: 'jackpot',
    4: 'elimination',
  };
  const resolvedMode = modeMap[parseNumber(rawAny?.mode)] ?? 'classic';
  const playersCount = Number(raw.num) > 0 ? Number(raw.num) : Math.max(slots.length, participants.length, 1);
  const numericStatus = parseNumber(raw.status);
  const status: BattleStatus =
    numericStatus === 2 ? 'completed' : numericStatus === 1 ? 'active' : 'pending';

  return {
    id: battleId,
    title: raw.title || `Battle #${raw.id}`,
    mode: resolvedMode,
    status,
    cost: formatCurrency(explicitCost || fallbackCost),
    totalOpened: formatCurrency(totalOpened),
    battleType: 'solo',
    teamStructure: undefined,
    packs,
    participants,
    slots,
    createdAt: raw.created_at,
    hostUserId: raw.user_id ? String(raw.user_id) : undefined,
    rawStatusCode: numericStatus,
    updatedTimestamp: updatedTimestamp > 0 ? updatedTimestamp : undefined,
    playersCount,
    isFastMode: Boolean(specialOptions.fast),
    isLastChance: Boolean(specialOptions.lastChance),
    isInverted: Boolean(specialOptions.inverted),
  };
}

export function buildBattlePayloadFromRaw(raw: RawBattleDetail, options?: BuildOptions): BackendBattlePayload {
  const { boxLookup, winBoxLookup } = buildLookups(raw);
  const participants = (raw.users || [])
    .map(normalizeUserEntry)
    .filter(Boolean)
    .map((entry) => ({
      id: String(entry!.user.id),
      name: entry!.user.name,
      avatar: entry!.user.avatar,
      teamId: undefined,
    }));

  const battleId = options?.battleId ?? String(raw.id);
  const rawAny = raw as Record<string, any>;
  const specialOptions = {
    fast: rawAny?.fast === 1,
    lastChance: rawAny?.finally === 1,
    inverted: rawAny?.type === 1,
    ...options?.specialOptions,
  };

  const config: BackendBattlePayload['config'] = {
    battleId,
    matchVariant: 'solo',
    gameplay: ((): BackendBattlePayload['config']['gameplay'] => {
      const modeMap: Record<number, BackendBattlePayload['config']['gameplay']> = {
        0: 'classic',
        1: 'share',
        2: 'sprint',
        3: 'jackpot',
        4: 'elimination',
      };
      return modeMap[parseNumber(rawAny?.mode)] ?? 'classic';
    })(),
    specialRules: {
      fast: Boolean(specialOptions.fast),
      lastChance: Boolean(specialOptions.lastChance),
      inverted: Boolean(specialOptions.inverted),
    },
    startAt: parseNumber(raw.open_at) * 1000,
    countdownMs: 3000,
    roundDurationMs: 5000,
    roundsTotal: (raw.data.box || []).length,
    packs: (raw.data.box || []).map((boxId) => String(boxId)),
  };

  const rounds = config.packs.map((packId, roundIndex) => {
    const box = boxLookup.get(Number(packId));
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

  const beanEntries = Object.entries(raw.data.win.bean || {});
  const highestValue = beanEntries.length ? Math.max(...beanEntries.map(([, value]) => parseNumber(value))) : 0;
  const tiedIds = beanEntries
    .map(([id, value]) => [id, parseNumber(value)] as const)
    .filter(([, value]) => value === highestValue && highestValue > 0)
    .map(([id]) => id);
  const explicitWinnerIds = Array.isArray(raw.win_user)
    ? raw.win_user.map((id) => String(id))
    : [];
  const winnerId =
    explicitWinnerIds[0] ??
    tiedIds[0] ??
    participants[0]?.id ??
    battleId;

  return {
    config,
    participants,
    rounds,
    classic: {
      winnerId,
      tieBreakerIds: tiedIds.length > 1 ? tiedIds : undefined,
    },
  };
}

