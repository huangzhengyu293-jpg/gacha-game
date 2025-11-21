# 🧪 测试系统总览

完整的测试场景和文档索引

---

## 📂 文件结构

```
app/battles/
├── [id]/
│   ├── COMPLETE_TEST_SCENARIOS.ts   ← 10个完整测试场景
│   ├── FIXED_TEST_DATA.ts           ← 原始固定测试数据（已弃用）
│   ├── TIME_DRIVEN_RESULTS.md       ← 时间驱动机制文档
│   ├── page.tsx                     ← 入口（使用 page-wrapper）
│   ├── page-wrapper.tsx             ← 智能切换器
│   ├── page-timeline.tsx            ← 时间轴版本
│   └── ...
├── scenario-test/
│   └── page.tsx                     ← 场景选择和运行页面
├── TEST_SCENARIOS_GUIDE.md          ← 详细场景说明文档（本文档）
└── TEST_INDEX.md                    ← 总览索引（当前文件）
```

---

## 🎯 快速访问

### 1. 测试场景选择器
```
http://localhost:3000/battles/scenario-test
```
**功能**: 
- 查看所有10个测试场景
- 按模式分组展示
- 点击运行测试

### 2. 直接运行特定场景
```
http://localhost:3000/battles/test-id?useTimeline=true
```
替换 `test-id` 为以下任意场景ID：
- `classic-4p-no-legendary`
- `classic-4p-with-legendary`
- `elimination-4p`
- `jackpot-4p`
- `sprint-4p`
- `team-2v2-classic`
- `team-3v3-elimination`
- `fast-2p`
- `last-chance-4p`
- `inverted-4p`

### 3. 测试中途加入
```
http://localhost:3000/battles/test-id?simulateJoinTime=10
```
模拟从第10秒加入对战

---

## 📋 测试场景清单

| 模式 | 场景数 | 描述 |
|------|--------|------|
| **经典模式** | 2 | 基础对战 + 二段动画 |
| **淘汰模式** | 2 | 个人淘汰 + 团队淘汰 |
| **大奖模式** | 1 | 赢家通吃 |
| **积分冲刺** | 1 | 品质积分制 |
| **团队模式** | 2 | 2v2 + 3v3 |
| **特殊规则** | 2 | 快速/最后机会/反转 |
| **总计** | **10** | 涵盖所有游戏规则 |

---

## 📖 关键文档

### 1. COMPLETE_TEST_SCENARIOS.ts
**内容**:
- 10个完整测试场景定义
- 每个场景包含：配置、参与者、卡包、轮次、预期结果
- 场景选择器函数

**使用**:
```typescript
import { ALL_TEST_SCENARIOS, getScenarioById } from './COMPLETE_TEST_SCENARIOS';

// 获取所有场景
const scenarios = ALL_TEST_SCENARIOS;

// 获取特定场景
const scenario = getScenarioById('classic-4p-with-legendary');
```

### 2. TEST_SCENARIOS_GUIDE.md
**内容**:
- 每个场景的详细说明
- 轮次设计和时间轴分析
- 预期结果和测试要点
- 检查清单

**用途**: 人工检查场景是否符合游戏规则

### 3. TIME_DRIVEN_RESULTS.md
**内容**:
- 时间驱动机制原理
- `round_spinning` vs `round_complete`
- 二段动画处理
- 中途加入场景分析

**用途**: 理解时间轴系统的核心逻辑

---

## ✅ 测试检查表

### 场景完整性
- [x] 10个场景已创建
- [x] 涵盖所有游戏模式
- [x] 涵盖所有人数配置（2/4/6人）
- [x] 涵盖所有特殊规则
- [x] 包含二段动画测试
- [x] 包含团队模式测试

### 数据完整性
- [ ] 所有itemId对应正确 ← **需要检查**
- [ ] 所有qualityId匹配 ← **需要检查**
- [ ] 所有needsSecondSpin正确 ← **需要检查**
- [ ] 预期结果计算正确 ← **需要检查**

### 时间轴准确性
- [ ] 回正时刻更新金额 ← **需要测试**
- [ ] 回正时刻更新round记录 ← **需要测试**
- [ ] 二段动画正确处理 ← **需要测试**
- [ ] 中途加入正确显示 ← **需要测试**

### UI/UX
- [ ] 场景选择器界面 ← **需要测试**
- [ ] 场景详情展示 ← **需要测试**
- [ ] 运行按钮功能 ← **需要测试**
- [ ] 统计数据正确 ← **需要测试**

---

## 🔧 下一步工作

### 1. 数据验证 ✅ **当前任务**
- 检查所有场景数据是否符合游戏规则
- 验证itemId和qualityId的对应关系
- 确认预期结果的计算

### 2. 集成测试
- 确保场景数据能正确加载到 `page-timeline.tsx`
- 测试所有10个场景的运行
- 验证时间轴的准确性

### 3. UI完善
- 优化场景选择器界面
- 添加测试结果对比功能
- 添加自动化测试报告

### 4. 文档补充
- 添加常见问题(FAQ)
- 添加故障排除指南
- 添加性能优化建议

---

## 📝 记录问题

在测试过程中发现的问题：

### 数据问题
```
场景: 
问题: 
状态: [ ] 待修复 / [ ] 已修复
```

### 时间轴问题
```
场景: 
问题: 
状态: [ ] 待修复 / [ ] 已修复
```

### UI问题
```
场景: 
问题: 
状态: [ ] 待修复 / [ ] 已修复
```

---

## 🎉 完成标准

当以下所有项都勾选时，测试系统视为完成：

- [ ] 所有10个场景数据验证通过
- [ ] 所有场景能正常运行
- [ ] 时间轴系统工作正常
- [ ] UI界面完整且美观
- [ ] 文档完整且易懂
- [ ] 无已知bug

---

**当前状态**: 🟡 数据创建完成，等待用户检查

**下一步**: 用户检查数据 → 集成测试 → UI完善


