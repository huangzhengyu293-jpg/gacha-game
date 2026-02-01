"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "./I18nProvider";
import { buildBattleListCards, type BattleListCard } from "@/app/battles/battleListSource";
import BattleListCardItem from "@/app/battles/components/BattleListCardItem";
import type { RawBattleListItem } from "@/app/components/bettlesListData";
import { api } from "@/app/lib/api";
import { motion } from "framer-motion";

type BattleModesProps = {
  sortValue?: "priceDesc" | "latest";
  useBestRecord?: boolean; // 使用对战亮点接口
  enablePolling?: boolean; // 是否轮询，默认 true
  initialFightList?: any; // 服务端预取的首屏数据（用于“准备好再进入”）
  initialFightBestRecord?: any; // 服务端预取（对战亮点）
};

export default function BattleModes({
  sortValue = "latest",
  useBestRecord = false,
  enablePolling = true,
  initialFightList,
  initialFightBestRecord,
}: BattleModesProps = {}) {
  const router = useRouter();
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const maxCountRef = useRef<number | null>(null);
  const [displayCards, setDisplayCards] = useState<BattleListCard[]>([]);
  const displayCardsRef = useRef<BattleListCard[]>([]);

  type LeavingOverlay = {
    key: string;
    card: BattleListCard;
    top: number;
    height: number;
  };
  const [leavingOverlays, setLeavingOverlays] = useState<LeavingOverlay[]>([]);

  useEffect(() => {
    displayCardsRef.current = displayCards;
  }, [displayCards]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [useBestRecord ? "fightBestRecord" : "battleList"],
    queryFn: () => (useBestRecord ? api.getFightBestRecord() : api.getFightList()),
    ...(useBestRecord && initialFightBestRecord
      ? { initialData: initialFightBestRecord, initialDataUpdatedAt: Date.now() }
      : {}),
    ...(useBestRecord
      ? {}
      : (initialFightList
          ? {
              // 让首屏直接用服务端数据渲染（SSR 体验：浏览器等到数据齐了才进入页面）
              initialData: initialFightList,
              initialDataUpdatedAt: Date.now(),
            }
          : {})),
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
      // 重要：加上稳定的 tie-breaker，避免 createdAt 相同/解析失败时每次轮询造成顺序抖动，
      // 进而出现“倒数第二个被挤到最后、最后才消失”的怪异动画。
      return list.sort((a, b) => {
        const primary = b.createdAt - a.createdAt;
        if (primary) return primary;
        const idA = Number(a.id);
        const idB = Number(b.id);
        if (Number.isFinite(idA) && Number.isFinite(idB)) return idB - idA;
        return String(b.id).localeCompare(String(a.id));
      });
    }
    return list.sort((a, b) => {
      const primary = b.entryCost - a.entryCost;
      if (primary) return primary;
      const secondary = b.createdAt - a.createdAt;
      if (secondary) return secondary;
      const idA = Number(a.id);
      const idB = Number(b.id);
      if (Number.isFinite(idA) && Number.isFinite(idB)) return idB - idA;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [cards, sortValue]);

  // 关键：列表永远只渲染固定数量（后端固定条数），更新时用 diff 决定哪个消失/哪个插入。
  // 退出动画使用 absolute overlay，不让 DOM 临时变成 N+1，避免“右侧滚动条闪一下/空位闪一下”。
  // 用 layoutEffect：首批数据到达时在 paint 前完成“首屏渲染 + 动画初始态”，避免先空一帧导致僵硬感。
  useLayoutEffect(() => {
    if (!sortedCards.length) {
      setDisplayCards([]);
      setLeavingOverlays([]);
      return;
    }

    if (maxCountRef.current === null) {
      maxCountRef.current = sortedCards.length;
    }

    // 若后端条数变化（极少见），跟随更新，避免显示“旧的多出来”。
    if (sortedCards.length !== maxCountRef.current) {
      maxCountRef.current = sortedCards.length;
    }

    const maxCount = Math.min(maxCountRef.current ?? sortedCards.length, sortedCards.length);
    const next = sortedCards.slice(0, maxCount);

    const prev = displayCardsRef.current;
    if (!prev.length) {
      // 首屏：让每个 item 用“直播开启”同款入场动效（Q 弹 + blur）。
      setDisplayCards(next);
      return;
    }

    const nextIdSet = new Set(next.map((c) => c.id));
    const removed = prev.filter((c) => !nextIdSet.has(c.id));

    // 记录离场项当前位置（相对容器），用 overlay 在原位淡出，不参与布局。
    if (removed.length) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const overlays: LeavingOverlay[] = [];
        for (const card of removed) {
          const el = itemRefs.current.get(card.id) ?? null;
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const top = rect.top - containerRect.top;
          overlays.push({
            key: `leave-${card.id}-${Date.now()}`,
            card,
            top,
            height: rect.height,
          });
        }
        if (overlays.length) {
          setLeavingOverlays((prevOverlays) => [...prevOverlays, ...overlays]);
        }
      }
    }

    setDisplayCards(next);
  }, [sortedCards]);

  return (
    <motion.div
      ref={containerRef}
      className="relative flex flex-col items-stretch gap-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 离场覆盖层：不占布局，避免 N+1 导致滚动条/闪动 */}
      {leavingOverlays.map((overlay) => (
        <motion.div
          key={overlay.key}
          className="pointer-events-none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: overlay.top,
            width: "100%",
            transformOrigin: "top center",
            willChange: "transform, opacity",
          }}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onAnimationComplete={() => {
            setLeavingOverlays((prevOverlays) => prevOverlays.filter((x) => x.key !== overlay.key));
          }}
        >
          <BattleListCardItem
            card={useBestRecord && Number(overlay.card.status) === 2 ? { ...overlay.card, status: 3 } : overlay.card}
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
            isPendingBattle={overlay.card.status === 0}
            onPrimaryAction={() => {}}
            onPendingAction={() => {}}
          />
        </motion.div>
      ))}

      {displayCards.map((card) => {
        return (
          <motion.div
            key={card.id}
            layout="position"
            style={{
              width: "100%",
              transformOrigin: "top center",
              willChange: "transform, opacity",
            }}
            // 重要：scale 不做“超调回弹”，避免 overflow-hidden 时边缘裁切造成卡顿观感
            initial={{ opacity: 0, y: -40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              layout: {
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 100,
                damping: 15,
              },
              opacity: { duration: 0.4, ease: "easeOut" },
              // y 用 tween：避免 spring 结尾的细微“下沉几 px”
              y: { type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] },
              // 用 tween 直接到 1，保证不会出现 scale > 1
              scale: { type: "tween", duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            }}
            ref={(el) => {
              itemRefs.current.set(card.id, el);
            }}
          >
            <BattleListCardItem
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
          </motion.div>
        );
      })}
    </motion.div>
  );
}