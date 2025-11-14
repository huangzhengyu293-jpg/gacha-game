# LuckySlotMachine 组件使用说明

## 组件介绍
`LuckySlotMachine` 是一个可复用的老虎机组件，支持自定义奖品、选中目标、动画回调等功能。

## 基本用法

```tsx
import LuckySlotMachine, { SlotSymbol } from '@/app/components/SlotMachine/LuckySlotMachine';

// 准备奖品数据
const symbols: SlotSymbol[] = [
  {
    id: 'item_1',
    name: '奖品1',
    description: '这是奖品1的描述',
    image: 'https://example.com/image1.jpg',
    price: 100,
    dropProbability: 0.1,
    qualityId: null
  },
  // ... 更多奖品
];

// 在组件中使用
function MyComponent() {
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  
  const handleSpinStart = () => {
    console.log('开始旋转！');
    // 可以在这里决定中奖结果
    // setSelectedPrizeId('item_1');
  };
  
  const handleSpinComplete = (result: SlotSymbol) => {
    console.log('旋转结束，结果是：', result);
    // 处理中奖结果
  };
  
  return (
    <LuckySlotMachine
      symbols={symbols}
      selectedPrizeId={selectedPrizeId}
      onSpinStart={handleSpinStart}
      onSpinComplete={handleSpinComplete}
      height={540}
      showPrizeSelector={true}
      buttonText="开始游戏"
    />
  );
}
```

## Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `symbols` | `SlotSymbol[]` | 必需 | 奖品数组，包含所有可能的奖品 |
| `selectedPrizeId` | `string \| null` | `null` | 预设的中奖物品ID，如果设置了会停在这个物品上 |
| `onSpinStart` | `() => void` | - | 开始旋转时的回调函数 |
| `onSpinComplete` | `(result: SlotSymbol) => void` | - | 旋转结束时的回调，返回最终停留的奖品 |
| `height` | `number` | `540` | 转轮的高度（像素） |
| `showPrizeSelector` | `boolean` | `true` | 是否显示底部的奖品选择器 |
| `buttonText` | `string` | `'开始'` | 按钮显示的文字 |

## SlotSymbol 数据结构

```typescript
interface SlotSymbol {
  id: string;                    // 唯一标识符
  name: string;                   // 奖品名称
  description?: string;           // 奖品描述（可选）
  image: string;                  // 奖品图片URL
  price: number;                  // 奖品价值
  dropProbability?: number;       // 掉落概率（可选）
  qualityId?: string | null;      // 品质ID（可选）
}
```

## 高级用法示例

### 1. 控制中奖结果
```tsx
function ControlledSlotMachine() {
  const [targetId, setTargetId] = useState<string | null>(null);
  
  const handleSpinStart = () => {
    // 从服务器获取中奖结果
    fetch('/api/lottery')
      .then(res => res.json())
      .then(data => {
        setTargetId(data.winnerId);
      });
  };
  
  return (
    <LuckySlotMachine
      symbols={symbols}
      selectedPrizeId={targetId}
      onSpinStart={handleSpinStart}
      onSpinComplete={(result) => {
        alert(`恭喜获得：${result.name}`);
      }}
    />
  );
}
```

### 2. 隐藏奖品选择器（纯抽奖模式）
```tsx
function PureLotteryMode() {
  const determineWinner = () => {
    // 随机选择一个奖品
    const randomIndex = Math.floor(Math.random() * symbols.length);
    return symbols[randomIndex].id;
  };
  
  const [winnerId, setWinnerId] = useState<string | null>(null);
  
  return (
    <LuckySlotMachine
      symbols={symbols}
      selectedPrizeId={winnerId}
      showPrizeSelector={false}  // 隐藏选择器
      onSpinStart={() => {
        setWinnerId(determineWinner());
      }}
      onSpinComplete={(result) => {
        console.log('Winner:', result);
      }}
    />
  );
}
```

### 3. 自适应父容器高度
```tsx
function AdaptiveHeightSlotMachine() {
  const [containerHeight, setContainerHeight] = useState(540);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      setContainerHeight(height * 0.8); // 使用80%的容器高度
    }
  }, []);
  
  return (
    <div ref={containerRef} style={{ height: '600px' }}>
      <LuckySlotMachine
        symbols={symbols}
        height={containerHeight}
        onSpinComplete={(result) => {
          console.log('Result:', result);
        }}
      />
    </div>
  );
}
```

## 注意事项

1. **图片加载**: 确保所有奖品图片URL都是可访问的，否则会显示为空白
2. **性能优化**: 建议奖品数量控制在20个以内，过多会影响动画流畅度
3. **响应式设计**: 组件宽度固定为180px，如需响应式可以通过CSS transform进行缩放
4. **动画时长**: 旋转动画时长为4.5-5.5秒，不可配置（如需修改请修改组件源码）

## 样式定制

组件使用了 `styled-jsx`，样式都封装在组件内部。如需修改样式，可以：

1. 修改组件源码中的样式
2. 或使用CSS覆盖（注意提高选择器优先级）

```css
/* 覆盖按钮颜色示例 */
.lucky-slot-machine-container .spin-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%) !important;
}
```

