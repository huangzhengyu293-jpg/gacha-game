/**
 * 对战结果生成工具
 * 
 * 提取自原来的 generateAllResults 函数
 * 用于前端预生成或验证后端返回的数据
 */

import type { SlotSymbol } from '@/app/components/SlotMachine/LuckySlotMachine';
import type { BattleData } from '../types';

interface RoundPools {
  normal: SlotSymbol[];
  legendary: SlotSymbol[];
  placeholder: SlotSymbol;
}

interface RoundResult {
  itemId: string;
  qualityId: string | null;
  poolType: 'normal' | 'legendary';
  needsSecondSpin: boolean;
}

export interface GeneratedRound {
  pools: RoundPools;
  results: Record<string, RoundResult>;
}

// 创建金色占位符
function createGoldenPlaceholder(): SlotSymbol {
  return {
    id: 'golden_placeholder',
    name: '金色神秘',
    image: '/theme/default/hidden-gold.webp',
    price: 0,
    qualityId: 'placeholder',
    description: '',
    dropProbability: 0
  };
}

// 处理道具池（分离legendary，替换为占位符）
function processSymbolPools(packItems: any[]): RoundPools {
  const legendaryPool = packItems.filter(s => s.qualityId === 'legendary');
  const normalSymbols = packItems.filter(s => s.qualityId !== 'legendary');
  
  const placeholder = createGoldenPlaceholder();
  const normalPool = legendaryPool.length > 0 
    ? [...normalSymbols, placeholder]
    : normalSymbols;
  
  return { 
    normal: normalPool, 
    legendary: legendaryPool, 
    placeholder 
  };
}

// ========== 主函数：生成所有轮次的结果 ==========
export function generateAllBattleResults(
  battleData: BattleData,
  allParticipants: any[]
): {
  rounds: GeneratedRound[];
  jackpotWinner?: any;
  sprintData?: any;
  eliminationData?: any;
} {
  console.log('🎲 [generateAllBattleResults] 开始生成结果');
  console.log('  - battleData.packs.length:', battleData.packs.length);
  console.log('  - allParticipants.length:', allParticipants.length);
  
  const rounds: GeneratedRound[] = [];
  const detailedResults: Record<number, Record<string, any>> = {};
  
  // 为每个礼包/轮次生成结果
  battleData.packs.forEach((pack, packIndex) => {
    console.log(`  📦 处理礼包 ${packIndex + 1}: ${pack.name}`);
    console.log('    - pack.items:', pack.items);
    console.log('    - pack.items.length:', pack.items?.length || 0);
    
    const pools = processSymbolPools(pack.items || []);
    console.log('    - pools.normal.length:', pools.normal.length);
    console.log('    - pools.legendary.length:', pools.legendary.length);
    
    if (pools.normal.length === 0) {
      console.log('    ⚠️ pools.normal 是空的，跳过这个礼包');
      return;
    }
    
    const results: Record<string, RoundResult> = {};
    detailedResults[packIndex] = {};
    
    allParticipants.forEach(participant => {
      if (participant && participant.id) {
        // 从完整列表随机抽取
        const allSymbols = [
          ...pools.normal.filter(s => s.id !== 'golden_placeholder'), 
          ...pools.legendary
        ];
        const randomSymbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
        
        const isLegendary = randomSymbol.qualityId === 'legendary';
        
        results[participant.id] = {
          itemId: randomSymbol.id,
          qualityId: randomSymbol.qualityId || null,
          poolType: isLegendary ? 'legendary' : 'normal',
          needsSecondSpin: isLegendary
        };
        
        detailedResults[packIndex][participant.id] = {
          道具: randomSymbol.name,
          品质: randomSymbol.qualityId,
          价格: `¥${randomSymbol.price}`,
          需要二段: isLegendary ? '是 💛' : '否'
        };
      }
    });
    
    rounds.push({ pools, results });
  });
  
  console.log('📋 ========== 所有轮次预生成结果汇总 ==========');
  console.table(detailedResults);
  console.log('==============================================');
  
  // 根据游戏模式计算获胜者
  let jackpotWinner, sprintData, eliminationData;
  
  if (battleData.mode === 'jackpot') {
    jackpotWinner = calculateJackpotWinner(allParticipants, detailedResults, battleData);
  } else if (battleData.mode === 'sprint') {
    sprintData = calculateSprintWinner(allParticipants, detailedResults, battleData);
  } else if (battleData.mode === 'elimination') {
    eliminationData = calculateElimination(allParticipants, detailedResults, battleData);
  }
  
  return {
    rounds,
    jackpotWinner,
    sprintData,
    eliminationData,
  };
}

