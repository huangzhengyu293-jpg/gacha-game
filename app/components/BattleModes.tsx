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
};

export default function BattleModes({ sortValue = "priceDesc" }: BattleModesProps = {}) {
  const router = useRouter();
  const { t } = useI18n();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["battleList"],
    queryFn: () => api.getFightList(),
    staleTime: 30_000,
  });

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
    () => buildBattleListCards(rawEntries.length ? rawEntries : undefined),
    [rawEntries],
  );

  const sortedCards = useMemo(() => {
    const list = [...cards];
    if (sortValue === "latest") {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list.sort((a, b) => b.entryCost - a.entryCost);
  }, [cards, sortValue]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-700 p-8 text-center text-white/70">
        正在载入对战列表…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-gray-700 p-8 text-center text-white/70 flex flex-col items-center gap-3">
        <span>
          载入对战失败：{error instanceof Error ? error.message : "请稍后重试"}
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md bg-[#6D4CFF] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#5533d0]"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!sortedCards.length) {
    return (
      <div className="rounded-lg border border-gray-700 p-8 text-center text-white/70">
        暂无可展示的对战
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-4">
      {sortedCards.map((card) => (
        <BattleListCardItem
          key={card.id}
          card={card}
          labels={{
            cost: t("cost"),
            opened: t("opened"),
            button: t("viewResults"),
          }}
          isPendingBattle={card.status === 0}
          onPrimaryAction={() => router.push(`/battles/${card.id}`)}
          onPendingAction={() => router.push(`/battles/${card.id}`)}
        />
      ))}
    </div>
  );
}