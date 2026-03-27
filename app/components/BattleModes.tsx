"use client";

import React, { useMemo, useState } from "react";
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
  /** 仅展示前 N 条，其余通过「展开全部」显示（如首页对战亮点） */
  collapseInitialCount?: number;
};

export default function BattleModes({
  sortValue = "latest",
  useBestRecord = false,
  enablePolling = true,
  collapseInitialCount,
}: BattleModesProps = {}) {
  const router = useRouter();
  const { t } = useI18n();
  const [battleListExpanded, setBattleListExpanded] = useState(false);

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
    // 对战亮点（首页）：使用接口默认排序，不做额外排序
    if (useBestRecord) return cards;
    const list = [...cards];
    if (sortValue === "latest") {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list.sort((a, b) => b.entryCost - a.entryCost);
  }, [cards, sortValue, useBestRecord]);

  const cap =
    typeof collapseInitialCount === "number" && collapseInitialCount > 0
      ? collapseInitialCount
      : undefined;
  const canToggleExpand = Boolean(cap && sortedCards.length > cap);
  const visibleCards =
    !cap || battleListExpanded ? sortedCards : sortedCards.slice(0, cap);

  return (
    <div className="flex flex-col items-stretch gap-4">
      {visibleCards.map((card) => (
        <BattleListCardItem
          key={card.id}
          // 对战亮点（best record）不会存在“进行中”语义：status=2 直接按“已开启”展示
          card={useBestRecord && Number(card.status) === 2 ? { ...card, status: 3 } : card}
          labels={{
            cost: t("cost"),
            opened: t("opened"),
            preparing: t("preparing"),
            waiting: t("waitingPlayers"),
            inProgress: t("battleInProgress"),
            waitingBlocks: t("waitingBlocks"),
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
      {canToggleExpand ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-bold transition-colors select-none py-2.5 px-6 cursor-pointer"
            style={{
              backgroundColor: "transparent",
              color: "#FFFFFF",
              border: "1px solid #4C5268",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#34383C";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
            onClick={() => setBattleListExpanded((v) => !v)}
            aria-expanded={battleListExpanded}
          >
            {battleListExpanded ? t("battleHighlightsCollapse") : t("battleHighlightsExpand")}
            <svg
              className="h-4 w-4 shrink-0 transition-transform duration-200"
              style={{ transform: battleListExpanded ? "rotate(180deg)" : "none" }}
              viewBox="0 0 10 6"
              fill="none"
              aria-hidden
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}