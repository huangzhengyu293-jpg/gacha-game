# 时间驱动的结果展示机制

## 📌 核心概念

所有的结果展示（玩家金额累加、下方记录）都是**基于时间轴事件**驱动的，而不是基于 `currentRound`。

## 🎯 关键时刻：老虎机回正

### 时间轴事件结构

```typescript
// 第1轮时间轴
{
  type: 'round_spinning',   // 老虎机转动 + 回正
  startTime: 3000,          // 3s 开始
  duration: 5000,           // 持续 5 秒
  endTime: 8000,            // 8s 结束 ✅ 回正完成
  roundIndex: 0,
  data: { stage: 1 }
}
{
  type: 'round_complete',   // 静止展示结果
  startTime: 8000,          // 8s 开始
  duration: 1000,           // 持续 1 秒
  endTime: 9000,            // 9s 结束
  roundIndex: 0,
  data: { stage: 1 }
}
```

**关键：当 `playbackTime >= round_spinning.endTime` 时（8s），老虎机已回正，此时立即更新金额和记录！**

## 📊 时间轴示例

```
0s ──────── 3s ──────── 8s ── 9s ────── 14s ─ 15s
   倒计时    第1轮转动    展示  第2轮转动   展示
   3-2-1     spinning    静止  spinning   静止
                   ↑ 8s回正 ✅         ↑ 14s回正 ✅
                   立即记录第1轮       立即记录第2轮
```

**重点**：
- **8s 时刻**：老虎机回正 → 立即更新金额和round记录
- **8-9s**：静止展示结果（玩家观看）
- **9s 时刻**：第1轮完全结束，进入第2轮

## 💰 玩家金额累加逻辑

```typescript
// useBattleTimeline.ts
const playerValues = useMemo(() => {
  const values: Record<string, number> = {};
  
  // ✅ 找到每轮的最后一个 round_spinning 事件（老虎机回正的时刻）
  const roundLastSpinningEndTime: Record<number, number> = {};
  for (const event of timeline) {
    if (event.type === 'round_spinning' && event.roundIndex !== undefined) {
      const roundIdx = event.roundIndex;
      // 记录最晚的 endTime（处理二段动画的情况）
      if (!roundLastSpinningEndTime[roundIdx] || event.endTime > roundLastSpinningEndTime[roundIdx]) {
        roundLastSpinningEndTime[roundIdx] = event.endTime;
      }
    }
  }
  
  // 检查哪些轮次的老虎机已回正
  const completedRounds: number[] = [];
  Object.entries(roundLastSpinningEndTime).forEach(([roundIdx, endTime]) => {
    if (playbackTime >= endTime) {
      completedRounds.push(parseInt(roundIdx));
    }
  });
  
  // 累加已回正轮次的物品价格
  completedRounds.forEach(i => {
    // ... 累加逻辑
  });
  
  return values;
}, [playbackTime, timeline, rounds, battleData.packs]);
```

## 📝 下方记录展示逻辑

```typescript
// page-timeline.tsx
const completedRoundResults = useMemo(() => {
  const results = [];
  
  // ✅ 找到每轮的最后一个 round_spinning 事件（老虎机回正的时刻）
  const roundLastSpinningEndTime: Record<number, number> = {};
  for (const event of timelineControl.timeline) {
    if (event.type === 'round_spinning' && event.roundIndex !== undefined) {
      const roundIdx = event.roundIndex;
      // 记录最晚的 endTime（处理二段动画的情况）
      if (!roundLastSpinningEndTime[roundIdx] || event.endTime > roundLastSpinningEndTime[roundIdx]) {
        roundLastSpinningEndTime[roundIdx] = event.endTime;
      }
    }
  }
  
  // 检查哪些轮次的老虎机已回正
  const completedRounds: number[] = [];
  Object.entries(roundLastSpinningEndTime).forEach(([roundIdx, endTime]) => {
    if (timelineControl.state.playbackTime >= endTime) {
      completedRounds.push(parseInt(roundIdx));
    }
  });
  
  // 构建结果数组
  completedRounds.forEach(i => {
    results.push({
      roundId: `round-${i}`,
      playerItems: { ... }
    });
  });
  
  return results;
}, [gameResults, timelineControl.timeline, timelineControl.state.playbackTime, battleData.packs]);

// ✅ 传递给 ParticipantsWithPrizes 组件
<ParticipantsWithPrizes
  roundResults={completedRoundResults}
  completedRounds={new Set(
    completedRoundResults.map(r => parseInt(r.roundId.replace('round-', '')))
  )}
/>
```

**关键点**：
- 检查 `round_spinning.endTime`（老虎机回正时刻），而不是 `round_complete.endTime`
- `roundResults`: 包含每轮的详细物品数据
- `completedRounds`: `Set<number>`，告诉组件哪些轮次已完成，用于显示视觉效果

## 🚀 中途加入场景

### 场景 1：第一轮正在进行中

```
用户进入时间: 5s (第一轮老虎机还在转)

0s ──── 3s ──── 5s(👤进入) ──── 8s(✅回正) ─── 9s
       倒计时    正在spinning    立即记录     展示

结果:
- 玩家金额: 0 (第一轮还没回正)
- 下方记录: 空 (没有回正的轮次)
- 5s → 8s: 看到老虎机从头转动
- 8s 时刻: 金额和记录立即更新 ✅
```

### 场景 2：第二轮正在进行中

```
用户进入时间: 12s (第二轮老虎机正在转)

0s ─ 3s ─ 8s(✅) ─ 9s ─ 12s(👤) ─ 14s(✅) ─ 15s
    倒计时  回正  展示  进入    回正     展示

结果:
- 玩家金额: 第1轮的总价值 (8s 已回正)
- 下方记录: 显示第1轮的物品
- 12s → 14s: 看到第2轮老虎机转动
- 14s 时刻: 金额和记录再次更新 ✅
```

