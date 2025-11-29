"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/lib/api";
import { getDynamicBattleSource } from "../../dynamicBattleSource";
import type { BattleDataSourceConfig } from "./useBattleRuntime";
import { buildBattleDataFromRaw, buildBattlePayloadFromRaw, type RawBattleDetail } from "../battleDetailBuilder";

interface BattleDetailResponse {
  code?: number;
  message?: string;
  data?: RawBattleDetail;
}

function extractRawDetail(input: BattleDetailResponse | RawBattleDetail | undefined): RawBattleDetail | undefined {
  if (!input) return undefined;
  if ('data' in input && input.data && typeof input.data === 'object') {
    return input.data as RawBattleDetail;
  }
  if ('id' in input && typeof input.id === 'number') {
    return input as RawBattleDetail;
  }
  return undefined;
}

export function useBattleDetailSource(battleId: string | null | undefined) {
  const queryResult = useQuery({
    queryKey: ['battleDetail', battleId],
    queryFn: async () => {
      if (!battleId) {
        throw new Error('缺少对战 ID');
      }
      return api.getBattleDetail(battleId);
    },
    enabled: Boolean(battleId),
    staleTime: 30_000,
    retry: 1,
    refetchInterval: (query: any) => {
      const raw = extractRawDetail(query.state.data as any);
      if (!raw) return 1000;
      return raw.status === 0 ? 1000 : false;
    },
  });

  const rawDetail = useMemo(
    () => extractRawDetail(queryResult.data as any),
    [queryResult.data],
  );

  const activeSource = useMemo<BattleDataSourceConfig>(() => {
    if (rawDetail) {
      const rawAny = rawDetail as Record<string, any>;
      const normalizedId = String(rawDetail.id ?? battleId ?? '');
      const specialOptions = {
        inverted: rawDetail.type === 1,
        fast: rawAny?.fast === 1,
        lastChance: rawAny?.finally === 1,
      };
      return {
        id: normalizedId,
        entryRound: 0,
        buildData: () => buildBattleDataFromRaw(rawDetail, { battleId: normalizedId, specialOptions }),
        buildPayload: () => buildBattlePayloadFromRaw(rawDetail, { battleId: normalizedId, specialOptions }),
      };
    }
    return getDynamicBattleSource(battleId);
  }, [rawDetail, battleId]);

  return {
    activeSource,
    isRemoteLoading: queryResult.isLoading || queryResult.isFetching,
    isRemoteError: queryResult.isError,
  };
}

