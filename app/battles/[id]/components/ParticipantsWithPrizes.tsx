"use client";

import type { BattleData, Participant } from "../types";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";

interface ParticipantsWithPrizesProps {
  battleData: BattleData;
  onAllSlotsFilledChange?: (filled: boolean, participants?: any[]) => void;
  roundResults: Array<{ roundId: string; playerItems: Record<string, SlotSymbol | undefined> }>;
}

export default function ParticipantsWithPrizes({
  battleData,
  onAllSlotsFilledChange,
  roundResults,
}: ParticipantsWithPrizesProps) {
  const { participants, packs, playersCount } = battleData;
  const [activeGroup, setActiveGroup] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const prevFilledRef = useRef<boolean>(false);

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

  const handleSummonBot = (slotIndex: number) => {
    setSlotParticipants((prev) => {
      if (prev[slotIndex]) {
        return prev;
      }
      const updated = [...prev];
      updated[slotIndex] = {
        id: `bot-${slotIndex}-${Date.now()}`,
        name: `Bot ${slotIndex + 1}`,
        avatar: "",
        totalValue: "$0.00",
        isWinner: false,
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
                            style={{ backgroundColor: "#34383C" }}
                          >
                            <p className="text-xxs sm:text-xs lg:text-sm text-white font-semibold">{participant.totalValue}</p>
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
                            <div className="absolute inset-0 flex w-full h-full flex-col justify-center items-center gap-2 p-2 text-center">
                              {playerResult.image ? (
                                <Image
                                  alt={playerResult.name}
                                  src={playerResult.image}
                                  width={80}
                                  height={80}
                                  className="h-16 w-auto object-contain flex-shrink-0"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-2xl text-white">{playerResult.name?.slice(0, 2) || '?'}</span>
                              )}
                              <p className="text-sm text-white font-bold truncate w-full">{playerResult.name}</p>
                            </div>
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
