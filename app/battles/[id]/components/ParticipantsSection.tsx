'use client';

import type { Participant } from '../types';

interface ParticipantsSectionProps {
  participants: Participant[];
}

export default function ParticipantsSection({ participants }: ParticipantsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-extrabold text-white">参与者</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{
              backgroundColor: '#22272B',
              border: participant.isWinner ? '2px solid #10B981' : '1px solid #34383C',
            }}
          >
            <div className="relative">
              <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 2, width: 56, height: 56 }}>
                <img
                  alt={participant.name}
                  loading="lazy"
                  decoding="async"
                  src={participant.avatar}
                  className="w-full h-full object-cover"
                  style={{ color: 'transparent' }}
                />
              </div>
              {participant.isWinner && (
                <div className="absolute -top-1 -right-1 size-6 text-yellow-400">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white truncate">{participant.name}</p>
              <p className="text-sm font-bold" style={{ color: '#7A8084' }}>总价值: {participant.totalValue}</p>
            </div>
            {participant.isWinner && (
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}>
                获胜者
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

