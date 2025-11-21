/**
 * 对战时间轴控制 Hook
 * 
 * 基于时间轴驱动整个对战流程
 * 支持中途加入、快进、暂停等功能
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  buildBattleTimeline, 
  calculatePlaybackState, 
  debugTimeline,
  type TimelineEvent,
  type PlaybackState 
} from '../timeline';
import type { BattleData } from '../types';

interface UseBattleTimelineOptions {
  battleData: BattleData;
  rounds: any[];  // 预生成的轮次数据
  gameMode: string;
  isFastMode: boolean;
  eliminationData?: any;
  jackpotData?: any;
  sprintData?: any;
  serverStartTime?: string;  // 服务器开始时间（ISO 8601）
  onComplete?: () => void;
}

interface UseBattleTimelineReturn {
  // 当前状态
  state: PlaybackState;
  
  // 时间轴
  timeline: TimelineEvent[];
  totalDuration: number;
  
  // 控制方法
  play: () => void;
  pause: () => void;
  jumpTo: (time: number) => void;
  reset: () => void;
  
  // 便捷字段
  isPlaying: boolean;
  isPaused: boolean;
  isCountingDown: boolean;
  currentRound: number;
  currentRoundResults: Record<string, any> | null;
  
  // 玩家数据
  playerValues: Record<string, number>;  // 每个玩家的累计价值
}

export function useBattleTimeline(options: UseBattleTimelineOptions): UseBattleTimelineReturn {
  const {
    battleData,
    rounds,
    gameMode,
    isFastMode,
    eliminationData,
    jackpotData,
    sprintData,
    serverStartTime,
    onComplete,
  } = options;
  
  // 构建时间轴（只构建一次）
  const timeline = useMemo(() => {
    const tl = buildBattleTimeline(rounds, gameMode, isFastMode, eliminationData, jackpotData);
    // debugTimeline(tl);  // ✅ 禁用调试打印
    return tl;
  }, [rounds, gameMode, isFastMode, eliminationData, jackpotData]);
  
  // 总时长
  const totalDuration = useMemo(() => {
    const lastEvent = timeline[timeline.length - 1];
    return lastEvent.startTime;
  }, [timeline]);
  
  // 计算初始播放时间（如果有服务器开始时间，则计算中途加入的位置）
  const initialPlaybackTime = useMemo(() => {
    if (!serverStartTime) {
      return 0;
    }
    
    try {
      const serverStart = new Date(serverStartTime).getTime();
      const now = Date.now();
      let elapsed = now - serverStart;
      
      // ✅ 如果已经结束，直接跳到最后（展示获胜者）
      if (elapsed >= totalDuration) {
        return totalDuration;
      }
      
      // 如果还没开始或已经结束很久，从头播放
      if (elapsed < 0 || elapsed > totalDuration + 10000) {
        return 0;
      }
      
      // ✅ 关键修复：如果进入的时间在 round_spinning 事件中间，跳到该事件的开始
      const currentEvent = timeline.find(e => 
        elapsed >= e.startTime && elapsed < e.endTime
      );
      
      if (currentEvent && currentEvent.type === 'round_spinning') {
        elapsed = currentEvent.startTime;  // 跳到该轮开始
      }
      
      return elapsed;
    } catch (error) {
      return 0;
    }
  }, [serverStartTime, totalDuration, timeline]);
  
  // 播放状态
  const [playbackTime, setPlaybackTime] = useState(initialPlaybackTime);
  const [isPlaying, setIsPlaying] = useState(false);  // ✅ 先暂停，初始化完成后再播放
  const [isPaused, setIsPaused] = useState(false);
  
  // 播放起始时间（用于计算漂移）
  const playbackStartTimeRef = useRef<number>(Date.now());
  const playbackStartValueRef = useRef<number>(initialPlaybackTime);
  
  // ✅ 自动启动播放
  useEffect(() => {
    // 等待一帧确保组件渲染完成
    const rafId = requestAnimationFrame(() => {
      const now = Date.now();
      playbackStartTimeRef.current = now;
      playbackStartValueRef.current = initialPlaybackTime;
      setPlaybackTime(initialPlaybackTime);  // ✅ 确保设置初始播放时间
      
      // ✅ 如果已经到达结束时间，不启动播放循环
      if (initialPlaybackTime >= totalDuration) {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [initialPlaybackTime, totalDuration]);
  
  // 计算当前状态（添加缓存，减少计算频率）
  const prevStateRef = useRef<PlaybackState | null>(null);
  const state = useMemo(() => {
    const newState = calculatePlaybackState(playbackTime, timeline);
    
    // ✅ 如果事件类型没变，复用之前的状态对象（减少下游 re-render）
    if (prevStateRef.current && 
        prevStateRef.current.currentEvent?.type === newState.currentEvent?.type &&
        prevStateRef.current.currentRound === newState.currentRound) {
      return prevStateRef.current;
    }
    
    prevStateRef.current = newState;
    return newState;
  }, [playbackTime, timeline]);
  
  // ✅ 计算玩家累计价值（老虎机回正时更新）
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
    
    // 遍历已完成的轮次，累加物品价格
    completedRounds.forEach(i => {
      const roundData = rounds[i];
      if (!roundData || !roundData.results) return;
      
      Object.entries(roundData.results).forEach(([playerId, result]: [string, any]) => {
        // 从虚拟数据中查找物品信息
        const pack = battleData.packs[i];
        if (pack?.items) {
          const item = pack.items.find((it: any) => it.id === result.itemId);
          if (item) {
            values[playerId] = (values[playerId] || 0) + (item.price || 0);
          }
        }
      });
    });
    
    return values;
  }, [playbackTime, timeline, rounds, battleData.packs]);
  
  // 播放循环
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    
    let rafId: number;
    let lastUpdateTime = Date.now();
    
    // ✅ 检测设备性能，手机端降低更新频率
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const updateInterval = isMobile ? 50 : 33;  // 手机 20fps，桌面 30fps
    
    const tick = () => {
      const now = Date.now();
      const realElapsed = now - playbackStartTimeRef.current;
      const newPlaybackTime = playbackStartValueRef.current + realElapsed;
      
      // ✅ 节流更新（手机端降低频率）
      if (now - lastUpdateTime >= updateInterval) {
        setPlaybackTime(newPlaybackTime);
        lastUpdateTime = now;
      }
      
      // 检查是否完成
      if (newPlaybackTime >= totalDuration) {
        setIsPlaying(false);
        if (onComplete) {
          onComplete();
        }
        return;
      }
      
      rafId = requestAnimationFrame(tick);
    };
    
    rafId = requestAnimationFrame(tick);
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isPlaying, isPaused, totalDuration, onComplete]);
  
  // 控制方法
  const play = useCallback(() => {
    if (playbackTime >= totalDuration) {
      // 如果已经结束，重新开始
      setPlaybackTime(0);
      playbackStartTimeRef.current = Date.now();
      playbackStartValueRef.current = 0;
    } else {
      playbackStartTimeRef.current = Date.now();
      playbackStartValueRef.current = playbackTime;
    }
    setIsPlaying(true);
    setIsPaused(false);
  }, [playbackTime, totalDuration]);
  
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);
  
  const jumpTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, totalDuration));
    setPlaybackTime(clampedTime);
    playbackStartTimeRef.current = Date.now();
    playbackStartValueRef.current = clampedTime;
  }, [totalDuration]);
  
  const reset = useCallback(() => {
    setPlaybackTime(0);
    playbackStartTimeRef.current = Date.now();
    playbackStartValueRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
  }, []);
  
  // 获取当前轮次的结果
  const currentRoundResults = useMemo(() => {
    if (state.currentRound >= 0 && state.currentRound < rounds.length) {
      return rounds[state.currentRound].results;
    }
    return null;
  }, [state.currentRound, rounds]);
  
  return {
    // 状态
    state,
    timeline,
    totalDuration,
    
    // 控制
    play,
    pause,
    jumpTo,
    reset,
    
    // 便捷字段
    isPlaying,
    isPaused,
    isCountingDown: state.currentEvent?.type === 'countdown',
    currentRound: state.currentRound,
    currentRoundResults,
    playerValues,
  };
}


