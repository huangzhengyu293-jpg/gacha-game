"use client";

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import gsap from "gsap";

if (typeof window !== 'undefined') {
  gsap.config({ 
    force3D: true,
    nullTargetWarn: false,
  });
  gsap.ticker.lagSmoothing(0);
}

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
  bounceDirection?: 'auto' | 'left' | 'right';
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
  ({ items = DEFAULT_ITEMS, highSpeedDuration = 0.62, bounceDirection = 'auto' }, ref) => {
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
  const currentBounceDirectionRef = useRef<'left' | 'right'>('right');
  const lastStepTimeRef = useRef(0);
  const currentStepIdxRef = useRef(-1);
  const stepIntervalRef = useRef(0.20)
  const stepStartTimeRef = useRef<number | null>(null);
  const stepTimesRef = useRef<number[] | null>(null);
  const nextStepIdxRef = useRef<number>(0);
  const countdownWindowStartedRef = useRef(false);

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
        isScrollingRef.current = false;
        lastStepTimeRef.current = -1e9;
        currentStepIdxRef.current = -1;
        stepStartTimeRef.current = null;
        stepTimesRef.current = null;
        nextStepIdxRef.current = 0;
        countdownWindowStartedRef.current = false;

        const SLOT = slotSizeRef.current;
        const MAX_SPEED = SLOT * 30;
        const velObj = { v: velocityRef.current } as { v: number };
        gsap.to(velObj, {
          v: MAX_SPEED,
          duration: 0.23,
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
          duration: 0.2,
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
        lastStepTimeRef.current = -1e9;
        currentStepIdxRef.current = -1;
        stepStartTimeRef.current = null;
        stepTimesRef.current = null;
        nextStepIdxRef.current = 0;
        countdownWindowStartedRef.current = false;

        const tl = gsap.timeline({ onUpdate: () => forceUpdate((n) => n + 1) });
        timelineRef.current = tl;

        const startPos = scrollOffsetRef.current;
        const SLOT = slotSizeRef.current;
        
        // 快速模式：0.35s 加速 + 0.5s 高速匀速
        tl.to(scrollOffsetRef, {
          current: startPos + SLOT * 8,
          duration: 0.23,
          ease: "power3.in",
          onUpdate: () => {
            const progress = (scrollOffsetRef.current - startPos) / (SLOT * 8);
            if (progress > 0.3) isScrollingRef.current = true;
          },
        });

        tl.to(scrollOffsetRef, {
          current: scrollOffsetRef.current + SLOT * 24,
          duration: 0.33,
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
            targetGlobalIndexRef.current = targetItemIdx;

            // 按方向决定超/欠冲方向，并记录当前方向
            let shouldBounceFromRight = true;
            if (bounceDirection === 'left') shouldBounceFromRight = false;
            else if (bounceDirection === 'right') shouldBounceFromRight = true;
            else shouldBounceFromRight = Math.random() > 0.5;
            currentBounceDirectionRef.current = shouldBounceFromRight ? 'right' : 'left';

            const halfSlotFast = SLOT * 0.5;
            const withinHalfOffsetFast = Math.random() * halfSlotFast;
            const travelPosition = shouldBounceFromRight
              ? finalPosition + withinHalfOffsetFast + overshootPx
              : finalPosition - withinHalfOffsetFast - overshootPx;

            tl.to(scrollOffsetRef, {
              current: travelPosition,
              duration: 0.37,
              ease: "expo.out",
              onStart: () => {
                selectedGlowActiveRef.current = true;
              },
              onUpdate: function(this: gsap.core.Tween) {
                const SLOT = slotSizeRef.current;
                const centerFloat = scrollOffsetRef.current / SLOT;
                const target = targetGlobalIndexRef.current ?? 0;
                const diffFloat = target - centerFloat;
                const now = this.totalTime();
                const remain = this.totalDuration() - this.totalTime();

                if (!inFinalSnapRef.current) inFinalSnapRef.current = true;

                // 方向化：右→左更早选中奖品
                let intended = Math.max(0, Math.min(1, Math.floor(1 - diffFloat))); // 仅两步：-1, target
                if (diffFloat <= 0.6) intended = 2; // target
                const lead = currentBounceDirectionRef.current === 'right' ? 0.25 : 0.35;
                if (intended === 2 && remain > lead) intended = 1;

                // 速度化：右→左最后一步更快
                const base = Math.max(0.06, stepIntervalRef.current * 0.4);
                const faster = currentBounceDirectionRef.current === 'right' && intended === 2 ? base * 0.6 : base;
                if (now - lastStepTimeRef.current >= faster) {
                  const focus = intended === 0 ? target - 1 : target;
                  if (countdownFocusGlobalIndexRef.current !== focus) {
                    countdownFocusGlobalIndexRef.current = focus;
                    lastStepTimeRef.current = now;
                    liveSelectActiveRef.current = false;
                    forceUpdate((n) => n + 1);
                  }
                }
              },
            });

            // 高速情况下的回正更平滑：先接近再回正
            const approachOffset = SLOT * 0.12;
            const approachPos = shouldBounceFromRight
              ? finalPosition - approachOffset
              : finalPosition + approachOffset;

            tl.to(scrollOffsetRef, {
              current: approachPos,
              duration: 0.09,
              ease: "power1.out",
            });

            tl.to(scrollOffsetRef, {
              current: finalPosition,
              duration: 0.18,
              ease: "circ.out",
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
        lastStepTimeRef.current = -1e9;
        currentStepIdxRef.current = -1;
        stepStartTimeRef.current = null;
        stepTimesRef.current = null;
        nextStepIdxRef.current = 0;
        countdownWindowStartedRef.current = false;

        const tl = gsap.timeline({ onUpdate: () => forceUpdate((n) => n + 1) });
        timelineRef.current = tl;

        const startPos = scrollOffsetRef.current;
        const SLOT = slotSizeRef.current;

        const targetIndex = Math.floor(Math.random() * Math.max(1, total));
        const BRIDGE_DUR = 0.5;
        const v0 = Math.max(0, velocityRef.current);
        const minDist = SLOT * 16 //高速推进段：最少推进约6格（更慢）
        const maxDist = SLOT * 32
        const bridgeDist = Math.max(minDist, Math.min(maxDist, v0 * BRIDGE_DUR));
        const currentPos = scrollOffsetRef.current + bridgeDist;
        const currentItemIdx = Math.floor(currentPos / SLOT);
        const loops = 5;
        const targetItemIdx =
          currentItemIdx + loops * total + ((targetIndex - (currentItemIdx % total) + total) % total);
        const finalPosition = targetItemIdx * SLOT;
        let shouldBounceFromRight = true;
        if (bounceDirection === 'left') shouldBounceFromRight = false;
        else if (bounceDirection === 'right') shouldBounceFromRight = true;
        else shouldBounceFromRight = Math.random() > 0.5;
        
        targetGlobalIndexRef.current = targetItemIdx;
        const halfSlot = SLOT * 0.5;
        const extraBounce = 10 + Math.random() * 20;

        if (shouldBounceFromRight) {
          currentBounceDirectionRef.current = 'right';
          const withinHalfOffset = Math.random() * halfSlot; // 半个卡片宽度以内
          const overshootPosition = finalPosition + withinHalfOffset + extraBounce;

          // 高速→减速过渡桥（0.5s 匀速，高速保持连续）
          tl.to(scrollOffsetRef, {
            current: scrollOffsetRef.current + bridgeDist,
            duration: BRIDGE_DUR,
            ease: "none",
            onStart: () => { isScrollingRef.current = true; },
          });

          tl.to(scrollOffsetRef, {
            current: overshootPosition,
            duration: 4.5,
            ease: "expo.out",
            onStart: () => {
              selectedGlowActiveRef.current = true;
              // 预排均匀节拍（最后一步与前面相同，整体稍放慢）
              const lastStepLead = 0.85; // 回正前 0.85s 选中奖品
              const stepInterval = 0.16; // 每步间隔（稍慢一点点）
              const steps = 6; // -5,-4,-3,-2,-1, target
              const tweenDur = 4.5;
              const times: number[] = [];
              for (let i = 0; i < steps; i++) {
                const remainAtStep = lastStepLead + (steps - 1 - i) * stepInterval;
                const t = Math.max(0, tweenDur - remainAtStep);
                times.push(t);
              }
              stepTimesRef.current = times;
              nextStepIdxRef.current = 0;
              lastStepTimeRef.current = -1e9;
              currentStepIdxRef.current = -1;
              stepStartTimeRef.current = null;
            },
            onUpdate: function(this: gsap.core.Tween) {
              const SLOT = slotSizeRef.current;
              const centerFloat = scrollOffsetRef.current / SLOT;
              const target = targetGlobalIndexRef.current ?? 0;
              const diffFloat = target - centerFloat;
              const now = this.totalTime();
              const remain = this.totalDuration() - this.totalTime();

              if (!inFinalSnapRef.current) inFinalSnapRef.current = true;

              // 基于位置的逐格推进：diff 从 8→0 递减
              let intended = Math.max(0, Math.min(7, Math.floor(8 - diffFloat)));
              if (diffFloat <= 0.6) intended = 8; // 奖品
              // 奖品步在回正前 lead 秒内才允许触发（左→右更早）
              const lead = currentBounceDirectionRef.current === 'left' ? 1.5 : 1.0;
              if (intended === 8 && remain > lead) intended = 7;

              if (intended > currentStepIdxRef.current) {
                // 控制最小步进间隔，防止过快连跳
                if (now - lastStepTimeRef.current >= Math.max(0.08, stepIntervalRef.current * 0.6)) {
                  countdownFocusGlobalIndexRef.current = (target - 8) + intended;
                  currentStepIdxRef.current = intended;
                  lastStepTimeRef.current = now;
                  liveSelectActiveRef.current = false;
                  forceUpdate((n) => n + 1);
                }
              }
            },
            onComplete: () => {
              const target = targetGlobalIndexRef.current ?? null;
              if (target !== null) {
                countdownFocusGlobalIndexRef.current = target;
                inFinalSnapRef.current = true;
                forceUpdate((n) => n + 1);
              }
            },
          });

          tl.to(scrollOffsetRef, {
            current: finalPosition,
            duration: 0.2,
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
        } else {
          currentBounceDirectionRef.current = 'left';
          const withinHalfOffsetL = Math.random() * halfSlot; // 半个卡片宽度以内
          const undershootPosition = finalPosition - withinHalfOffsetL - extraBounce;

          // 高速→减速过渡桥（0.5s 匀速，高速保持连续）
          tl.to(scrollOffsetRef, {
            current: scrollOffsetRef.current + bridgeDist,
            duration: BRIDGE_DUR,
            ease: "none",
            onStart: () => { isScrollingRef.current = true; },
          });

          tl.to(scrollOffsetRef, {
            current: undershootPosition,
            duration: 4.5,
            ease: "expo.out",
            onStart: () => {
              selectedGlowActiveRef.current = true;
              lastStepTimeRef.current = -1e9;
              currentStepIdxRef.current = -1;
              stepStartTimeRef.current = null;
            },
            onUpdate: function(this: gsap.core.Tween) {
              const SLOT = slotSizeRef.current;
              const centerFloat = scrollOffsetRef.current / SLOT;
              const target = targetGlobalIndexRef.current ?? 0;
              const diffFloat = target - centerFloat;
              const now = this.totalTime();
              const remain = this.totalDuration() - this.totalTime();

              if (!inFinalSnapRef.current) inFinalSnapRef.current = true;

              let intended = Math.max(0, Math.min(7, Math.floor(8 - diffFloat)));
              if (diffFloat <= 0.6) intended = 8;
              const lead = currentBounceDirectionRef.current === 'left' ? 1.5 : 1.0;
              if (intended === 8 && remain > lead) intended = 7;

              if (intended > currentStepIdxRef.current) {
                if (now - lastStepTimeRef.current >= Math.max(0.08, stepIntervalRef.current * 0.6)) {
                  countdownFocusGlobalIndexRef.current = (target - 8) + intended;
                  currentStepIdxRef.current = intended;
                  lastStepTimeRef.current = now;
                  liveSelectActiveRef.current = false;
                  forceUpdate((n) => n + 1);
                }
              }
            },
            onComplete: () => {
              const target = targetGlobalIndexRef.current ?? null;
              if (target !== null) {
                countdownFocusGlobalIndexRef.current = target;
                inFinalSnapRef.current = true;
                forceUpdate((n) => n + 1);
              }
            },
          });

          tl.to(scrollOffsetRef, {
            current: finalPosition,
            duration: 0.2,
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
        }
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
      showInfo: boolean;
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
      
      let scale = 1;
      if (shouldMagnifyFinal) {
        scale = FOCUS_SCALE;
      } else if (isCountdownFocus) {
        scale = FOCUS_SCALE;
      }
      
      let glowSize = 50;
      if (shouldMagnifyFinal || isCountdownFocus) {
        glowSize = 85;
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
        showInfo: shouldMagnifyFinal,
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
                    className={`flex absolute flex-col items-center bg-gray-700/40 px-2 py-1 mx-2 rounded-md transition-opacity duration-200 ${
                      slot.showInfo ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                    }`}
                    style={{
                      transform: "translate(0px, 65px)",
                      maxWidth: SLOT - 16,
                    }}
                  >
                    <p className="text-white font-bold text-xs whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
                      {slot.item.name}
                    </p>
                    <p className="text-white font-bold text-xs">
                      {slot.item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      
      </div>
    );
  }
);

GachaWheel.displayName = "GachaWheel";

export default GachaWheel;

