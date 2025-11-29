'use client';

import BattleHeader from "./BattleHeader";
import PacksGallery from "./PacksGallery";
import ParticipantsWithPrizes from "./ParticipantsWithPrizes";
import type { BattleData, BattleSlot } from "../types";
import type { SlotSymbol } from "@/app/components/SlotMachine/LuckySlotMachine";

type RoundResultsEntry = Array<{
  roundId: string;
  playerItems: Record<string, SlotSymbol | undefined>;
}>;

export type PendingBattleScreenProps = {
  battleData: BattleData;
  packImages: Array<{ src: string; alt: string; id: string }>;
  firstPackName: string;
  firstPackPrice: string;
  pendingStatusMessage: string;
  gameMode: string;
  isFastMode: boolean;
  isLastChance: boolean;
  isInverted: boolean;
  roundResults: RoundResultsEntry;
  participantValues: Record<string, number>;
  playerColors: Record<string, string>;
  eliminatedPlayerIds: Set<string>;
  eliminationRounds: Record<string, number>;
  sprintScores: Record<string, number>;
  completedRounds: Set<number>;
  slotAssignments: BattleSlot[];
  currentUserId: string | null;
  onAllSlotsFilledChange: (filled: boolean, participants?: any[]) => void;
  onJoinSlot: (slotIndex: number, teamId?: string) => void;
  onFairnessClick: () => void;
  onShareClick: () => void;
};

export default function PendingBattleScreen({
  battleData,
  packImages,
  firstPackName,
  firstPackPrice,
  pendingStatusMessage,
  gameMode,
  isFastMode,
  isLastChance,
  isInverted,
  roundResults,
  participantValues,
  playerColors,
  eliminatedPlayerIds,
  eliminationRounds,
  sprintScores,
  completedRounds,
  slotAssignments,
  currentUserId,
  onAllSlotsFilledChange,
  onJoinSlot,
  onFairnessClick,
  onShareClick,
}: PendingBattleScreenProps) {
  return (
    <div className="flex flex-col flex-1 items-stretch relative">
      <div className="flex flex-col items-center gap-0 pb-12 w-full" style={{ marginTop: '-32px' }}>
        <BattleHeader
          packImages={packImages}
          highlightedIndices={[]}
          statusText="等待玩家"
          totalCost={battleData.cost}
          isCountingDown={false}
          isPlaying={false}
          isCompleted={false}
          currentRound={0}
          totalRounds={battleData.packs.length}
          currentPackName={firstPackName}
          currentPackPrice={firstPackPrice}
          gameMode={gameMode}
          isFastMode={isFastMode}
          isLastChance={isLastChance}
          isInverted={isInverted}
          onFairnessClick={onFairnessClick}
          onShareClick={onShareClick}
        />
        <div className="flex w-full max-w-[1248px] px-4 mt-6">
          <PacksGallery
            packs={battleData.packs}
            countdownValue={null}
            highlightAlert={false}
            forceHidden={false}
            currentRound={0}
          />
        </div>
      </div>
      <div className="flex flex-col items-center w-full px-4 pb-10 gap-4">
        <p className="text-sm text-gray-400 text-center">{pendingStatusMessage}</p>
        <ParticipantsWithPrizes
          battleData={battleData}
          onAllSlotsFilledChange={onAllSlotsFilledChange}
          roundResults={roundResults}
          participantValues={participantValues}
          gameMode={gameMode}
          playerColors={playerColors}
          eliminatedPlayerIds={eliminatedPlayerIds}
          eliminationRounds={eliminationRounds}
          sprintScores={sprintScores}
          currentRound={0}
          completedRounds={completedRounds}
          slotAssignments={slotAssignments}
          currentUserId={currentUserId}
          onJoinSlot={onJoinSlot}
        />
      </div>
    </div>
  );
}

