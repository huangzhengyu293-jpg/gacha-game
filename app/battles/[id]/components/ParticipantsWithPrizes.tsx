"use client";

import type { BattleData, Participant, BattleSlot } from "../types";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";

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
  slotAssignments?: BattleSlot[]; // 🔄 兼容 legacy props
  currentUserId?: string | null;
  onJoinSlot?: (slotIndex: number, teamId?: string) => void;
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
  slotAssignments = [],
  currentUserId = null,
  onJoinSlot,
}: ParticipantsWithPrizesProps) {
  const { participants, packs, playersCount, battleType, teamStructure } = battleData;
  const hostUserId = battleData.hostUserId ? String(battleData.hostUserId) : null;
  const isOwner = Boolean(currentUserId && hostUserId && currentUserId === hostUserId);
  const canSummonBot = battleData.status === 'pending';
  
  // 🔥 调试：打印淘汰轮次信息
  useEffect(() => {
    if (Object.keys(eliminationRounds).length > 0) {
      console.log('🔥 [ParticipantsWithPrizes] eliminationRounds:', eliminationRounds);
      console.log('🔥 [ParticipantsWithPrizes] eliminatedPlayerIds:', Array.from(eliminatedPlayerIds));
    }
  }, [eliminationRounds, eliminatedPlayerIds]);
  const [activeGroup, setActiveGroup] = useState(0);
  const [activeTeamGroup, setActiveTeamGroup] = useState(0); // 团队模式tabs
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  // 🚀 初始化为 undefined，这样第一次比较时会触发回调
  const prevFilledRef = useRef<boolean | undefined>(undefined);
  
  // 🎯 团队模式判断
  const isTeamMode = battleType === 'team';
  
  // 🏆 大奖模式：计算总奖池
  const totalJackpot = useMemo(() => {
    return Object.values(participantValues).reduce((sum, val) => sum + val, 0);
  }, [participantValues]);
  
  // 🏆 大奖模式：计算玩家百分比
  const getPlayerPercentage = (participantId: string) => {
    if (gameMode !== 'jackpot' || totalJackpot === 0) return null;
    const playerValue = participantValues[participantId] || 0;
    const percentage = (playerValue / totalJackpot) * 100;
    return percentage.toFixed(2);
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

  const totalSlots = useMemo(
    () =>
      slotAssignments.length
        ? slotAssignments.length
        : Math.max(playersCount || participants.length || 1, 1),
    [slotAssignments, playersCount, participants.length],
  );
  
  const createSlotSnapshot = () => {
    if (slotAssignments.length) {
      return slotAssignments.map((slot) => slot?.participant ?? null);
    }
    return Array.from({ length: totalSlots }, (_, index) => participants[index] || null);
  };

  const [slotParticipants, setSlotParticipants] = useState<Array<Participant | null>>(createSlotSnapshot);
  const participantSignature = useMemo(
    () => participants.map((p) => (p?.id ? String(p.id) : '')).join(','),
    [participants],
  );
  
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
      
      // 从 slotParticipants 中按顺序提取这个队伍的成员
      const members: (Participant | null)[] = [];
      for (let slotIndex = teamStartIndex; slotIndex < teamEndIndex; slotIndex++) {
        const participant = slotParticipants[slotIndex] || null;
        members.push(participant); // 保留 null，保持索引对应关系
      }
      
      allTeams.push({
        id: teamId,
        members, // 直接使用，不过滤 null
        totalSlots: teamConfigs.membersPerTeam
      });
    }
    
    return allTeams;
  }, [isTeamMode, teamStructure, slotParticipants]);

  // Only update if participants actually changed (by checking IDs)
  useEffect(() => {
    if (slotAssignments.length) {
      setSlotParticipants(slotAssignments.map((slot) => slot?.participant ?? null));
      return;
    }
    setSlotParticipants((prev) => {
      const prevParticipantIds = prev.slice(0, participants.length).map((p) => p?.id || '').join(',');
      if (prevParticipantIds === participantSignature && prev.length === totalSlots) {
        return prev;
      }

      const next = Array.from({ length: totalSlots }, (_, index) => {
        const participantAtSlot = participants[index];
        if (participantAtSlot) {
          return participantAtSlot;
        }
        return prev[index] ?? null;
      });
      return next;
    });
  }, [slotAssignments, participants, participantSignature, totalSlots]);

  const slots: Array<Participant | null> = slotParticipants;
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
    const filled = slotParticipants.every(Boolean);
    // Only call if the filled state actually changed
    if (prevFilledRef.current !== filled) {
      prevFilledRef.current = filled;
      // Pass all participants (including bots) when all slots are filled
      onAllSlotsFilledChange?.(filled, filled ? slotParticipants.filter(p => p !== null) : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotParticipants]);

  const handleSummonBot = (slotIndex: number, teamId?: string) => {
    if (!canSummonBot) {
      return;
    }
    if (onJoinSlot) {
      onJoinSlot(slotIndex, teamId);
      return;
    }
    setSlotParticipants((prev) => {
      const ensuredArray =
        prev.length < totalSlots ? [...prev, ...Array(totalSlots - prev.length).fill(null)] : prev;

      if (ensuredArray[slotIndex]) {
        return ensuredArray;
      }
      const updated = [...ensuredArray];
      updated[slotIndex] = {
        id: `bot-${slotIndex}-${Date.now()}`,
        name: `Bot ${slotIndex + 1}`,
        avatar: "",
        totalValue: "$0.00",
        isWinner: false,
        teamId,
      };
      return updated;
    });
  };

  const isBotParticipant = (participant?: Participant | null) =>
    Boolean(participant?.id && String(participant.id).startsWith("bot-"));

  const roundResultMap = roundResults.reduce<Record<string, Record<string, SlotSymbol | undefined>>>(
    (acc, result) => {
      acc[result.roundId] = result.playerItems;
      return acc;
    },
    {},
  );

  // 🎯 团队模式渲染
  if (isTeamMode && teams.length > 0) {
    // 小屏幕 3v3 或 2v2v2: 需要tabs切换
    const shouldUseTeamTabs = !isLargeScreen && (teamStructure === '3v3' || teamStructure === '2v2v2');
    const safeActiveTeamGroup = Math.min(activeTeamGroup, teams.length - 1);
    
    // 渲染单个成员的函数
    const renderMember = (member: Participant, index: number, teamId: string) => {
      const isBot = isBotParticipant(member);
      const maskId = `${teamId}-member-${index}-mask`;
      
      return (
        <div key={member.id} className="flex gap-2 items-center justify-center flex-col sm:flex-row">
          <div className="flex relative">
            <div 
              className="relative" 
              style={{ 
                opacity: gameMode === 'elimination' && eliminatedPlayerIds.has(member.id) ? 0.3 : 1 
              }}
            >
              {/* 头像 */}
              <div
                className="overflow-hidden border rounded-full border-gray-700"
                style={{ borderWidth: "1px" }}
              >
                <div className="relative rounded-full overflow-hidden w-6 h-6 sm:w-8 sm:h-8">
                  {isBot || !member.avatar ? (
                    renderBotAvatar(maskId)
                  ) : (
                    <Image
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
            </div>
            
            {/* 🔥 淘汰禁止图标 */}
            {gameMode === 'elimination' && eliminatedPlayerIds.has(member.id) && (
              <div 
                className="flex absolute left-0 top-0 text-[#FF9C49] z-10"
                style={{ width: '34px', height: '34px' }}
              >
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2"></circle>
                  <line x1="6.67941" y1="7.26624" x2="33.6794" y2="32.2662" stroke="currentColor" strokeWidth="2"></line>
                </svg>
              </div>
            )}
            
            {/* 序号标记 - 机器人不显示 */}
            {!isBot && (
              <div
                className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-4 -left-1"
                style={{ backgroundColor: "#22272B", border: "1px solid #2B2F33", color: "#FFFFFF" }}
              >
                <span className="text-xxs font-bold leading-none text-white">{index}</span>
              </div>
            )}
          </div>
          
          {/* 成员信息 */}
          <div className="flex flex-col gap-1 items-center sm:items-start">
            <p className="text-xs sm:text-base font-bold text-white max-w-16 sm:max-w-20 lg:max-w-24 overflow-hidden text-ellipsis whitespace-nowrap">
              {member.name}
            </p>
            <div
              className="flex justify-center items-center rounded p-0.5 w-[3.5rem] sm:w-[4rem] lg:w-[5.5rem]"
              style={{ 
                backgroundColor: gameMode === 'jackpot' ? playerColors[member.id] || "#34383C" : "#34383C"
              }}
            >
              <p className="text-xxs sm:text-xs lg:text-sm text-white font-semibold">
                {gameMode === 'jackpot' 
                  ? `${getPlayerPercentage(member.id) || '0.00'}%`
                  : `$${(participantValues[member.id] || 0).toFixed(2)}`
                }
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
                    
                    return (
                      <div key={`${team.id}-slot-${memberIndex}`} className="flex flex-1 justify-center items-center">
                        {member ? renderMember(member, memberIndex, team.id) : (
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-xs sm:text-sm md:text-base text-white font-bold select-none h-8 sm:h-10 px-2 sm:px-4 md:px-6 w-full max-w-[7rem] sm:max-w-[9.5rem] whitespace-nowrap overflow-hidden text-ellipsis"
                            style={{ backgroundColor: "#48BB78", cursor: "pointer" }}
                            onClick={() => {
                              if (realSlotIndex >= 0) {
                                handleSummonBot(realSlotIndex, team.id);
                              }
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#38A169";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#48BB78";
                            }}
                          >
                            召唤机器人
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
          const maskId = `${slotKey}-mask`;
          const slotNumberLabel = slotIndex + 1;
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
                      <div className="flex relative">
                        <div 
                          className="relative" 
                          style={{ 
                            opacity: gameMode === 'elimination' && eliminatedPlayerIds.has(participant.id) ? 0.3 : 1 
                          }}
                        >
                          <div
                              className="overflow-hidden border rounded-full border-gray-700"
                              style={{ borderWidth: "1px" }}
                            >
                              <div className="relative rounded-full overflow-hidden w-6 h-6 sm:w-8 sm:h-8">
                                {isBot || !participant.avatar ? (
                                  renderBotAvatar(maskId)
                                ) : (
                              <Image
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
                        </div>
                        
                        {/* 🔥 淘汰禁止图标 */}
                        {gameMode === 'elimination' && eliminatedPlayerIds.has(participant.id) && (
                          <div 
                            className="flex absolute left-0 top-0 text-[#FF9C49] z-10"
                            style={{ width: '34px', height: '34px' }}
                          >
                            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2"></circle>
                              <line x1="6.67941" y1="7.26624" x2="33.6794" y2="32.2662" stroke="currentColor" strokeWidth="2"></line>
                            </svg>
                          </div>
                        )}
                        
                        {/* 序号标记 - 机器人不显示 */}
                        {!isBot && (
                          <div
                            className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-4 -left-1"
                            style={{ backgroundColor: "#22272B", border: "1px solid #2B2F33", color: "#FFFFFF" }}
                          >
                            <span className="text-xxs font-bold leading-none text-white">{slotNumberLabel}</span>
                          </div>
                        )}
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
                                ? `${getPlayerPercentage(participant.id) || '0.00'}%`
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
                          backgroundColor: canSummonBot ? "#48BB78" : "#34383C",
                          cursor: canSummonBot ? "pointer" : "not-allowed",
                          opacity: canSummonBot ? 1 : 0.6,
                        }}
                        onClick={() => handleSummonBot(slotIndex)}
                        disabled={!canSummonBot}
                        onMouseEnter={(e) => {
                          if (!canSummonBot) return;
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#38A169";
                        }}
                        onMouseLeave={(e) => {
                          if (!canSummonBot) return;
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#48BB78";
                        }}
                      >
                        召唤机器人
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
                style={{ 
                  backgroundColor: playerResult.qualityId === 'legendary' ? '#FFD700' :
                    playerResult.qualityId === 'epic' ? '#A335EE' :
                    playerResult.qualityId === 'rare' ? '#0070DD' :
                    playerResult.qualityId === 'uncommon' ? '#1EFF00' :
                    '#9D9D9D'
                }}
              />
              
              <div className="absolute inset-0 flex w-full h-full flex-col justify-between items-center p-3 text-center">
              <p className="text-sm text-gray-400 font-semibold h-6">
                {playerResult.dropProbability ? `${(playerResult.dropProbability * 100).toFixed(4)}%` : '0.0000%'}
              </p>
              
              {playerResult.image && (
                <div className="relative w-full flex-1 flex items-center justify-center">
                  <Image alt={playerResult.name} src={playerResult.image} fill sizes="(min-width: 0px) 100px" className="object-contain" />
                </div>
              )}
              
              <div className="flex flex-col w-full gap-0.5">
                <p className="text-sm text-gray-400 font-semibold truncate max-w-full text-center">{playerResult.name}</p>
                <div className="flex justify-center">
                  <p className="text-sm text-white font-extrabold">${playerResult.price || '0.00'}</p>
                </div>
              </div>
            </div>
            
            {shouldShowEliminationOverlay && (
              <>
                <div className="absolute inset-0 bg-black/40 pointer-events-none rounded-lg z-[2]" />
                <div className="flex absolute inset-0 text-[#FF9C49] z-[3] p-6 md:p-8 items-center justify-center pointer-events-none rounded-lg">
                  <div className="flex w-full max-w-16 max-h-16">
                    <svg viewBox="0 0 50 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.0985 2.3155C22.7065 -0.771551 27.2943 -0.771588 28.9022 2.3155L49.5341 41.9385C50.9837 44.7238 48.8759 47.9998 45.6327 48.0001H4.36804C1.12569 48 -0.983697 44.7238 0.465694 41.9385L21.0985 2.3155ZM24.9999 2.86921C24.7442 2.86927 24.1149 2.94132 23.7723 3.5987L3.13952 43.2218C2.84192 43.7935 3.04991 44.2713 3.20007 44.505C3.35032 44.7387 3.70289 45.1299 4.36804 45.13H45.6327C46.2982 45.1298 46.6493 44.7379 46.7997 44.505C46.9499 44.2721 47.158 43.7936 46.8602 43.2218L26.2284 3.5987C25.8857 2.94083 25.2553 2.86921 24.9999 2.86921ZM24.9999 4.50007C25.1984 4.50009 25.4684 4.56501 25.6298 4.8741L45.6327 43.0001C45.7491 43.2237 75.7386 43.4454 45.6014 43.6583C45.4642 43.8711 45.2624 43.9786 45.0018 43.9786H4.99792C4.73747 43.9786 4.53649 43.871 4.39929 43.6583C4.26208 43.4453 4.25159 43.2238 4.36804 43.0001L24.37 4.8741C24.5314 4.56503 24.8014 4.5001 24.9999 4.50007ZM24.9989 27.3477L20.3993 23.0274L17.203 26.0303L21.8026 30.3507L17.202 34.6729L20.3983 37.6759L24.9989 33.3536L29.6005 37.6768L32.7977 34.6739L28.1952 30.3507L32.7967 26.0294L29.6005 23.0264L24.9989 27.3477Z" fill="currentColor"></path>
                    </svg>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div data-component="RoundCard" className="absolute inset-0 flex w-full h-full justify-center items-center text-center transition duration-300 group-hover:opacity-0 group-hover:translate-y-4">
              <p className="text-xs sm:text-sm text-white font-bold">Round {packIndex + 1}</p>
            </div>
            
            <div data-component="PackCard" className="absolute inset-0 opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 flex w-full h-full justify-center p-2 md:p-5">
              <Image alt={pack.name} src={pack.image} width={150} height={300} className="object-contain h-full w-auto pointer-events-none" />
            </div>
            
            {shouldShowEliminationOverlay && !shouldShowPlayerResult && (
              <div className="flex size-5 absolute top-3 right-3 pointer-events-none z-10" style={{ color: '#7A8084' }}>
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.4416 3.33334C11.2951 3.08078 11.0848 2.87113 10.8318 2.7254C10.5788 2.57967 10.2919 2.50296 9.99996 2.50296C9.70798 2.50296 9.42112 2.57967 9.1681 2.7254C8.91509 2.87113 8.7048 3.08078 8.55829 3.33334L1.89163 15C1.74542 15.2532 1.66841 15.5405 1.66834 15.8329C1.66826 16.1253 1.74512 16.4126 1.8912 16.6659C2.03728 16.9192 2.24743 17.1297 2.50056 17.2761C2.75369 17.4225 3.04088 17.4997 3.33329 17.5H16.6666C16.959 17.4997 17.2462 17.4225 17.4994 17.2761C17.7525 17.1297 17.9626 16.9192 18.1087 16.6659C18.2548 16.4126 18.3315 16.1253 18.3316 15.8329C18.3315 15.5405 18.2545 15.2532 18.1083 15L11.4416 3.33334Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M12 10L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M8 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            )}
          </>
        )}
        </div>
      )}
    </div>
  );
}
