"use client";

import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import gsap from "gsap";
import type { SlotMachineProps, SlotMachineHandle } from "./SlotMachine.types";
import { useSlotMachineAnimation } from "./hooks/useSlotMachineAnimation";
import SlotMachineColumn from "./components/SlotMachineColumn";

if (typeof window !== "undefined") {
  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });
  gsap.ticker.lagSmoothing(0);
}

const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(
  (
    {
      columns,
      stopIds,
      stopPositions,
      itemHeight = 150,
      visibleItems = 3,
      duration = 3,
      showGuidelines = true,
      onComplete,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
    const imageItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const isAnimatingRef = useRef(false);
    const initialOffsetsRef = useRef<number[]>([]);
    const currentPositionsRef = useRef<number[]>([]);
    const columnSpeedsRef = useRef<Map<number, number>>(new Map());
    const scaledItemsRef = useRef<Map<string, boolean>>(new Map());
    const selectedItemsRef = useRef<Map<number, import("./SlotMachine.types").SlotMachineItem | null>>(
      new Map()
    );
    const lastPlayedItemRef = useRef<Map<number, number>>(new Map());
    const lastSoundTimeRef = useRef<Map<number, number>>(new Map());

    // 初始化列引用数组
    useEffect(() => {
      scrollRefs.current = scrollRefs.current.slice(0, columns.length);
      currentPositionsRef.current = new Array(columns.length).fill(0);
      lastPlayedItemRef.current.clear();
      scaledItemsRef.current.clear();
    }, [columns.length]);

    // 为每列设置初始随机偏移量
    useEffect(() => {
      if (columns.length > 0 && initialOffsetsRef.current.length === 0) {
        initialOffsetsRef.current = columns.map(
          () => (Math.random() - 0.5) * itemHeight * 0.5
        );
        currentPositionsRef.current = initialOffsetsRef.current.map(
          (offset) => offset
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns.length, itemHeight]);

    const { start, reset } = useSlotMachineAnimation({
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
    });

    const handleReset = () => {
      reset(initialOffsetsRef);
    };

    useImperativeHandle(ref, () => ({
      start,
      reset: handleReset,
    }));

    // 组件卸载时清理
    useEffect(() => {
      return () => {
        if (timelineRef.current) {
          timelineRef.current.kill();
        }
      };
    }, []);

    const viewportHeight = itemHeight * visibleItems;

    return (
      <div
        ref={containerRef}
        className="w-full relative"
        style={{
          minHeight: viewportHeight,
          padding: "24px 0",
        }}
      >
        <div className="flex gap-0 md:gap-2 justify-center items-center relative">
          {columns.map((columnItems, colIndex) => {
            const selectedItem = selectedItemsRef.current.get(colIndex) || null;

            return (
              <SlotMachineColumn
                key={colIndex}
                colIndex={colIndex}
                columnItems={columnItems}
                itemHeight={itemHeight}
                viewportHeight={viewportHeight}
                showGuidelines={showGuidelines}
                initialOffset={initialOffsetsRef.current[colIndex] || 0}
                scrollRef={(el) => {
                  scrollRefs.current[colIndex] = el;
                }}
                imageItemRef={(itemKey, el) => {
                  if (el) {
                    imageItemRefs.current.set(itemKey, el);
                  } else {
                    imageItemRefs.current.delete(itemKey);
                  }
                }}
                selectedItem={selectedItem}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

SlotMachine.displayName = "SlotMachine";

export default SlotMachine;
export type { SlotMachineItem, SlotMachineHandle } from "./SlotMachine.types";

