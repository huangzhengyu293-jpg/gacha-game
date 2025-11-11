import { useParams } from 'next/navigation';
import type { BattleData } from '../types';

export function useBattleData(): BattleData {
  const params = useParams();
  
  // Mock data - replace with actual API call
  return {
    id: params.id || '',
    title: '分享模式对战',
    mode: 'share',
    status: 'completed',
    cost: '$345.30',
    totalOpened: '$60,921.00',
    battleType: 'solo',
    packs: [
      { id: '1', image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max', name: 'Pack 1', value: '$1,250.00', openedBy: 'Player1' },
      { id: '2', image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm26flgi701cpm4zlkfg9r5rs/packs/cm26flgi701cpm4zlkfg9r5rs_kSVR2aWAW.png?tr=q-50,w-128,c-at_max', name: 'Pack 2', value: '$2,500.00', openedBy: 'Player2' },
      { id: '3', image: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max', name: 'Pack 3', value: '$3,750.00', openedBy: 'Player1' },
      { id: '4', image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max', name: 'Pack 4', value: '$1,800.00', openedBy: 'Player2' },
      { id: '5', image: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max', name: 'Pack 5', value: '$4,200.00', openedBy: 'Player1' },
    ],
    participants: [
      { 
        id: '1', 
        name: 'Player1', 
        avatar: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot32.png?tr=w-128,c-at_max', 
        totalValue: '$35,450.00', 
        isWinner: false,
        items: [
          {
            id: 'p1-i1',
            name: 'Pack 1',
            image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max',
            price: '$0.05',
            percentage: '59.2000%',
          },
          {
            id: 'p1-i2',
            name: 'Pack 3',
            image: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max',
            price: '$0.01',
            percentage: '84.9930%',
          },
          {
            id: 'p1-i3',
            name: 'Pack 5',
            image: 'https://ik.imagekit.io/hr727kunx/packs/clnbe51bh0002mj16f3okhxel_140233__MGmAsXEkC?tr=q-50,w-128,c-at_max',
            price: '$2.00',
            percentage: '10.0000%',
          },
        ],
      },
      { 
        id: '2', 
        name: 'Player2', 
        avatar: 'https://ik.imagekit.io/hr727kunx/profile_pictures/packbot21.png?tr=w-128,c-at_max', 
        totalValue: '$25,471.00', 
        isWinner: false,
        items: [
          {
            id: 'p2-i1',
            name: 'Pack 2',
            image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm26flgi701cpm4zlkfg9r5rs/packs/cm26flgi701cpm4zlkfg9r5rs_kSVR2aWAW.png?tr=q-50,w-128,c-at_max',
            price: '$0.05',
            percentage: '75.0000%',
          },
          {
            id: 'p2-i2',
            name: 'Pack 4',
            image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-128,c-at_max',
            price: '$0.01',
            percentage: '49.6200%',
          },
          {
            id: 'p2-i3',
            name: 'Pack 2',
            image: 'https://ik.imagekit.io/hr727kunx/community_packs/cm26flgi701cpm4zlkfg9r5rs/packs/cm26flgi701cpm4zlkfg9r5rs_kSVR2aWAW.png?tr=q-50,w-128,c-at_max',
            price: '$4.00',
            percentage: '14.0000%',
          },
        ],
      },
    ],
    createdAt: '2025-01-15T10:30:00Z',
    completedAt: '2025-01-15T11:45:00Z',
  };
}

