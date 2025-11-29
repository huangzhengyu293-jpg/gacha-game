"use client";

import { type MutableRefObject } from "react";
import LuckySlotMachine, { type SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
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

type CompactSlotGridProps = {
  participants: Participant[];
  roundData: RoundData | undefined;
  slotMachineRefs: MutableRefObject<Record<string, any>>;
  slotMachineKeySuffix: Record<string, string>;
  currentRoundPrizes: Record<string, string>;
  spinDuration: number;
  onSlotComplete: (participantId: string, result: SlotSymbol) => void;
};

export default function CompactSlotGrid({
  participants,
  roundData,
  slotMachineRefs,
  slotMachineKeySuffix,
  currentRoundPrizes,
  spinDuration,
  onSlotComplete,
}: CompactSlotGridProps) {
  if (!roundData) return null;

  const renderSlot = (participant: Participant, wrapperKey: string) => {
    const selectedPrizeId = currentRoundPrizes[participant.id];
    if (!selectedPrizeId) {
      console.warn(`⚠️ selectedPrizeId 未设置，参与者: ${participant.name}`);
      return null;
    }

    const keySuffix = slotMachineKeySuffix[participant.id] || "";
    const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);

    return (
      <div
        key={`${wrapperKey}-${participant.id}`}
        className="flex flex-col items-center gap-2 flex-1 min-w-0 relative"
        style={{ marginTop: `${-(450 - 216.5) / 2}px` }}
      >
        <div className="absolute inset-0" style={{ width: "100%", height: "100%" }}>
          <div
            className="w-full transition-opacity duration-300 absolute inset-0"
            style={{
              opacity: !keySuffix ? 1 : 0,
              pointerEvents: !keySuffix ? "auto" : "none",
              zIndex: !keySuffix ? 1 : 0,
            }}
          >
            <LuckySlotMachine
              key={`${participant.id}-${wrapperKey}-first`}
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
              className="w-full transition-opacity duration-300 absolute inset-0"
              style={{
                opacity: keySuffix ? 1 : 0,
                pointerEvents: keySuffix ? "auto" : "none",
                zIndex: keySuffix ? 1 : 0,
              }}
            >
              <LuckySlotMachine
                key={`${participant.id}-${wrapperKey}-second`}
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

  return (
    <div
      className="flex flex-col justify-between px-2 md:px-4 w-full max-w-[1248px]"
      style={{ height: "450px" }}
    >
      <div
        className="flex gap-0 md:gap-4 justify-around"
        style={{ height: "216.5px", overflow: "hidden", pointerEvents: "none" }}
      >
        {participants.slice(0, 3).map((participant) => {
          if (!participant || !participant.id) return null;
          return renderSlot(participant, "compact-top");
        })}
      </div>
      <div
        className="flex gap-0 md:gap-4 justify-around"
        style={{ height: "216.5px", overflow: "hidden", pointerEvents: "none" }}
      >
        {participants.slice(3, 6).map((participant) => {
          if (!participant || !participant.id) return null;
          return renderSlot(participant, "compact-bottom");
        })}
      </div>
    </div>
  );
}

