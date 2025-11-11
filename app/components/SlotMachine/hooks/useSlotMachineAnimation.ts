import { useRef, useCallback } from 'react';
import gsap from 'gsap';
import type { SlotMachineItem, ColumnConfig } from '../SlotMachine.types';
import { calculateStopPositions, calculateColumnConfigs, calculateItemSpacing, GAP_SIZE } from '../utils/slotMachineUtils';
import { useSlotMachineAudio } from './useSlotMachineAudio';

interface UseSlotMachineAnimationProps {
  columns: SlotMachineItem[][];
  stopIds?: string[];
  stopPositions?: number[];
  itemHeight: number;
  visibleItems: number;
  onComplete?: () => void;
  scrollRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  imageItemRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  currentPositionsRef: React.MutableRefObject<number[]>;
  columnSpeedsRef: React.MutableRefObject<Map<number, number>>;
  scaledItemsRef: React.MutableRefObject<Map<string, boolean>>;
  selectedItemsRef: React.MutableRefObject<Map<number, SlotMachineItem | null>>;
  lastPlayedItemRef: React.MutableRefObject<Map<number, number>>;
  lastSoundTimeRef: React.MutableRefObject<Map<number, number>>;
  isAnimatingRef: React.MutableRefObject<boolean>;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
}

export function useSlotMachineAnimation({
  columns,
  stopIds,
  stopPositions,
  itemHeight,
  visibleItems,
  onComplete,
  scrollRefs,
  imageItemRefs,
  currentPositionsRef,
  columnSpeedsRef,
  scaledItemsRef,
  selectedItemsRef,
  lastPlayedItemRef,
  lastSoundTimeRef,
  isAnimatingRef,
  timelineRef,
}: UseSlotMachineAnimationProps) {
  const { playTickSound, playWinSound, stopWinSound } = useSlotMachineAudio();

  const createTimelineUpdateHandler = useCallback((
    columnConfigs: ColumnConfig[],
    viewportHeight: number,
    centerLineY: number
  ) => {
    const itemSpacing = calculateItemSpacing(itemHeight);

    return () => {
      // 计算每列的当前速度
      scrollRefs.current.forEach((scrollEl, colIndex) => {
        if (!scrollEl) return;
        const currentY = (gsap.getProperty(scrollEl, "y") as number) || 0;
        const prevY = currentPositionsRef.current[colIndex] || 0;
        const speed = Math.abs(currentY - prevY);
        columnSpeedsRef.current.set(colIndex, speed);
        currentPositionsRef.current[colIndex] = currentY;
      });

      // 找到最快的列
      let fastestColIndex = -1;
      let fastestSpeed = 0;
      columnSpeedsRef.current.forEach((speed, colIndex) => {
        if (speed > fastestSpeed) {
          fastestSpeed = speed;
          fastestColIndex = colIndex;
        }
      });

      // 检测每列图片是否经过标线位置，播放音效和放大动画
      scrollRefs.current.forEach((scrollEl, colIndex) => {
        if (!scrollEl) return;
        const columnItems = columns[colIndex];
        if (!columnItems || columnItems.length === 0) return;

        const currentY = (gsap.getProperty(scrollEl, "y") as number) || 0;
        const totalItems = columnItems.length;
        const scrollTop = -currentY;
        const relativeY = scrollTop + centerLineY;
        const currentItemIndex = Math.floor(relativeY / itemSpacing);

        // 检查所有图片，看哪些在标线附近，哪些不在
        imageItemRefs.current.forEach((imageItem, itemKey) => {
          if (!itemKey.startsWith(`${colIndex}-`)) return;

          const imgIndex = parseInt(itemKey.split('-')[1]);
          const itemTop = imgIndex * itemSpacing;
          const itemCenter = itemTop + itemHeight / 2;
          const distanceFromLine = Math.abs(itemCenter - relativeY);
          const isAtLine = distanceFromLine < itemHeight / 2;

          const isScaled = scaledItemsRef.current.get(itemKey) || false;

          if (isAtLine && !isScaled) {
            gsap.to(imageItem, {
              scale: 2,
              duration: 0.2,
              ease: "power2.out",
            });
            scaledItemsRef.current.set(itemKey, true);
          } else if (!isAtLine && isScaled) {
            gsap.to(imageItem, {
              scale: 1,
              duration: 0.2,
              ease: "power2.out",
            });
            scaledItemsRef.current.set(itemKey, false);
          }
        });

        // 检查是否是新图片经过标线
        const lastPlayedIndex = lastPlayedItemRef.current.get(colIndex) ?? -1;
        const normalizedIndex = currentItemIndex % totalItems;

        if (normalizedIndex !== lastPlayedIndex && currentItemIndex >= 0) {
          const itemTop = currentItemIndex * itemSpacing;
          const itemCenter = itemTop + itemHeight / 2;
          const distanceFromLine = Math.abs(itemCenter - relativeY);

          if (distanceFromLine < itemHeight / 2) {
            if (colIndex === fastestColIndex) {
              const now = Date.now();
              const lastSoundTime = lastSoundTimeRef.current.get(colIndex) || 0;
              const timeSinceLastSound = now - lastSoundTime;
              const minInterval = 150;

              if (timeSinceLastSound >= minInterval) {
                lastPlayedItemRef.current.set(colIndex, normalizedIndex);
                lastSoundTimeRef.current.set(colIndex, now);
                playTickSound();
              } else {
                lastPlayedItemRef.current.set(colIndex, normalizedIndex);
              }
            } else {
              lastPlayedItemRef.current.set(colIndex, normalizedIndex);
            }
          }
        }
      });
    };
  }, [columns, itemHeight, scrollRefs, imageItemRefs, currentPositionsRef, columnSpeedsRef, scaledItemsRef, lastPlayedItemRef, lastSoundTimeRef, playTickSound]);

  const start = useCallback((overrideStopIds?: string[]) => {
    if (isAnimatingRef.current) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    isAnimatingRef.current = true;

    lastSoundTimeRef.current.clear();
    scaledItemsRef.current.clear();
    selectedItemsRef.current.clear();
    columnSpeedsRef.current.clear();

    scrollRefs.current.forEach((scrollEl, index) => {
      if (scrollEl) {
        const currentY = (gsap.getProperty(scrollEl, "y") as number) || 0;
        currentPositionsRef.current[index] = currentY;
      }
    });

    let calculatedStopPositions: number[];
    try {
      calculatedStopPositions = calculateStopPositions(
        columns,
        overrideStopIds || stopIds,
        stopPositions
      );
    } catch (error) {
      console.warn(error);
      isAnimatingRef.current = false;
      return;
    }

    const viewportHeight = itemHeight * visibleItems;
    const centerLineY = viewportHeight / 2;
    const columnConfigs = calculateColumnConfigs(
      columns,
      calculatedStopPositions,
      itemHeight,
      visibleItems
    );

    const timeline = gsap.timeline({
      onUpdate: createTimelineUpdateHandler(columnConfigs, viewportHeight, centerLineY),
      onComplete: () => {
        isAnimatingRef.current = false;
        if (onComplete) onComplete();
      },
    });

    timelineRef.current = timeline;

    const totalScrollDuration = 3.0;
    const itemSpacing = calculateItemSpacing(itemHeight);

    // 阶段1：快速滚动
    scrollRefs.current.forEach((scrollEl, colIndex) => {
      if (!scrollEl) return;
      const columnItems = columns[colIndex];
      if (!columnItems || columnItems.length === 0) return;

      const stopIndex = calculatedStopPositions[colIndex];
      if (stopIndex < 0 || stopIndex >= columnItems.length) return;

      const config = columnConfigs[colIndex];
      const easingOptions = ["power2.out", "power3.out", "power4.out", "sine.out"];
      const easing = easingOptions[colIndex % easingOptions.length];

      timeline.to(
        scrollEl,
        {
          y: config.scrollTargetPosition * 0.85 + config.finalPosition * 0.15,
          duration: totalScrollDuration * 0.85,
          ease: easing,
        },
        colIndex * 0.1
      );
    });

    // 阶段2：快速结束
    scrollRefs.current.forEach((scrollEl, colIndex) => {
      if (!scrollEl) return;
      const config = columnConfigs[colIndex];
      timeline.to(
        scrollEl,
        {
          y: config.finalPosition,
          duration: totalScrollDuration * 0.15,
          ease: "power1.out",
        },
        `>-${totalScrollDuration * 0.1}`
      );
    });

    // 阶段3：回弹对齐
    const bounceDuration = 1.2;
    const bounceStartTime = timeline.duration();

    scrollRefs.current.forEach((scrollEl, colIndex) => {
      if (!scrollEl) return;

      const config = columnConfigs[colIndex];
      const columnItems = columns[colIndex];
      const totalItems = columnItems.length;
      const repeatCount = Math.max(15, Math.ceil(500 / totalItems));
      const middleRepeat = Math.floor(repeatCount / 2);
      const selectedItemIndex = middleRepeat * totalItems + config.stopIndex;
      const selectedItemKey = `${colIndex}-${selectedItemIndex}`;
      const selectedImageItem = imageItemRefs.current.get(selectedItemKey);

      timeline.to(
        scrollEl,
        {
          y: config.alignedPosition,
          duration: bounceDuration,
          ease: "elastic.out(1, 0.3)",
          onStart: () => {
            if (colIndex === 0) {
              playWinSound(bounceDuration);
            }
          },
          onComplete: () => {
            if (config.stopItem) {
              selectedItemsRef.current.set(colIndex, config.stopItem);
            }
            if (selectedImageItem) {
              scaledItemsRef.current.set(selectedItemKey, true);
            }
            if (colIndex === columns.length - 1) {
              stopWinSound();
            }
          },
        },
        bounceStartTime
      );
    });
  }, [
    columns,
    stopIds,
    stopPositions,
    itemHeight,
    visibleItems,
    onComplete,
    scrollRefs,
    imageItemRefs,
    currentPositionsRef,
    columnSpeedsRef,
    scaledItemsRef,
    selectedItemsRef,
    lastPlayedItemRef,
    lastSoundTimeRef,
    isAnimatingRef,
    timelineRef,
    createTimelineUpdateHandler,
    playTickSound,
    playWinSound,
    stopWinSound,
  ]);

  const reset = useCallback((initialOffsetsRef: React.MutableRefObject<number[]>) => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    isAnimatingRef.current = false;

    scrollRefs.current.forEach((scrollEl, index) => {
      if (scrollEl) {
        const initialOffset = initialOffsetsRef.current[index] || 0;
        gsap.set(scrollEl, {
          y: initialOffset,
          clearProps: "all",
        });
        currentPositionsRef.current[index] = initialOffset;
      }
    });
  }, [scrollRefs, currentPositionsRef, isAnimatingRef, timelineRef]);

  return { start, reset };
}