// ========== 大奖模式：计算获胜者 ==========
function calculateJackpotWinner(
  allParticipants: any[],
  detailedResults: Record<number, Record<string, any>>,
  battleData: BattleData
) {
  console.log('\n🎯🎯🎯 [大奖模式] 计算获胜者 🎯🎯🎯');
  
  const playerTotals: Record<string, { name: string; totalValue: number }> = {};
  
  allParticipants.forEach(p => {
    if (p && p.id) {
      playerTotals[p.id] = { name: p.name, totalValue: 0 };
      
      Object.values(detailedResults).forEach((roundRes: any) => {
        const item = roundRes[p.id];
        if (item && item.价格) {
          const price = parseFloat(item.价格.replace('¥', ''));
          playerTotals[p.id].totalValue += price;
        }
      });
    }
  });
  
  let maxValue = -1;
  let topPlayerId = '';
  
  Object.entries(playerTotals).forEach(([id, data]) => {
    console.log(`👤 ${data.name}: $${data.totalValue.toFixed(2)}`);
    if (data.totalValue > maxValue) {
      maxValue = data.totalValue;
      topPlayerId = id;
    }
  });
  
  const topPlayer = allParticipants.find(p => p.id === topPlayerId);
  let winnerIds: string[] = [topPlayerId];
  
  if (topPlayer && topPlayer.teamId) {
    const winningTeam = allParticipants.filter(p => p && p.teamId === topPlayer.teamId);
    winnerIds = winningTeam.map(p => p.id);
  }
  
  console.log(`🏆 获胜者: ${playerTotals[topPlayerId]?.name}, 金额: $${maxValue.toFixed(2)}`);
  console.log('🎯🎯🎯 [大奖模式答案计算完成] 🎯🎯🎯\n');
  
  return { 
    id: topPlayerId, 
    name: playerTotals[topPlayerId]?.name, 
    totalValue: maxValue,
    teamIds: winnerIds
  };
}

// ========== 积分冲刺模式：计算获胜者 ==========
function calculateSprintWinner(
  allParticipants: any[],
  detailedResults: Record<number, Record<string, any>>,
  battleData: BattleData
) {
  console.log('\n🏃🏃🏃 [积分冲刺模式] 计算获胜者 🏃🏃🏃');
  
  const scores: Record<string, number> = {};
  const roundWinners: Record<number, string[]> = {};
  const isTeamMode = battleData.battleType === 'team';
  const isInverted = battleData.isInverted || false;
  
  if (isTeamMode) {
    const teams = new Set(allParticipants.map(p => p.teamId).filter(Boolean));
    teams.forEach(teamId => { scores[teamId!] = 0; });
  } else {
    allParticipants.forEach(p => { scores[p.id] = 0; });
  }
  
  // 计算每轮得分
  Object.keys(detailedResults).forEach((roundKey) => {
    const round = parseInt(roundKey);
    const roundResult = detailedResults[round];
    const roundPrices: Record<string, number> = {};
    
    if (isTeamMode) {
      const teamTotals: Record<string, number> = {};
      allParticipants.forEach(p => {
        if (!p || !p.id || !p.teamId) return;
        const item = roundResult[p.id];
        if (!item || !item.价格) return;
        const price = parseFloat(item.价格.replace('¥', ''));
        teamTotals[p.teamId] = (teamTotals[p.teamId] || 0) + price;
      });
      Object.assign(roundPrices, teamTotals);
    } else {
      allParticipants.forEach(p => {
        if (!p || !p.id) return;
        const item = roundResult[p.id];
        if (!item || !item.价格) return;
        const price = parseFloat(item.价格.replace('¥', ''));
        roundPrices[p.id] = price;
      });
    }
    
    const targetPrice = isInverted 
      ? Math.min(...Object.values(roundPrices))
      : Math.max(...Object.values(roundPrices));
    
    const winners: string[] = [];
    Object.entries(roundPrices).forEach(([id, price]) => {
      if (price === targetPrice) {
        scores[id] = (scores[id] || 0) + 1;
        winners.push(id);
      }
    });
    
    roundWinners[round] = winners;
  });
  
  const maxScore = Math.max(...Object.values(scores));
  const topScorers = Object.entries(scores)
    .filter(([_, score]) => score === maxScore)
    .map(([id]) => id);
  
  const needsTiebreaker = topScorers.length > 1;
  const finalWinnerId = topScorers[Math.floor(Math.random() * topScorers.length)];
  
  console.log(`🏆 最高分: ${maxScore}, 获胜者: ${finalWinnerId}`);
  console.log('🏃🏃🏃 [积分冲刺模式答案计算完成] 🏃🏃🏃\n');
  
  return {
    scores,
    roundWinners,
    finalWinnerId,
    needsTiebreaker,
    tiebreakerPlayers: needsTiebreaker ? topScorers : []
  };
}

