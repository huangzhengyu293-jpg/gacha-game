'use client';

import Image from "next/image";
import FireworkArea, { type FireworkAreaHandle } from "@/app/components/FireworkArea";
import JackpotProgressBarInline from "./JackpotProgressBarInline";
import type { Participant } from "../types";

type WinnerSegment = {
  id: string;
  name: string;
  percentage: number;
  color: string;
};

type CompletedBattleContentProps = {
  winners: Participant[];
  gameMode: string;
  isTeamMode: boolean;
  prizePerParticipant: number;
  playerColors: Record<string, string>;
  jackpotPhase: 'rolling' | 'winner';
  jackpotPlayerSegments: WinnerSegment[];
  jackpotAnimationKey: number;
  jackpotWinnerId: string;
  onJackpotAnimationComplete: () => void;
  winnerFireworkRef: React.RefObject<FireworkAreaHandle | null>;
  onReplay: () => void;
  onCreateNewBattle: () => void;
  onCopySetup: () => void;
  battleCost: string;
};

const isBotParticipant = (participant?: Participant | null) =>
  Boolean(participant?.id && String(participant.id).startsWith('bot-'));

const adjustColor = (color: string, amount: number): string => {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  const r = Math.min(255, Math.max(0, parseInt(match[1]) + amount));
  const g = Math.min(255, Math.max(0, parseInt(match[2]) + amount));
  const b = Math.min(255, Math.max(0, parseInt(match[3]) + amount));
  return `rgb(${r}, ${g}, ${b})`;
};

function renderAvatar(participant: Participant) {
  const maskId = `mask-${participant.id}`;
  if (isBotParticipant(participant) || !participant.avatar) {
    return (
      <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
          <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask={`url(#${maskId})`}>
          <rect width="36" height="36" fill="#333333"></rect>
          <rect x="0" y="0" width="36" height="36" transform="translate(-1 5) rotate(305 18 18) scale(1.2)" fill="#0C8F8F" rx="36"></rect>
          <g transform="translate(-1 1) rotate(5 18 18)">
            <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
            <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
            <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
          </g>
        </g>
      </svg>
    );
  }

  return (
    <Image
      alt={participant.name}
      src={participant.avatar}
      fill
      sizes="(min-width: 0px) 100px"
      className="pointer-events-none object-cover"
    />
  );
}

export default function CompletedBattleContent({
  winners,
  gameMode,
  isTeamMode,
  prizePerParticipant,
  playerColors,
  jackpotPhase,
  jackpotPlayerSegments,
  jackpotAnimationKey,
  jackpotWinnerId,
  onJackpotAnimationComplete,
  winnerFireworkRef,
  onReplay,
  onCreateNewBattle,
  onCopySetup,
  battleCost,
}: CompletedBattleContentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-[1280px] relative" style={{ minHeight: '450px' }}>
      <FireworkArea ref={winnerFireworkRef} />

      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        {winners.map((member, index) => (
          <div key={member.id} className="flex flex-col items-center justify-center">
            <div className="relative" style={{ opacity: 1 }}>
              <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: '1px' }}>
                <div className="relative rounded-full overflow-hidden w-12 h-12 md:w-24 md:h-24 xl:w-32 xl:h-32">
                  {renderAvatar(member)}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center max-w-[100px] md:max-w-[200px]">
              <span className="font-bold text-sm md:text-lg xl:text-xl text-center w-full truncate">{member.name}</span>
              <p className="text-sm md:text-base text-white font-bold">${prizePerParticipant.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none h-10 px-6"
          style={{ backgroundColor: '#10B981', color: '#ffffff' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#10B981'; }}
        >
          <p className="text-base font-bold" style={{ color: '#ffffff' }}>
            用 {battleCost} 重新创建此对战
          </p>
        </button>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
            style={{ backgroundColor: '#34383C', color: '#ffffff' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5A5E62'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#34383C'; }}
            onClick={onReplay}
            aria-label="重播"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none h-10 px-6 flex-1"
            style={{ backgroundColor: '#34383C', color: '#ffffff' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5A5E62'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#34383C'; }}
            onClick={onCreateNewBattle}
          >
            <p className="text-base font-bold" style={{ color: '#ffffff' }}>创建新对战</p>
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
            style={{ backgroundColor: '#34383C', color: '#ffffff' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5A5E62'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#34383C'; }}
            onClick={onCopySetup}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
            </svg>
          </button>
        </div>
      </div>

      {gameMode === 'jackpot' && jackpotPhase === 'rolling' && jackpotPlayerSegments.length > 0 && (
        <JackpotProgressBarInline
          key={`jackpot-animation-${jackpotAnimationKey}`}
          players={jackpotPlayerSegments}
          winnerId={jackpotWinnerId}
          onComplete={onJackpotAnimationComplete}
        />
      )}

      {gameMode === 'jackpot' && winners.length > 0 && (
        <div className="flex flex-col items-center relative w-full max-w-[1280px] p-4">
          <div className="flex relative justify-center w-full overflow-hidden transition-transform duration-100 ease-in h-6 min-h-6 rounded-md">
            <div className="flex relative w-full">
              <div
                className="flex absolute top-0 bottom-0 left-0 right-0 justify-center items-center"
                style={{
                  border: `1px solid ${playerColors[winners[0].id] || 'rgb(128, 128, 128)'}`,
                  background: `repeating-linear-gradient(115deg, ${
                    playerColors[winners[0].id] || 'rgb(128, 128, 128)'
                  }, ${adjustColor(playerColors[winners[0].id] || 'rgb(128, 128, 128)', 20)} 1px, ${adjustColor(
                    playerColors[winners[0].id] || 'rgb(128, 128, 128)',
                    20,
                  )} 5px, ${playerColors[winners[0].id] || 'rgb(128, 128, 128)'} 6px, ${
                    playerColors[winners[0].id] || 'rgb(128, 128, 128)'
                  } 17px)`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

