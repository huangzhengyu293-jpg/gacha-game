"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import gsap from "gsap";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getGlowColorFromProbability, getQualityFromLv } from "../lib/catalogV2";
import { useI18n } from "./I18nProvider";
import { keyDropPoppins } from "./KeyDropPoppins";

/** 与 BestLiveSidebar 中「直播开启」共用 boxRecord2 与 queryKey */
const LIVE_RECORD_POLL_MS = 5_000;

/** StripCard 宽 + pr-[6px]，与真实槽位一致；旧卡整段用 transform 播完整右移过程 */
const STRIP_CARD_W = 96;
const STRIP_GAP_PX = 6;
const STRIP_SHIFT_PX = STRIP_CARD_W + STRIP_GAP_PX;

/** 旧卡「整条」横向让位：固定时长 tween，避免 layout 在 flex 里几乎瞬切 */
const TAIL_SHIFT_DURATION_S = 0.92;
const TAIL_SHIFT_EASE = [0.22, 0.09, 0.18, 1] as const;

/** 新卡：从视口左上方向斜落到槽位（GSAP 同时插值 x/y，轨迹为直线斜入） */
const DROP_OFFSET_X = -56;
const DROP_OFFSET_Y = -82;
const DROP_TILT_DEG = -8;
const STRIP_HEAD_DROP_DURATION = 0.88;
const STRIP_HEAD_DROP_EASE = "power3.out";

/** 单条落下后再播下一条（需晚于尾段平移 tween 结束） */
const DROP_SETTLE_MS = 1000;
const QUEUE_STEP_GAP_MS = 440;

/** 与礼包页 ProductCard 卡片底 #22272B 一致，用于把品质色混成竖条渐变 */
const PACK_CARD_BASE_BG = "#22272B";
const PACK_CARD_DEEP_BG = "#15181c";

/** 无 lv 时按概率档给不同底色的兜底（不用单色黄） */
const PROB_GRADIENT_BUCKETS: { maxPct: number; from: string; to: string; accent: string }[] = [
  { maxPct: 1, from: "#3a2f18", to: "#6b5320", accent: "#E4AE33" },
  { maxPct: 5, from: "#3d1818", to: "#7a2528", accent: "#EB4B4B" },
  { maxPct: 10, from: "#382345", to: "#5F2A88", accent: "#8847FF" },
  { maxPct: 30, from: "#232D45", to: "#254E86", accent: "#4B69FF" },
  { maxPct: 100, from: "#2e3648", to: "#4a5f78", accent: "#829DBB" },
];

type StripItem = {
  id: string;
  href: string;
  avatarUrl: string;
  productImageUrl: string;
  /** 礼包封面（hover 主图），对应接口 box.cover */
  packCoverUrl: string;
  title: string;
  priceLabel: string;
  /** 用户 VIP 等级，用于头像角标 */
  vipId?: number;
  /** 来自 box_award.lv（与礼包详情 mapBoxDetailToPackData 的 item.lv 同源逻辑） */
  lv?: number;
  glowColor?: string;
  /** 无 lv 时用于底色分档 */
  dropProbability?: number;
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(Math.max(0, Math.min(255, Math.round(g))))}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
}

/** 与 ProductCard 一致：t 越大越接近 colorB */
function mixHexColors(colorA: string, colorB: string, t: number) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = a.r + (b.r - a.r) * t;
  const g = a.g + (b.g - a.g) * t;
  const bl = a.b + (b.b - a.b) * t;
  return rgbToHex(r, g, bl);
}

/** 礼包页用 backlightColor 做光晕；竖条用同色压进深色底做渐变 */
function stripGradientFromPackBacklight(accent: string): { from: string; to: string; accentVar: string } {
  const from = mixHexColors(accent, PACK_CARD_DEEP_BG, 0.86);
  const to = mixHexColors(accent, PACK_CARD_BASE_BG, 0.4);
  return { from, to, accentVar: accent };
}

function probBucketGradient(probability: number | undefined): { from: string; to: string; accentVar: string } {
  const raw = typeof probability === "number" && Number.isFinite(probability) ? probability : 50;
  const pct = raw <= 1 ? raw * 100 : raw;
  for (const b of PROB_GRADIENT_BUCKETS) {
    if (pct <= b.maxPct) {
      return { from: b.from, to: b.to, accentVar: b.accent };
    }
  }
  const last = PROB_GRADIENT_BUCKETS[PROB_GRADIENT_BUCKETS.length - 1]!;
  return { from: last.from, to: last.to, accentVar: last.accent };
}

