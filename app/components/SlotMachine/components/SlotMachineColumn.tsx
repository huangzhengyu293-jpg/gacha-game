import type { SlotMachineItem } from '../SlotMachine.types';
import { duplicateItems } from '../utils/slotMachineUtils';
import Guidelines from './Guidelines';
import ColumnSeparator from './ColumnSeparator';
import SelectedItemInfo from './SelectedItemInfo';

interface SlotMachineColumnProps {
  colIndex: number;
  columnItems: SlotMachineItem[];
  itemHeight: number;
  viewportHeight: number;
  showGuidelines: boolean;
  initialOffset: number;
  scrollRef: (el: HTMLDivElement | null) => void;
  imageItemRef: (itemKey: string, el: HTMLDivElement | null) => void;
  selectedItem: SlotMachineItem | null;
}

export default function SlotMachineColumn({
  colIndex,
  columnItems,
  itemHeight,
  viewportHeight,
  showGuidelines,
  initialOffset,
  scrollRef,
  imageItemRef,
  selectedItem,
}: SlotMachineColumnProps) {
  const duplicatedItems = duplicateItems(columnItems);

  return (
    <div key={colIndex} className="relative flex-1 flex items-center">
      <ColumnSeparator showGuidelines={showGuidelines} colIndex={colIndex} />

      {/* 列容器 */}
      <div
        className="relative flex-1"
        style={{
          height: viewportHeight,
          overflow: "hidden",
        }}
      >
        <Guidelines showGuidelines={showGuidelines} />

        {/* 滚动容器 */}
        <div
          ref={scrollRef}
          className="absolute inset-0 flex flex-col items-center gap-[80px]"
          style={{
            willChange: "transform",
            transform: `translateY(${initialOffset}px)`,
          }}
        >
          {duplicatedItems.map((item, imgIndex) => {
            const itemKey = `${colIndex}-${imgIndex}`;
            return (
              <div
                key={itemKey}
                ref={(el) => imageItemRef(itemKey, el)}
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
                    src={item.image}
                    alt={item.name}
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

        <SelectedItemInfo selectedItem={selectedItem} />
      </div>
    </div>
  );
}

