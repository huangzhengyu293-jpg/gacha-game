'use client';

import HorizontalLuckySlotMachine, {
  type SlotSymbol as HorizontalSlotSymbol,
} from '@/app/components/SlotMachine/HorizontalLuckySlotMachine';

type TieBreakerOverlayProps = {
  isVisible: boolean;
  symbols: HorizontalSlotSymbol[];
  winnerId: string;
  onSpinComplete: () => void;
  isFastMode: boolean;
};

export default function TieBreakerOverlay({
  isVisible,
  symbols,
  winnerId,
  onSpinComplete,
  isFastMode,
}: TieBreakerOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="flex absolute justify-center items-center flex-col"
      style={{
        height: '450px',
        width: '100vw',
        backgroundColor: '#191d21',
        zIndex: 55,
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <HorizontalLuckySlotMachine
        symbols={symbols}
        selectedPrizeId={winnerId}
        onSpinComplete={onSpinComplete}
        width={9999}
        spinDuration={isFastMode ? 1000 : 4500}
        isEliminationMode={true}
      />
    </div>
  );
}

