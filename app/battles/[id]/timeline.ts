/**
 * 对战时间轴系统
 * 
 * 核心思想：
 * 1. 所有动画结果提前确定（由后端或前端预生成）
 * 2. 将整个对战看作一条时间轴，每个事件有固定的开始时间和持续时间
 * 3. 根据当前播放时间，计算应该显示什么状态
 * 4. 支持中途加入：根据服务器开始时间计算当前应该在哪个位置
 */

import type { SlotSymbol } from '@/app/components/SlotMachine/LuckySlotMachine';

// ========== 时间轴配置 ==========
export const TIMELINE_CONFIG = {
  COUNTDOWN_DURATION: 3000,      // 倒计时 3秒
  SLOT_SPIN_DURATION: 4500,      // 老虎机转动 4.5秒（或快速模式1秒）
  SLOT_SNAP_DURATION: 500,       // 老虎机回正 0.5秒
  ELIMINATION_ANIMATION: 2000,   // 淘汰动画 2秒
  JACKPOT_ANIMATION: 5000,       // 大奖进度条 5秒
  RESULT_DISPLAY: 1000,          // 结果展示 1秒
  FINAL_CELEBRATION: 3000,       // 最终庆祝 3秒
} as const;

// ========== 时间轴事件类型 ==========
export type TimelineEventType = 
  | 'countdown'
  | 'round_start'
  | 'round_spinning'
  | 'round_snapping'
  | 'round_complete'
  | 'elimination'
  | 'jackpot'
  | 'final'
  | 'completed';

export interface TimelineEvent {
  type: TimelineEventType;
  startTime: number;       // 事件开始的绝对时间（ms）
  duration: number;        // 事件持续时间（ms）
  endTime: number;         // 事件结束时间（ms）
  roundIndex?: number;     // 如果是轮次事件，对应的轮次索引
  data?: any;              // 事件相关数据
}

// ========== 当前状态 ==========
export interface PlaybackState {
  currentEvent: TimelineEvent | null;
  progress: number;        // 当前事件的进度 0-1
  playbackTime: number;    // 当前播放时间（ms）
  isCompleted: boolean;    // 是否已完成
  
  // 便捷字段
  currentRound: number;    // 当前轮次索引（-1 表示未开始）
  phase: 'idle' | 'countdown' | 'playing' | 'completed';
}

