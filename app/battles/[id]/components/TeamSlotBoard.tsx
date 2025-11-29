"use client";

import { type MutableRefObject } from "react";
import LuckySlotMachine, { type SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import SlotEdgePointer from "./SlotEdgePointer";
import type { Participant } from "../types";

type RoundData = {
  pools: {
    normal: SlotSymbol[];
    legendary: SlotSymbol[];
  };
  spinStatus: {
    firstStage: {
      gotLegendary: Set<string>;
    };
  };
};

type TeamSlotBoardProps = {
  teamGroups: Participant[][];
  teamStructure?: string | null;
  isSmallScreen: boolean;
  roundData: RoundData | undefined;
  slotMachineRefs: MutableRefObject<Record<string, any>>;
  slotMachineKeySuffix: Record<string, string>;
  currentRoundPrizes: Record<string, string>;
  spinDuration: number;
  onSlotComplete: (participantId: string, result: SlotSymbol) => void;
  activeParticipants: Participant[];
};

export default function TeamSlotBoard({
  teamGroups,
  teamStructure,
  isSmallScreen,
  roundData,
  slotMachineRefs,
  slotMachineKeySuffix,
  currentRoundPrizes,
  spinDuration,
  onSlotComplete,
  activeParticipants,
}: TeamSlotBoardProps) {
  if (!roundData) return null;

  const renderSlotMachine = (
    participant: Participant,
    wrapperStyle?: React.CSSProperties,
    slotKeyPrefix = "",
  ) => {
    const selectedPrizeId = currentRoundPrizes[participant.id];
    const keySuffix = slotMachineKeySuffix[participant.id] || "";
    const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);

    return (
      <div
        key={`${slotKeyPrefix}${participant.id}`}
        className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
        style={{ height: "450px", ...wrapperStyle }}
      >
        <div className="absolute inset-0" style={{ width: "100%", height: "100%" }}>
          <div
            className="w-full h-full transition-opacity duration-300 absolute inset-0"
            style={{
              opacity: !keySuffix ? 1 : 0,
              pointerEvents: !keySuffix ? "auto" : "none",
              zIndex: !keySuffix ? 1 : 0,
            }}
          >
            <LuckySlotMachine
              key={`${participant.id}-${slotKeyPrefix}-first`}
              ref={(ref) => {
                if (ref && !keySuffix) slotMachineRefs.current[participant.id] = ref;
              }}
              symbols={roundData.pools.normal}
              selectedPrizeId={!keySuffix ? selectedPrizeId : null}
              height={450}
              spinDuration={spinDuration}
              onSpinComplete={(result) => !keySuffix && onSlotComplete(participant.id, result)}
            />
          </div>

          {isGoldenPlayer && roundData.pools.legendary.length > 0 && (
            <div
              className="w-full h-full transition-opacity duration-300 absolute inset-0"
              style={{
                opacity: keySuffix ? 1 : 0,
                pointerEvents: keySuffix ? "auto" : "none",
                zIndex: keySuffix ? 1 : 0,
              }}
            >
              <LuckySlotMachine
                key={`${participant.id}-${slotKeyPrefix}-second`}
                ref={(ref) => {
                  if (ref && keySuffix) slotMachineRefs.current[participant.id] = ref;
                }}
                symbols={roundData.pools.legendary}
                selectedPrizeId={keySuffix ? selectedPrizeId : null}
                height={450}
                spinDuration={spinDuration}
                onSpinComplete={(result) => keySuffix && onSlotComplete(participant.id, result)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRow = (
    participants: Participant[],
    rowHeight: number,
    marginOffset: number,
    rowKey: string,
  ) => (
    <div
      key={rowKey}
      className="flex gap-0 md:gap-4 justify-around"
      style={{ height: `${rowHeight}px`, overflow: "hidden", pointerEvents: "none" }}
    >
      {participants.map((participant) => {
        if (!participant || !participant.id) return null;
        return renderSlotMachine(participant, { marginTop: `${-marginOffset}px` }, rowKey);
      })}
    </div>
  );

  if (!isSmallScreen) {
    return (
      <div
        className="flex gap-4 px-2 md:px-4 w-full max-w-[1248px]"
        style={{ height: "450px", position: "relative" }}
      >
        <SlotEdgePointer side="left" />
        <SlotEdgePointer side="right" />
        {teamGroups.map((teamMembers, teamIndex) => (
          <div
            key={`team-${teamIndex}`}
            className="flex gap-0 md:gap-4 justify-around flex-1"
            style={{ height: "450px" }}
          >
            {teamMembers.map((participant) => {
              if (!participant || !participant.id) return null;
              return renderSlotMachine(participant, undefined, `team-${teamIndex}`);
            })}
          </div>
        ))}
      </div>
    );
  }

  if (teamStructure === "3v3") {
    return (
      <div
        className="flex flex-col justify-between px-2 md:px-4 w-full max-w-[1248px]"
        style={{ height: "450px" }}
      >
        {renderRow(activeParticipants.slice(0, 3), 216.5, (450 - 216.5) / 2, "3v3-top")}
        {renderRow(activeParticipants.slice(3, 6), 216.5, (450 - 216.5) / 2, "3v3-bottom")}
      </div>
    );
  }

  if (teamStructure === "2v2v2") {
    const rowOffset = (450 - 130) / 2;
    return (
      <div
        className="flex flex-col px-2 md:px-4 w-full max-w-[1248px]"
        style={{ height: "450px", gap: "17px", justifyContent: "center" }}
      >
        {renderRow(activeParticipants.slice(0, 2), 130, rowOffset, "2v2v2-row-1")}
        {renderRow(activeParticipants.slice(2, 4), 130, rowOffset, "2v2v2-row-2")}
        {renderRow(activeParticipants.slice(4, 6), 130, rowOffset, "2v2v2-row-3")}
      </div>
    );
  }

  return null;
}

