"use client";

import type { BattleData, Participant } from "../types";
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
}

export default function ParticipantsWithPrizes({
  battleData,
  onAllSlotsFilledChange,
  roundResults,
  participantValues = {},
  gameMode = 'classic',
  playerColors = {},
}: ParticipantsWithPrizesProps) {
  const { participants, packs, playersCount, battleType, teamStructure } = battleData;
  const [activeGroup, setActiveGroup] = useState(0);
  const [activeTeamGroup, setActiveTeamGroup] = useState(0); // 团队模式tabs
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const prevFilledRef = useRef<boolean>(false);
  
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

  const totalSlots = useMemo(() => 
    Math.max(playersCount || participants.length || 1, 1), 
    [playersCount, participants.length]
  );
  
  const createSlotSnapshot = () =>
    Array.from({ length: totalSlots }, (_, index) => participants[index] || null);

  const [slotParticipants, setSlotParticipants] = useState<Array<Participant | null>>(createSlotSnapshot);
  
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
    setSlotParticipants((prev) => {
      // Create ID string for comparison
      const currentParticipantIds = participants.map(p => p?.id || '').join(',');
      const prevParticipantIds = prev.slice(0, participants.length).map(p => p?.id || '').join(',');
      
      // Only update if something actually changed
      if (prevParticipantIds === currentParticipantIds && prev.length === totalSlots) {
        return prev;
      }
      
      // Create new array
      const next = Array.from({ length: totalSlots }, (_, index) => {
        const participantAtSlot = participants[index];
        if (participantAtSlot) {
          return participantAtSlot;
        }
        return prev[index] ?? null;
      });
      return next;
    });
  }, [participants.length, totalSlots]);

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
  }, [slotParticipants, onAllSlotsFilledChange]);

  const handleSummonBot = (slotIndex: number, teamId?: string) => {
    setSlotParticipants((prev) => {
      // 确保数组长度足够
      const ensuredArray = prev.length < totalSlots 
        ? [...prev, ...Array(totalSlots - prev.length).fill(null)]
        : prev;
      
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
        teamId: teamId, // 添加teamId支持
      };
      return updated;
    });
  };

  const isBotParticipant = (participant?: Participant | null) =>
    Boolean(participant?.id?.startsWith("bot-"));

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
            <div className="relative" style={{ opacity: 1 }}>
              {/* 头像 */}
              <div
                className="overflow-hidden border rounded-full"
                style={{ borderWidth: "1px", borderColor: "#2B2F33" }}
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
                      className="object-cover w-full h-full"
                      style={{ color: "transparent" }}
                    />
                  )}
                </div>
              </div>
              
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
                className="flex flex-col w-full relative rounded-lg"
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
              </div>
              
              {/* 底部：Round卡片区域（每个成员一行）*/}
              <div className="flex flex-row gap-2 mt-2 items-stretch">
                {/* 为每个成员槽位创建一列 */}
                {memberSlotsWithIndex.map(({ member }, memberIndex) => (
                  <div key={`${team.id}-member-${memberIndex}`} className="grid gap-2 w-full grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
                    {packs.map((pack, packIndex) => {
                      const roundId = `round-${packIndex}`;
                      const roundPlayerItems = roundResultMap[roundId] || {};
                      
                      // 获取这个成员在这轮的结果
                      const playerResult = member ? roundPlayerItems[member.id] : undefined;

  return (
                        <div
                          key={`${team.id}-member-${memberIndex}-pack-${packIndex}`}
                          data-component="BattleResultsRound"
                          className="group flex flex-1 relative rounded-lg overflow-hidden cursor-pointer min-h-[7rem] sm:min-h-[8rem] md:min-h-[10rem]"
                          style={{ backgroundColor: "#22272B" }}
                        >
                          <div className="flex relative w-full h-full overflow-hidden">
                            {playerResult ? (
                              <>
                                {/* 光晕背景 - 根据品质变色 */}
                                <div 
                                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 group-hover:opacity-90 filter blur-[25px]"
                                  style={{ 
                                    backgroundColor: playerResult.qualityId === 'legendary' ? '#FFD700' 
                                      : playerResult.qualityId === 'epic' ? '#A335EE'
                                      : playerResult.qualityId === 'rare' ? '#0070DD'
                                      : playerResult.qualityId === 'uncommon' ? '#1EFF00'
                                      : '#9D9D9D'
                                  }}
                                />
                                
                                <div className="absolute inset-0 flex w-full h-full flex-col justify-between items-center p-3 text-center" style={{ zIndex: 1 }}>
                                  {/* 中奖百分比 */}
                                  <p className="text-sm text-gray-400 font-semibold h-6">
                                    {playerResult.dropProbability 
                                      ? `${(playerResult.dropProbability * 100).toFixed(4)}%`
                                      : '0.0000%'}
                                  </p>
                                  
                                  {/* 道具图片 - 占据剩余空间 */}
                                  {playerResult.image && (
                                    <div className="relative w-full flex-1 flex items-center justify-center">
                                      <Image
                                        alt={playerResult.name}
                                        src={playerResult.image}
                                        fill
                                        sizes="(min-width: 0px) 100px"
                                        className="object-contain"
                                      />
                                    </div>
                                  )}
                                  
                                  {/* 底部信息 */}
                                  <div className="flex flex-col w-full gap-0.5">
                                    {/* 道具名称 */}
                                    <p className="text-sm text-gray-400 font-semibold truncate max-w-full text-center">
                                      {playerResult.name}
                                    </p>
                                    
                                    {/* 价格 */}
                                    <div className="flex justify-center">
                                      <p className="text-sm text-white font-extrabold">
                                        ${playerResult.price || '0.00'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              // 没有结果，显示Round文字和hover时显示包裹
                              <>
                                {/* Round文字 - hover时消失 */}
                                <div
                                  data-component="RoundCard"
                                  className="absolute inset-0 flex w-full h-full justify-center items-center text-center transition duration-300 group-hover:opacity-0 group-hover:translate-y-4"
                                >
                                  <p className="text-xs sm:text-sm text-white font-bold">Round {packIndex + 1}</p>
                                </div>
                                
                                {/* 包裹图片 - hover时出现 */}
                                <div
                                  data-component="PackCard"
                                  className="absolute inset-0 opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 flex w-full h-full justify-center p-2 md:p-5"
                                >
                                  <Image
                                    alt={pack.name}
                                    src={pack.image}
                                    width={150}
                                    height={300}
                                    className="object-contain h-full w-auto pointer-events-none"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
          return (
            <div key={slotKey} className="flex flex-col w-full">
              <div
                className="flex flex-col w-full relative rounded-lg"
                style={{ backgroundColor: "#22272B" }}
              >
                <div className="flex w-full gap-1 md:gap-4 items-center min-h-[70px] sm:min-h-[86px] py-2 sm:py-4">
                  <div className="flex flex-1 justify-center items-center">
                    {participant ? (
                      <div className="flex gap-2 items-center justify-center flex-col sm:flex-row">
                      <div className="flex relative">
                        <div className="relative" style={{ opacity: 1 }}>
                          <div
                              className="overflow-hidden border rounded-full"
                              style={{ borderWidth: "1px", borderColor: "#2B2F33" }}
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
                                    className="object-cover w-full h-full"
                                style={{ color: "transparent" }}
                              />
                                )}
                            </div>
                          </div>
                            {!isBot && (
                              <div
                                className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-4 -left-1"
                                style={{ backgroundColor: "#22272B", border: "1px solid #2B2F33", color: "#FFFFFF" }}
                              >
                                <span className="text-xxs font-bold leading-none text-white">0</span>
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
                        style={{ backgroundColor: "#48BB78", cursor: "pointer" }}
                        onClick={() => handleSummonBot(slotIndex)}
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
              </div>
            </div>
              <div className="flex flex-row gap-2 mt-2 items-stretch">
                <div className="grid gap-2 w-full grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
                  {packs.map((pack, roundIndex) => {
                    const key = participant ? `${participant.id}-${roundIndex}` : `${slotKey}-round-${roundIndex}`;
                    // Use round index to get results
                    const resultForRound = roundResultMap[`round-${roundIndex}`] || {};
                    const playerResult =
                      participant && resultForRound
                        ? resultForRound[participant.id]
                        : undefined;
                    return (
                      <div
                        key={`${key}-${pack.id}`}
                        data-component="BattleResultsRound"
                        className="group flex flex-1 relative rounded-lg overflow-hidden cursor-pointer min-h-[7rem] sm:min-h-[8rem] md:min-h-[10rem]"
                        style={{ backgroundColor: "#22272B" }}
                      >
                        <div className="flex relative w-full h-full overflow-hidden">
                          {playerResult ? (
                            <>
                              {/* 光晕背景 - 根据品质变色 */}
                              <div 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px]"
                  style={{
                                  backgroundColor: playerResult.qualityId === 'legendary' ? '#FFD700' 
                                    : playerResult.qualityId === 'epic' ? '#A335EE'
                                    : playerResult.qualityId === 'rare' ? '#0070DD'
                                    : playerResult.qualityId === 'uncommon' ? '#1EFF00'
                                    : '#9D9D9D' // common
                                }}
                              />
                              
                              <div className="absolute inset-0 flex w-full h-full flex-col justify-center items-center gap-1 p-2 text-center" style={{ zIndex: 1 }}>
                                {/* 中奖百分比 */}
                                <p className="text-xs text-gray-400 font-semibold">
                                  {playerResult.dropProbability 
                                    ? `${(playerResult.dropProbability * 100).toFixed(4)}%`
                                    : '0.0000%'}
                                </p>
                                
                                 {/* 道具图片 */}
                                 {playerResult.image ? (
                                   <div className="relative w-full h-12 sm:h-16 md:h-20 flex-shrink-0">
                                     <Image
                                       alt={playerResult.name}
                                       src={playerResult.image}
                                       fill
                                       sizes="(min-width: 0px) 100px"
                            className="object-contain"
                                       unoptimized
                          />
                        </div>
                                 ) : (
                                   <span className="text-2xl sm:text-3xl md:text-4xl text-white">{playerResult.name?.slice(0, 2) || '?'}</span>
                                 )}
                                
                                {/* 道具名称 */}
                                <p className="text-xs text-white font-bold truncate w-full">{playerResult.name}</p>
                                
                                {/* 道具价格 */}
                                <p className="text-sm text-white font-extrabold">
                                  ${typeof playerResult.price === 'number' 
                                    ? playerResult.price.toFixed(2) 
                                    : '0.00'}
                            </p>
                          </div>
                            </>
                          ) : (
                            <>
                              <div
                                data-component="RoundCard"
                                className="absolute inset-0 flex w-full h-full justify-center items-center text-center transition duration-300 group-hover:opacity-0 group-hover:translate-y-4"
                              >
                                <p className="text-sm text-white font-bold">Round {roundIndex + 1}</p>
                              </div>
                              <div
                                data-component="PackCard"
                                className="absolute inset-0 opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 flex w-full h-full justify-center p-2 md:p-5"
                              >
                                <Image
                                  alt={pack.name}
                                  src={pack.image}
                                  width={150}
                                  height={300}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-auto"
                                  style={{ color: "transparent" }}
                                  sizes="(min-width: 0px) 100px"
                                  unoptimized
                                />
                        </div>
                            </>
                          )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
