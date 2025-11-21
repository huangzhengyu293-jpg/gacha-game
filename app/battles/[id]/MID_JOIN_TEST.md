# 中途加入测试指南

## 🎯 功能说明

时间轴系统支持"中途加入"功能，用户可以在对战进行中的任何时间点进入，系统会计算正确的播放位置并从该点开始展示。

---

## 🧪 测试方法

### 方式 1: 使用 `simulateJoinTime` 参数

在 URL 中添加 `simulateJoinTime` 参数（单位：秒）：

```
/battles/test-id?useTimeline=true&simulateJoinTime=10
```

### 方式 2: 使用真实的 `serverStartTime`

后端返回对战开始时间，前端自动计算经过的时间。

---

## 📊 测试场景

### 完整时间轴（总时长 29 秒）

| 时间 | 阶段 | 说明 |
|------|------|------|
| 0-3s | 倒计时 | 3 → 2 → 1 |
| 3-8s | 第1轮 | 老虎机转动 |
| 8-9s | 第1轮展示 | 显示结果 |
| 9-14s | 第2轮第1阶段 | 老虎机转动 |
| 14-19s | 第2轮第2阶段 | 传说道具二次转动 |
| 19-20s | 第2轮展示 | 显示结果 |
| 20-25s | 第3轮 | 老虎机转动 |
| 25-26s | 第3轮展示 | 显示结果 |
| 26-29s | 最终庆祝 | 🎆 获胜者展示 + 烟花 |
| 29s+ | 完成 | 静态展示获胜者 |

---

## 🔗 测试 URL 示例

### 从头播放
```
/battles/test-id?useTimeline=true
```

### 从倒计时中途进入
```
/battles/test-id?useTimeline=true&simulateJoinTime=1
```
显示: 倒计时 2 或 1

### 从第1轮进入
```
/battles/test-id?useTimeline=true&simulateJoinTime=5
```
显示: 第1轮老虎机转动（从头开始）

### 从第2轮传说阶段进入
```
/battles/test-id?useTimeline=true&simulateJoinTime=15
```
显示: 第2轮第2阶段（传说道具）

### 从最终庆祝进入
```
/battles/test-id?useTimeline=true&simulateJoinTime=27
```
显示: 🎆 获胜者展示 + 烟花

### ✅ 直接显示获胜者（超出总时长）
```
/battles/test-id?useTimeline=true&simulateJoinTime=30
/battles/test-id?useTimeline=true&simulateJoinTime=99999
```
显示: 直接跳到获胜者展示，不播放任何动画

---

## 🎮 智能跳转规则

### 1. 时间小于 0
- 结果: 从头播放（0秒开始）

### 2. 时间在 0 - 29 秒之间
- 如果在 `round_spinning` 事件中间
  - 结果: 跳到该轮次的**开始**（确保看到完整的老虎机动画）
- 否则
  - 结果: 从该时间点继续播放

### 3. 时间 ≥ 29 秒（总时长）
- 结果: **直接显示获胜者**，不播放任何动画 ✅

### 4. 时间 > 总时长 + 10 秒
- 结果: 从头播放（认为数据过期）

---

## 💡 实际使用场景

### 场景 1: 直播式观看
用户在对战进行中进入房间，看到的是当前正在进行的轮次，就像看直播一样。

### 场景 2: 回放功能
用户可以通过调整 `simulateJoinTime` 参数，跳到任意时间点查看对战过程。

### 场景 3: 查看结果
用户只想看最终结果，不想等待动画，可以使用超出总时长的参数直接跳到结果页面。

```
?simulateJoinTime=9999  → 直接显示获胜者 🏆
```

---

## 🐛 调试技巧

### 开发模式调试信息

在开发环境下，倒计时会显示调试信息：

```
Time: 5000ms | Remaining: 1000ms
Playing: ✅ | Phase: countdown
Event: countdown | Duration: 3000ms
```

### 控制台日志

时间轴系统会在控制台输出关键信息：
- 时间轴构建完成
- 当前播放状态
- 事件切换

---

## ⚠️ 注意事项

1. **老虎机中途加入**: 如果进入时正好在老虎机转动中间，系统会自动跳到该轮开始，确保用户看到完整的转动过程。

2. **二段动画**: 第2轮包含传说道具的二段动画，进入时需要注意时间点。

3. **烟花效果**: 烟花会在进入 `final` 阶段（26-29秒）时自动触发。

4. **移动端性能**: 移动端更新频率降低到 20fps，确保流畅播放。

---

## 📌 快速测试命令

```bash
# 测试从头播放
curl http://localhost:3000/battles/test-id?useTimeline=true

# 测试中途加入第2轮
curl http://localhost:3000/battles/test-id?useTimeline=true&simulateJoinTime=15

# 测试直接显示结果
curl http://localhost:3000/battles/test-id?useTimeline=true&simulateJoinTime=99
```

---

**祝测试愉快！** 🎉


