"use client";

import React, { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LiveFeedElement from "./LiveFeedElement";
import { useLiveFeed } from "./live-feed/LiveFeedProvider";

interface LiveFeedTickerProps {
  maxItems?: number; // 可见条数（固定高度）
  intervalMs?: number; // 新通知间隔
}

export default function LiveFeedTicker({ maxItems = 9, intervalMs = 2000 }: LiveFeedTickerProps) {
  const { items, enteringId, visibleCount, cardHeight, gapPx, oneStep, viewportPx } = useLiveFeed();

  // 当新项目进入时，触发动画完成事件
  useEffect(() => {
    if (!enteringId) return;
    const endTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('livefeed:enter-finish'));
      window.clearTimeout(endTimer);
    }, 760);
  }, [enteringId]);

  // 视口高度
  const viewportPxMemo = useMemo(() => viewportPx, [viewportPx]);

  return (
    <div className="relative" style={{ height: viewportPxMemo + "px", overflow: "hidden" }}>
      <AnimatePresence initial={false}>
        {items.map((it, index) => (
          <motion.div
            key={it.id}
            layout
            initial={{ 
              opacity: 0, 
              y: -80,
              scale: 0.85,
              filter: "blur(4px)"
            }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
              filter: "blur(0px)"
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.85,
              filter: "blur(4px)",
              transition: { duration: 0.3 }
            }}
            transition={{
              layout: { 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 100,
                damping: 15
              },
              opacity: { duration: 0.4, ease: "easeOut" },
              y: { 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 120,
                damping: 18
              },
              scale: { 
                duration: 0.5, 
                ease: [0.34, 1.56, 0.64, 1],
                type: "spring",
                stiffness: 150,
                damping: 12
              },
              filter: { duration: 0.3 }
            }}
            style={{
              marginBottom: index < items.length - 1 ? `${gapPx}px` : 0,
              transformOrigin: "top center",
              willChange: "transform, opacity"
            }}
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
// framer-motion 完全支持 React 19，提供更强大的动画控制