// ========== 构建时间轴 ==========
export function buildBattleTimeline(
  rounds: any[],
  gameMode: string,
  isFastMode: boolean,
  eliminationData?: any,
  jackpotData?: any
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let currentTime = 0;
  
  // 确定老虎机转动时长
  const spinDuration = isFastMode ? 1000 : TIMELINE_CONFIG.SLOT_SPIN_DURATION;
  const snapDuration = TIMELINE_CONFIG.SLOT_SNAP_DURATION;
  
  // 1. 倒计时
  events.push({
    type: 'countdown',
    startTime: currentTime,
    duration: TIMELINE_CONFIG.COUNTDOWN_DURATION,
    endTime: currentTime + TIMELINE_CONFIG.COUNTDOWN_DURATION,
  });
  currentTime += TIMELINE_CONFIG.COUNTDOWN_DURATION;
  
  // 2. 每一轮
  rounds.forEach((round, index) => {
    // ✅ 检查这轮是否有玩家需要二段动画
    const hasSecondSpin = Object.values(round.results).some((r: any) => r.needsSecondSpin);
    
    // 轮次开始标记
    events.push({
      type: 'round_start',
      startTime: currentTime,
      duration: 0,
      endTime: currentTime,
      roundIndex: index,
    });
    
    // ✅ 第一段：老虎机动画（转动 + 回正）
    const actualSlotDuration = spinDuration + snapDuration;  // 4500 + 500 = 5000ms
    events.push({
      type: 'round_spinning',
      startTime: currentTime,
      duration: actualSlotDuration,
      endTime: currentTime + actualSlotDuration,
      roundIndex: index,
      data: { results: round.results, stage: 1 },
    });
    currentTime += actualSlotDuration;
    
    // 第一段结束后的展示时间
    events.push({
      type: 'round_complete',
      startTime: currentTime,
      duration: TIMELINE_CONFIG.RESULT_DISPLAY,  // 1000ms 展示结果
      endTime: currentTime + TIMELINE_CONFIG.RESULT_DISPLAY,
      roundIndex: index,
      data: { stage: 1 },
    });
    currentTime += TIMELINE_CONFIG.RESULT_DISPLAY;
    
    // ✅ 如果有二段动画
    if (hasSecondSpin) {
      events.push({
        type: 'round_spinning',
        startTime: currentTime,
        duration: actualSlotDuration,  // 第二段也是 5000ms
        endTime: currentTime + actualSlotDuration,
        roundIndex: index,
        data: { results: round.results, stage: 2 },
      });
      currentTime += actualSlotDuration;
      
      // 第二段结束后的展示时间
      events.push({
        type: 'round_complete',
        startTime: currentTime,
        duration: TIMELINE_CONFIG.RESULT_DISPLAY,
        endTime: currentTime + TIMELINE_CONFIG.RESULT_DISPLAY,
        roundIndex: index,
        data: { stage: 2 },
      });
      currentTime += TIMELINE_CONFIG.RESULT_DISPLAY;
      
      console.log(`      ✅ 添加第二段动画 + 展示`);
    }
    
    console.log(`      ✅ 第 ${index + 1} 轮总时长: ${currentTime - events.find(e => e.type === 'round_start' && e.roundIndex === index)!.startTime}ms`);
    
    // 淘汰动画（如果有）
    if (eliminationData?.eliminations?.[index]) {
      const elimData = eliminationData.eliminations[index];
      
      // ✅ 淘汰老虎机时长：转动(2000ms) + 回正(500ms) + 展示(300ms) = 2800ms
      const elimDuration = elimData.needsSlotMachine ? 2800 : 1000;  // 不需要老虎机就只展示1秒
      
      events.push({
        type: 'elimination',
        startTime: currentTime,
        duration: elimDuration,
        endTime: currentTime + elimDuration,
        roundIndex: index,
        data: elimData,
      });
      currentTime += elimDuration;
      console.log(`      ✅ 添加淘汰动画，时长: ${elimDuration}ms (${elimData.needsSlotMachine ? '需要老虎机' : '直接淘汰'})`);
    }
  });
  
  // 3. 最终结算动画
  if (gameMode === 'jackpot' && jackpotData) {
    events.push({
      type: 'jackpot',
      startTime: currentTime,
      duration: TIMELINE_CONFIG.JACKPOT_ANIMATION,
      endTime: currentTime + TIMELINE_CONFIG.JACKPOT_ANIMATION,
      data: jackpotData,
    });
    currentTime += TIMELINE_CONFIG.JACKPOT_ANIMATION;
  }
  
  // 4. 最终庆祝
  events.push({
    type: 'final',
    startTime: currentTime,
    duration: TIMELINE_CONFIG.FINAL_CELEBRATION,
    endTime: currentTime + TIMELINE_CONFIG.FINAL_CELEBRATION,
  });
  currentTime += TIMELINE_CONFIG.FINAL_CELEBRATION;
  
  // 5. 完成标记
  events.push({
    type: 'completed',
    startTime: currentTime,
    duration: Infinity,
    endTime: Infinity,
  });
  
  return events;
}

