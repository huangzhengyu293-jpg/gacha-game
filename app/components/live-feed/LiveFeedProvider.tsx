"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getAllCatalogPacks, getGlowColorFromProbability } from "../../lib/catalogV2";

let PACKS_CACHE: any[] = [];

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

  const [items, setItems] = useState<FeedItem[]>(() => initialSeed(visibleCount).slice(0, visibleCount));
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const queueRef = useRef<FeedItem[]>([]);
  const visibleRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
  const timerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);
  const MAX_BACKLOG = 5; // 隐藏期间最多保留的待播条数

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
      // 隐藏：清掉定时器，避免离开期间积压节拍；显示：重新启动一个节拍
      if (!visibleRef.current) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        if (!timerRef.current) timerRef.current = window.setTimeout(tick, Math.min(400, intervalMs));
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [intervalMs]);

  const push = useCallback((item: Omit<FeedItem, "id">) => {
    const newItem: FeedItem = { id: `push-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ...item };
    // 预加载图片，确保加入时就有图
    preloadItemImages(item).then(() => {
      const readyItem = { ...newItem };
      if (!visibleRef.current || enteringId) {
        queueRef.current.push(readyItem);
        if (queueRef.current.length > MAX_BACKLOG) {
          queueRef.current.splice(0, queueRef.current.length - MAX_BACKLOG);
        }
      } else {
        startPrepend(readyItem);
      }
    });
  }, [enteringId, startPrepend]);

  const tick = useCallback(() => {
    timerRef.current = null;
    if (visibleRef.current) {
      const base = makeMockItem();
      // 预加载后再加入，避免图片延迟出现
      preloadItemImages(base).then(() => {
        const newItem: FeedItem = { id: `mock-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ...base };
        if (enteringId) {
          queueRef.current.push(newItem);
          if (queueRef.current.length > MAX_BACKLOG) {
            queueRef.current.splice(0, queueRef.current.length - MAX_BACKLOG);
          }
        } else {
          startPrepend(newItem);
        }
      });
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

  // 首次拉取 packs（JSON 优先，失败回退本地）
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch('/api/packs', { cache: 'no-store' });
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        if (!aborted && Array.isArray(data)) {
          PACKS_CACHE = data;
        }
      } catch {
        PACKS_CACHE = getAllCatalogPacks();
      }
    })();
    return () => { aborted = true; };
  }, []);
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
function initialSeed(visibleCount: number): FeedItem[] {
  const seed: FeedItem[] = [];
  const n = Math.max(visibleCount, 9);
  for (let i = 0; i < n; i++) {
    const base = makeMockItem();
    seed.push({ id: `seed-${i}-${Date.now()}`, ...base });
  }
  return seed;
}

function makeMockItem(): Omit<FeedItem, "id"> {
  // 随机选择一个卡包及其中一个商品
  const packs = (PACKS_CACHE && PACKS_CACHE.length ? PACKS_CACHE : getAllCatalogPacks());
  const pack = packs[Math.floor(Math.random() * Math.max(1, packs.length))];
  const items = (pack?.items || []) as any[];
  const product = items[Math.floor(Math.random() * Math.max(1, items.length))];
  return {
    href: `/packs/${pack.id}`,
    avatarUrl:
      "https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max",
    productImageUrl: `${product?.image ?? ""}?tr=w-1080,c-at_max`,
    packImageUrl: `${pack.image}?tr=w-1080,c-at_max`,
    title: product?.name ?? "",
    priceLabel: `$${(product?.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    glowColor: product ? getGlowColorFromProbability((product as any).dropProbability ?? (product as any).probability) : undefined,
  };
}

// ---- 图片预加载，加入前先准备好，避免“过一会才出来” ----
function preloadImage(url: string, timeoutMs = 1500): Promise<void> {
  if (!url) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let done = false;
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };
      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;
        cleanup();
        resolve();
      }, timeoutMs);
      img.onload = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        cleanup();
        resolve();
      };
      img.onerror = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        cleanup();
        resolve();
      };
      img.src = url;
    } catch {
      resolve();
    }
  });
}

function preloadItemImages(item: Omit<FeedItem, "id">): Promise<void> {
  return Promise.all([
    preloadImage(item.productImageUrl),
    preloadImage(item.packImageUrl),
  ]).then(() => undefined);
}


