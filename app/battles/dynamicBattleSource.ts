import type { BattleData } from './[id]/types';
import type { BackendBattlePayload } from './[id]/battlePayloadTypes';
import { battlesDetail } from '@/app/components/bettlesDetail';
import { buildBattleDataFromRaw, buildBattlePayloadFromRaw } from './[id]/battleDetailBuilder';
import type { RawBattleDetail } from './[id]/battleDetailBuilder';

type BattleDataSourceConfig = {
  id: string;
  entryRound: number;
  buildData: () => BattleData;
  buildPayload: () => BackendBattlePayload;
};

const dynamicCache = new Map<string, BattleDataSourceConfig>();
const detailKeys = Object.keys(battlesDetail);
const DEFAULT_BATTLE_KEY = detailKeys[0];

if (DEFAULT_BATTLE_KEY === undefined) {
  throw new Error('bettlesDetail 数据为空，无法构建战斗详情。');
}

const DEFAULT_RAW = battlesDetail[Number(DEFAULT_BATTLE_KEY) as keyof typeof battlesDetail] as unknown as RawBattleDetail;

export function getDynamicBattleSource(id: string | null | undefined): BattleDataSourceConfig {
  const effectiveKey = id ?? DEFAULT_BATTLE_KEY;
  const numericId = Number(effectiveKey);
  const hasValidId = Number.isFinite(numericId);
  const cacheKey = hasValidId ? String(numericId) : DEFAULT_BATTLE_KEY;
  if (dynamicCache.has(cacheKey)) {
    return dynamicCache.get(cacheKey)!;
  }

  const rawCandidate = hasValidId
    ? (battlesDetail[numericId as keyof typeof battlesDetail] as unknown as RawBattleDetail | undefined)
    : undefined;
  const raw = rawCandidate ?? DEFAULT_RAW;

  const specialOptions = {
    inverted: raw.type === 1,
  };

  const config: BattleDataSourceConfig = {
    id: cacheKey,
    entryRound: 0,
    buildData: () => buildBattleDataFromRaw(raw, { battleId: cacheKey, specialOptions }),
    buildPayload: () => buildBattlePayloadFromRaw(raw, { battleId: cacheKey, specialOptions }),
  };

  dynamicCache.set(cacheKey, config);
  return config;
}

