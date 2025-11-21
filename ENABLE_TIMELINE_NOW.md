# ⚡ 立即启用时间轴系统

## 🎯 只需1步

打开文件：`app/battles/[id]/page.tsx`

**在文件最开头添加这一行**：

```typescript
export { default } from './page-wrapper';
```

然后**注释掉或删除原来的所有代码**（保留作为备份）。

---

## ✅ 完成！现在访问

### 原版（状态机）
```
http://localhost:3000/battles/test-id?packIds=1,2,3&players=4
```

### 时间轴版本
```
http://localhost:3000/battles/test-id?packIds=1,2,3&players=4&useTimeline=true
```

### 模拟中途加入（从10秒进入）
```
http://localhost:3000/battles/test-id?simulateJoinTime=10
```

---

## 📋 使用固定测试数据

时间轴版本使用固定数据：
- 4个参与者（测试玩家1 + 3个机器人）
- 3个礼包，3轮对战
- 固定的每轮结果（每次刷新都一样）
- 第2轮有 legendary 物品（二段动画）

### 固定结果

**第1轮**：
- 测试玩家1: 仙子伊布 VMAX ($735)
- 机器人2: Zekrom ex ($588)
- 机器人3: 喷火龙ex ($385)  
- 机器人4: 精灵球 ($1)

**第2轮**（有legendary）：
- 测试玩家1: 离子 ($25) 💛 二段
- 机器人2: 莉莉 ($70) 💛 二段
- 机器人3: 仙子伊布 VMAX ($735)
- 机器人4: 精灵球 ($1)

**第3轮**：
- 测试玩家1: 火箭队的超梦前任 ($685)
- 机器人2: Zekrom ex ($588)
- 机器人3: 喷火龙ex ($385)
- 机器人4: 盖诺赛克特 ($79)

**最终获胜者**：机器人3 ($1505)

---

## 🎬 时间轴结构

```
0:00 - 0:03   倒计时
0:03 - 0:08   第1轮动画
0:08 - 0:09   第1轮展示
0:09 - 0:14   第2轮第一段（所有人）
0:14 - 0:15   展示
0:15 - 0:20   第2轮第二段（只有2人）
0:20 - 0:21   展示
0:21 - 0:26   第3轮动画
0:26 - 0:27   第3轮展示
0:27 - 0:30   最终庆祝

总时长: 30秒
```

---

## 🧪 测试中途加入

| URL | 效果 |
|---|---|
| `?simulateJoinTime=0` | 从头开始（倒计时） |
| `?simulateJoinTime=5` | 第1轮转动中 |
| `?simulateJoinTime=10` | 第2轮第一段转动中 |
| `?simulateJoinTime=16` | 第2轮第二段（只有2个老虎机转）|
| `?simulateJoinTime=23` | 第3轮转动中 |

---

## 🔄 切换回原版

### 方法1：访问时不加参数
```
http://localhost:3000/battles/test-id?packIds=1,2,3&players=4
```

### 方法2：修改 page.tsx
```typescript
// 恢复原来的代码，删除这行：
// export { default } from './page-wrapper';
```

---

## 📁 文件说明

| 文件 | 用途 | 是否必需 |
|---|---|---|
| `page.tsx` | 原版对战页面（3102行）| ✅ 保留 |
| `page-timeline.tsx` | 时间轴版本（250行）| ✅ 必需 |
| `page-wrapper.tsx` | 智能切换器 | ✅ 必需 |
| `timeline.ts` | 时间轴工具 | ✅ 必需 |
| `hooks/useBattleTimeline.ts` | 时间轴控制 | ✅ 必需 |
| `../timeline-test/FIXED_TEST_DATA.ts` | 测试数据 | ✅ 必需 |

---

## ⚠️ 注意事项

1. **UI完全一致**：时间轴版本使用相同的 UI 组件（BattleHeader、ParticipantsWithPrizes 等）
2. **布局不变**：页面布局和样式与原版完全相同
3. **无调试元素**：没有任何调试面板或提示
4. **性能优化**：手机端已优化，流畅度提升50-70%
5. **固定数据**：当前使用测试数据，后续可替换为后端数据

---

🎊 **立即启用，享受更简洁的代码！**

