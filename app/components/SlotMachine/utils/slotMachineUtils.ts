import type { SlotMachineItem, ColumnConfig } from '../SlotMachine.types';

export const GAP_SIZE = 80; // gap大小（增大到80px以容纳放大后的图片）

export function calculateItemSpacing(itemHeight: number): number {
  return itemHeight + GAP_SIZE; // 每个item占据的总空间（高度+间距）
}

export function calculateStopPositions(
  columns: SlotMachineItem[][],
  stopIds?: string[],
  stopPositions?: number[]
): number[] {
  const calculatedStopPositions: number[] = [];
  
  if (stopIds && stopIds.length > 0) {
    // 使用id查找位置
    columns.forEach((columnItems, colIndex) => {
      const stopId = stopIds[colIndex];
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
    throw new Error("必须提供 stopIds 或 stopPositions");
  }

  // 验证输入
  if (calculatedStopPositions.length !== columns.length) {
    throw new Error("停止位置数量必须与 columns 长度匹配");
  }

  return calculatedStopPositions;
}

export function calculateColumnConfigs(
  columns: SlotMachineItem[][],
  calculatedStopPositions: number[],
  itemHeight: number,
  visibleItems: number
): ColumnConfig[] {
  const viewportHeight = itemHeight * visibleItems;
  const centerLineY = viewportHeight / 2; // 标线位置（中间）
  const itemSpacing = calculateItemSpacing(itemHeight);

  return columns.map((columnItems, colIndex) => {
    const stopIndex = calculatedStopPositions[colIndex];
    const totalItems = columnItems.length;
    const totalHeight = totalItems * itemSpacing; // 考虑gap的总高度

    // 计算精确对齐位置（回弹后的最终位置）
    const targetItemCenterY = stopIndex * itemSpacing + itemHeight / 2;
    const repeatCount = Math.max(15, Math.ceil(500 / totalItems));
    const middleRepeat = Math.floor(repeatCount / 2);
    const targetPositionInRepeat = middleRepeat * totalHeight + targetItemCenterY;
    const alignedPosition = centerLineY - targetPositionInRepeat;

    // 阶段3结束时的位置：让标线停在图片上方或下方足够远的位置
    const stopOffsetDirection = Math.random() > 0.5 ? 1 : -1;
    const stopOffset = stopOffsetDirection * (1.0 + Math.random() * 0.5) * itemHeight;
    const finalPosition = alignedPosition - stopOffset;

    // 添加偏移量以在滚动期间创建不一致效果
    const inconsistencyOffset = (Math.random() - 0.5) * itemHeight * 0.5;
    const scrollTargetPosition = finalPosition + inconsistencyOffset;

    return {
      finalPosition,
      alignedPosition,
      scrollTargetPosition,
      totalItems,
      totalHeight,
      stopIndex,
      stopItem: columnItems[stopIndex],
    };
  });
}

export function duplicateItems(
  columnItems: SlotMachineItem[]
): SlotMachineItem[] {
  const repeatCount = Math.max(15, Math.ceil(500 / columnItems.length));
  const duplicatedItems: SlotMachineItem[] = [];
  for (let i = 0; i < repeatCount; i++) {
    duplicatedItems.push(...columnItems);
  }
  return duplicatedItems;
}

