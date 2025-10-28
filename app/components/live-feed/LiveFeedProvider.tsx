"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type FeedItem = {
  id: string;
  href: string;
  avatarUrl: string;
  productImageUrl: string;
  packImageUrl: string;
  title: string;
  priceLabel: string;
  glowColor?: string;
};

type LiveFeedContextValue = {
  items: FeedItem[];
  enteringId: string | null;
  visibleCount: number;
  cardHeight: number;
  gapPx: number;
  oneStep: number;
  viewportPx: number;
  push: (item: Omit<FeedItem, "id">) => void;
};

const Ctx = createContext<LiveFeedContextValue | null>(null);

// 使用说明：
// 1) 在 app/layout.tsx 包裹 <LiveFeedProvider> 以跨路由持久化“直播开启”数据
// 2) 如需接入 WebSocket：传入 socketEnabled 和 socketUrl
//    例：
//    <LiveFeedProvider socketEnabled socketUrl="wss://example.com/live">
//      {children}
//    </LiveFeedProvider>
// 3) 如需在任意组件手动推送通知：
//    const { push } = useLiveFeed();
//    push({ href, avatarUrl, productImageUrl, packImageUrl, title, priceLabel, glowColor });
export function LiveFeedProvider({ children, visibleCount = 9, intervalMs = 2000, socketEnabled, socketUrl }: { children: React.ReactNode; visibleCount?: number; intervalMs?: number; socketEnabled?: boolean; socketUrl?: string; }) {
  const CARD_HEIGHT = 180;
  const GAP_PX = 12;
  const ONE_STEP = CARD_HEIGHT + GAP_PX;
  const VIEWPORT_PX = visibleCount * CARD_HEIGHT + (visibleCount - 1) * GAP_PX;

  const [items, setItems] = useState<FeedItem[]>(() => initialSeed().slice(0, visibleCount));
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const queueRef = useRef<FeedItem[]>([]);
  const visibleRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
  const timerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);

  const startPrepend = useCallback((newItem: FeedItem) => {
    setEnteringId(newItem.id);
    setItems((prev) => [newItem, ...prev].slice(0, visibleCount + 1));
  }, [visibleCount]);

  const finishEnter = useCallback(() => {
    setItems((prev) => prev.slice(0, visibleCount));
    setEnteringId(null);
    const next = queueRef.current.shift();
    if (next) startPrepend(next);
  }, [visibleCount, startPrepend]);

  // 可见性处理
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = typeof document !== 'undefined' ? !document.hidden : true;
      if (visibleRef.current && !timerRef.current) timerRef.current = window.setTimeout(tick, intervalMs);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [intervalMs]);

  const push = useCallback((item: Omit<FeedItem, "id">) => {
    const newItem: FeedItem = { id: `push-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ...item };
    if (enteringId) queueRef.current.push(newItem);
    else startPrepend(newItem);
  }, [enteringId, startPrepend]);

  const tick = useCallback(() => {
    timerRef.current = null;
    if (visibleRef.current) {
      const base = makeMockItem();
      const newItem: FeedItem = { id: `mock-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ...base };
      if (enteringId) queueRef.current.push(newItem);
      else startPrepend(newItem);
    }
    timerRef.current = window.setTimeout(tick, intervalMs);
  }, [intervalMs, enteringId, startPrepend]);

  useEffect(() => {
    timerRef.current = window.setTimeout(tick, intervalMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [intervalMs, tick]);

  // WebSocket 预留：开启后端实时推送
  useEffect(() => {
    if (!socketEnabled || !socketUrl) return;
    let alive = true;
    const connect = () => {
      try {
        const ws = new WebSocket(socketUrl);
        wsRef.current = ws;
        ws.onopen = () => {
          reconnectRef.current = 0;
        };
        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            // 期望 payload 形如：
            // { href, avatarUrl, productImageUrl, packImageUrl, title, priceLabel, glowColor }
            if (!data) return;
            const payload = {
              href: data.href ?? "/packs/1",
              avatarUrl: data.avatarUrl ?? "",
              productImageUrl: data.productImageUrl ?? "",
              packImageUrl: data.packImageUrl ?? "",
              title: data.title ?? "",
              priceLabel: data.priceLabel ?? "",
              glowColor: data.glowColor,
            } as Omit<FeedItem, "id">;
            push(payload);
          } catch {}
        };
        ws.onclose = () => {
          if (!alive) return;
          const delay = Math.min(1000 * Math.pow(2, reconnectRef.current++), 10000);
          setTimeout(connect, delay);
        };
        ws.onerror = () => {
          try { ws.close(); } catch {}
        };
      } catch {
        const delay = Math.min(1000 * Math.pow(2, reconnectRef.current++), 10000);
        setTimeout(connect, delay);
      }
    };
    connect();
    return () => {
      alive = false;
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, [socketEnabled, socketUrl, push]);

  const value = useMemo(() => ({
    items,
    enteringId,
    visibleCount,
    cardHeight: CARD_HEIGHT,
    gapPx: GAP_PX,
    oneStep: ONE_STEP,
    viewportPx: VIEWPORT_PX,
    push,
  }), [items, enteringId, visibleCount]);

  return (
    <Ctx.Provider value={value as LiveFeedContextValue}>
      {/* 通过自定义事件让视图在动画完成时回调 finishEnter */}
      <LiveFeedFinishBridge onFinish={finishEnter} />
      {children}
    </Ctx.Provider>
  );
}

export function useLiveFeed() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLiveFeed must be used within LiveFeedProvider");
  return ctx;
}

