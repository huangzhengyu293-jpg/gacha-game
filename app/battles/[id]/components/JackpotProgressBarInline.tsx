'use client';

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type PlayerSegment = {
  id: string;
  name: string;
  percentage: number;
  color: string;
};

type JackpotProgressBarInlineProps = {
  players: PlayerSegment[];
  winnerId: string;
  onComplete: () => void;
};

function adjustColor(color: string, amount: number): string {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  const r = Math.min(255, Math.max(0, parseInt(match[1]) + amount));
  const g = Math.min(255, Math.max(0, parseInt(match[2]) + amount));
  const b = Math.min(255, Math.max(0, parseInt(match[3]) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function JackpotProgressBarInline({
  players,
  winnerId,
  onComplete,
}: JackpotProgressBarInlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const executed = useRef(false);

  useEffect(() => {
    if (
      executed.current ||
      !containerRef.current ||
      !segmentsRef.current ||
      players.length === 0 ||
      !winnerId
    ) {
      return;
    }

    executed.current = true;

    const containerWidth = containerRef.current.offsetWidth;
    const screenCenter = containerWidth / 2;

    let cumulativePercent = 0;
    let winnerStartPercent = 0;
    let winnerEndPercent = 0;
    let winnerFound = false;

    for (const p of players) {
      if (p.id === winnerId) {
        winnerStartPercent = cumulativePercent;
        winnerEndPercent = cumulativePercent + p.percentage;
        winnerFound = true;
        break;
      }
      cumulativePercent += p.percentage;
    }

    if (!winnerFound) return;
    const randomPercent =
      winnerStartPercent + Math.random() * (winnerEndPercent - winnerStartPercent);
    const randomPixels = (randomPercent / 100) * containerWidth;
    const randomAbsolutePos = 6 * containerWidth + randomPixels;
    const moveDistance = randomAbsolutePos - screenCenter;

    gsap.set(segmentsRef.current, { x: 0 });
    setTimeout(() => {
      if (segmentsRef.current) {
        gsap.to(segmentsRef.current, {
          x: -moveDistance,
          duration: 4,
          ease: 'power2.inOut',
          onComplete,
        });
      }
    }, 500);
  }, [players, winnerId, onComplete]);

  const renderSegments = () => {
    const containerWidth = containerRef.current?.offsetWidth || 1248;
    const segments: JSX.Element[] = [];

    for (let copy = 0; copy < 10; copy++) {
      for (const player of players) {
        const widthPx = (player.percentage / 100) * containerWidth;
        const lighter = adjustColor(player.color, 20);

        segments.push(
          <div
            key={`${copy}-${player.id}`}
            className="h-full flex-shrink-0"
            style={{
              width: `${widthPx}px`,
              border: `1px solid ${player.color}`,
              background: `repeating-linear-gradient(115deg, ${player.color}, ${lighter} 1px, ${lighter} 5px, ${player.color} 6px, ${player.color} 17px)`,
            }}
          />,
        );
      }
    }
    return segments;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 overflow-hidden" style={{ height: '450px' }}>
      <div className="flex flex-col items-center relative w-full max-w-[1248px]">
        <div ref={containerRef} className="relative w-full max-w-[1248px] overflow-hidden h-28 min-h-28 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
          <div ref={segmentsRef} className="flex h-full" style={{ width: 'max-content' }}>
            {renderSegments()}
          </div>
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 size-5 min-w-5 min-h-5 text-white z-10">
          <svg viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.739429 3.00255L6.01823 12.1147C6.77519 13.4213 8.65172 13.4499 9.44808 12.1668L15.1039 3.05473C15.9309 1.72243 14.9727 0 13.4047 0H2.47C0.929093 0 -0.0329925 1.66922 0.739429 3.00255Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 size-5 min-w-5 min-h-5 text-white z-10">
          <svg viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.739429 10.9974L6.01823 1.88534C6.77519 0.578686 8.65172 0.550138 9.44808 1.83316L15.1039 10.9453C15.9309 12.2776 14.9727 14 13.4047 14H2.47C0.929093 14 -0.0329925 12.3308 0.739429 10.9974Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

