"use client";

import type { BattleData, Participant } from "../types";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import LoadingSpinnerIcon from "@/app/components/icons/LoadingSpinner";
import { useI18n } from "@/app/components/I18nProvider";
import { allocateJackpotPercentageBps } from "../utils";
import StreamerBadge from "@/app/components/StreamerBadge";

function clampSlotIndex(value: number, totalSlots: number) {
  if (!Number.isFinite(value)) return 0;
  if (totalSlots <= 0) return 0;
  if (value < 0) return 0;
  const maxIndex = Math.max(totalSlots - 1, 0);
  if (value > maxIndex) return maxIndex;
  return value;
}

function allocateParticipantsToSlots(participants: Participant[], totalSlots: number) {
  if (totalSlots <= 0) {
    return [];
  }
  const snapshot: Array<Participant | null> = Array.from({ length: totalSlots }, () => null);
  participants.forEach((participant, fallbackIndex) => {
    const preferredIndex =
      typeof participant.slotIndex === "number" ? participant.slotIndex : fallbackIndex;
    let targetIndex = clampSlotIndex(preferredIndex, totalSlots);
    let attempts = 0;
    while (
      snapshot[targetIndex] &&
      snapshot[targetIndex]?.id !== participant.id &&
      attempts < totalSlots
    ) {
      targetIndex = (targetIndex + 1) % totalSlots;
      attempts += 1;
    }
    snapshot[targetIndex] = participant;
  });
  return snapshot;
}

const formatSlotNumber = (slotIndex: number) => slotIndex + 1;

function normalizeSlotArray(value: unknown, totalSlots: number): Array<Participant | null> {
  const safeTotal = Number.isFinite(totalSlots) && totalSlots > 0 ? Math.floor(totalSlots) : 0;
  const base: Array<Participant | null> = Array.isArray(value) ? (value as Array<Participant | null>) : [];
  const next = base.slice(0, safeTotal);
  while (next.length < safeTotal) next.push(null);
  return next;
}

// ✅ pending 阶段（召唤机器人/加入玩家）只“填充空槽”，不清空已有槽位，避免其他槽位按钮闪烁
function mergeSlotsForPending(prevSlots: Array<Participant | null>, nextSlots: Array<Participant | null>) {
  const result = [...prevSlots];
  const placedIds = new Set<string>();

  result.forEach((p) => {
    if (p?.id) placedIds.add(p.id);
  });

  // 先按 index 对齐填充，尽量贴合后端 slotIndex/顺序
  for (let i = 0; i < result.length; i++) {
    if (result[i]) continue;
    const candidate = nextSlots[i];
    if (!candidate?.id) continue;
    if (placedIds.has(candidate.id)) continue;
    result[i] = candidate;
    placedIds.add(candidate.id);
  }

  // 再把剩余未放入的参与者依序填到空位
  const remaining = nextSlots.filter((p) => p?.id && !placedIds.has(p.id)) as Participant[];
  let cursor = 0;
  for (let i = 0; i < result.length && cursor < remaining.length; i++) {
    if (result[i]) continue;
    result[i] = remaining[cursor];
    placedIds.add(remaining[cursor].id);
    cursor += 1;
  }

  return result;
}

const QUALITY_COLOR_FALLBACK: Record<string, string> = {
  legendary: '#E4AE33',
  mythic: '#EB4B4B',
  epic: '#8847FF',
  rare: '#4B69FF',
  common: '#829DBB',
  placeholder: '#E4AE33',
};

function resolveGlowColor(result?: SlotSymbol): string {
  if (!result) {
    return QUALITY_COLOR_FALLBACK.common;
  }

  if (result.qualityId && QUALITY_COLOR_FALLBACK[result.qualityId]) {
    return QUALITY_COLOR_FALLBACK[result.qualityId];
  }
  return QUALITY_COLOR_FALLBACK.common;
}

interface ParticipantsWithPrizesProps {
  battleData: BattleData;
  onAllSlotsFilledChange?: (filled: boolean, participants?: any[]) => void;
  roundResults: Array<{ roundId: string; playerItems: Record<string, SlotSymbol | undefined> }>;
  participantValues?: Record<string, number>; // participantId -> totalValue (number)
  gameMode?: string; // 游戏模式
  playerColors?: Record<string, string>; // 玩家颜色映射
  eliminatedPlayerIds?: Set<string>; // 🔥 淘汰模式：已淘汰的玩家ID集合
  eliminationRounds?: Record<string, number>; // 🔥 淘汰模式：玩家ID -> 被淘汰的轮次索引（0-based）
  sprintScores?: Record<string, number>; // 🏃 积分冲刺模式：玩家/团队积分
  currentRound?: number; // 当前轮次（用于实时更新积分）
  completedRounds?: Set<number>; // 🚀 性能优化：已完成的轮次集合
  // 返回值表示“是否真正发起了动作”（例如：未登录仅弹登录则返回 false）
  onPendingSlotAction?: (order: number) => boolean | Promise<boolean>;
  pendingButtonLabel?: string;
}

