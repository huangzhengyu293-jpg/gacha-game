/**
 * 固定的测试数据
 * 用于时间轴系统测试，确保每次结果一致
 */

// 🎮 游戏配置
export const FIXED_GAME_CONFIG = {
  gameMode: 'classic' as 'classic' | 'share' | 'sprint' | 'jackpot' | 'elimination',
  battleType: 'solo' as 'solo' | 'team',
  teamStructure: undefined as '2v2' | '3v3' | '2v2v2' | undefined,
  playersCount: 6,
  isFastMode: false,
  isLastChance: false,
  isInverted: false,
};

// 固定的参与者
export const FIXED_PARTICIPANTS = [
  {
    id: 'player-1',
    name: '测试玩家1',
    avatar: 'https://avatar.vercel.sh/player1.svg',
    totalValue: '$0.00',
    isWinner: false,
    items: [],
  },
  {
    id: 'bot-1',
    name: '机器人2',
    avatar: '',
    totalValue: '$0.00',
    isWinner: false,
    items: [],
  },
  {
    id: 'bot-2',
    name: '机器人3',
    avatar: '',
    totalValue: '$0.00',
    isWinner: false,
    items: [],
  },
  {
    id: 'bot-3',
    name: '机器人4',
    avatar: '',
    totalValue: '$0.00',
    isWinner: false,
    items: [],
  },
  {
    id: 'bot-4',
    name: '机器人5',
    avatar: '',
    totalValue: '$0.00',
    isWinner: false,
    items: [],
  },
  {
    id: 'bot-5',
    name: '机器人6',
    avatar: '',
    totalValue: '$0.00',
    isWinner: false,
    items: [],
  },
];

