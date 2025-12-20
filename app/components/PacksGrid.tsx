"use client";

import { useCallback, useRef, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import PackCard from './PackCard';
import { useResponsiveGridColumns } from '../hooks/useResponsiveGridColumns';

type PackItem = {
  id: string;
  coverSrc: string;
  price: string;
  title?: string;
  priceNumber?: number;
};

// 只渲染 2-3 行的数据（自适应列数），默认提供示例数据
const DEFAULT_ITEMS: PackItem[] = [
  {
    id: "p1",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmf364zuz0000gs0g8kl2j9kk_8813805__877HjEZ6l?tr=q-50,w-640,c-at_max",
    price: "$22,289.96",
  },
  {
    id: "p2",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=q-50,w-640,c-at_max",
    price: "$20,507.39",
  },
  {
    id: "p3",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=q-50,w-640,c-at_max",
    price: "$18,120.00",
  },
  {
    id: "p4",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=q-50,w-640,c-at_max",
    price: "$12,300.00",
  },
  {
    id: "p5",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=q-50,w-640,c-at_max",
    price: "$9,999.00",
  },
  {
    id: "p6",
    coverSrc:
      "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=q-50,w-640,c-at_max",
    price: "$7,450.00",
  },
];

export default function PacksGrid({
  items = DEFAULT_ITEMS,
  scrollRef,
}: {
  items?: PackItem[];
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  const internalScrollRef = useRef<HTMLDivElement | null>(null);
  const effectiveScrollRef = scrollRef ?? internalScrollRef;

  const columns = useResponsiveGridColumns(effectiveScrollRef);
  const rowCount = Math.ceil(items.length / Math.max(1, columns));

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => effectiveScrollRef.current,
    estimateSize: () => 380,
    overscan: 6,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const measureRow = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      // 避免 react-virtual 內部 flushSync 在 React 正在 render/commit 時觸發的警告
      Promise.resolve().then(() => rowVirtualizer.measureElement(el));
    },
    [rowVirtualizer],
  );

  const grid = (
    <div className="flex flex-col gap-4">
      <div
        className="relative w-full"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {virtualRows.map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowItems = items.slice(start, start + columns);
          return (
            <div
              key={virtualRow.key}
              ref={measureRow}
              data-index={virtualRow.index}
              className="absolute left-0 top-0 w-full pb-4"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div
                className="grid gap-4 self-stretch"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowItems.map((p) => (
                  <div className="relative w-full" key={p.id}>
                    <div className="relative w-full">
                      <div className="relative flex flex-col items-stretch w-full mb-12">
                        <PackCard
                          imageUrl={p.coverSrc}
                          alt="pack-grid-card"
                          width={200}
                          height={304}
                          href={`/packs/${p.id}`}
                          hoverTilt={false}
                          showActions
                          packId={p.id}
                          packTitle={p.title}
                          packPrice={p.priceNumber}
                        />
                        <div className="flex justify-center pt-3 absolute left-0 right-0 bottom-[-40px]">
                          <p className="font-bold text-base text-white">
                            {p.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 若外部沒提供 scrollRef，PacksGrid 會自行提供可滾動容器（避免破壞其它使用處）
  if (!scrollRef) {
    return (
      <div
        ref={internalScrollRef}
        className="overflow-y-auto custom-scrollbar"
        style={{
          maxHeight: '2600px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #1F2937',
        }}
      >
        {grid}
      </div>
    );
  }

  return grid;
}


