"use client";

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import gsap from "gsap";

const ITEM_SIZE_PX = 195;

interface GachaItem {
  id: string;
  name: string;
  price: string;
  image: string;
  accent: "gold" | "blue";
}

const DEFAULT_ITEMS: GachaItem[] = [
  {
    id: "1",
    name: "1 Ticket",
    price: "$0.01",
    image: "https://ik.imagekit.io/hr727kunx/products/cmc5mkiqj0009jo0mb8h8m78e_2739246__Mr5QPr_4Y?tr=w-256,c-at_max",
    accent: "blue",
  },
  {
    id: "2",
    name: "2019 Ferrari 812 Superfast GTS",
    price: "$449,000.00",
    image: "https://ik.imagekit.io/hr727kunx/products/cm18gmp6d000010it5zjc9lw9_8061114__ujECk6qYI?tr=w-256,c-at_max",
    accent: "gold",
  },
];

interface GachaWheelProps {
  items?: GachaItem[];
  highSpeedDuration?: number;
}

export interface GachaWheelHandle {
  startSpin: () => void;           
  settleTo: (index: number) => void;
  spinTo?: (index: number) => void; 
  spinDemo?: () => void;            
  spinDemoFast?: () => void;       
  settleToId?: (id: string) => void;
}

const GachaWheel = forwardRef<GachaWheelHandle, GachaWheelProps>(
  ({ items = DEFAULT_ITEMS, highSpeedDuration = 0.62 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollOffsetRef = useRef(0);
    const slotSizeRef = useRef(ITEM_SIZE_PX);
    const visibleCountRef = useRef(13);
    const velocityRef = useRef(0);
    const tickerFnRef = useRef<((time?: number) => void) | null>(null);
    const lastTimeRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);
    const [, forceUpdate] = useState(0);
    const [centerIndex, setCenterIndex] = useState<number | null>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const winnerScaleRef = useRef(1);
  const magnifyTriggeredRef = useRef(false);
  const stoppedRef = useRef(false);
  const targetGlobalIndexRef = useRef<number | null>(null);
  const countdownFocusGlobalIndexRef = useRef<number | null>(null);
  const selectedGlowActiveRef = useRef(false);
  const liveSelectActiveRef = useRef(false);
  const countdownFocusIndexRef = useRef<number | null>(null);
  const countdownTimeoutsRef = useRef<number[]>([]);
  const inFinalSnapRef = useRef(false);
  const isScrollingRef = useRef(false);

  const clearCountdown = () => {
    for (const id of countdownTimeoutsRef.current) {
      clearTimeout(id);
    }
    countdownTimeoutsRef.current = [];
    countdownFocusIndexRef.current = null;
  };

    const total = items.length;

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const update = () => {
        const w = el.clientWidth;
        if (w > 0) {
          if (w < 640) visibleCountRef.current = 5;
          else if (w < 768) visibleCountRef.current = 7;
          else if (w < 1024) visibleCountRef.current = 9;
          else visibleCountRef.current = 13;
          
          slotSizeRef.current = ITEM_SIZE_PX;
          forceUpdate((n) => n + 1);
        }
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    useImperativeHandle(ref, () => ({
      startSpin: () => {
        if (timelineRef.current) timelineRef.current.kill();
        if (tickerFnRef.current) {
          gsap.ticker.remove(tickerFnRef.current);
          tickerFnRef.current = null;
        }

        setCenterIndex(null);
        winnerScaleRef.current = 1;
        magnifyTriggeredRef.current = false;
        stoppedRef.current = false;
        targetGlobalIndexRef.current = null;
        countdownFocusGlobalIndexRef.current = null;
        selectedGlowActiveRef.current = false;
        liveSelectActiveRef.current = false;
        clearCountdown();
        inFinalSnapRef.current = false;
        inFinalSnapRef.current = false;
        isScrollingRef.current = false;

        const SLOT = slotSizeRef.current;
        const MAX_SPEED = SLOT * 30;
        const velObj = { v: velocityRef.current } as { v: number };
        gsap.to(velObj, {
          v: MAX_SPEED,
          duration: 0.35,
          ease: "power4.out",
          onUpdate: () => {
            velocityRef.current = velObj.v;
            if (velObj.v > SLOT * 10) {
              isScrollingRef.current = true;
            }
          },
        });

        lastTimeRef.current = typeof performance !== "undefined" ? performance.now() : 0;
        const tick = () => {
          const now = typeof performance !== "undefined" ? performance.now() : 0;
          const dt = Math.max(0, (now - lastTimeRef.current) / 1000);
          lastTimeRef.current = now;

          scrollOffsetRef.current += velocityRef.current * dt;
          forceUpdate((n) => n + 1);
        };
        tickerFnRef.current = tick;
        gsap.ticker.add(tick);
      },

      settleTo: (targetIndex: number) => {
        if (tickerFnRef.current) {
          gsap.ticker.remove(tickerFnRef.current);
          tickerFnRef.current = null;
        }
        velocityRef.current = 0;

        const SLOT = slotSizeRef.current;
        const currentPos = scrollOffsetRef.current;
        const currentItemIdx = Math.floor(currentPos / SLOT);
        const loops = 5;
        const targetItemIdx =
          currentItemIdx + loops * total + ((targetIndex - (currentItemIdx % total) + total) % total);
        const finalPosition = targetItemIdx * SLOT;

        const overshootPx = 8 + Math.random() * 10;
        const overshootPosition = finalPosition + overshootPx;

        const currentBase = Math.floor(scrollOffsetRef.current / SLOT);
        targetGlobalIndexRef.current = currentBase + loops * total + ((targetIndex - (currentBase % total) + total) % total);

        if (timelineRef.current) timelineRef.current.kill();
        const tl = gsap.timeline({
          onUpdate: () => forceUpdate((n) => n + 1),
        });
        timelineRef.current = tl;

        tl.to(scrollOffsetRef, {
          current: overshootPosition,
          duration: 3.0,
          ease: "expo.out",
          onStart: () => {
            selectedGlowActiveRef.current = true;
          },
          onUpdate: () => {
            const SLOT = slotSizeRef.current;
            const currentCenterGlobal = Math.floor(scrollOffsetRef.current / SLOT);
            const target = targetGlobalIndexRef.current ?? 0;

            let newFocus = countdownFocusGlobalIndexRef.current;
            
            if (newFocus === null) {
              newFocus = currentCenterGlobal;
              countdownFocusGlobalIndexRef.current = newFocus;
              liveSelectActiveRef.current = false;
              inFinalSnapRef.current = true;
              forceUpdate((n) => n + 1);
            } else if (newFocus < target) {
              newFocus = newFocus + 1;
              if (newFocus <= target) {
                countdownFocusGlobalIndexRef.current = newFocus;
                forceUpdate((n) => n + 1);
              }
            }
          },
        });

        tl.to(scrollOffsetRef, {
          current: finalPosition,
          duration: 0.6,
          ease: "back.out(1.3)",
          onComplete: () => {
            scrollOffsetRef.current = finalPosition;
            stoppedRef.current = true;
            isScrollingRef.current = false;
            setCenterIndex(targetIndex);
            winnerScaleRef.current = 1.5;
            clearCountdown();
            inFinalSnapRef.current = false;
            forceUpdate((n) => n + 1);
          },
        });
      },

      spinTo: (targetIndex: number) => {
        (ref as any)?.current?.startSpin();
        setTimeout(() => (ref as any)?.current?.settleTo(targetIndex), 1200);
      },

      settleToId: (id: string) => {
        const idx = items.findIndex((it) => it.id === id);
        if (idx >= 0) {
          (ref as any)?.current?.settleTo(idx);
        }
      },

      spinDemoFast: () => {
        if (timelineRef.current) timelineRef.current.kill();
        if (tickerFnRef.current) {
          gsap.ticker.remove(tickerFnRef.current);
          tickerFnRef.current = null;
        }
        setCenterIndex(null);
        winnerScaleRef.current = 1;
        magnifyTriggeredRef.current = false;
        stoppedRef.current = false;
        targetGlobalIndexRef.current = null;
        countdownFocusGlobalIndexRef.current = null;
        selectedGlowActiveRef.current = false;
        liveSelectActiveRef.current = false;
        clearCountdown();
        inFinalSnapRef.current = false;
        isScrollingRef.current = false;

        const tl = gsap.timeline({ onUpdate: () => forceUpdate((n) => n + 1) });
        timelineRef.current = tl;

        const startPos = scrollOffsetRef.current;
        const SLOT = slotSizeRef.current;
        
        tl.to(scrollOffsetRef, {
          current: startPos + SLOT * 5,
          duration: 0.15,
          ease: "power3.in",
          onUpdate: () => {
            const progress = (scrollOffsetRef.current - startPos) / (SLOT * 5);
            if (progress > 0.3) {
              isScrollingRef.current = true;
            }
          },
        });

        tl.to(scrollOffsetRef, {
          current: startPos + SLOT * (5 + 15),
          duration: 0.2,
          ease: "none",
          onComplete: () => {
            const targetIndex = Math.floor(Math.random() * Math.max(1, total));

            const currentPos = scrollOffsetRef.current;
            const currentItemIdx = Math.floor(currentPos / SLOT);
            const loops = 2;
            const targetItemIdx =
              currentItemIdx + loops * total + ((targetIndex - (currentItemIdx % total) + total) % total);
            const finalPosition = targetItemIdx * SLOT;

            const overshootPx = 4 + Math.random() * 4;
            const overshootPosition = finalPosition + overshootPx;

            targetGlobalIndexRef.current = targetItemIdx;

            tl.to(scrollOffsetRef, {
              current: overshootPosition,
              duration: 0.55,
              ease: "expo.out",
              onStart: () => {
                selectedGlowActiveRef.current = true;
              },
              onUpdate: () => {
                const SLOT = slotSizeRef.current;
                const currentCenterGlobal = Math.floor(scrollOffsetRef.current / SLOT);
                const target = targetGlobalIndexRef.current ?? 0;
                const diff = target - currentCenterGlobal;

                let newFocus = countdownFocusGlobalIndexRef.current;
                if (diff <= 1 && diff > 0) newFocus = target - 1;
                else if (diff <= 0) newFocus = target;

                if (newFocus !== null && newFocus !== countdownFocusGlobalIndexRef.current) {
                  countdownFocusGlobalIndexRef.current = newFocus;
                  liveSelectActiveRef.current = false;
                  inFinalSnapRef.current = true;
                  forceUpdate((n) => n + 1);
                }
              },
            });

            tl.to(scrollOffsetRef, {
              current: finalPosition,
              duration: 0.1,
              ease: "back.out(1.15)",
              onComplete: () => {
                scrollOffsetRef.current = finalPosition;
                stoppedRef.current = true;
                isScrollingRef.current = false;
                setCenterIndex(targetIndex);
                winnerScaleRef.current = 1.5;
                clearCountdown();
                inFinalSnapRef.current = false;
                forceUpdate((n) => n + 1);
              },
            });
          },
        });
      },

      spinDemo: () => {
        if (timelineRef.current) timelineRef.current.kill();
        if (tickerFnRef.current) {
          gsap.ticker.remove(tickerFnRef.current);
          tickerFnRef.current = null;
        }
        setCenterIndex(null);
        winnerScaleRef.current = 1;
        magnifyTriggeredRef.current = false;
        stoppedRef.current = false;
        targetGlobalIndexRef.current = null;
        countdownFocusGlobalIndexRef.current = null;
        selectedGlowActiveRef.current = false;
        liveSelectActiveRef.current = false;
        clearCountdown();
        isScrollingRef.current = false;

        const tl = gsap.timeline({ onUpdate: () => forceUpdate((n) => n + 1) });
        timelineRef.current = tl;

        const startPos = scrollOffsetRef.current;
        const SLOT = slotSizeRef.current;
        tl.to(scrollOffsetRef, {
          current: startPos + SLOT * 5,
          duration: 0.25,
          ease: "power3.in",
          onUpdate: () => {
            const progress = (scrollOffsetRef.current - startPos) / (SLOT * 5);
            if (progress > 0.3) {
              isScrollingRef.current = true;
              liveSelectActiveRef.current = true;
            }
          },
        });

        tl.to(scrollOffsetRef, {
          current: startPos + SLOT * (5 + 18),
          duration: highSpeedDuration,
          ease: "none",
        });

        const targetIndex = Math.floor(Math.random() * Math.max(1, total));
        const currentPos = startPos + SLOT * (5 + 18);
        const currentItemIdx = Math.floor(currentPos / SLOT);
        const loops = 5;
        const targetItemIdx =
          currentItemIdx + loops * total + ((targetIndex - (currentItemIdx % total) + total) % total);
        const finalPosition = targetItemIdx * SLOT;
        const overshootPx = 8 + Math.random() * 10;
        const overshootPosition = finalPosition + overshootPx;

        targetGlobalIndexRef.current = targetItemIdx;

        tl.to(scrollOffsetRef, {
          current: overshootPosition,
          duration: 4.5,
          ease: "expo.out",
          onStart: () => {
            selectedGlowActiveRef.current = true;
          },
          onUpdate: () => {
            const SLOT = slotSizeRef.current;
            const currentCenterGlobal = Math.floor(scrollOffsetRef.current / SLOT);
            const target = targetGlobalIndexRef.current ?? 0;
            const diff = target - currentCenterGlobal;

            let newFocus = countdownFocusGlobalIndexRef.current;
            if (diff <= 3 && diff > 2) newFocus = target - 3;
            else if (diff <= 2 && diff > 1) newFocus = target - 2;
            else if (diff <= 1 && diff > 0) newFocus = target - 1;
            else if (diff <= 0) newFocus = target;

            if (newFocus !== null && newFocus !== countdownFocusGlobalIndexRef.current) {
              countdownFocusGlobalIndexRef.current = newFocus;
              liveSelectActiveRef.current = false;
              inFinalSnapRef.current = true;
              forceUpdate((n) => n + 1);
            }
          },
        });

        tl.to(scrollOffsetRef, {
          current: finalPosition,
          duration: 0.6,
          ease: "back.out(1.3)",
          onComplete: () => {
            scrollOffsetRef.current = finalPosition;
            stoppedRef.current = true;
            isScrollingRef.current = false;
            setCenterIndex(targetIndex);
            winnerScaleRef.current = 1.5;
            clearCountdown();
            inFinalSnapRef.current = false;
            forceUpdate((n) => n + 1);
          },
        });
      },
    }));

    const SLOT = slotSizeRef.current;
    const centerItemIdxRaw = scrollOffsetRef.current / SLOT;
    const base = Math.floor(centerItemIdxRaw);
    let frac = centerItemIdxRaw - base;
    if (Math.abs(frac) < 1e-4) frac = 0;

    const VISIBLE_SLOTS = visibleCountRef.current;
    const OVERSCAN = 2;
    const TOTAL_SLOTS = VISIBLE_SLOTS + OVERSCAN * 2;

    const slots = [] as Array<{
      item: GachaItem;
      x: number;
      scale: number;
      glowSize: number;
      spinClass: string;
      key: string;
    }>;
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const k = i - (Math.floor(VISIBLE_SLOTS / 2) + OVERSCAN);
      const itemIdx = base + k;
      const itemIndex = ((itemIdx % total) + total) % total;
      const item = items[itemIndex];

      const x = k * SLOT - frac * SLOT;

      const EPS = Math.max(0.1, SLOT * 0.001);
      const isCenterSlot = Math.abs(x) <= EPS;
      const baseScale = 1;
      const currentBaseIndex = Math.floor(scrollOffsetRef.current / SLOT);
      const thisGlobalIndex = base + (i - (Math.floor(VISIBLE_SLOTS / 2) + OVERSCAN));
      const isWinnerItem = targetGlobalIndexRef.current !== null && thisGlobalIndex === targetGlobalIndexRef.current;
      const winnerGlowActive = selectedGlowActiveRef.current && isWinnerItem;
      const isCountdownFocus = inFinalSnapRef.current && countdownFocusGlobalIndexRef.current !== null && thisGlobalIndex === countdownFocusGlobalIndexRef.current;

      const shouldMagnifyFinal = stoppedRef.current && isCenterSlot && isWinnerItem;
      const FOCUS_SCALE = 1.4;
      const LIVE_SCROLL_SCALE = 1.4;
      
      const leftOneSlotX = -1 * SLOT;
      const leftOneEPS = SLOT * 0.6;
      const isLeftOneSlot = Math.abs(x - leftOneSlotX) <= leftOneEPS;
      
      const isInDecelerationPhase = selectedGlowActiveRef.current && !inFinalSnapRef.current;
      const shouldShowLeftOneMagnify = isScrollingRef.current && (liveSelectActiveRef.current || isInDecelerationPhase) && isLeftOneSlot;
      
      let scale = 1;
      if (shouldMagnifyFinal) {
        scale = FOCUS_SCALE;
      } else if (isCountdownFocus) {
        scale = FOCUS_SCALE;
      } else if (shouldShowLeftOneMagnify) {
        scale = LIVE_SCROLL_SCALE;
      }
      
      let glowSize = 50;
      if (shouldMagnifyFinal || isCountdownFocus) {
        glowSize = 85;
      } else if (shouldShowLeftOneMagnify) {
        glowSize = 100;
      }

      const spinClass =
        item.accent === "gold"
          ? "bg-spin-blur-E4AE33"
          : "bg-spin-blur-829DBB";

      slots.push({
        item,
        x,
        scale,
        glowSize,
        spinClass,
        key: `slot-${i}`,
      });
    }

    return (
      <div className="flex flex-col w-screen relative left-1/2 -translate-x-1/2">
        <div className="relative w-full" style={{ height: 250 }}>
          <div
            ref={containerRef}
            className="flex absolute inset-0 justify-center items-center overflow-hidden"
          >
            <div className="flex relative w-full h-full">
              {slots.map((slot) => (
                <div
                  key={slot.key}
                  className="flex absolute items-center justify-center will-change-transform"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: SLOT,
                    height: SLOT,
                    minWidth: SLOT,
                    minHeight: SLOT,
                    maxWidth: SLOT,
                    maxHeight: SLOT,
                    transform: `translate(-50%, -50%) translateX(${slot.x}px) scale(${slot.scale})`,
                  }}
                >
                  <div
                    className={`flex absolute aspect-square bg-center bg-contain bg-no-repeat ${slot.spinClass}`}
                    style={{
                      width: `${slot.glowSize}%`,
                      height: `${slot.glowSize}%`,
                    }}
                  />

                  <div
                    className="flex relative w-[55%] h-[55%]"
                  >
                    <img
                      alt={slot.item.name}
                      src={slot.item.image}
                      className="product-image"
                      style={{
                        position: "absolute",
                        height: "100%",
                        width: "100%",
                        inset: 0,
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <div
                    className="flex absolute flex-col items-center bg-gray-700/40 px-2 rounded-md transition-opacity duration-200 opacity-0 hover:opacity-100"
                    style={{
                      transform: "translate(0px, 78px)",
                      maxWidth: SLOT,
                    }}
                  >
                    <p className="text-white font-black text-base whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
                      {slot.item.name}
                    </p>
                    <p className="text-white font-black text-base">
                      {slot.item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {centerIndex !== null && items[centerIndex] && (
          <div className="mt-4 text-center text-white font-bold">
            中奖：{items[centerIndex].name}
          </div>
        )}
      </div>
    );
  }
);

GachaWheel.displayName = "GachaWheel";

export default GachaWheel;

