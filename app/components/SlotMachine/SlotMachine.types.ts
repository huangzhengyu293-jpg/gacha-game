// 数据项接口
export interface SlotMachineItem {
  id: string; // 唯一标识符
  name: string; // 名称
  price: string; // 价格
  image: string; // 图片URL
}

export interface SlotMachineProps {
  columns: SlotMachineItem[][]; // 二维数组，每个内部数组包含该列的数据项
  stopIds?: string[]; // 数组，每个元素表示对应列应该停止的id（可选，如果提供则使用id停止）
  stopPositions?: number[]; // 数组，每个元素表示对应列应该停止的位置索引（可选，如果stopIds未提供则使用）
  itemHeight?: number; // 每个项目的高度（像素）
  visibleItems?: number; // 同时可见的项目数量
  duration?: number; // 动画持续时间（秒）
  showGuidelines?: boolean; // 是否显示标线和分隔线，默认 true
  onComplete?: () => void; // 动画完成时的回调函数
}

export interface SlotMachineHandle {
  start: (stopIds?: string[]) => void; // 开始老虎机动画，可选的stopIds参数
  reset: () => void; // 重置到初始状态
}

export interface ColumnConfig {
  finalPosition: number; // 阶段2结束时的位置（错开）
  alignedPosition: number; // 阶段3回弹后的精确对齐位置（所有列相同）
  scrollTargetPosition: number;
  totalItems: number;
  totalHeight: number;
  stopIndex: number;
  stopItem: SlotMachineItem; // 存储停止的项
}