// ========== 根据播放时间计算当前状态 ==========
export function calculatePlaybackState(
  playbackTime: number,
  timeline: TimelineEvent[]
): PlaybackState {
  // 查找当前正在发生的事件
  let currentEvent: TimelineEvent | null = null;
  let progress = 0;
  
  for (const event of timeline) {
    if (playbackTime >= event.startTime && playbackTime < event.endTime) {
      currentEvent = event;
      progress = event.duration > 0 
        ? (playbackTime - event.startTime) / event.duration 
        : 1;
      break;
    }
  }
  
  // 如果没找到，可能是已完成或还未开始
  if (!currentEvent) {
    const lastEvent = timeline[timeline.length - 1];
    if (playbackTime >= lastEvent.endTime) {
      currentEvent = lastEvent;
      progress = 1;
    } else {
      currentEvent = timeline[0];
      progress = 0;
    }
  }
  
  // 计算当前轮次
  let currentRound = -1;
  if (currentEvent?.roundIndex !== undefined) {
    currentRound = currentEvent.roundIndex;
  } else {
    // 查找最近完成的轮次
    for (let i = timeline.length - 1; i >= 0; i--) {
      const roundIndex = timeline[i].roundIndex;
      if (roundIndex !== undefined && playbackTime >= timeline[i].startTime) {
        currentRound = roundIndex;
        break;
      }
    }
  }
  
  // 确定阶段
  let phase: PlaybackState['phase'] = 'idle';
  if (currentEvent) {
    if (currentEvent.type === 'countdown') {
      phase = 'countdown';
    } else if (currentEvent.type === 'completed' || currentEvent.type === 'final') {
      phase = 'completed';
    } else {
      phase = 'playing';
    }
  }
  
  return {
    currentEvent,
    progress,
    playbackTime,
    isCompleted: currentEvent?.type === 'completed',
    currentRound,
    phase,
  };
}

// ========== 计算玩家在指定时间的累计价值 ==========
export function calculatePlayerValuesAtTime(
  playbackTime: number,
  timeline: TimelineEvent[],
  rounds: any[]
): Record<string, number> {
  const values: Record<string, number> = {};
  
  // 遍历时间轴，累计已完成轮次的价值
  for (const event of timeline) {
    if (event.type === 'round_complete' && event.roundIndex !== undefined) {
      // 检查这轮是否已完成
      if (playbackTime >= event.endTime) {
        const roundIndex = event.roundIndex;
        const roundData = rounds[roundIndex];
        
        if (roundData && roundData.results) {
          Object.entries(roundData.results).forEach(([playerId, result]: [string, any]) => {
            const item = result as { itemId: string; price?: number };
            // 需要从完整数据中找到物品价格
            // 这里假设 result 已包含 price，或者需要从 symbols 中查找
            if (item.price !== undefined) {
              values[playerId] = (values[playerId] || 0) + item.price;
            }
          });
        }
      }
    }
  }
  
  return values;
}

// ========== 获取指定时间应该播放的音效 ==========
export function getAudioEventsAtTime(
  prevTime: number,
  currentTime: number,
  timeline: TimelineEvent[]
): Array<'tick' | 'win' | 'special_win' | 'elimination'> {
  const audioEvents: Array<'tick' | 'win' | 'special_win' | 'elimination'> = [];
  
  // 检查在这个时间段内完成的事件
  for (const event of timeline) {
    if (event.endTime > prevTime && event.endTime <= currentTime) {
      if (event.type === 'round_complete') {
        audioEvents.push('win');
      } else if (event.type === 'elimination') {
        audioEvents.push('elimination');
      } else if (event.type === 'jackpot') {
        audioEvents.push('special_win');
      }
    }
  }
  
  return audioEvents;
}

// ========== 工具函数：格式化时间显示 ==========
export function formatPlaybackTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ========== 调试工具：打印时间轴 ==========
export function debugTimeline(timeline: TimelineEvent[]) {
  // ✅ 禁用日志输出，减少性能影响
  // console.log('\n🎬 ========== 对战时间轴 ==========');
  // timeline.forEach((event, index) => {
  //   console.log(`${index}. [${formatPlaybackTime(event.startTime)} - ${formatPlaybackTime(event.endTime)}] ${event.type}${event.roundIndex !== undefined ? ` (轮次 ${event.roundIndex + 1})` : ''}`);
  // });
  // console.log(`总时长: ${formatPlaybackTime(timeline[timeline.length - 1].startTime)}`);
  // console.log('====================================\n');
}