function mapRecord2ToStripItems(raw: unknown[]): StripItem[] {
  return raw.slice(0, 40).map((row: unknown, idx: number) => {
    const item = row as Record<string, unknown>;
    const id = String(item?.id ?? item?.record_id ?? `strip-${idx}`);
    const priceNum = Number(item?.bean ?? item?.price ?? 0);
    const priceLabel =
      priceNum > 0
        ? `$${priceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00";
    const award = item?.awards as Record<string, unknown> | undefined;
    const boxAward = item?.box_award as Record<string, unknown> | undefined;
    const box = item?.box as Record<string, unknown> | undefined;
    const user = item?.user as Record<string, unknown> | undefined;
    const vipRaw = user?.vip as Record<string, unknown> | undefined;
    const vipNum = Number(vipRaw?.vip_id);
    const vipId = Number.isFinite(vipNum) && vipNum > 0 ? Math.floor(vipNum) : undefined;
    const coverFromAward =
      (award?.cover as string) ?? (award?.image as string) ?? (item?.cover as string) ?? (item?.icon as string);
    const packCoverUrl =
      (box?.cover as string) ??
      (item?.box_cover as string) ??
      (item?.pack_image as string) ??
      "";
    const title =
      (award?.name as string) ?? (item?.name as string) ?? (item?.title as string) ?? (item?.goods_name as string) ?? "";
    const lvNum = Number(boxAward?.lv ?? award?.lv ?? item?.lv);
    const lv = Number.isFinite(lvNum) && lvNum >= 1 ? Math.min(Math.floor(lvNum), 99) : undefined;
    const dropProbability = Number(item?.probability ?? item?.dropProbability);
    const probNorm = Number.isFinite(dropProbability) ? dropProbability : undefined;
    const quality = lv != null ? getQualityFromLv(lv) : null;
    const glowColor = quality?.color ?? getGlowColorFromProbability(probNorm);
    const boxId = item?.box_id;
    return {
      id,
      href: boxId ? `/packs/${boxId}` : "/packs",
      avatarUrl: (user?.avatar as string) ?? (item?.avatar as string) ?? "",
      productImageUrl: (coverFromAward as string) ?? "",
      packCoverUrl,
      title: title ?? "",
      priceLabel,
      vipId,
      lv,
      glowColor,
      dropProbability: probNorm,
    };
  });
}

function stripCardSurface(item: StripItem): { from: string; to: string; accentVar: string } {
  if (item.lv != null && item.lv >= 1) {
    const { color } = getQualityFromLv(item.lv);
    const accent = item.glowColor ?? color;
    return stripGradientFromPackBacklight(accent);
  }
  const fromGlow = probBucketFromGlowHex(item.glowColor ?? "");
  if (fromGlow) return fromGlow;
  return probBucketGradient(item.dropProbability);
}

/** 由光晕 hex 反查概率档底板（与 getGlowColorFromProbability 五档一致） */
function probBucketFromGlowHex(hex: string): { from: string; to: string; accentVar: string } | null {
  const key = hex.trim().toUpperCase();
  const map: Record<string, (typeof PROB_GRADIENT_BUCKETS)[number]> = {
    "#E4AE33": PROB_GRADIENT_BUCKETS[0]!,
    "#EB4B4B": PROB_GRADIENT_BUCKETS[1]!,
    "#8847FF": PROB_GRADIENT_BUCKETS[2]!,
    "#4B69FF": PROB_GRADIENT_BUCKETS[3]!,
    "#829DBB": PROB_GRADIENT_BUCKETS[4]!,
  };
  const b = map[key];
  if (!b) return null;
  return { from: b.from, to: b.to, accentVar: b.accent };
}

function AvatarRingDecoration({ uid }: { uid: string }) {
  const expId = `strip-av-exp-${uid}`;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 40 40"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <defs>
        <linearGradient id={expId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke="#433519"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        transform="rotate(-90 20 20)"
      />
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke={`url(#${expId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100}
        className="transition-all duration-500 ease-in-out"
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

function StripCard({ item }: { item: StripItem }) {
  const { from, to, accentVar } = stripCardSurface(item);
  const overlayStyle: CSSProperties = {
    ["--color" as string]: accentVar,
    backgroundImage: "linear-gradient(transparent 30%, var(--color))",
  };

  return (
    <Link
      href={item.href}
      className="group relative z-0 block h-full cursor-pointer overflow-hidden rounded bg-gradient-to-b"
      style={
        {
          width: 96,
          backgroundImage: `linear-gradient(to bottom, ${from}, ${to})`,
          ["--tw-gradient-from"]: from,
          ["--tw-gradient-to"]: to,
        } as CSSProperties
      }
    >
      <div className="relative z-[1] h-full overflow-hidden">
        <div className="flex h-[200%] flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
          {/* 默认面：掉落物 + 短标题 */}
          <div className="relative flex h-1/2 min-h-0 w-full flex-col items-center justify-center gap-[2px] px-1.5 py-1.5">
            <div className="relative min-h-0 w-[calc(100%-8px)] flex-1">
              {item.productImageUrl ? (
                <img
                  alt={item.title}
                  src={item.productImageUrl}
                  className="light-skin absolute h-full min-h-0 w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="absolute inset-0 rounded bg-white/10" />
              )}
            </div>
            <div className="mt-auto w-full truncate text-center text-[9px] font-semibold capitalize leading-none text-white/70">
              {item.title}
            </div>
          </div>
          {/* Hover 面：礼盒封面为主 + 底部头像（对齐 key-drop 结构） */}
          <div className="relative flex h-1/2 w-full flex-col items-center gap-1 p-2">
            {item.packCoverUrl ? (
              <img
                alt=""
                src={item.packCoverUrl}
                className="min-h-0 w-[72px] flex-1 rounded object-cover object-top aspect-[270/375]"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex min-h-[72px] w-[72px] flex-1 items-center justify-center rounded bg-navy-800/60" />
            )}
            <div
              className="absolute bottom-2 left-1/2 flex max-h-full -translate-x-1/2 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-800"
              style={{ width: 40, height: 40 }}
            >
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full p-px">
                {item.avatarUrl ? (
                  <img
                    alt=""
                    src={item.avatarUrl}
                    className="max-h-full rounded-full object-cover"
                    style={{ width: 30, height: 30 }}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="rounded-full bg-navy-600" style={{ width: 30, height: 30 }} />
                )}
                <div className="pointer-events-none absolute bottom-0 w-full bg-navy-800" style={{ height: 6 }} />
                <div
                  className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-navy-800 text-center text-[9px] font-semibold leading-none text-[#FFC354]"
                  style={{ height: 20, width: 20, bottom: 2.5 }}
                >
                  <span className="animate-pulse">?</span>
                </div>
              </div>
              <AvatarRingDecoration uid={item.id} />
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[-1] opacity-30" style={overlayStyle} />
    </Link>
  );
}

function stripIdsSignature(rows: StripItem[]) {
  if (!rows.length) return "";
  return rows.map((r) => r.id).join("\0");
}

/**
 * 与接口顺序对齐时尽量保留已有行对象引用，避免队列播完后 reconcile / 静默轮询造成整排不重也要「换一遍」闪一下。
 */
function mergeStripOrderPreserveRefs(prev: StripItem[], want: StripItem[]): StripItem[] {
  if (stripIdsSignature(prev) === stripIdsSignature(want)) return prev;
  const prevById = new Map(prev.map((p) => [p.id, p]));
  const merged = want.map((w) => prevById.get(w.id) ?? w);
  if (merged.length === prev.length && merged.every((m, i) => m === prev[i])) return prev;
  return merged;
}

function collectNewHeadPrefix(target: StripItem[], displayed: StripItem[]): StripItem[] {
  const displayedIds = new Set(displayed.map((i) => i.id));
  const head: StripItem[] = [];
  for (const row of target) {
    if (displayedIds.has(row.id)) break;
    head.push(row);
  }
  return head;
}

/** 头条新卡插入：GSAP 控制左上→落点的斜向轨迹（x/y/rotation/opacity 同步） */
function StripHeadGsapDrop({ playToken, children }: { playToken: number; children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (playToken === 0) return;
    const el = wrapRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      {
        x: DROP_OFFSET_X,
        y: DROP_OFFSET_Y,
        rotation: DROP_TILT_DEG,
        opacity: 0,
        force3D: true,
      },
      {
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        duration: STRIP_HEAD_DROP_DURATION,
        ease: STRIP_HEAD_DROP_EASE,
        overwrite: "auto",
      },
    );
    return () => {
      gsap.killTweensOf(el);
    };
  }, [playToken]);

  return (
    <div ref={wrapRef} className="h-full overflow-hidden rounded will-change-transform">
      {children}
    </div>
  );
}

export default function LiveFeedNavStrip() {
  const { t } = useI18n();
  const [items, setItems] = useState<StripItem[]>([]);
  const [droppingId, setDroppingId] = useState<string | null>(null);

  const initialBootstrapDoneRef = useRef(false);
  const lastSigRef = useRef("");
  const itemsRef = useRef<StripItem[]>([]);
  const latestTargetRef = useRef<StripItem[]>([]);
  const insertQueueRef = useRef<StripItem[]>([]);
  /** hover 暂停期间接口新来的头批，先堆这里，松开后再并入 insertQueue 做动画 */
  const pausedIngressRef = useRef<StripItem[]>([]);
  const pumpingRef = useRef(false);
  const pumpTimeoutsRef = useRef<number[]>([]);
  /** hover 滚动区时暂停插入动画（与 ref 同步，供 tryPump / effect 立读） */
  const insertPausedRef = useRef(false);
  const [stripHoverPaused, setStripHoverPaused] = useState(false);
  /** 每插入一条头卡 +1，驱动 GSAP 斜落（bootstrap 不为 0 避免首屏误播） */
  const [headDropTick, setHeadDropTick] = useState(0);

  const tailX = useMotionValue(0);
  const [tailShiftTick, setTailShiftTick] = useState(0);
  const tailShiftAnimRef = useRef<ReturnType<typeof animate> | null>(null);

  useLayoutEffect(() => {
    if (tailShiftTick === 0) return;
    tailShiftAnimRef.current?.stop();
    tailX.set(-STRIP_SHIFT_PX);
    tailShiftAnimRef.current = animate(tailX, 0, {
      type: "tween",
      duration: TAIL_SHIFT_DURATION_S,
      ease: TAIL_SHIFT_EASE,
    });
    return () => {
      tailShiftAnimRef.current?.stop();
    };
  }, [tailShiftTick, tailX]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const { data: liveRecordResp, isFetched } = useQuery({
    queryKey: ["boxRecord2"],
    queryFn: () => api.getBoxRecord2?.(),
    refetchInterval: LIVE_RECORD_POLL_MS,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const mappedFromApi = useMemo(() => {
    const list = Array.isArray(liveRecordResp?.data) ? liveRecordResp.data : [];
    return mapRecord2ToStripItems(list);
  }, [liveRecordResp?.data]);

  useEffect(() => {
    latestTargetRef.current = mappedFromApi;
  }, [mappedFromApi]);

  const clearPumpTimeouts = () => {
    pumpTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    pumpTimeoutsRef.current = [];
  };

  useEffect(() => () => clearPumpTimeouts(), []);

  const scheduleTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    pumpTimeoutsRef.current.push(id);
  };

  const reconcileToTarget = () => {
    const want = latestTargetRef.current;
    setItems((prev) => mergeStripOrderPreserveRefs(prev, want));
  };

  const tryPump = () => {
    if (insertPausedRef.current) return;
    if (pumpingRef.current) return;
    if (insertQueueRef.current.length === 0) return;

    pumpingRef.current = true;

    const run = () => {
      if (insertPausedRef.current) {
        pumpingRef.current = false;
        return;
      }
      if (insertQueueRef.current.length === 0) {
        pumpingRef.current = false;
        reconcileToTarget();
        return;
      }

      const next = insertQueueRef.current.shift()!;
      const prevSnap = itemsRef.current;
      const nextItems = [next, ...prevSnap.filter((i) => i.id !== next.id)].slice(0, 40);
      setHeadDropTick((n) => n + 1);
      if (nextItems.length > 1) {
        setTailShiftTick((t) => t + 1);
      }
      setDroppingId(next.id);
      setItems(nextItems);

      scheduleTimeout(() => {
        setDroppingId(null);
        scheduleTimeout(() => {
          if (insertPausedRef.current) {
            pumpingRef.current = false;
            return;
          }
          run();
        }, QUEUE_STEP_GAP_MS);
      }, DROP_SETTLE_MS);
    };

    run();
  };

  const enqueueMany = (prefix: StripItem[]) => {
    const ordered = [...prefix].reverse();
    const activeQ = insertPausedRef.current ? pausedIngressRef.current : insertQueueRef.current;
    const otherQ = insertPausedRef.current ? insertQueueRef.current : pausedIngressRef.current;
    for (const it of ordered) {
      if (activeQ.some((q) => q.id === it.id) || otherQ.some((q) => q.id === it.id)) continue;
      activeQ.push(it);
    }
    if (!insertPausedRef.current) tryPump();
  };

  const flushPausedIngressIntoPumpQueue = () => {
    for (const it of pausedIngressRef.current) {
      if (!insertQueueRef.current.some((q) => q.id === it.id)) {
        insertQueueRef.current.push(it);
      }
    }
    pausedIngressRef.current = [];
  };

  /** 只打标暂停：不打断当前条的 settle 动画；等本轮 timeout 跑完后在间隙里停住，主队列保留；新来的进 pausedIngress */
  const handleStripScrollHoverEnter = () => {
    insertPausedRef.current = true;
    setStripHoverPaused(true);
  };

  const handleStripScrollHoverLeave = () => {
    insertPausedRef.current = false;
    setStripHoverPaused(false);
    flushPausedIngressIntoPumpQueue();
    tryPump();
  };

  useEffect(() => {
    if (!isFetched) return;

    const target = mappedFromApi;
    const sig = stripIdsSignature(target);

    if (!initialBootstrapDoneRef.current) {
      initialBootstrapDoneRef.current = true;
      lastSigRef.current = sig;
      insertQueueRef.current = [];
      pausedIngressRef.current = [];
      clearPumpTimeouts();
      pumpingRef.current = false;
      setDroppingId(null);
      setItems(target);
      return;
    }

    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    if (!target.length) {
      clearPumpTimeouts();
      insertQueueRef.current = [];
      pausedIngressRef.current = [];
      pumpingRef.current = false;
      setDroppingId(null);
      setItems([]);
      return;
    }

    const displayed = itemsRef.current;

    if (displayed.length === 0 && target.length > 0) {
      insertQueueRef.current = [];
      pausedIngressRef.current = [];
      clearPumpTimeouts();
      pumpingRef.current = false;
      setDroppingId(null);
      setItems(target);
      return;
    }

    const headNew = collectNewHeadPrefix(target, displayed);

    if (headNew.length === 0) {
      if (stripIdsSignature(displayed) !== sig) {
        if (!insertPausedRef.current) {
          setItems((prev) => mergeStripOrderPreserveRefs(prev, target));
        }
      }
      return;
    }

    enqueueMany(headNew);
  }, [mappedFromApi, isFetched]);

  const countDisplay = mappedFromApi.length.toLocaleString();
  const stripHead = items.length > 0 ? items[0]! : null;

  return (
    <div
      className={`${keyDropPoppins.className} hidden h-[99px] w-full flex-shrink-0 flex-row items-center gap-2.5 overflow-hidden bg-navy-700 md:flex 3xl:h-[114px]`}
    >
      <div className="relative z-20 ml-3 flex h-[80px] w-[8.5rem] flex-shrink-0 rounded 3xl:h-[96px]">
        <div className="relative mr-[2px] flex w-20 flex-1 flex-col items-center justify-center bg-navy-600 pb-3 pl-0 pt-2.5">
          <svg viewBox="0 0 21 21" width="20" height="20" fill="currentColor" className="text-gold" aria-hidden>
            <path d="M10.893 9.286a5 5 0 0 1 5 5v6h-10v-6a5 5 0 0 1 5-5Zm-6.712 3.006a6.982 6.982 0 0 0-.28 1.65l-.008.344v6h-3v-4.5a3.5 3.5 0 0 1 3.12-3.48l.17-.014H4.18Zm13.424 0a3.5 3.5 0 0 1 3.288 3.494v4.5h-3v-6c0-.693-.1-1.362-.288-1.994ZM4.393 6.286a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm13 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm-6.5-6a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
          </svg>
          <div className="ml-0 mt-1 flex flex-col items-center">
            <div className="flex items-center text-center text-sm font-semibold text-white">
              <span className="text-xs font-bold text-white">{countDisplay}</span>
            </div>
            <div className="text-center text-[10px] font-bold uppercase leading-none text-navy-400">{t("liveStart")}</div>
          </div>
        </div>
        <div className="flex w-11 flex-col gap-[2px] self-stretch overflow-hidden rounded-r">
          <Link
            href="/"
            aria-label={t("liveFeedStripHomeAria")}
            className="flex flex-1 flex-col items-center justify-center rounded-tr bg-navy-600 px-1 text-navy-200 transition-colors duration-100 hover:bg-navy-700"
          >
            <svg className="icon h-4 w-4 fill-current 3xl:h-[19px] 3xl:w-[19px]" viewBox="0 0 21 21" aria-hidden>
              <path
                fill="currentColor"
                d="m3.179 5.035 3.375 2.25 3.364-4.708a.804.804 0 0 1 1.308 0l3.363 4.708 3.376-2.25a.803.803 0 0 1 1.243.764l-1.32 11.223a.804.804 0 0 1-.799.71H4.054a.803.803 0 0 1-.798-.71L1.936 5.798a.804.804 0 0 1 1.243-.763Zm7.393 7.876a1.607 1.607 0 1 0 0-3.214 1.607 1.607 0 0 0 0 3.214Z"
              />
            </svg>
          </Link>
          <Link
            href="/packs"
            aria-label={t("liveFeedStripQuickAria")}
            className="flex flex-1 flex-col items-center justify-center rounded-br bg-gold-800 px-1 text-gold transition-colors duration-100 hover:bg-gold-800"
          >
            <svg viewBox="0 0 21 21" width="24" height="24" fill="currentColor" className="h-4 w-4 3xl:h-[19px] 3xl:w-[19px]" aria-hidden>
              <path d="M11.375 8.964H17L9.768 19.41v-7.232H4.143l7.232-10.446v7.232Z" />
            </svg>
          </Link>
        </div>
      </div>

      <div
        className="group/strip-scroll relative grid h-[80px] w-full min-w-0 flex-1 overflow-hidden 3xl:h-[96px]"
        onPointerEnter={handleStripScrollHoverEnter}
        onPointerLeave={handleStripScrollHoverLeave}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 flex h-full w-16 -translate-x-full cursor-default transform flex-col items-center justify-center bg-navy-800/50 p-2 text-xs font-bold text-red-400 transition duration-300 ease-in-out group-hover/strip-scroll:translate-x-0"
          aria-hidden
        >
          <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden>
            <path d="M10.361 18.406a7.917 7.917 0 1 1 0-15.833 7.917 7.917 0 0 1 0 15.833ZM7.986 8.114v4.75H9.57v-4.75H7.986Zm3.167 0v4.75h1.583v-4.75h-1.583Z" />
          </svg>
          <span className="mt-1 uppercase">{t("liveFeedStripPause")}</span>
        </div>
        <div className="col-start-1 col-end-2 row-start-1 row-end-2 h-full min-h-0 min-w-0">
          <div className="h-full w-screen max-w-none flex-shrink-0 overflow-hidden rounded-tl">
            <div className="h-full overflow-hidden">
              <div role="list" className="relative flex h-full w-max flex-row items-stretch">
                {items.length === 0 ? (
                  <div role="listitem" className="flex h-full flex-shrink-0 items-center pl-2 pr-6">
                    <span className="text-xs font-semibold text-navy-300">{t("liveFeedStripEmpty")}</span>
                  </div>
                ) : (
                  <>
                    <div role="listitem" className="relative z-[1] flex h-full flex-shrink-0 pr-[6px]">
                      {stripHead ? (
                        <StripHeadGsapDrop key={stripHead.id} playToken={headDropTick}>
                          <StripCard item={stripHead} />
                        </StripHeadGsapDrop>
                      ) : null}
                    </div>
                    {items.length > 1 && (
                      <motion.div
                        role="group"
                        aria-label={t("liveFeedStripEarlierDropsAria")}
                        className="relative z-0 flex flex-row items-stretch will-change-transform"
                        style={{ x: tailX }}
                      >
                        {items.slice(1).map((item) => (
                          <div key={item.id} role="listitem" className="flex h-full flex-shrink-0 pr-[6px]">
                            <div className="h-full overflow-hidden rounded">
                              <StripCard item={item} />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