export default function ParticipantsWithPrizes({
  battleData,
  onAllSlotsFilledChange,
  roundResults,
  participantValues = {},
  gameMode = 'classic',
  playerColors = {},
  eliminatedPlayerIds = new Set(),
  eliminationRounds = {},
  sprintScores = {},
  currentRound = 0,
  completedRounds = new Set(),
  onPendingSlotAction,
  pendingButtonLabel,
}: ParticipantsWithPrizesProps) {
  const { participants, packs, playersCount, battleType, teamStructure } = battleData;
  const { t } = useI18n();
  const pendingLabel = pendingButtonLabel || t('summonBot');
  
  const [activeGroup, setActiveGroup] = useState(0);
  const [activeTeamGroup, setActiveTeamGroup] = useState(0); // 团队模式tabs
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  // 🚀 初始化为 undefined，这样第一次比较时会触发回调
  const prevFilledRef = useRef<boolean | undefined>(undefined);
  
  // 🎯 团队模式判断
  const isTeamMode = battleType === 'team';
  const isLastChanceJackpot = gameMode === 'jackpot' && Boolean(battleData.isLastChance);
  const totalRoundsForJackpot = Array.isArray(packs) ? packs.length : 0;
  const lastRoundIndexForJackpot = totalRoundsForJackpot > 0 ? totalRoundsForJackpot - 1 : 0;
  const isLastChanceJackpotLastRoundRevealed =
    isLastChanceJackpot &&
    ((completedRounds && completedRounds.has(lastRoundIndexForJackpot)) ||
      (typeof currentRound === 'number' && currentRound > lastRoundIndexForJackpot));
  
  // 🏆 大奖模式：计算总奖池
  const jackpotPercentages = useMemo(() => {
    if (gameMode !== 'jackpot') {
      return {};
    }
    const isInvertedJackpot = battleData.isInverted;
    const isLastChanceMode = Boolean(battleData.isLastChance);
    type JackpotEntry = { participantId: string; rawValue: number; inverseWeight: number };

    const totalRounds = Array.isArray(packs) ? packs.length : 0;
    const lastRoundIndex = totalRounds > 0 ? totalRounds - 1 : 0;
    const lastRoundId = `round-${lastRoundIndex}`;
    const isLastRoundRevealed =
      (completedRounds && completedRounds.has(lastRoundIndex)) ||
      (typeof currentRound === 'number' && currentRound > lastRoundIndex);

    const lastRoundItems =
      isLastChanceMode && isLastRoundRevealed
        ? (roundResults.find((r) => r?.roundId === lastRoundId)?.playerItems ?? {})
        : null;

    const entries: JackpotEntry[] = isLastChanceMode
      ? isLastRoundRevealed
        ? (participants ?? []).reduce<JackpotEntry[]>((acc, participant) => {
            if (!participant?.id) return acc;
            const normalizedValue = Number(lastRoundItems?.[participant.id]?.price ?? 0) || 0;
            acc.push({
              participantId: participant.id,
              rawValue: normalizedValue,
              inverseWeight: normalizedValue > 0 ? 1 / normalizedValue : 0,
            });
            return acc;
          }, [])
        : []
      : Object.entries(participantValues).reduce<JackpotEntry[]>((acc, [participantId, value]) => {
          if (!participantId) return acc;
          const normalizedValue = Number(value) || 0;
          acc.push({
            participantId,
            rawValue: normalizedValue,
            inverseWeight: normalizedValue > 0 ? 1 / normalizedValue : 0,
          });
          return acc;
        }, []);

    // 展示层：用 0.01% 单位分配，避免出现 0.00%（除非条目数量大到无法分配）
    const weightEntries = entries.map((entry) => ({
      id: entry.participantId,
      weight: isInvertedJackpot ? entry.inverseWeight : entry.rawValue,
    }));
    const bpsById = allocateJackpotPercentageBps(weightEntries);

    const result: Record<string, string> = {};
    entries.forEach((entry) => {
      const bps = bpsById?.[entry.participantId] ?? 0;
      result[entry.participantId] = (bps / 100).toFixed(2);
    });
    return result;
  }, [gameMode, participantValues, battleData.isInverted, battleData.isLastChance, packs, participants, roundResults, completedRounds, currentRound]);
  
  const getPlayerPercentage = (participantId: string) => {
    if (gameMode !== 'jackpot') return null;
    return jackpotPercentages[participantId] ?? null;
  };

  // 🏃 积分冲刺模式：根据积分获取颜色
  const sprintColorMap = useMemo(() => {
    const colors = [
      '#FF6B6B', // 红色
      '#4ECDC4', // 青色
      '#45B7D1', // 蓝色
      '#F7DC6F', // 黄色
      '#BB8FCE', // 紫色
      '#52C41A', // 绿色
    ];
    
    // 获取所有不同的分数
    const uniqueScores = [...new Set(Object.values(sprintScores))].sort((a, b) => b - a);
    const colorMapping: Record<number, string> = {};
    
    uniqueScores.forEach((score, index) => {
      colorMapping[score] = colors[index % colors.length];
    });
    
    return colorMapping;
  }, [sprintScores]);

  // 🏃 获取玩家/团队的积分颜色
  const getSprintColor = (participantId: string) => {
    const score = sprintScores[participantId] || 0;
    return sprintColorMap[score] || '#34383C';
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateMatch = (mq: MediaQueryListEvent | MediaQueryList) => {
      setIsLargeScreen(mq.matches);
    };
    updateMatch(mediaQuery);
    const listener = (event: MediaQueryListEvent) => updateMatch(event);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const renderBotAvatar = (maskId: string) => (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
      </mask>
      <g mask={`url(#${maskId})`}>
        <rect width="36" height="36" fill="#333333"></rect>
        <rect
          x="0"
          y="0"
          width="36"
          height="36"
          transform="translate(-1 5) rotate(305 18 18) scale(1.2)"
          fill="#0C8F8F"
          rx="36"
        ></rect>
        <g transform="translate(-1 1) rotate(5 18 18)">
          <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
          <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
          <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
        </g>
      </g>
    </svg>
  );

  const totalSlots = useMemo(() => {
    const declaredSlots = Number(playersCount) || 0;
    if (declaredSlots > 0) {
      return declaredSlots;
    }
    return Math.max(participants.length, 1);
  }, [playersCount, participants.length]);

  const computedSlots = useMemo(
    () => allocateParticipantsToSlots(participants, totalSlots),
    [participants, totalSlots],
  );
  const [slotParticipantsState, setSlotParticipantsState] = useState<Array<Participant | null>>(computedSlots);
  const [pendingActionSlots, setPendingActionSlots] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // 非 pending：保持原行为，直接同步计算结果
    if (!onPendingSlotAction) {
      setSlotParticipantsState(computedSlots);
      return;
    }

    // pending：只填充空槽，避免 computedSlots 的短暂重排把已占槽位清空（按钮闪烁）
    setSlotParticipantsState((prev) => {
      const prevNormalized = normalizeSlotArray(prev, totalSlots);
      const nextNormalized = normalizeSlotArray(computedSlots, totalSlots);
      return mergeSlotsForPending(prevNormalized, nextNormalized);
    });
  }, [computedSlots, onPendingSlotAction]);

  const markSlotPending = useCallback((slotIndex: number) => {
    setPendingActionSlots((prev) => {
      if (prev[slotIndex]) {
        return prev;
      }
      return { ...prev, [slotIndex]: true };
    });
  }, []);

  const clearSlotPending = useCallback((slotIndex: number) => {
    setPendingActionSlots((prev) => {
      if (!prev[slotIndex]) {
        return prev;
      }
      const next = { ...prev };
      delete next[slotIndex];
      return next;
    });
  }, []);

  const slots: Array<Participant | null> = slotParticipantsState;

  useEffect(() => {
    setPendingActionSlots((prev) => {
      const next = { ...prev };
      let changed = false;
      slots.forEach((participant, index) => {
        if (participant && next[index]) {
          delete next[index];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [slots]);

  // 按teamId分组玩家 + 计算队伍结构
  const teams = useMemo(() => {
    if (!isTeamMode || !teamStructure) return [];
    
    // 根据teamStructure确定队伍配置
    const teamConfigs: { teamCount: number; membersPerTeam: number } = 
      teamStructure === '2v2' ? { teamCount: 2, membersPerTeam: 2 } :
      teamStructure === '3v3' ? { teamCount: 2, membersPerTeam: 3 } :
      { teamCount: 3, membersPerTeam: 2 }; // 2v2v2
    
    // 创建所有队伍，按照全局槽位顺序来组织成员
    const allTeams = [];
    for (let teamIndex = 0; teamIndex < teamConfigs.teamCount; teamIndex++) {
      const teamId = `team-${teamIndex + 1}`;
      const teamStartIndex = teamIndex * teamConfigs.membersPerTeam;
      const teamEndIndex = teamStartIndex + teamConfigs.membersPerTeam;
      
      // 从 slots 中按顺序提取这个队伍的成员
      const members: (Participant | null)[] = [];
      for (let slotIndex = teamStartIndex; slotIndex < teamEndIndex; slotIndex++) {
        const participant = slots[slotIndex] || null;
        members.push(participant); // 保留 null，保持索引对应关系
      }
      
      allTeams.push({
        id: teamId,
        members, // 直接使用，不过滤 null
        totalSlots: teamConfigs.membersPerTeam
      });
    }
    
    return allTeams;
  }, [isTeamMode, teamStructure, slots]);

  const slotsPerGroup = 3;
  const groupCount = Math.max(1, Math.ceil(totalSlots / slotsPerGroup));
  const safeActiveGroup = Math.min(activeGroup, groupCount - 1);
  const groups = Array.from({ length: groupCount }, (_, index) => {
    const start = index * slotsPerGroup;
    const end = Math.min(start + slotsPerGroup, totalSlots);
    return {
      start,
      end,
      label: `Players [${start + 1}-${end}]`,
    };
  });
  // Use tabs when there are more than 4 players on small screens (so 6 players = 2 tabs)
  const shouldUseTabs = !isLargeScreen && totalSlots > 4;
  const rangeStart = shouldUseTabs ? groups[safeActiveGroup].start : 0;
  const rangeEnd = shouldUseTabs ? groups[safeActiveGroup].end : totalSlots;
  const visibleSlots = slots.slice(rangeStart, rangeEnd);
  const displayedSlots: Array<Participant | null> = shouldUseTabs ? [...visibleSlots] : [...visibleSlots];
  if (shouldUseTabs) {
    while (displayedSlots.length < slotsPerGroup) {
      displayedSlots.push(null);
    }
  }
  // Max 4 columns on desktop for <=4 players, 6 columns for 6 players, adjust based on actual player count
  const getColumnCount = () => {
    if (shouldUseTabs) {
      return Math.min(Math.max(displayedSlots.length, 1), slotsPerGroup);
    }
    // For large screens: 
    // - If 6 players: use 6 columns
    // - Otherwise: max 4 columns
    if (totalSlots === 6) {
      return 6;
    }
    return Math.min(totalSlots || 1, 4);
  };
  const columnTemplate = `repeat(${getColumnCount()}, minmax(0, 1fr))`;

  useEffect(() => {
    const filled = slots.every(Boolean);
    if (prevFilledRef.current !== filled) {
      prevFilledRef.current = filled;
      onAllSlotsFilledChange?.(filled, filled ? slots.filter((p) => p !== null) : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const handlePendingSlotAction = (slotIndex: number, teamId?: string) => {
    if (onPendingSlotAction) {
      markSlotPending(slotIndex);
      try {
        const maybeResult = onPendingSlotAction(slotIndex + 1) as unknown;
        if (maybeResult && typeof (maybeResult as Promise<unknown>).then === "function") {
          (maybeResult as Promise<unknown>)
            .then((started) => {
              if (started === false) {
                clearSlotPending(slotIndex);
              }
            })
            .catch(() => {
              clearSlotPending(slotIndex);
            });
        } else if (maybeResult === false) {
          // 同步返回 false：表示没有真正执行（比如需要登录）
          clearSlotPending(slotIndex);
        }
      } catch (error) {
        clearSlotPending(slotIndex);
      }
      return;
    }
    // 现在不再在前端本地生成机器人/参与者数据
  };

  // 后端字段：user.robot === 1 表示机器人
  const isBotParticipant = (participant?: Participant | null) => participant?.robot === 1;

  const roundResultMap = roundResults.reduce<Record<string, Record<string, SlotSymbol | undefined>>>(
    (acc, result) => {
      acc[result.roundId] = result.playerItems;
      return acc;
    },
    {},
  );

  const renderSlotCard = (
    participant: Participant | null,
    slotIndex: number,
    slotKey: string,
    summonTeamId?: string,
  ) => {
    const isRealSlot = slotIndex < totalSlots;
    const isBot = isBotParticipant(participant);
    const isStreamer = !isBot && Number(participant?.promotion) === 1;
    const maskId = `${slotKey}-mask`;
    const isEliminated =
      Boolean(participant) && gameMode === 'elimination' && eliminatedPlayerIds.has(participant!.id);
    const participantValue = participant ? participantValues[participant.id] || 0 : 0;
    const jackpotBackground =
      participant && gameMode === 'jackpot' ? playerColors[participant.id] || '#34383C' : '#34383C';
    const sprintColor = participant ? getSprintColor(participant.id) : '#34383C';

    return (
      <div key={slotKey} className="flex flex-col w-full">
        <div className="flex flex-col w-full relative rounded-lg mb-2.5" style={{ backgroundColor: '#22272B' }}>
          <div className="flex w-full gap-1 md:gap-4 items-center min-h-[70px] sm:min-h-[86px] py-2 sm:py-4">
            <div className="flex flex-1 justify-center items-center">
              {participant ? (
                <div className="flex gap-2 items-center justify-center flex-col sm:flex-row">
                  <div className="flex relative">
                    <div className="relative">
                      <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: "1px" }}>
                        <div className="relative rounded-full overflow-hidden w-6 h-6 sm:w-8 sm:h-8">
                          {!participant.avatar ? (
                            renderBotAvatar(maskId)
                          ) : (
                            <img
                              alt={participant.name}
                              src={participant.avatar}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full pointer-events-none"
                              style={{ color: "transparent" }}
                            />
                          )}
                        </div>
                      </div>
                      {isEliminated && (
                        <>
                          <div className="pointer-events-none absolute inset-0 rounded-full bg-black/60" />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#FF9C49] z-10">
                            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                              <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2"></circle>
                              <line x1="6.67941" y1="7.26624" x2="33.6794" y2="32.2662" stroke="currentColor" strokeWidth="2"></line>
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                    {/* 等级：主播(且非机器人)时不显示 */}
                    {!isBot && !isStreamer && (participant.vipLevel ?? 0) > 0 && (
                      <div
                        className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-4 -left-1"
                        style={{ backgroundColor: "#22272B", border: "1px solid #2B2F33", color: "#FFFFFF" }}
                      >
                        <span className="text-xxs font-bold leading-none text-white">{participant.vipLevel}</span>
                      </div>
                    )}
                    {/* 主播徽标：压在头像底边上（约一半在头像内）；手机在头像右下重叠 */}
                    {isStreamer && (
                      <div
                        className={
                          "pointer-events-none absolute z-10 " +
                          (isLargeScreen
                            ? "left-1/2 top-full -translate-x-1/2 -translate-y-[42%]"
                            : "left-full bottom-0 -translate-x-1/2 -translate-y-[42%]")
                        }
                      >
                        <StreamerBadge size="xs" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 items-center sm:items-start">
                    <p className="text-xs sm:text-base font-bold text-white max-w-16 sm:max-w-20 lg:max-w-24 overflow-hidden text-ellipsis whitespace-nowrap">
                      {participant.name}
                    </p>
                    <div
                      className="flex justify-center items-center rounded p-0.5 w-[3.5rem] sm:w-[4rem] lg:w-[5.5rem]"
                      style={{ backgroundColor: jackpotBackground }}
                    >
                      <p className="text-xxs sm:text-xs lg:text-sm text-white font-semibold">
                        {gameMode === 'jackpot' ? (
                          isLastChanceJackpot && !isLastChanceJackpotLastRoundRevealed ? (
                            'TBD'
                          ) : (
                            `${getPlayerPercentage(participant.id) ?? '0.00'}%`
                          )
                        ) : (
                          `$${participantValue.toFixed(2)}`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-xs sm:text-sm md:text-base text-white font-bold select-none h-8 sm:h-10 px-2 sm:px-4 md:px-6 w-full max-w-[7rem] sm:max-w-[9.5rem] whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ backgroundColor: '#48BB78', cursor: 'pointer' }}
                  onClick={() => handlePendingSlotAction(slotIndex, summonTeamId)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#38A169';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#48BB78';
                  }}
                  disabled={!isRealSlot}
                >
                  {pendingLabel}
                </button>
              )}
            </div>
          </div>

          {gameMode === 'sprint' && participant && (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg" style={{ backgroundColor: sprintColor }} />
              <div className="flex justify-center w-full relative" style={{ marginBottom: '16px' }}>
                <div
                  className="flex justify-center items-center h-8 w-8 rounded-full border-2 absolute"
                  style={{
                    backgroundColor: '#22272B',
                    borderColor: sprintColor,
                    top: '0px',
                  }}
                >
                  <p className="text-base text-white font-bold">{sprintScores[participant.id] || 0}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-row gap-2 mt-2 items-stretch">
          <div className="grid gap-2 w-full grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
            {packs.map((pack, roundIndex) => (
              <LazyRoundCard
                key={participant ? `${participant.id}-${roundIndex}` : `${slotKey}-round-${roundIndex}`}
                pack={pack}
                packIndex={roundIndex}
                member={participant}
                completedRounds={completedRounds}
                roundResultMap={roundResultMap}
                gameMode={gameMode}
                eliminationRounds={eliminationRounds}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 🎯 团队模式渲染
  if (isTeamMode && teams.length > 0) {
    // 小屏幕 3v3 或 2v2v2: 需要tabs切换
    const shouldUseTeamTabs = !isLargeScreen && (teamStructure === '3v3' || teamStructure === '2v2v2');
    const safeActiveTeamGroup = Math.min(activeTeamGroup, teams.length - 1);

    const renderMember = (member: Participant, index: number, teamId: string, slotNumber: number) => {
      const isBot = isBotParticipant(member);
      const maskId = `${teamId}-member-${index}-mask`;
      const isEliminated = gameMode === 'elimination' && eliminatedPlayerIds.has(member.id);
      const isStreamer = !isBot && Number(member?.promotion) === 1;
      const shouldShowVip = !isBot && !isStreamer && (member.vipLevel ?? 0) > 0;

      return (
        <div key={member.id} className="flex gap-2 items-center justify-center flex-col sm:flex-row">
          <div className="flex flex-col items-center gap-1">
            <div className="flex relative">
              <div className="relative">
                <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: "1px" }}>
                  <div className="relative rounded-full overflow-hidden w-6 h-6 sm:w-8 sm:h-8">
                    {!member.avatar ? (
                      renderBotAvatar(maskId)
                    ) : (
                      <img
                        alt={member.name}
                        src={member.avatar}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full pointer-events-none"
                        style={{ color: "transparent" }}
                      />
                    )}
                  </div>
                </div>
                {isEliminated && (
                  <>
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-black/60" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#FF9C49] z-10">
                      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2"></circle>
                        <line x1="6.67941" y1="7.26624" x2="33.6794" y2="32.2662" stroke="currentColor" strokeWidth="2"></line>
                      </svg>
                    </div>
                  </>
                )}
              </div>

              {shouldShowVip && (
                <div
                  className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-4 -left-1"
                  style={{ backgroundColor: "#22272B", border: "1px solid #2B2F33", color: "#FFFFFF" }}
                >
                  <span className="text-xxs font-bold leading-none text-white">{member.vipLevel}</span>
                </div>
              )}
              {/* 主播徽标：压在头像底边上（约一半在头像内）；手机在头像右下重叠 */}
              {isStreamer && (
                <div
                  className={
                    "pointer-events-none absolute z-10 " +
                    (isLargeScreen
                      ? "left-1/2 top-full -translate-x-1/2 -translate-y-[42%]"
                      : "left-full bottom-0 -translate-x-1/2 -translate-y-[42%]")
                  }
                >
                  <StreamerBadge size="xs" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 items-center sm:items-start">
            <p className="text-xs sm:text-base font-bold text-white max-w-16 sm:max-w-20 lg:max-w-24 overflow-hidden text-ellipsis whitespace-nowrap">
              {member.name}
            </p>
            <div
              className="flex justify-center items-center rounded p-0.5 w-[3.5rem] sm:w-[4rem] lg:w-[5.5rem]"
              style={{ backgroundColor: gameMode === 'jackpot' ? playerColors[member.id] || '#34383C' : '#34383C' }}
            >
              <p className="text-xxs sm:text-xs lg:text-sm text-white font-semibold">
                {gameMode === 'jackpot'
                  ? (isLastChanceJackpot && !isLastChanceJackpotLastRoundRevealed
                      ? 'TBD'
                      : `${getPlayerPercentage(member.id) ?? '0.00'}%`)
                  : `$${(participantValues[member.id] || 0).toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      );
    };
    
    // 决定要显示的队伍
    const displayTeams = shouldUseTeamTabs ? [teams[safeActiveTeamGroup]] : teams;
    
    return (
      <div className="flex flex-col w-full max-w-screen-xl">
        {/* Tabs (仅小屏幕 3v3/2v2v2) */}
        {shouldUseTeamTabs && (
          <div className="flex w-full px-4 mt-4">
            <div className="flex w-full gap-2 p-2 rounded-lg" style={{ backgroundColor: "#292f34" }}>
              {teams.map((team, index) => {
                const isActive = index === safeActiveTeamGroup;
                return (
                  <button
                    key={team.id}
                    type="button"
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-10 px-6 flex-1 text-base font-bold ${
                      isActive
                        ? "bg-blue-400 text-white hover:bg-blue-500"
                        : "bg-transparent text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setActiveTeamGroup(index)}
                  >
                    TEAM {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <div
          className="grid w-full max-w-screen-xl gap-2 sm:gap-4 p-2 sm:p-4"
          style={{ gridTemplateColumns: `repeat(${displayTeams.length}, 1fr)` }}
        >
        {displayTeams.map((team, displayIndex) => {
          // 计算这个team应该占用哪些槽位范围
          const teamConfigs: { teamCount: number; membersPerTeam: number } = 
            teamStructure === '2v2' ? { teamCount: 2, membersPerTeam: 2 } :
            teamStructure === '3v3' ? { teamCount: 2, membersPerTeam: 3 } :
            { teamCount: 3, membersPerTeam: 2 }; // 2v2v2
          
          const teamNumber = parseInt(team.id.split('-')[1]) - 1; // team-1 -> 0, team-2 -> 1
          const teamStartIndex = teamNumber * teamConfigs.membersPerTeam;
          
          // 根据totalSlots创建成员槽位，每个槽位对应一个固定的全局索引
      const memberSlotsWithIndex = Array.from({ length: team.totalSlots }, (_, i) => {
        const member = team.members[i] || null;
        // 每个成员槽位对应的全局索引是固定的
        const realSlotIndex = teamStartIndex + i;
        return { member, realSlotIndex };
      });
          return (
            <div key={team.id} className="flex flex-col w-full">
              {/* 队伍容器 */}
              <div
                className="flex flex-col w-full relative rounded-lg mb-2.5"
                style={{ backgroundColor: "#22272B" }}
              >
                {/* 顶部：队员信息区 */}
                <div className="flex w-full gap-1 md:gap-4 items-center min-h-[70px] sm:min-h-[86px] py-2 sm:py-4">
                  {memberSlotsWithIndex.map(({ member, realSlotIndex }, memberIndex) => {
                    const isSlotLoading = !!pendingActionSlots[realSlotIndex];

                    return (
                      <div key={`${team.id}-slot-${memberIndex}`} className="flex flex-1 justify-center items-center">
                        {member ? (
                          renderMember(member, memberIndex, team.id, realSlotIndex)
                        ) : (
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-xs sm:text-sm md:text-base text-white font-bold select-none h-8 sm:h-10 px-2 sm:px-4 md:px-6 w-full max-w-[7rem] sm:max-w-[9.5rem] whitespace-nowrap overflow-hidden text-ellipsis"
                            style={{
                              backgroundColor: isSlotLoading ? "#3A7B58" : "#48BB78",
                              cursor: isSlotLoading ? "not-allowed" : "pointer",
                              position: "relative",
                            }}
                            onClick={() => {
                              if (realSlotIndex >= 0) {
                                handlePendingSlotAction(realSlotIndex, team.id);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (isSlotLoading) return;
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#38A169";
                            }}
                            onMouseLeave={(e) => {
                              if (isSlotLoading) return;
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSlotLoading ? "#3A7B58" : "#48BB78";
                            }}
                            disabled={isSlotLoading}
                          >
                            {isSlotLoading ? (
                              <LoadingSpinnerIcon size={20} />
                            ) : (
                              pendingButtonLabel
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* 🏃 积分冲刺模式：色条和积分显示（团队） */}
                {gameMode === 'sprint' && (
                  <>
                    {/* 色条 - 在底部边缘 */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
                      style={{ backgroundColor: getSprintColor(team.id) }}
                    />
                    
                    {/* 积分徽章 - 圆心在底部线上，居中 */}
                    <div className="flex justify-center w-full relative" style={{ marginBottom: '16px' }}>
                      <div 
                        className="flex justify-center items-center h-8 w-8 rounded-full border-2 absolute"
                        style={{ 
                          backgroundColor: '#22272B',
                          borderColor: getSprintColor(team.id),
                          top: '0px'
                        }}
                      >
                        <p className="text-base text-white font-bold">
                          {sprintScores[team.id] || 0}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* 底部：Round卡片区域（每个成员一行）*/}
              <div className="flex flex-row gap-2 mt-2 items-stretch">
                {/* 为每个成员槽位创建一列 */}
                {memberSlotsWithIndex.map(({ member }, memberIndex) => (
                  <div key={`${team.id}-member-${memberIndex}`} className="grid gap-2 w-full grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
                    {packs.map((pack, packIndex) => (
                      <LazyRoundCard
                        key={`${team.id}-member-${memberIndex}-pack-${packIndex}`}
                        pack={pack}
                        packIndex={packIndex}
                        member={member}
                        completedRounds={completedRounds}
                        roundResultMap={roundResultMap}
                        gameMode={gameMode}
                        eliminationRounds={eliminationRounds}
                        teamId={team.id}
                        memberIndex={memberIndex}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  }

  // 🎯 单人模式渲染（原有逻辑）
  return (
    <div className="flex flex-col w-full max-w-screen-xl">
      {shouldUseTabs && (
        <div className="flex w-full px-4 mt-4">
          <div className="flex w-full gap-2 p-2 rounded-lg" style={{ backgroundColor: "#292f34" }}>
            {groups.map((group, index) => {
              const isActive = index === safeActiveGroup;
              return (
                <button
                  key={group.label}
                  type="button"
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-10 px-6 flex-1 text-base font-bold ${
                    isActive
                      ? "bg-blue-400 text-white hover:bg-blue-500"
                      : "bg-transparent text-gray-400 hover:text-white"
                  }`}
                  onClick={() => setActiveGroup(index)}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div
        className="grid w-full max-w-screen-xl gap-2 sm:gap-4 p-2 sm:p-4"
        style={{ gridTemplateColumns: columnTemplate }}
      >
        {displayedSlots.map((participant, slotOffset) => {
          const slotIndex = rangeStart + slotOffset;
          const isRealSlot = slotIndex < totalSlots;
          const slotKey = isRealSlot ? `slot-${slotIndex}` : `placeholder-${safeActiveGroup}-${slotOffset}`;
          const isBot = isBotParticipant(participant);
          const isStreamer = !isBot && Number(participant?.promotion) === 1;
          const maskId = `${slotKey}-mask`;
          const isLoadingSlot = !!pendingActionSlots[slotIndex];
          return (
            <div key={slotKey} className="flex flex-col w-full">
              <div
                className="flex flex-col w-full relative rounded-lg mb-2.5"
                style={{ backgroundColor: "#22272B" }}
              >
                <div className="flex w-full gap-1 md:gap-4 items-center min-h-[70px] sm:min-h-[86px] py-2 sm:py-4">
                  <div className="flex flex-1 justify-center items-center">
                    {participant ? (
                      <div className="flex gap-2 items-center justify-center flex-col sm:flex-row">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex relative">
                          <div className="relative">
                            <div
                                className="overflow-hidden border rounded-full border-gray-700"
                                style={{ borderWidth: "1px" }}
                              >
                                <div className="relative rounded-full overflow-hidden w-6 h-6 sm:w-8 sm:h-8">
                                  {!participant.avatar ? (
                                    renderBotAvatar(maskId)
                                  ) : (
                                <img
                                  src={participant.avatar}
                                  alt={participant.name}
                                  width={32}
                                  height={32}
                                  className="object-cover w-full h-full pointer-events-none"
                                  style={{ color: "transparent" }}
                                />
                                  )}
                              </div>
                            </div>
                            {gameMode === 'elimination' && eliminatedPlayerIds.has(participant.id) && (
                              <>
                                <div className="pointer-events-none absolute inset-0 rounded-full bg-black/60" />
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#FF9C49] z-10">
                                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                    <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2"></circle>
                                    <line x1="6.67941" y1="7.26624" x2="33.6794" y2="32.2662" stroke="currentColor" strokeWidth="2"></line>
                                  </svg>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* 等级：主播(且非机器人)时不显示 */}
                          {!isBot && !isStreamer && (participant.vipLevel ?? 0) > 0 && (
                            <div
                              className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-4 -left-1"
                              style={{ backgroundColor: "#22272B", border: "1px solid #2B2F33", color: "#FFFFFF" }}
                            >
                              <span className="text-xxs font-bold leading-none text-white">{participant.vipLevel}</span>
                            </div>
                          )}
                          {/* 主播徽标：压在头像底边上（约一半在头像内）；手机在头像右下重叠 */}
                          {isStreamer && (
                            <div
                              className={
                                "pointer-events-none absolute z-10 " +
                                (isLargeScreen
                                  ? "left-1/2 top-full -translate-x-1/2 -translate-y-[42%]"
                                  : "left-full bottom-0 -translate-x-1/2 -translate-y-[42%]")
                              }
                            >
                              <StreamerBadge size="xs" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1 items-center sm:items-start">
                          <p className="text-xs sm:text-base font-bold text-white max-w-16 sm:max-w-20 lg:max-w-24 overflow-hidden text-ellipsis whitespace-nowrap">
                          {participant.name}
                        </p>
                        <div
                            className="flex justify-center items-center rounded p-0.5 w-[3.5rem] sm:w-[4rem] lg:w-[5.5rem]"
                            style={{ 
                              backgroundColor: gameMode === 'jackpot' ? playerColors[participant.id] || "#34383C" : "#34383C"
                            }}
                          >
                            <p className="text-xxs sm:text-xs lg:text-sm text-white font-semibold">
                              {gameMode === 'jackpot'
                                ? (isLastChanceJackpot && !isLastChanceJackpotLastRoundRevealed
                                    ? 'TBD'
                                    : `${getPlayerPercentage(participant.id) ?? '0.00'}%`)
                                : `$${(participantValues[participant.id] || 0).toFixed(2)}`
                              }
                            </p>
                        </div>
                      </div>
                    </div>
                    ) : (
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-xs sm:text-sm md:text-base text-white font-bold select-none h-8 sm:h-10 px-2 sm:px-4 md:px-6 w-full max-w-[7rem] sm:max-w-[9.5rem] whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{
                          backgroundColor: isLoadingSlot ? "#3A7B58" : "#48BB78",
                          cursor: isLoadingSlot ? "not-allowed" : "pointer",
                        }}
                        onClick={() => handlePendingSlotAction(slotIndex)}
                        onMouseEnter={(e) => {
                          if (isLoadingSlot) return;
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#38A169";
                        }}
                        onMouseLeave={(e) => {
                          if (isLoadingSlot) return;
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = isLoadingSlot ? "#3A7B58" : "#48BB78";
                        }}
                        disabled={isLoadingSlot || !isRealSlot}
                      >
                        {isLoadingSlot ? (
                          <LoadingSpinnerIcon size={20} />
                        ) : (
                          pendingButtonLabel
                        )}
                      </button>
                    )}
                  </div>
              </div>
              
              {/* 🏃 积分冲刺模式：色条和积分显示 */}
              {gameMode === 'sprint' && participant && (
                <>
                  {/* 色条 - 在底部边缘，更粗 */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
                    style={{ backgroundColor: getSprintColor(participant.id) }}
                  />
                  
                  {/* 积分徽章 - 圆心在底部线上，居中 */}
                  <div className="flex justify-center w-full relative" style={{ marginBottom: '16px' }}>
                    <div 
                      className="flex justify-center items-center h-8 w-8 rounded-full border-2 absolute"
                      style={{ 
                        backgroundColor: '#22272B',
                        borderColor: getSprintColor(participant.id),
                        top: '0px'
                      }}
                    >
                      <p className="text-base text-white font-bold">
                        {sprintScores[participant.id] || 0}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
              <div className="flex flex-row gap-2 mt-2 items-stretch">
                <div className="grid gap-2 w-full grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
                  {packs.map((pack, roundIndex) => (
                    <LazyRoundCard
                      key={participant ? `${participant.id}-${roundIndex}` : `${slotKey}-round-${roundIndex}`}
                      pack={pack}
                      packIndex={roundIndex}
                      member={participant}
                      completedRounds={completedRounds}
                      roundResultMap={roundResultMap}
                      gameMode={gameMode}
                      eliminationRounds={eliminationRounds}
                    />
                  ))}
                    
                   
                </div>
              </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// 🚀 懒加载的 Round 卡片组件 - 使用 Intersection Observer 优化性能
function LazyRoundCard({ 
  pack, 
  packIndex, 
  member, 
  completedRounds,
  roundResultMap,
  gameMode,
  eliminationRounds,
  teamId,
  memberIndex
}: {
  pack: any;
  packIndex: number;
  member: any;
  completedRounds?: Set<number>;
  roundResultMap: Record<string, Record<string, SlotSymbol | undefined>>;
  gameMode?: string;
  eliminationRounds?: Record<string, number>;
  teamId?: string;
  memberIndex?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '300px',
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const roundId = `round-${packIndex}`;
  const roundPlayerItems = roundResultMap[roundId] || {};
  const playerResult = member ? roundPlayerItems[member.id] : undefined;
  
  const isRoundCompleted = completedRounds?.has(packIndex) || false;
  const shouldShowPlayerResult = !!playerResult;

  const isEliminatedPlayer = member && gameMode === 'elimination' && eliminationRounds?.[member.id] !== undefined;
  const eliminatedAtRound = isEliminatedPlayer ? eliminationRounds![member.id] : -1;
  const shouldShowEliminationOverlay = isEliminatedPlayer && packIndex >= eliminatedAtRound;
  const roundGlowColor = resolveGlowColor(playerResult);

  // 🎯 统一返回：根据可见性决定渲染内容
  return (
    <div
      ref={cardRef}
      data-component="BattleResultsRound"
      className="group flex flex-1 relative rounded-lg overflow-hidden cursor-pointer min-h-[7rem] sm:min-h-[8rem] md:min-h-[10rem]"
      style={{ backgroundColor: "#22272B" }}
    >
      {/* 🔥 关键：只有可见 && 完成时才渲染完整内容 */}
      {isVisible && (
        <div className="flex relative w-full h-full overflow-hidden">
          {isRoundCompleted && shouldShowPlayerResult ? (
            <>
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 group-hover:opacity-90 filter blur-[25px]"
                style={{ backgroundColor: roundGlowColor }}
              />
              
              <div className="absolute inset-0 flex w-full h-full flex-col justify-between items-center p-3 text-center">
              <p className="text-sm text-gray-400 font-semibold h-6">
                {playerResult.dropProbability ? `${(playerResult.dropProbability * 100).toFixed(4)}%` : '0.0000%'}
              </p>
              
              {playerResult.image && (
                <div className="relative w-full flex-1 flex items-center justify-center">
                  <img alt={playerResult.name} src={playerResult.image} className="object-contain absolute inset-0 w-full h-full" />
                </div>
              )}
              
              <div className="flex flex-col w-full gap-0.5">
                <p className="text-sm text-gray-400 font-semibold truncate max-w-full text-center">{playerResult.name}</p>
                <div className="flex justify-center">
                  <p className="text-sm text-white font-extrabold">${playerResult.price || '0.00'}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div data-component="RoundCard" className="absolute inset-0 flex w-full h-full justify-center items-center text-center transition duration-300 group-hover:opacity-0 group-hover:translate-y-4">
              <p className="text-xs sm:text-sm text-white font-bold">Round {packIndex + 1}</p>
            </div>
            
            <div data-component="PackCard" className="absolute inset-0 opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 flex w-full h-full justify-center p-2 md:p-5">
              <img alt={pack.name} src={pack.image} width={150} height={300} className="object-contain h-full w-auto pointer-events-none" />
            </div>
          </>
        )}
          {shouldShowEliminationOverlay && (
            <>
              <div className="absolute inset-0 bg-black/40 pointer-events-none rounded-lg z-[4]" />
              <div className="flex absolute inset-0 text-[#FF9C49] z-[5] p-6 md:p-8 items-center justify-center pointer-events-none rounded-lg">
                <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-full w-full"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M12 3 2 21h20L12 3z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 9v4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 17h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
