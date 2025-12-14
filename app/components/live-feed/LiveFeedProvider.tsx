"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
// 去掉模拟数据，改由外部 push 或接口轮询驱动

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
  setInitialItems: (items: FeedItem[]) => void;
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
  const MAX_ITEMS = 20;

  const [items, setItems] = useState<FeedItem[]>([]);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const queueRef = useRef<FeedItem[]>([]);
  const visibleRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);
  const MAX_BACKLOG = 5; // 隐藏期间最多保留的待播条数
  const nextTimerRef = useRef<number | null>(null);

  const scheduleNext = useCallback(
    (delayMs = 0) => {
      if (nextTimerRef.current) {
        window.clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }
      if (!queueRef.current.length) return;
      nextTimerRef.current = window.setTimeout(() => {
        nextTimerRef.current = null;
        const next = queueRef.current.shift();
        if (next) {
          setEnteringId(next.id);
          setItems((prev) => [next, ...prev].slice(0, MAX_ITEMS));
        }
      }, delayMs);
    },
    [MAX_ITEMS],
  );

  const startPrepend = useCallback((newItem: FeedItem) => {
    setEnteringId(newItem.id);
    setItems((prev) => [newItem, ...prev].slice(0, MAX_ITEMS));
  }, [MAX_ITEMS]);

  const finishEnter = useCallback(() => {
    setItems((prev) => prev.slice(0, MAX_ITEMS));
    setEnteringId(null);
    // 间隔 0.5s 后播下一条
    scheduleNext(500);
  }, [MAX_ITEMS, scheduleNext]);

  // 可见性处理，仅更新可见状态
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = typeof document !== 'undefined' ? !document.hidden : true;
      if (visibleRef.current && !enteringId && !nextTimerRef.current) {
        scheduleNext(0);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [enteringId, scheduleNext]);

  const push = useCallback((item: Omit<FeedItem, "id">) => {
    const newItem: FeedItem = { id: `push-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ...item };
    // 预加载图片，确保加入时就有图
    preloadItemImages(item).then(() => {
      const readyItem = { ...newItem };
      const shouldQueue = !visibleRef.current || enteringId || Boolean(nextTimerRef.current);
      if (shouldQueue) {
        queueRef.current.push(readyItem);
        if (queueRef.current.length > MAX_BACKLOG) {
          queueRef.current.splice(0, queueRef.current.length - MAX_BACKLOG);
        }
        if (visibleRef.current && !enteringId && !nextTimerRef.current) {
          scheduleNext(0);
        }
      } else {
        startPrepend(readyItem);
      }
    });
  }, [enteringId, scheduleNext, startPrepend]);

  const setInitialItems = useCallback((list: FeedItem[]) => {
    if (!Array.isArray(list)) return;
    setItems(list.slice(0, MAX_ITEMS));
    queueRef.current = [];
    setEnteringId(null);
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, [MAX_ITEMS]);

  // 移除模拟播报逻辑，真实数据由外部 push 驱动
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
    setInitialItems,
  }), [items, enteringId, visibleCount, setInitialItems]);

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