// ========== 淘汰模式：计算淘汰数据 ==========
function calculateElimination(
  allParticipants: any[],
  detailedResults: Record<number, Record<string, any>>,
  battleData: BattleData
) {
  console.log('\n🔥🔥🔥 [淘汰模式] 计算淘汰数据 🔥🔥🔥');
  
  const totalRounds = battleData.packs.length;
  const playersCount = allParticipants.length;
  const eliminationStartRound = totalRounds - (playersCount - 1);
  
  const eliminations: Record<number, any> = {};
  let activePlayerIds = allParticipants.map(p => p.id);
  
  const eliminationCount = playersCount - 1;
  for (let i = 0; i < eliminationCount && (eliminationStartRound + i) < totalRounds; i++) {
    const roundIdx = eliminationStartRound + i;
    const roundResult = detailedResults[roundIdx];
    if (!roundResult) continue;
    
    const playerPrices: Array<{ id: string; name: string; price: number }> = [];
    
    activePlayerIds.forEach(playerId => {
      const item = roundResult[playerId];
      if (item && item.价格) {
        const price = parseFloat(item.价格.replace('¥', ''));
        const player = allParticipants.find(p => p.id === playerId);
        playerPrices.push({ id: playerId, name: player?.name || 'Unknown', price });
      }
    });
    
    const targetPrice = battleData.isInverted 
      ? Math.max(...playerPrices.map(p => p.price))
      : Math.min(...playerPrices.map(p => p.price));
    
    const targetPlayers = playerPrices.filter(p => p.price === targetPrice);
    
    if (targetPlayers.length === 1) {
      const eliminated = targetPlayers[0];
      eliminations[roundIdx] = {
        eliminatedPlayerId: eliminated.id,
        eliminatedPlayerName: eliminated.name,
        needsSlotMachine: false
      };
    } else {
      const randomIndex = Math.floor(Math.random() * targetPlayers.length);
      const eliminated = targetPlayers[randomIndex];
      eliminations[roundIdx] = {
        eliminatedPlayerId: eliminated.id,
        eliminatedPlayerName: eliminated.name,
        needsSlotMachine: true,
        tiedPlayerIds: targetPlayers.map(p => p.id)
      };
    }
    
    activePlayerIds = activePlayerIds.filter(id => id !== eliminations[roundIdx].eliminatedPlayerId);
  }
  
  console.log(`🏆 最终获胜者: ${allParticipants.find(p => p.id === activePlayerIds[0])?.name}`);
  console.log('🔥🔥🔥 [淘汰模式答案计算完成] 🔥🔥🔥\n');
  
  return {
    eliminations,
    eliminationStartRound,
    finalWinnerId: activePlayerIds[0]
  };
}

