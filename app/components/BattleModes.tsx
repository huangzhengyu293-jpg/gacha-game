"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "./I18nProvider";
import { buildBattleListCards } from "@/app/battles/battleListSource";
import BattleListCardItem from "@/app/battles/components/BattleListCardItem";
import type { RawBattleListItem } from "@/app/components/bettlesListData";
import { api } from "@/app/lib/api";

type BattleModesProps = {
  sortValue?: "priceDesc" | "latest";
  useBestRecord?: boolean; // 使用对战亮点接口
  enablePolling?: boolean; // 是否轮询，默认 true
};

export default function BattleModes({ sortValue = "latest", useBestRecord = false, enablePolling = true }: BattleModesProps = {}) {
  const router = useRouter();
  const { t } = useI18n();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [useBestRecord ? "fightBestRecord" : "battleList"],
    queryFn: () => (useBestRecord ? api.getFightBestRecord() : api.getFightList()),
    refetchInterval: enablePolling ? 1000 : false,
    refetchIntervalInBackground: enablePolling,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
    staleTime: enablePolling ? 0 : 30_000,
  });

  const serverTimestampSec = useMemo(() => {
    const payload = data as any;
    const direct = payload?.t2 ?? payload?.data?.t2 ?? payload?.timestamp ?? payload?.server_time;
    const n = Number(direct);
    if (Number.isFinite(n)) return n;
    return Math.floor(Date.now() / 1000);
  }, [data]);

  const rawEntries = useMemo<RawBattleListItem[]>(() => {
    const payload = data?.data;
    if (Array.isArray(payload?.data)) {
      return payload.data as RawBattleListItem[];
    }
    if (Array.isArray(payload?.list)) {
      return payload.list as RawBattleListItem[];
    }
    if (Array.isArray(payload)) {
      return payload as RawBattleListItem[];
    }
    return [];
  }, [data]);

  const cards = useMemo(
    () => buildBattleListCards(rawEntries.length ? rawEntries : undefined, serverTimestampSec),
    [rawEntries, serverTimestampSec],
  );

  const sortedCards = useMemo(() => {
    const list = [...cards];
    if (sortValue === "latest") {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list.sort((a, b) => b.entryCost - a.entryCost);
  }, [cards, sortValue]);

 

  return (
    <div className="flex flex-col items-stretch gap-4">
      {sortedCards.map((card) => (
        <BattleListCardItem
          key={card.id}
          card={card}
          labels={{
            cost: t("cost"),
            opened: t("opened"),
            preparing: t("preparing"),
            waiting: t("waitingPlayers"),
            button: t("viewResults"),
            join: t("joinBattle"),
            modeClassic: t("battleModeClassic"),
            modeShare: t("battleModeShare"),
            modeSprint: t("battleModeSprint"),
            modeJackpot: t("battleModeJackpot"),
            modeElimination: t("battleModeElimination"),
          }}
          isPendingBattle={card.status === 0}
          onPrimaryAction={() => router.push(`/battles/${card.id}`)}
          onPendingAction={() => router.push(`/battles/${card.id}`)}
        />
      ))}
    </div>
  );
}