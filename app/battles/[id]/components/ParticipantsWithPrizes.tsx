"use client";

import type { BattleData, Participant, PrizeItem } from "../types";
import Image from "next/image";

interface ParticipantsWithPrizesProps {
  battleData: BattleData;
  itemsPerRow?: number; // 每行卡片数量，默认3个，范围2-3
}

interface TeamGroup {
  teamId?: string;
  participants: Participant[];
  allItems: PrizeItem[];
}

export default function ParticipantsWithPrizes({
  battleData,
  itemsPerRow = 3,
}: ParticipantsWithPrizesProps) {
  const { participants, battleType, teamStructure } = battleData;

  // 限制 itemsPerRow 在 2-3 之间
  const validItemsPerRow = Math.max(2, Math.min(3, itemsPerRow));

  // Group participants by team for team battles, or create individual groups for solo
  const groups: TeamGroup[] = [];

  if (battleType === "team" && teamStructure) {
    // Group by teamId
    const teamMap = new Map<string, TeamGroup>();

    participants.forEach((participant) => {
      const teamId = participant.teamId || "unknown";
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          teamId,
          participants: [],
          allItems: [],
        });
      }
      const team = teamMap.get(teamId)!;
      team.participants.push(participant);
      if (participant.items) {
        team.allItems.push(...participant.items);
      }
    });

    groups.push(...Array.from(teamMap.values()));
  } else {
    // Solo battle - each participant is their own group
    participants.forEach((participant) => {
      groups.push({
        teamId: undefined,
        participants: [participant],
        allItems: participant.items || [],
      });
    });
  }

  // Calculate grid columns - use inline style for dynamic columns
  const columnCount = groups.length;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid w-full gap-2"
        style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
      >
        {groups.map((group, groupIndex) => (
          <div
            key={group.teamId || `solo-${groupIndex}`}
            className="flex flex-col w-full"
          >
            {/* Header Section */}
            <div
              style={{ backgroundColor: "rgb(34 39 43 / 1)" }}
              className="flex flex-col w-full relative rounded-lg"
            >
              <div className="flex w-full gap-1 md:gap-4 items-center min-h-[86px] py-4">
                {group.participants.map((participant, pIndex) => (
                  <div
                    key={participant.id}
                    className="flex flex-1 justify-center items-center"
                  >
                    <div className="flex gap-2 items-center justify-center flex-row">
                      <div className="flex relative">
                        <div className="relative" style={{ opacity: 1 }}>
                          <div
                            className="overflow-hidden border rounded-full border-gray-700"
                            style={{ borderWidth: "1px" }}
                          >
                            <div
                              className="relative rounded-full overflow-hidden"
                              style={{ width: 32, height: 32 }}
                            >
                              <Image
                                src={participant.avatar}
                                alt={participant.name}
                                width={32}
                                height={32}
                                className="object-cover"
                                style={{ color: "transparent" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-start">
                        <p className="text-base font-bold text-white max-w-24 overflow-hidden text-ellipsis whitespace-nowrap">
                          {participant.name}
                        </p>
                        <div
                          className="flex justify-center items-center border rounded p-0.5 w-16 lg:w-[5.5rem]"
                          style={{
                            borderColor: participant.isWinner
                              ? "rgb(255, 75, 79)"
                              : "rgb(93, 123, 139)",
                            backgroundColor: participant.isWinner
                              ? "rgb(255, 75, 79)"
                              : "rgb(93, 123, 139)",
                          }}
                        >
                          <p className="text-xs lg:text-sm text-white font-semibold">
                            {participant.totalValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prize Grid Section */}
            {group.allItems.length > 0 && (
              <div className="flex flex-row gap-2 mt-2">
                <div
                  className="grid gap-2 w-full"
                  style={{
                    gridTemplateColumns: `repeat(${validItemsPerRow}, 1fr)`,
                  }}
                >
                  {group.allItems.map((item) => (
                    <div
                      key={item.id}
                      // 广澳暂时写死后续优化
                      className="relative aspect-battlePack sm:aspect-battlePackSm md:aspect-battlePackMd w-[200px] h-[250px]"
                    >
                      <div
                        style={{ backgroundColor: "rgb(34 39 43 / 1)" }}
                        className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 ease-in-out p-4 cursor-pointer opacity-100"
                      >
                        <p
                          className="font-semibold text-gray-400 h-6 text-base"
                          style={{ color: "rgb(122 128 132/1)" }}
                        >
                          {item.percentage}
                        </p>
                        <div className="relative flex-1 flex w-full justify-center my-[10px]">
                          <div style={{backgroundColor: "rgb(75 105 255 / 1)"}} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px]"></div>
                          <img
                            src={item.image}
                            className="object-contain"
                            style={{
                              position: "absolute",
                              height: "100%",
                              width: "100%",
                              inset: "0px",
                              objectFit: "contain",
                              color: "transparent",
                              zIndex: 1,
                            }}
                            loading="lazy"
                            data-nimg="fill"
                          />
                        </div>

                        <div className="flex flex-col w-full gap-0.5">
                          <p
                            className="font-semibold truncate max-w-full text-gray-400 text-center text-base"
                            style={{ color: "rgb(122 128 132/1)" }}
                          >
                            {item.name}
                          </p>
                          <div className="flex justify-center">
                            <p className="font-extrabold text-white">
                              {item.price}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
