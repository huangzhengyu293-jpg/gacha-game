"use client";

import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import gsap from "gsap";

if (typeof window !== "undefined") {
  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });
  gsap.ticker.lagSmoothing(0);
}

// 数据项接口
export interface SlotMachineItem {
  id: string; // 唯一标识符
  name: string; // 名称
  price: string; // 价格
  image: string; // 图片URL
}

interface SlotMachineProps {
  columns: SlotMachineItem[][]; // 二维数组，每个内部数组包含该列的数据项
  stopIds?: string[]; // 数组，每个元素表示对应列应该停止的id（可选，如果提供则使用id停止）
  stopPositions?: number[]; // 数组，每个元素表示对应列应该停止的位置索引（可选，如果stopIds未提供则使用）
  itemHeight?: number; // 每个项目的高度（像素）
  visibleItems?: number; // 同时可见的项目数量
  duration?: number; // 动画持续时间（秒）
  onComplete?: () => void; // 动画完成时的回调函数
}

export interface SlotMachineHandle {
  start: (stopIds?: string[]) => void; // 开始老虎机动画，可选的stopIds参数
  reset: () => void; // 重置到初始状态
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
      onComplete,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
    const imageItemRefs = useRef<Map<string, HTMLDivElement>>(new Map()); // 图片元素引用，用于放大动画
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const isAnimatingRef = useRef(false);
    const initialOffsetsRef = useRef<number[]>([]);
    const currentPositionsRef = useRef<number[]>([]); // 跟踪当前位置，用于循环
    const audioRef = useRef<HTMLAudioElement | null>(null); // 滚动音效引用
    const winAudioRef = useRef<HTMLAudioElement | null>(null); // 结束音效引用
    const lastPlayedItemRef = useRef<Map<number, number>>(new Map()); // 跟踪每列最后播放音效的图片索引
    const lastSoundTimeRef = useRef<Map<number, number>>(new Map()); // 跟踪每列最后播放音效的时间，用于节流
    const scaledItemsRef = useRef<Map<string, boolean>>(new Map()); // 跟踪哪些图片当前处于放大状态
    const selectedItemsRef = useRef<Map<number, SlotMachineItem | null>>(new Map()); // 跟踪每列当前选中的项
    const columnSpeedsRef = useRef<Map<number, number>>(new Map()); // 跟踪每列的滚动速度

