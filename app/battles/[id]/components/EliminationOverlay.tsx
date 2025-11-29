'use client';

import EliminationSlotMachine, {
  type PlayerSymbol,
  type EliminationSlotMachineHandle,
} from './EliminationSlotMachine';
import { forwardRef } from 'react';

type EliminationOverlayProps = {
  isVisible: boolean;
  players: PlayerSymbol[];
  selectedPlayerId: string;
  onSpinComplete: () => void;
  isFastMode: boolean;
};

const EliminationOverlay = forwardRef<EliminationSlotMachineHandle, EliminationOverlayProps>(
  ({ isVisible, players, selectedPlayerId, onSpinComplete, isFastMode }, ref) => {
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
          zIndex: 50,
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <EliminationSlotMachine
          ref={ref}
          players={players}
          selectedPlayerId={selectedPlayerId}
          onSpinComplete={onSpinComplete}
          isFastMode={isFastMode}
        />
      </div>
    );
  },
);

EliminationOverlay.displayName = 'EliminationOverlay';

export default EliminationOverlay;

