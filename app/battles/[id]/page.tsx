'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../components/I18nProvider';

type PackItem = {
  id: string;
  image: string;
  name: string;
  value: string;
  openedBy?: string;
};

export default function BattleDetailPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);
  const params = useParams()
  // Mock data - replace with actual API call
  const battleData = {
    id: params.id,
    title: '分享模式对战',
    mode: 'share',
    status: 'completed', // 'active', 'completed', 'pending'
    cost: '$345.30',
    totalOpened: '$60,921.00',
    participants: [
      { id: '1', name: 'Player1', avatar: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot32.png?tr=w-128,c-at_max', totalValue: '$35,450.00', isWinner: true },
      { id: '2', name: 'Player2', avatar: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot21.png?tr=w-128,c-at_max', totalValue: '$25,471.00', isWinner: false },
    ],
    packs: [
      { id: '1', image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max', name: 'Pack 1', value: '$1,250.00', openedBy: 'Player1' },
      { id: '2', image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm26flgi701cpm4zlkfg9r5rs/packs/cm26flgi701cpm4zlkfg9r5rs_kSVR2aWAW.png?tr=q-50,w-128,c-at_max', name: 'Pack 2', value: '$2,500.00', openedBy: 'Player2' },
      { id: '3', image: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max', name: 'Pack 3', value: '$3,750.00', openedBy: 'Player1' },
      { id: '4', image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max', name: 'Pack 4', value: '$1,800.00', openedBy: 'Player2' },
      { id: '5', image: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max', name: 'Pack 5', value: '$4,200.00', openedBy: 'Player1' },
    ],
    createdAt: '2025-01-15T10:30:00Z',
    completedAt: '2025-01-15T11:45:00Z',
  };

  const goBack = () => router.back();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex w-full max-w-[1248px] mx-auto flex-col gap-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={goBack}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base text-gray-400 font-bold hover:text-white select-none h-10 px-0 gap-2"
          >
            <div className="size-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
                <path d="M8 3L3 8L8 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M13 8L3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <p className="text-sm text-white font-bold">{t('battles')}</p>
          </button>
        </div>

        {/* Battle Info Card */}
        <div className="flex flex-col gap-4 p-4 md:p-6 rounded-lg" style={{ backgroundColor: '#22272B' }}>
          {/* Title and Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{battleData.title}</h1>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: battleData.status === 'completed' ? '#10B981' : battleData.status === 'active' ? '#3B82F6' : '#6B7280',
                    color: '#FFFFFF',
                  }}
                >
                  {battleData.status === 'completed' ? '已完成' : battleData.status === 'active' ? '进行中' : '待开始'}
                </span>
                <span className="text-sm text-gray-400">
                  {battleData.status === 'completed' && battleData.completedAt
                    ? `完成于 ${formatDate(battleData.completedAt)}`
                    : `创建于 ${formatDate(battleData.createdAt)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Battle Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{t('cost')}</p>
              <p className="text-lg font-extrabold text-white">{battleData.cost}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{t('opened')}</p>
              <p className="text-lg font-extrabold text-white">{battleData.totalOpened}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold" style={{ color: '#7A8084' }}>参与者</p>
              <p className="text-lg font-extrabold text-white">{battleData.participants.length}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold" style={{ color: '#7A8084' }}>礼包数量</p>
              <p className="text-lg font-extrabold text-white">{battleData.packs.length}</p>
            </div>
          </div>
        </div>

        {/* Participants Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold text-white">参与者</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {battleData.participants.map((participant) => (
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

        {/* Packs Gallery Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold text-white">已开启的礼包</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {battleData.packs.map((pack) => (
              <div
                key={pack.id}
                className="flex flex-col gap-2 p-3 rounded-lg cursor-pointer transition-all"
                style={{ backgroundColor: '#22272B' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '#2A2D35';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '#22272B';
                }}
                onClick={() => setSelectedPack(pack)}
              >
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden" style={{ backgroundColor: '#0F1012' }}>
                  <img
                    alt={pack.name}
                    loading="lazy"
                    decoding="async"
                    src={pack.image}
                    className="w-full h-full object-cover"
                    style={{ color: 'transparent', opacity: 0.9 }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-white truncate">{pack.name}</p>
                  <p className="text-xs font-bold" style={{ color: '#7A8084' }}>{pack.value}</p>
                  {pack.openedBy && (
                    <p className="text-xs" style={{ color: '#7A8084' }}>开启者: {pack.openedBy}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pack Detail Modal */}
        {selectedPack && (
          <div
            className="fixed inset-0 z-50 px-4 py-16 overflow-y-auto flex justify-center items-start"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)', pointerEvents: 'auto' }}
            onClick={() => setSelectedPack(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-lg rounded-lg shadow-lg overflow-hidden grid gap-4 p-6"
              style={{ backgroundColor: '#22272B' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-bold text-white">{selectedPack.name}</h2>
              </div>
              <div className="rounded-lg" style={{ backgroundColor: '#34383C', padding: 24 }}>
                <div className="h-[400px] flex justify-center">
                  <img
                    alt={selectedPack.name}
                    loading="lazy"
                    decoding="async"
                    src={selectedPack.image}
                    style={{ color: 'transparent', objectFit: 'contain', height: '100%', width: 'auto' }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-black text-lg text-white">{selectedPack.value}</p>
                  {selectedPack.openedBy && (
                    <p className="text-sm" style={{ color: '#7A8084' }}>开启者: {selectedPack.openedBy}</p>
                  )}
                </div>
                <div className="flex w-full" style={{ backgroundColor: '#4B5563', height: 1 }}></div>
                <p style={{ color: '#7A8084' }}>礼包详情将由后端提供。</p>
              </div>
              <button
                type="button"
                className="absolute right-5 top-5 rounded-lg w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                onClick={() => setSelectedPack(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