// 固定的礼包数据
export const FIXED_PACKS_DATA = [
  {
    id: "pack-1",
    name: "不给糖就捣蛋宝可梦",
    image: "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-3840,c-at_max",
    value: "$398.30",
    items: [
      { id: "item_1_1", name: "仙子伊布 VMAX", image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max", price: 735, dropProbability: 0.1, qualityId: "epic" },
      { id: "item_1_2", name: "火箭队的超梦前任", image: "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max", price: 685, dropProbability: 0.1, qualityId: "epic" },
      { id: "item_1_3", name: "Zekrom ex", image: "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max", price: 588, dropProbability: 0.1, qualityId: "rare" },
      { id: "item_1_4", name: "喷火龙ex", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max", price: 385, dropProbability: 0.1, qualityId: "rare" },
      { id: "item_1_5", name: "雷希拉姆", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max", price: 255, dropProbability: 0.1, qualityId: "uncommon" },
      { id: "item_1_6", name: "盖诺赛克特", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max", price: 79, dropProbability: 0.1, qualityId: "common" },
      { id: "item_1_7", name: "精灵球", image: "https://ik.imagekit.io/hr727kunx/products/cmgo7mskd0000ju0kmqso6xbn_2808674__6u5KNOlaE", price: 1, dropProbability: 0.45, qualityId: "common" },
    ]
  },
  {
    id: "pack-2",
    name: "传说宝可梦礼包",
    image: "https://ik.imagekit.io/hr727kunx/community_packs/version18.png",
    value: "$25.00",
    items: [
      { id: "item_2_1", name: "离子（传说）", image: "https://ik.imagekit.io/hr727kunx/products/cmgo7y7z50001l50i3dvrh5t7_2587383__KszFCRqvU", price: 25, dropProbability: 0.01, qualityId: "legendary" },
      { id: "item_2_2", name: "莉莉（传说）", image: "https://ik.imagekit.io/hr727kunx/products/cmgo82y170000jp0fc2k2gj4y_949410__jYZt5PBjQ", price: 70, dropProbability: 0.01, qualityId: "legendary" },
      { id: "item_2_3", name: "仙子伊布 VMAX", image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max", price: 735, dropProbability: 0.1, qualityId: "epic" },
      { id: "item_2_4", name: "茴香", image: "https://ik.imagekit.io/hr727kunx/products/cmgo7qf8u0000jv0m5vqdxffv_6839547__emfZVD1ch", price: 1.95, dropProbability: 0.1, qualityId: "rare" },
      { id: "item_2_5", name: "精灵球", image: "https://ik.imagekit.io/hr727kunx/products/cmgo7mskd0000ju0kmqso6xbn_2808674__6u5KNOlaE", price: 1, dropProbability: 0.78, qualityId: "common" },
    ]
  },
  {
    id: "pack-3",
    name: "混合礼包",
    image: "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-3840,c-at_max",
    value: "$120.00",
    items: [
      { id: "item_3_1", name: "火箭队的超梦前任", image: "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max", price: 685, dropProbability: 0.15, qualityId: "epic" },
      { id: "item_3_2", name: "Zekrom ex", image: "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max", price: 588, dropProbability: 0.15, qualityId: "rare" },
      { id: "item_3_3", name: "喷火龙ex", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max", price: 385, dropProbability: 0.2, qualityId: "rare" },
      { id: "item_3_4", name: "雷希拉姆", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max", price: 255, dropProbability: 0.2, qualityId: "uncommon" },
      { id: "item_3_5", name: "盖诺赛克特", image: "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max", price: 79, dropProbability: 0.3, qualityId: "common" },
    ]
  },
 
];

// 🎯 固定的预设答案（每轮每个玩家开出什么）
export const FIXED_RESULTS = {
  rounds: [
    // 第1轮
    {
      results: {
        'player-1': { itemId: 'item_1_1', qualityId: 'epic', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-1': { itemId: 'item_1_3', qualityId: 'rare', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-2': { itemId: 'item_1_4', qualityId: 'rare', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-3': { itemId: 'item_1_7', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-4': { itemId: 'item_1_7', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-5': { itemId: 'item_1_7', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
      } as Record<string, { itemId: string; qualityId: string; poolType: 'normal' | 'legendary'; needsSecondSpin: boolean }>
    },
    // 第2轮（有 legendary，需要二段动画）
    {
      results: {
        'player-1': { itemId: 'item_2_1', qualityId: 'legendary', poolType: 'legendary' as const, needsSecondSpin: true },
        'bot-1': { itemId: 'item_2_2', qualityId: 'legendary', poolType: 'legendary' as const, needsSecondSpin: true },
        'bot-2': { itemId: 'item_2_3', qualityId: 'epic', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-3': { itemId: 'item_2_5', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-4': { itemId: 'item_2_5', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-5': { itemId: 'item_2_5', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
      } as Record<string, { itemId: string; qualityId: string; poolType: 'normal' | 'legendary'; needsSecondSpin: boolean }>
    },
    // 第3轮
    {
      results: {
        'player-1': { itemId: 'item_3_1', qualityId: 'epic', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-1': { itemId: 'item_3_2', qualityId: 'rare', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-2': { itemId: 'item_3_3', qualityId: 'rare', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-3': { itemId: 'item_3_5', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-4': { itemId: 'item_3_5', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
        'bot-5': { itemId: 'item_3_5', qualityId: 'common', poolType: 'normal' as const, needsSecondSpin: false },
      } as Record<string, { itemId: string; qualityId: string; poolType: 'normal' | 'legendary'; needsSecondSpin: boolean }>
    },
  
  ]
};

// 🏆 最终胜者和统计数据
export const EXPECTED_SUMMARY = {
  winner: {
    id: 'bot-2',
    name: '机器人3',
    totalValue: 1505, // 385 + 735 + 385
  },
  playersSummary: [
    {
      id: 'player-1',
      name: '测试玩家1',
      totalValue: 1445, // 735 + 25 + 685
      items: [
        { id: 'item_1_1', name: '仙子伊布 VMAX', price: 735, qualityId: 'epic' },
        { id: 'item_2_1', name: '离子（传说）', price: 25, qualityId: 'legendary' },
        { id: 'item_3_1', name: '火箭队的超梦前任', price: 685, qualityId: 'epic' },
      ],
      isWinner: false,
    },
    {
      id: 'bot-1',
      name: '机器人2',
      totalValue: 1246, // 588 + 70 + 588
      items: [
        { id: 'item_1_3', name: 'Zekrom ex', price: 588, qualityId: 'rare' },
        { id: 'item_2_2', name: '莉莉（传说）', price: 70, qualityId: 'legendary' },
        { id: 'item_3_2', name: 'Zekrom ex', price: 588, qualityId: 'rare' },
      ],
      isWinner: false,
    },
    {
      id: 'bot-2',
      name: '机器人3',
      totalValue: 1505, // 385 + 735 + 385
      items: [
        { id: 'item_1_4', name: '喷火龙ex', price: 385, qualityId: 'rare' },
        { id: 'item_2_3', name: '仙子伊布 VMAX', price: 735, qualityId: 'epic' },
        { id: 'item_3_3', name: '喷火龙ex', price: 385, qualityId: 'rare' },
      ],
      isWinner: true,
    },
    {
      id: 'bot-3',
      name: '机器人4',
      totalValue: 81, // 1 + 1 + 79
      items: [
        { id: 'item_1_7', name: '精灵球', price: 1, qualityId: 'common' },
        { id: 'item_2_5', name: '精灵球', price: 1, qualityId: 'common' },
        { id: 'item_3_5', name: '盖诺赛克特', price: 79, qualityId: 'common' },
      ],
      isWinner: false,
    },
    {
      id: 'bot-4',
      name: '机器人5',
      totalValue: 81, // 1 + 1 + 79
      items: [
        { id: 'item_1_7', name: '精灵球', price: 1, qualityId: 'common' },
        { id: 'item_2_5', name: '精灵球', price: 1, qualityId: 'common' },
        { id: 'item_3_5', name: '盖诺赛克特', price: 79, qualityId: 'common' },
      ],
      isWinner: false,
    },
    {
      id: 'bot-5',
      name: '机器人6',
      totalValue: 81, // 1 + 1 + 79
      items: [
        { id: 'item_1_7', name: '精灵球', price: 1, qualityId: 'common' },
        { id: 'item_2_5', name: '精灵球', price: 1, qualityId: 'common' },
        { id: 'item_3_5', name: '盖诺赛克特', price: 79, qualityId: 'common' },
      ],
      isWinner: false,
    },
  ],
  totalRounds: 3,
};

// 📝 时间轴说明
export const TIMELINE_EXPLANATION = `
🎬 完整时间轴流程:
1. 倒计时 3秒 (0-3s)
2. 第1轮滚动 5秒 (3-8s) - 无二段动画
3. 第1轮完成展示 1秒 (8-9s)
4. 第2轮滚动 5秒 (9-14s) - player-1 和 bot-1 需要二段动画（传说）
5. 第2轮二段滚动 5秒 (14-19s) - 只有需要的玩家
6. 第2轮完成展示 1秒 (19-20s)
7. 第3轮滚动 5秒 (20-25s) - 无二段动画
8. 第3轮完成展示 1秒 (25-26s)
9. 最终结果展示 3秒 (26-29s)
10. 完成 (29s+)

预期结果:
- 胜者: bot-2 (机器人3) - 总价值 $1505
- player-1: $1445
- bot-1: $1246
- bot-3: $81

🧪 测试中途加入:
- 访问 ?simulateJoinTime=10 - 从第10秒进入（第2轮）
- 访问 ?simulateJoinTime=30 - 超出总时长，直接显示获胜者
- 访问 ?simulateJoinTime=99999 - 超出总时长，直接显示获胜者
`;