// 视图层在完成进入动画时触发 window.dispatchEvent(new CustomEvent('livefeed:enter-finish'))
function LiveFeedFinishBridge({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const handler = () => onFinish();
    window.addEventListener('livefeed:enter-finish', handler as any);
    return () => window.removeEventListener('livefeed:enter-finish', handler as any);
  }, [onFinish]);
  // 兜底：如果视图未挂载，进入 800ms 后自动完成，避免队列阻塞
  useEffect(() => {
    let t: number | null = null;
    const schedule = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => onFinish(), 820);
    };
    window.addEventListener('livefeed:enter-start', schedule as any);
    return () => {
      if (t) window.clearTimeout(t);
      window.removeEventListener('livefeed:enter-start', schedule as any);
    };
  }, [onFinish]);
  return null;
}

// --- Mock helpers (与现有数据一致) ---
function initialSeed(): FeedItem[] {
  return [
    {
      id: `seed-0-${Date.now()}`,
      href: "/packs/1",
      avatarUrl:
        "https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max",
      productImageUrl:
        "https://ik.imagekit.io/hr727kunx/products/cm9ln14rj0002l50g0sajx4dg_2344464__pFeElsrMCp?tr=w-1080,c-at_max",
      packImageUrl:
        "https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-1080,c-at_max",
      title: "Audemars Piguet Stainless Steel USA Edition",
      priceLabel: "$65,000.00",
      glowColor: "#E4AE33",
    },
    {
      id: `seed-1-${Date.now()}`,
      href: "/packs/2",
      avatarUrl:
        "https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max",
      productImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-1080,c-at_max",
      packImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-1080,c-at_max",
      title: "Limited Edition Pack",
      priceLabel: "$2.99",
      glowColor: "#6EE7B7",
    },
    {
      id: `seed-2-${Date.now()}`,
      href: "/packs/3",
      avatarUrl:
        "https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max",
      productImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-1080,c-at_max",
      packImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-1080,c-at_max",
      title: "Special Drop",
      priceLabel: "$5.00",
      glowColor: "#60A5FA",
    },
  ];
}

function makeMockItem(): Omit<FeedItem, "id"> {
  const variants: Omit<FeedItem, "id">[] = [
    {
      href: "/packs/1",
      avatarUrl:
        "https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max",
      productImageUrl:
        "https://ik.imagekit.io/hr727kunx/products/cm9ln14rj0002l50g0sajx4dg_2344464__pFeElsrMCp?tr=w-1080,c-at_max",
      packImageUrl:
        "https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-1080,c-at_max",
      title: "Audemars Piguet Stainless Steel USA Edition",
      priceLabel: "$65,000.00",
      glowColor: "#E4AE33",
    },
    {
      href: "/packs/2",
      avatarUrl:
        "https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max",
      productImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-1080,c-at_max",
      packImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-1080,c-at_max",
      title: "Limited Edition Pack",
      priceLabel: "$2.99",
      glowColor: "#6EE7B7",
    },
    {
      href: "/packs/3",
      avatarUrl:
        "https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max",
      productImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-1080,c-at_max",
      packImageUrl:
        "https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-1080,c-at_max",
      title: "Special Drop",
      priceLabel: "$5.00",
      glowColor: "#60A5FA",
    },
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}


