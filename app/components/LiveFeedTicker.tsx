"use client";

import React, { useEffect, useMemo, useRef } from "react";
import LiveFeedElement from "./LiveFeedElement";
import { useLiveFeed } from "./live-feed/LiveFeedProvider";

interface LiveFeedTickerProps {
  maxItems?: number; // 可见条数（固定高度）
  intervalMs?: number; // 新通知间隔
}

export default function LiveFeedTicker({ maxItems = 9, intervalMs = 2000 }: LiveFeedTickerProps) {
  const { items, enteringId, visibleCount, cardHeight, gapPx, oneStep, viewportPx } = useLiveFeed();
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 播放进入动画：当 enteringId 存在时，对应节点从 -oneStep 滑入
  useEffect(() => {
    if (!enteringId) return;
    const node = nodeRefs.current.get(enteringId);
    if (!node) return;
    node.style.transition = 'none';
    node.style.top = `${-oneStep}px`;
    node.style.opacity = '0';
    void node.offsetHeight;
    node.style.transition = `top 700ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 320ms ease`;
    node.style.top = `0px`;
    node.style.opacity = '1';
    const endTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('livefeed:enter-finish'));
      window.clearTimeout(endTimer);
    }, 760);
  }, [enteringId, oneStep]);

  // 视口高度
  const viewportPxMemo = useMemo(() => viewportPx, [viewportPx]);

  return (
    <div className="relative" style={{ height: viewportPxMemo + "px", overflow: "hidden" }}>
      {items.map((it, index) => (
        <div
          key={it.id}
          ref={(el) => {
            if (el) nodeRefs.current.set(it.id, el);
            else nodeRefs.current.delete(it.id);
          }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${index * oneStep}px`,
            transition: 'top 700ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 300ms ease',
          }}
          // 不对卡片内部做缩放；仅通过 top/opacity 完成滑入与淡入
        >
          <LiveFeedElement
            index={index}
            href={it.href}
            avatarUrl={it.avatarUrl}
            productImageUrl={it.productImageUrl}
            packImageUrl={it.packImageUrl}
            title={it.title}
            priceLabel={it.priceLabel}
            glowColor={it.glowColor}
          />
        </div>
      ))}
    </div>
  );
}
// 删除本地 mock 与裁剪逻辑，交给 Provider 管理


