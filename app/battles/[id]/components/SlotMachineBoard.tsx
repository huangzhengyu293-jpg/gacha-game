"use client";

import { type MutableRefObject } from "react";
import LuckySlotMachine from '@/app/components/SlotMachine/LuckySlotMachine';
import type { Participant } from "../types";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";
import SlotEdgePointer from "./SlotEdgePointer";

type SlotMachineBoardProps = {
  participants: Participant[];
  roundData: {
    pools: {
      normal: SlotSymbol[];
      legendary: SlotSymbol[];
    };
    spinStatus: {
      firstStage: {
        gotLegendary: Set<string>;
      };
    };
  } | undefined;
  slotMachineRefs: MutableRefObject<Record<string, any>>;
  slotMachineKeySuffix: Record<string, string>;
  currentRoundPrizes: Record<string, string>;
  spinDuration: number;
  onSlotComplete: (participantId: string, result: SlotSymbol) => void;
  shouldShowSoloSlotSeparators: boolean;
};

export default function SlotMachineBoard({
  participants,
  roundData,
  slotMachineRefs,
  slotMachineKeySuffix,
  currentRoundPrizes,
  spinDuration,
  onSlotComplete,
  shouldShowSoloSlotSeparators,
}: SlotMachineBoardProps) {
  if (!roundData) {
    return null;
  }

  return (
    <div
      className="flex gap-0 md:gap-4 px-4 overflow-x-hidden w-full max-w-[1248px] justify-around"
      style={{ height: '450px', position: 'relative' }}
    >
      <SlotEdgePointer side="left" />
      <SlotEdgePointer side="right" />
      {participants.map((participant, index) => {
        if (!participant || !participant.id) return null;

        const selectedPrizeId = currentRoundPrizes[participant.id];
        const keySuffix = slotMachineKeySuffix[participant.id] || '';
        const isGoldenPlayer = roundData.spinStatus.firstStage.gotLegendary.has(participant.id);
        const showDivider =
          shouldShowSoloSlotSeparators && index < participants.length - 1;

        return (
          <div key={participant.id} className="flex flex-col items-center gap-2 flex-1 min-w-0 relative" style={{ height: '450px' }}>
            <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
              <div
                className="w-full transition-opacity duration-300 absolute inset-0"
                style={{
                  opacity: !keySuffix ? 1 : 0,
                  pointerEvents: !keySuffix ? 'auto' : 'none',
                  zIndex: !keySuffix ? 1 : 0,
                }}
              >
                <LuckySlotMachine
                  key={`${participant.id}-first`}
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
                    pointerEvents: keySuffix ? 'auto' : 'none',
                    zIndex: keySuffix ? 1 : 0,
                  }}
                >
                  <LuckySlotMachine
                    key={`${participant.id}-second`}
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

            {showDivider && (
              <div
                className="slot-machine-divider flex h-full w-6 flex-col items-center justify-center self-center"
                aria-hidden="true"
              >
                <div
                  className="flex w-px sm:w-[2px] flex-1"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(149,149,149,0) 0%, rgba(149,149,149,0.9) 55%, rgba(149,149,149,0) 100%)',
                  }}
                />
                <div className="flex items-center justify-center relative h-8 w-px">
                  <div className="hidden sm:flex absolute items-center justify-center size-8 rounded-full bg-gradient-to-br from-[#9CA9B6] to-[#41464C] shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-center size-7 rounded-full bg-[#2B3136]">
                      <svg
                        viewBox="0 0 25 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-3.5 text-gray-300"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M1.048 4.778c-.161-.16-.25-.379-.248-.606L.83.988C.835.461 1.261.035 1.788.03L4.972 0c.227-.002.446.087.607.248l4.429 4.429-4.53 4.53-4.429-4.43Zm18.966-4.764a.892.892 0 0 0-.606.248L7.307 12.362l4.53 4.53 12.1-12.1a.892.892 0 0 0 .247-.606l-.03-3.184a.892.892 0 0 0-.958-.956l-3.183-.03ZM4.401 12.875c-.283-.283-.742-.283-1.026 0l-1.368 1.368c-.283.283-.283.742 0 1.025l1.795 1.795c.283.283.283.742 0 1.025l-3.59 3.59c-.283.283-.283.743 0 1.026l1.282 1.282c.283.283.742.283 1.025 0l3.59-3.59c.283-.283.742-.283 1.026 0l1.795 1.795c.283.283.742.283 1.025 0l1.368-1.368c.283-.283.283-.742 0-1.025L4.401 12.875Zm9.274 6.924c-.283.283-.283.742 0 1.025l1.368 1.368c.283.283.742.283 1.025 0l1.795-1.795c.283-.283.742-.283 1.025 0l3.59 3.59c.283.283.742.283 1.025 0l1.282-1.282c.283-.283.283-.743 0-1.026l-3.59-3.59c-.283-.283-.283-.742 0-1.025l1.795-1.795c.283-.283.283-.742 0-1.025l-1.368-1.368c-.283-.283-.742-.283-1.025 0l-6.924 6.924Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex sm:hidden items-center justify-center rounded-full bg-[#2B3136] h-6 w-6 shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                    <svg
                      viewBox="0 0 25 25"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-3 text-gray-300"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1.048 4.778c-.161-.16-.25-.379-.248-.606L.83.988C.835.461 1.261.035 1.788.03L4.972 0c.227-.002.446.087.607.248l4.429 4.429-4.53 4.53-4.429-4.43Zm18.966-4.764a.892.892 0 0 0-.606.248L7.307 12.362l4.53 4.53 12.1-12.1a.892.892 0 0 0 .247-.606l-.03-3.184a.892.892 0 0 0-.958-.956l-3.183-.03ZM4.401 12.875c-.283-.283-.742-.283-1.026 0l-1.368 1.368c-.283.283-.283.742 0 1.025l1.795 1.795c.283.283.283.742 0 1.025l-3.59 3.59c-.283.283-.283.743 0 1.026l1.282 1.282c.283.283.742.283 1.025 0l3.59-3.59c.283-.283.742-.283 1.026 0l1.795 1.795c.283.283.742.283 1.025 0l1.368-1.368c.283-.283.283-.742 0-1.025L4.401 12.875Zm9.274 6.924c-.283.283-.283.742 0 1.025l1.368 1.368c.283.283.742.283 1.025 0l1.795-1.795c.283-.283.742-.283 1.025 0l3.59 3.59c.283.283.742.283 1.025 0l1.282-1.282c.283-.283.283-.743 0-1.026l-3.59-3.59c-.283-.283-.283-.742 0-1.025l1.795-1.795c.283-.283.283-.742 0-1.025l-1.368-1.368c-.283-.283-.742-.283-1.025 0l-6.924 6.924Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  className="flex w-px sm:w-[2px] flex-1"
                  style={{
                    background:
                      'linear-gradient(0deg, rgba(149,149,149,0) 0%, rgba(149,149,149,0.9) 55%, rgba(149,149,149,0) 100%)',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