    const centralIcon = (
      <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.00255 0.739429L12.1147 6.01823C13.4213 6.77519 13.4499 8.65172 12.1668 9.44808L3.05473 15.1039C1.72243 15.9309 0 14.9727 0 13.4047V2.47C0 0.929093 1.66922 -0.0329925 3.00255 0.739429Z"
          fill="currentColor"
        ></path>
      </svg>
    );
    const starIcon = (
      <div className="hidden sm:flex absolute justify-center items-center size-[32px] bg-gradient-to-br from-[#99A6B4] to-[#42484E] rounded-full">
        <div className="flex justify-center items-center size-[28px] bg-gray-650 rounded-full overflow-clip">
          <div className="size-3 text-gray-400">
            <svg
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.1806 0.652964C9.50276 -0.217654 10.7342 -0.217655 11.0563 0.652963L13.2 6.44613C13.3013 6.71985 13.5171 6.93566 13.7908 7.03694L19.584 9.1806C20.4546 9.50276 20.4546 10.7342 19.584 11.0563L13.7908 13.2C13.5171 13.3013 13.3013 13.5171 13.2 13.7908L11.0563 19.584C10.7342 20.4546 9.50276 20.4546 9.1806 19.584L7.03694 13.7908C6.93566 13.5171 6.71985 13.3013 6.44613 13.2L0.652964 11.0563C-0.217654 10.7342 -0.217655 9.50276 0.652963 9.1806L6.44613 7.03694C6.71985 6.93566 6.93566 6.71985 7.03694 6.44613L9.1806 0.652964Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    );
    // 初始化音效
    useEffect(() => {
      if (typeof window !== "undefined") {
        audioRef.current = new Audio("/tick.mp3");
        audioRef.current.volume = 0.65;
        audioRef.current.preload = "auto";
        
        winAudioRef.current = new Audio("/basic_win.mp3");
        winAudioRef.current.volume = 0.5;
        winAudioRef.current.preload = "auto";
      }
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (winAudioRef.current) {
          winAudioRef.current.pause();
          winAudioRef.current = null;
        }
      };
    }, []);

      // 初始化列引用数组
    useEffect(() => {
      columnRefs.current = columnRefs.current.slice(0, columns.length);
      scrollRefs.current = scrollRefs.current.slice(0, columns.length);
      currentPositionsRef.current = new Array(columns.length).fill(0);
      lastPlayedItemRef.current.clear();
      scaledItemsRef.current.clear();
    }, [columns.length]);

    // 为每列设置初始随机偏移量，以创建不一致效果
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

    const reset = () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      isAnimatingRef.current = false;

      // 重置所有列到初始位置
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
    };

    const start = (overrideStopIds?: string[]) => {
      if (isAnimatingRef.current) return;

      // 停止任何现有动画
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      isAnimatingRef.current = true;
      
      // 重置音效时间跟踪和缩放状态
      lastSoundTimeRef.current.clear();
      scaledItemsRef.current.clear();
      selectedItemsRef.current.clear();
      columnSpeedsRef.current.clear();
      
      // 初始化当前位置
      scrollRefs.current.forEach((scrollEl, index) => {
        if (scrollEl) {
          const currentY = (gsap.getProperty(scrollEl, "y") as number) || 0;
          currentPositionsRef.current[index] = currentY;
        }
      });

      // 计算停止位置：优先使用overrideStopIds，然后是stopIds，最后是stopPositions
      const calculatedStopPositions: number[] = [];
      const idsToUse = overrideStopIds || stopIds;
      
      if (idsToUse && idsToUse.length > 0) {
        // 使用id查找位置
        columns.forEach((columnItems, colIndex) => {
          const stopId = idsToUse[colIndex];
          if (stopId) {
            const stopIndex = columnItems.findIndex(item => item.id === stopId);
            if (stopIndex >= 0) {
              calculatedStopPositions.push(stopIndex);
            } else {
              // 如果找不到，使用第一个
              calculatedStopPositions.push(0);
            }
          } else {
            calculatedStopPositions.push(0);
          }
        });
      } else if (stopPositions && stopPositions.length > 0) {
        calculatedStopPositions.push(...stopPositions);
      } else {
        console.warn("必须提供 stopIds 或 stopPositions");
        isAnimatingRef.current = false;
        return;
      }

      // 验证输入
      if (calculatedStopPositions.length !== columns.length) {
        console.warn("停止位置数量必须与 columns 长度匹配");
        isAnimatingRef.current = false;
        return;
      }

      const viewportHeight = itemHeight * visibleItems;
      const centerLineY = viewportHeight / 2; // 标线位置（中间）
      
      // 基础滚动速度概念：2000像素/秒（现在使用固定3秒总时间，此值仅作为参考）
      // const baseScrollSpeed = 2000; // 不再使用，保留作为概念参考
      
      const timeline = gsap.timeline({
        onUpdate: () => {
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

            // 计算当前在标线位置的图片索引
            // 标线在 viewportHeight / 2，需要找到哪个图片在这个位置
            // currentY 是负数（向上滚动），所以需要计算相对位置
            // 注意：由于使用了gap，每个item之间的实际距离是 itemHeight + 80px
            const gapSize = 80; // gap大小（增大到80px以容纳放大后的图片）
            const itemSpacing = itemHeight + gapSize; // 每个item占据的总空间（高度+间距）
            const scrollTop = -currentY; // 转换为正数
            const relativeY = scrollTop + centerLineY; // 标线相对于滚动容器的位置
            const currentItemIndex = Math.floor(relativeY / itemSpacing);

            // 检查所有图片，看哪些在标线附近，哪些不在
            // 遍历所有可见的图片项
            imageItemRefs.current.forEach((imageItem, itemKey) => {
              if (!itemKey.startsWith(`${colIndex}-`)) return;
              
              // 从itemKey中提取图片索引
              const imgIndex = parseInt(itemKey.split('-')[1]);
              const itemTop = imgIndex * itemSpacing; // 考虑gap的间距
              const itemCenter = itemTop + itemHeight / 2;
              const distanceFromLine = Math.abs(itemCenter - relativeY);
              const isAtLine = distanceFromLine < itemHeight / 2;
              
              const isScaled = scaledItemsRef.current.get(itemKey) || false;
              
              if (isAtLine && !isScaled) {
                // 图片到达标线，放大到160px (从80px放大，scale = 160/80 = 2)
                // gap已经增大到80px，不需要负margin
                gsap.to(imageItem, {
                  scale: 2, // 160/80 = 2
                  duration: 0.2,
                  ease: "power2.out",
                });
                scaledItemsRef.current.set(itemKey, true);
              } else if (!isAtLine && isScaled) {
                // 图片离开标线，缩小回80px
                gsap.to(imageItem, {
                  scale: 1,
                  duration: 0.2,
                  ease: "power2.out",
                });
                scaledItemsRef.current.set(itemKey, false);
              }
            });

            // 检查是否是新图片经过标线（使用模运算处理重复图片）
            const lastPlayedIndex = lastPlayedItemRef.current.get(colIndex) ?? -1;
            const normalizedIndex = currentItemIndex % totalItems;
            
            if (normalizedIndex !== lastPlayedIndex && currentItemIndex >= 0) {
              // 检查图片中心是否真的在标线附近
              const itemTop = currentItemIndex * itemSpacing; // 考虑gap的间距
              const itemCenter = itemTop + itemHeight / 2;
              const distanceFromLine = Math.abs(itemCenter - relativeY);
              
              if (distanceFromLine < itemHeight / 2) {
                // 只有最快的列在标线上时才播放音效
                if (colIndex === fastestColIndex) {
                  const now = Date.now();
                  const lastSoundTime = lastSoundTimeRef.current.get(colIndex) || 0;
                  const timeSinceLastSound = now - lastSoundTime;
                  
                  // 节流：确保音效之间有足够间隔（至少150ms），让音效更清晰
                  const minInterval = 150; // 最小间隔150ms
                  
                  if (timeSinceLastSound >= minInterval) {
                    lastPlayedItemRef.current.set(colIndex, normalizedIndex);
                    lastSoundTimeRef.current.set(colIndex, now);

                    // 播放音效
                    if (audioRef.current) {
                      try {
                        // 创建新的 Audio 实例以避免重叠播放问题
                        const tickAudio = new Audio("/tick.mp3");
                        tickAudio.volume = 0.65;
                        tickAudio.play().catch(() => {
                          // 忽略播放错误（可能是用户未交互）
                        });
                      } catch {
                        // 忽略错误
                      }
                    }
                  } else {
                    // 即使不播放音效，也更新索引以避免重复检测
                    lastPlayedItemRef.current.set(colIndex, normalizedIndex);
                  }
                } else {
                  // 非最快列也更新索引以避免重复检测
                  lastPlayedItemRef.current.set(colIndex, normalizedIndex);
                }
              }
            }
          });
        },
        onComplete: () => {
          isAnimatingRef.current = false;
          
          if (onComplete) onComplete();
        },
      });

      timelineRef.current = timeline;

      // 存储每列的计算位置以确保一致性
      const gapSize = 80; // gap大小（增大到80px以容纳放大后的图片）
      const itemSpacing = itemHeight + gapSize; // 每个item占据的总空间（高度+间距）
      
      const columnConfigs = columns.map((columnItems, colIndex) => {
        const stopIndex = calculatedStopPositions[colIndex];
        const totalItems = columnItems.length;
        const totalHeight = totalItems * itemSpacing; // 考虑gap的总高度

        // 计算精确对齐位置（回弹后的最终位置）
        // 最终位置需要让指定图片的中心对齐到标线位置（centerLineY）
        // 标线在 viewportHeight / 2，所以最终位置应该是让 stopIndex 图片的中心对齐到 centerLineY
        // 由于图片是重复的，需要计算在重复数组中的位置
        const targetItemCenterY = stopIndex * itemSpacing + itemHeight / 2; // 考虑gap的间距
        // 计算在重复数组中的位置（选择中间重复组）
        const repeatCount = Math.max(15, Math.ceil(500 / totalItems));
        const middleRepeat = Math.floor(repeatCount / 2);
        const targetPositionInRepeat = middleRepeat * totalHeight + targetItemCenterY;
        const alignedPosition = centerLineY - targetPositionInRepeat; // 回弹后的位置（图片中心对齐到标线）

        // 阶段3结束时的位置：让标线停在图片上方或下方足够远的位置，确保图片完全不在标线上（小图片状态）
        // 为每列生成不同的随机偏移量（上方或下方，距离各不相同，至少1.0倍itemHeight以上）
        const stopOffsetDirection = Math.random() > 0.5 ? 1 : -1; // 随机方向：上方或下方
        const stopOffset = stopOffsetDirection * (1.0 + Math.random() * 0.5) * itemHeight; // 随机距离1.0-1.5倍itemHeight，确保图片完全不在标线上
        const finalPosition = alignedPosition - stopOffset; // 阶段3结束时的位置（标线在图片上方或下方足够远，图片为小图片状态）

        // 添加偏移量以在滚动期间创建不一致效果
        // 偏移距离为图片高度的0.5倍
        const inconsistencyOffset = (Math.random() - 0.5) * itemHeight * 0.5;
        const scrollTargetPosition = finalPosition + inconsistencyOffset;

        return {
          finalPosition, // 阶段2结束时的位置（错开）
          alignedPosition, // 阶段3回弹后的精确对齐位置（所有列相同）
          scrollTargetPosition,
          totalItems,
          totalHeight,
          stopIndex,
          stopItem: columnItems[stopIndex], // 存储停止的项
        };
      });

      // 固定总滚动时间为3秒（不包括回弹）
      const totalScrollDuration = 3.0; // 3秒
      
      // 阶段1：快速滚动（85%时间 = 2.55秒）
      scrollRefs.current.forEach((scrollEl, colIndex) => {
        if (!scrollEl) return;

        const columnItems = columns[colIndex];
        if (!columnItems || columnItems.length === 0) return;

        const stopIndex = calculatedStopPositions[colIndex];
        if (stopIndex < 0 || stopIndex >= columnItems.length) return;

        const config = columnConfigs[colIndex];

        // 每列使用不同的缓动函数以增加视觉变化
        const easingOptions = [
          "power2.out",
          "power3.out",
          "power4.out",
          "sine.out",
        ];
        const easing = easingOptions[colIndex % easingOptions.length];

        // 快速滚动阶段 - 移动到接近目标位置（85%距离）
        timeline.to(
          scrollEl,
          {
            y: config.scrollTargetPosition * 0.85 + config.finalPosition * 0.15,
            duration: totalScrollDuration * 0.85, // 2.55秒
            ease: easing,
          },
          colIndex * 0.1 // 每列错开0.1秒
        );
      });

      // 阶段2：快速结束（15%时间 = 0.45秒）
      scrollRefs.current.forEach((scrollEl, colIndex) => {
        if (!scrollEl) return;

        const config = columnConfigs[colIndex];

        // 快速结束阶段 - 快速移动到最终位置
        timeline.to(
          scrollEl,
          {
            y: config.finalPosition,
            duration: totalScrollDuration * 0.15, // 0.45秒
            ease: "power1.out", // 快速结束，更利索
          },
          `>-${totalScrollDuration * 0.1}` // 与前一阶段重叠，确保流畅过渡
        );
      });

      // 阶段3：回弹对齐 - 所有列精确对齐到标线位置（从错开位置对齐到同一行）
      const bounceDuration = 1.2; // 回弹持续时间1.2s
      const bounceStartTime = timeline.duration(); // 获取当前timeline的时间，确保所有列同时开始回弹
      
      scrollRefs.current.forEach((scrollEl, colIndex) => {
        if (!scrollEl) return;

        const config = columnConfigs[colIndex];
        const columnItems = columns[colIndex];
        const stopIndex = config.stopIndex;
        const totalItems = columnItems.length;
        const repeatCount = Math.max(15, Math.ceil(500 / totalItems));
        
        // 找到选中图片的引用（在中间重复组中）
        const middleRepeat = Math.floor(repeatCount / 2);
        const selectedItemIndex = middleRepeat * totalItems + stopIndex;
        const selectedItemKey = `${colIndex}-${selectedItemIndex}`;
        const selectedImageItem = imageItemRefs.current.get(selectedItemKey);

        // 回弹对齐 - 使用弹性缓动实现平滑回弹效果
        // 从finalPosition（错开位置，标线在图片上方或下方）回弹到alignedPosition（对齐位置，图片中心对齐到标线）
        // 所有列使用相同的时间点开始，确保同步回弹
        timeline.to(
          scrollEl,
          {
            y: config.alignedPosition, // 所有列对齐到相同位置（图片中心对齐到标线）
            duration: bounceDuration,
            ease: "elastic.out(1, 0.3)", // 调整弹性参数，让回弹更明显（更小的第二个参数=更大的回弹）
            onStart: () => {
              // 在回弹开始时播放音效（只播放一次，使用第一列触发）
              if (colIndex === 0 && winAudioRef.current) {
                try {
                  winAudioRef.current.currentTime = 0;
                  const audioDuration = winAudioRef.current.duration;
                  if (audioDuration > bounceDuration) {
                    setTimeout(() => {
                      if (winAudioRef.current) {
                        winAudioRef.current.pause();
                        winAudioRef.current.currentTime = 0;
                      }
                    }, bounceDuration * 1000);
                  }
                  winAudioRef.current.play().catch(() => {
                    // 忽略播放错误
                  });
                } catch {
                  // 忽略错误
                }
              }
              // 不提前放大，让onUpdate自然触发放大
              // 这样图片会在移动到标线时才放大
            },
            onComplete: () => {
              // 设置选中的项
              if (config.stopItem) {
                selectedItemsRef.current.set(colIndex, config.stopItem);
              }
              
              // 确保选中图片保持放大状态
              if (selectedImageItem) {
                scaledItemsRef.current.set(selectedItemKey, true);
              }
              
              // 在最后一列完成时停止音效
              if (colIndex === columns.length - 1 && winAudioRef.current) {
                try {
                  winAudioRef.current.pause();
                  winAudioRef.current.currentTime = 0;
                } catch {
                  // 忽略错误
                }
              }
            },
          },
          bounceStartTime // 所有列在同一时间点开始回弹
        );
      });
    };

    useImperativeHandle(ref, () => ({
      start,
      reset,
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
        <div className="flex  gap-0 md:gap-2 justify-center items-center relative">
          {columns.map((columnItems, colIndex) => {
            // 复制数据项以实现无缝循环（至少复制15次以确保滚动时始终有图片可见）
            const repeatCount = Math.max(
              15,
              Math.ceil(500 / columnItems.length)
            ); // 确保有足够的重复
            const duplicatedItems: SlotMachineItem[] = [];
            for (let i = 0; i < repeatCount; i++) {
              duplicatedItems.push(...columnItems);
            }
            
            const selectedItem = selectedItemsRef.current.get(colIndex);

            return (
              <div key={colIndex} className="relative flex-1 flex items-center">
                {/* 列分隔符 - 垂直线（不再需要中间的 x 图标，因为每列内部已有标线） */}
                {colIndex > 0 && (
                  <div
                    className="absolute left-0 top-0 bottom-0 z-20 flex-1 flex items-center justify-center"
                    style={{
                      width: "2px",
                      transform: "translateX(-50%)",
                      backgroundColor: "#34383C",
                    }}
                  />
                )}

                {/* 列容器 */}
                <div
                  className="relative flex-1"
                  style={{
                    height: viewportHeight,
                    overflow: "hidden",
                  }}
                >
                  {/* 左侧标线 - centralIcon */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30"
                    style={{
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="text-gray-400" style={{ width: "16px", height: "16px" }}>
                      {centralIcon}
                    </div>
                  </div>

                  {/* 中间标线 - x 图标 */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full"
                    style={{
                      height: "2px",
                      backgroundColor: "#34383C",
                    }}
                  >
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: "#22272B",
                        border: "2px solid #34383C",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 4L10 10M10 4L4 10"
                          stroke="#7A8084"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* 右侧标线 - starIcon */}
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30"
                    style={{
                      transform: "translate(50%, -50%)",
                    }}
                  >
                    {starIcon}
                  </div>
                  {/* 滚动容器 */}
                  <div
                    ref={(el) => {
                      scrollRefs.current[colIndex] = el;
                    }}
                    className="absolute inset-0 flex flex-col items-center gap-[80px]"
                    style={{
                      willChange: "transform",
                      transform: `translateY(${
                        initialOffsetsRef.current[colIndex] || 0
                      }px)`,
                    }}
                  >
                    {duplicatedItems.map((item, imgIndex) => {
                      const itemKey = `${colIndex}-${imgIndex}`;
                      return (
                        <div
                          key={itemKey}
                          ref={(el) => {
                            if (el) {
                              imageItemRefs.current.set(itemKey, el);
                            } else {
                              imageItemRefs.current.delete(itemKey);
                            }
                          }}
                          className="flex items-center justify-center"
                          style={{
                            width: "80px",
                            height: itemHeight,
                            boxSizing: "border-box",
                            transformOrigin: "center center",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transformOrigin: "center center",
                            }}
                          >
                            <img
                              src={duplicatedItems[imgIndex].image}
                              alt={duplicatedItems[imgIndex].name}
                              className="w-full h-full object-contain"
                              style={{
                                willChange: "transform",
                                imageRendering: "auto",
                              }}
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 选中项信息显示 - 对标PackDraw.html */}
                  {selectedItem && (
                    <div
                      className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-1 pb-4"
                      style={{
                        paddingTop: "8px",
                      }}
                    >
                      <p
                        className="text-base font-bold text-white max-w-24 overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          textAlign: "center",
                        }}
                      >
                        {selectedItem.name}
                      </p>
                      <div
                        className="flex justify-center items-center bg-gray-600 rounded px-2 py-0.5"
                        style={{
                          minWidth: "4rem",
                          width: "auto",
                        }}
                      >
                        <p className="text-sm font-semibold text-white">
                          {selectedItem.price}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

SlotMachine.displayName = "SlotMachine";

export default SlotMachine;
