# 🧪 时间轴系统测试指南

## ⚡ 快速测试（3分钟）

### 1️⃣ 启动项目

```bash
npm run dev
# 或
pnpm dev
```

### 2️⃣ 访问测试页面

在浏览器中打开：

```
http://localhost:3000/battles/timeline-test?packIds=1,2,3&players=4&gameMode=classic
```

**URL 参数说明**：
- `packIds=1,2,3` - 选择3个礼包（3轮）
- `players=4` - 4个玩家
- `gameMode=classic` - 经典模式

### 3️⃣ 观察效果

页面会自动：
1. ✅ 显示参与者插槽（会自动填充机器人）
2. ✅ 人满后显示倒计时 3、2、1
3. ✅ 自动开始第1轮老虎机
4. ✅ 依次播放所有轮次
5. ✅ 显示最终获胜者

**打开浏览器控制台**（F12），会看到详细日志：
```
🎲 生成游戏结果...
📋 ========== 所有轮次预生成结果汇总 ==========
🎬 对战时间轴
🎰 [时间轴] 第 1 轮开始转动
🎰 [时间轴] 第 2 轮开始转动
🏆 [时间轴] 对战结束
```

---

## 🎮 测试功能

页面底部有**绿色边框的调试面板**，包含：

### 显示信息
- 播放时间 / 总时长
- 当前轮次
- 当前事件类型
- 进度条

### 控制按钮

| 按钮 | 功能 | 测试点 |
|---|---|---|
| ▶️ 播放 | 继续播放 | 暂停后可以恢复 |
| ⏸️ 暂停 | 暂停播放 | 老虎机会停止，时间不推进 |
| 🔄 重置 | 回到开始 | 回到人员等待状态 |
| ⏩ 跳到5秒 | 跳到5秒位置 | 应该在第1轮或第2轮 |
| ⏭️ 跳到10秒 | 跳到10秒位置 | 应该在第2轮或第3轮 |
| 🎬 测试中途加入 | 模拟10秒前开始 | 应该直接跳到对应轮次 |

---

## ✅ 测试检查项

### 基础功能
- [ ] 人员插槽自动填满
- [ ] 倒计时显示正确（3、2、1）
- [ ] 老虎机自动开始转动
- [ ] 老虎机停在正确的物品上
- [ ] 每轮结束后玩家价值累计正确
- [ ] 所有轮次播放完毕
- [ ] 最终显示获胜者
- [ ] 播放烟花动画

### 时间轴功能
- [ ] **暂停**：点击后时间停止，老虎机不动
- [ ] **播放**：点击后继续播放
- [ ] **重置**：回到等待玩家状态
- [ ] **跳到5秒**：直接跳到对应位置，不播放前面的动画
- [ ] **跳到10秒**：同上
- [ ] **进度条**：实时显示正确的进度

### 中途加入测试
- [ ] 点击"测试中途加入"按钮
- [ ] 页面应该跳到 ~10秒 的位置
- [ ] 前面轮次的结果应该显示在参与者列表中
- [ ] 从当前位置继续正常播放

---

## 🎯 不同模式测试

### 经典模式
```
http://localhost:3000/battles/timeline-test?packIds=1,2,3&players=4&gameMode=classic
```
✅ 期望：最高价值者获胜

### 大奖模式
```
http://localhost:3000/battles/timeline-test?packIds=1,2,3&players=4&gameMode=jackpot
```
✅ 期望：所有轮次完成后显示进度条动画，获胜者颜色高亮

### 积分冲刺模式
```
http://localhost:3000/battles/timeline-test?packIds=1,2,3,4,5&players=4&gameMode=sprint
```
✅ 期望：每轮最高价格获得1分，最终积分最高者获胜

### 淘汰模式
```
http://localhost:3000/battles/timeline-test?packIds=1,2,3,4,5&players=4&gameMode=elimination
```
✅ 期望：从中间轮次开始，每轮淘汰最低价格者

### 快速模式
```
http://localhost:3000/battles/timeline-test?packIds=1,2,3&players=4&gameMode=classic&fastBattle=true
```
✅ 期望：老虎机转动速度变快（1秒而不是4.5秒）

---

## 🐛 问题排查

### 问题1：页面空白

**检查**：
```
1. 打开控制台，查看是否有报错
2. 检查 URL 参数是否正确
3. 检查 battleData 是否有数据
```

**解决**：
```typescript
// 在页面添加调试输出
console.log('battleData:', battleData);
console.log('packs:', battleData.packs);
```

### 问题2：老虎机不显示

**检查**：
```typescript
console.log('gameResults:', gameResults);
console.log('currentRoundResults:', currentRoundResults);
console.log('currentPack.items:', currentPack?.items);
```

### 问题3：点击按钮无反应

**检查**：
```typescript
console.log('isPlaying:', isPlaying);
console.log('isPaused:', timelineControl.isPaused);
console.log('state.phase:', state.phase);
```

---

## 📸 预期效果截图说明

### 1. 等待玩家阶段
- 显示空的参与者插槽
- 标题："🎮 时间轴系统测试页面"

### 2. 倒计时阶段
- 大大的数字：3 → 2 → 1
- 数字会闪烁（animate-pulse）

### 3. 老虎机转动阶段
- 4个老虎机同时转动
- 每个老虎机上方显示玩家名字
- 玩家名字下方显示累计价值（绿色）

### 4. 调试面板
- 绿色边框的面板
- 实时显示播放时间
- 进度条动态更新
- 所有按钮可点击

---

## 💡 快速验证核心功能

### 最简单的测试

1. **访问页面**
2. **等5秒**（人满 + 倒计时）
3. **看老虎机转动**
4. **点击"暂停"** ← 如果能暂停，说明时间轴系统工作正常！
5. **点击"播放"** ← 如果能继续，说明控制功能正常！
6. **点击"测试中途加入"** ← 如果能跳转，说明中途加入功能正常！

**如果以上都 OK，时间轴系统就成功了！** ✅

---

## 🚀 性能测试

### 打开性能监控

1. 按 `F12` 打开开发者工具
2. 切换到 `Performance` 标签
3. 点击 Record（录制）
4. 等待一轮对战完成
5. 停止录制

**检查**：
- FPS 应该稳定在 55-60
- 没有明显的长任务（黄色/红色块）
- 内存稳定（不持续增长）

---

## 🎓 测试完成后

如果一切正常，你可以：

1. ✅ 将 `BattlePageExample.tsx` 的逻辑复制到实际的 `page.tsx`
2. ✅ 或者直接在 `page.tsx` 中引入 `BattleTimelinePage`
3. ✅ 对接后端 `start_time` 字段
4. ✅ 部署到生产环境

---

## 📞 遇到问题？

查看以下文档：
- `QUICK_START.md` - 快速入门
- `README_TIMELINE.md` - 系统概述
- `MIGRATION_GUIDE.md` - 迁移指南

或者查看控制台输出的详细日志！

---

🎮 **开始测试吧！**

访问: http://localhost:3000/battles/timeline-test?packIds=1,2,3&players=4

