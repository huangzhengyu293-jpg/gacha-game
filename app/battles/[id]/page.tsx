"use client";

import { useState } from "react";
import BattleHeader from "./components/BattleHeader";
import ParticipantsWithPrizes from "./components/ParticipantsWithPrizes";
import PacksGallery from "./components/PacksGallery";
import PackDetailModal from "./components/PackDetailModal";
import { useBattleData } from "./hooks/useBattleData";
import type { PackItem } from "./types";
import BattleInfoCard from "./components/BattleInfoCard";
import SlotMachineSection from "./components/SlotMachineSection/SlotMachineSection";

export default function BattleDetailPage() {
  const battleData = useBattleData();
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);

  // Convert packs to packImages format for BattleHeader
  const packImages = battleData.packs.map((pack) => ({
    src: pack.image,
    alt: pack.name,
    id: pack.id,
  }));

  // Determine highlighted indices based on opened packs (example: highlight first opened pack)
  const highlightedIndices = battleData.packs
    .map((pack, index) => (pack.openedBy ? index : -1))
    .filter((index) => index !== -1);

  return (
    <div
      className="w-full px-4 sm:px-6 md:px-8 pb-12"
      style={{
        paddingLeft: "max(env(safe-area-inset-left, 0px), 16px)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 16px)",
      }}
    >
      <div className="flex w-full max-w-[1248px] mx-auto flex-col gap-6">
        <div className="w-full">
          <BattleHeader
            packImages={packImages}
            highlightedIndices={highlightedIndices}
            awardName="大奖"
            currentPackName={battleData.packs[0]?.name || ""}
            currentPackPrice={battleData.packs[0]?.value || ""}
            totalCost={battleData.cost}
            onFairnessClick={() => {
              // Handle fairness click
              console.log("Fairness clicked");
            }}
            onShareClick={() => {
              // Handle share click
              console.log("Share clicked");
            }}
          />
        </div>
{/*  */}
        {/* <BattleInfoCard battleData={battleData} /> */}
        <SlotMachineSection></SlotMachineSection>
        <ParticipantsWithPrizes battleData={battleData} />
        {/* <PacksGallery packs={battleData.packs} onPackClick={setSelectedPack} /> */}
        {selectedPack && (
          <PackDetailModal
            pack={selectedPack}
            onClose={() => setSelectedPack(null)}
          />
        )}
      </div>
    </div>
  );
}