### 场景 3：第二轮刚回正

```
用户进入时间: 14s (第二轮刚刚回正)

0s ─ 3s ─ 8s(✅) ─ 9s ─ 14s(✅) ─ 14s(👤进入) ─ 15s
    倒计时  回正1  展示  回正2     立即看到      展示

结果:
- 玩家金额: 第1轮 + 第2轮的总价值（立即显示）
- 下方记录: 显示第1轮和第2轮的物品（立即显示）
- 看到第2轮结果在静止展示
```

## 🎮 二段动画特殊情况

如果一轮有二段动画（抽到传说物品）：

```
第1轮（有人抽到传说）: 
  - 3-8s:   spinning (stage 1) → 普通物品 + 金色占位符
            8s ✅ 回正到金色占位符 → ❌ 还不记录（还有第2段）
  - 8-9s:   round_complete (stage 1) → 展示金色占位符
  
  - 9-14s:  spinning (stage 2) → 传说物品
            14s ✅ 回正到传说物品 → ✅ 记录最终结果！
  - 14-15s: round_complete (stage 2) → 展示传说物品

重要逻辑: 
- 8s 时：第1段回正，但不记录（因为还有第2段）
- 14s 时：第2段回正，记录最终结果 ✅
- 我们找到每轮**最后一个 round_spinning.endTime**，确保二段动画也正确处理
```

**关键代码**：
```typescript
// 找到每轮的最后一个 round_spinning 事件
const roundLastSpinningEndTime: Record<number, number> = {};
for (const event of timeline) {
  if (event.type === 'round_spinning' && event.roundIndex !== undefined) {
    const roundIdx = event.roundIndex;
    // 记录最晚的 endTime（自动处理二段动画）
    if (!roundLastSpinningEndTime[roundIdx] || event.endTime > roundLastSpinningEndTime[roundIdx]) {
      roundLastSpinningEndTime[roundIdx] = event.endTime;  // 14s
    }
  }
}
```

## 🔧 实现细节

### 需要二段的判断

```typescript
// timeline.ts
const hasSecondSpin = roundResults.some((r: any) => r.needsSecondSpin);

if (hasSecondSpin) {
  // 第1段
  events.push({ type: 'round_spinning', stage: 1 });
  events.push({ type: 'round_complete', stage: 1 });
  
  // 第2段
  events.push({ type: 'round_spinning', stage: 2 });
  events.push({ type: 'round_complete', stage: 2 });  // ✅ 这个结束才算完成
}
```

### 正确计算完成轮次

当前实现中，我们简单地检查所有 `round_complete` 事件。但为了正确处理二段动画，应该**只检查最后一个 `round_complete`**：

```typescript
// ✅ 改进版：只记录每轮最后一个 round_complete
const completedRounds: number[] = [];
const roundLastCompleteTime: Record<number, number> = {};

// 遍历时间轴，找到每轮的最后一个 round_complete
for (const event of timeline) {
  if (event.type === 'round_complete' && event.roundIndex !== undefined) {
    const roundIdx = event.roundIndex;
    // 记录最晚的 endTime
    if (!roundLastCompleteTime[roundIdx] || event.endTime > roundLastCompleteTime[roundIdx]) {
      roundLastCompleteTime[roundIdx] = event.endTime;
    }
  }
}

// 检查哪些轮次已完成
Object.entries(roundLastCompleteTime).forEach(([roundIdx, endTime]) => {
  if (playbackTime >= endTime) {
    completedRounds.push(parseInt(roundIdx));
  }
});
```

## ✅ 验证方法

### 测试场景

1. **从头播放**
   ```
   访问: /battles/test-id?useTimeline=true
   预期: 每轮老虎机结束后1秒，金额和记录才更新
   ```

2. **中途加入（第二轮开始前）**
   ```
   访问: /battles/test-id?simulateJoinTime=10
   预期: 
   - 第1轮金额和记录立即显示
   - 第2轮老虎机正在转动
   ```

3. **中途加入（第二轮进行中）**
   ```
   访问: /battles/test-id?simulateJoinTime=12
   预期:
   - 第1轮金额和记录立即显示
   - 第2轮老虎机从头播放（智能调整）
   ```

4. **中途加入（全部完成后）**
   ```
   访问: /battles/test-id?simulateJoinTime=50
   预期:
   - 所有轮次的金额和记录都显示
   - 直接显示最终获胜者
   ```

## 🎯 总结

| 元素 | 触发条件 | 说明 |
|------|---------|------|
| **玩家金额** | `playbackTime >= round_spinning.endTime` | 老虎机回正时立即累加 |
| **下方记录** | `playbackTime >= round_spinning.endTime` | 老虎机回正时立即显示 |
| **老虎机动画** | `round_spinning` 事件（startTime → endTime） | 转动 + 回正阶段 |
| **静止展示** | `round_complete` 事件（startTime → endTime） | 回正后的静止观看阶段 |
| **二段动画** | 最后一个 `round_spinning.endTime` | 只在最后一段回正时才记录 |

---

## ⏱️ 时间点对比

### 之前（错误）
```
8s: 老虎机回正 → 继续等待
9s: round_complete 结束 → 才更新金额和记录 ❌ 慢了1秒！
```

### 现在（正确）
```
8s: 老虎机回正 → 立即更新金额和记录 ✅
8-9s: 静止展示（玩家观看结果）
```

---

**核心原则：老虎机一回正到结果上，立即更新金额和记录！** 🎰⚡

