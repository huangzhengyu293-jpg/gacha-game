import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import type { BattleData } from '../types';
import type { CatalogPack } from '@/app/lib/api';

export function useBattleData(): BattleData {
  const params = useParams();
  const searchParams = useSearchParams();

  const packIdsParam = searchParams?.get('packIds') || '';
  const packIds = packIdsParam ? packIdsParam.split(',').filter(Boolean) : [];
  const playersParam = searchParams?.get('players') || '';
  const parsedPlayers = Number(playersParam);
  const playersCount = Number.isFinite(parsedPlayers) && parsedPlayers > 0 ? Math.floor(parsedPlayers) : 2;

  const { data: allPacks = [] } = useQuery({
    queryKey: ['packs'],
    queryFn: api.getPacks,
    staleTime: 30_000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: api.getCurrentUser,
    staleTime: 30_000,
    retry: false,
  });

  const selectedPacks = packIds
    .map((id) => allPacks.find((pack: CatalogPack) => pack.id === id))
    .filter((pack): pack is CatalogPack => pack !== undefined)
    .map((pack: CatalogPack) => ({
      id: pack.id,
      image: pack.image,
      name: pack.title || 'Pack',
      value: `$${pack.price.toFixed(2)}`,
      openedBy: undefined as string | undefined,
      items: pack.items ?? [],
    }));

  const totalCost = selectedPacks.reduce((sum, pack) => {
    const price = parseFloat(pack.value.replace('$', '').replace(/,/g, '')) || 0;
    return sum + price;
  }, 0);

  const normalizedPacks =
    selectedPacks.length > 0
      ? selectedPacks
      : [
         
        ];

  const currentUserName = currentUser?.username ?? '我的账号';
  const currentUserId = currentUser?.id ?? 'local-user';
  const avatarSeed = encodeURIComponent(currentUserName);
  const currentUserAvatar = `https://avatar.vercel.sh/${avatarSeed}.svg`;

  const participants = [
    {
      id: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
      totalValue: '$0.00',
      isWinner: false,
      items: [],
    },
  ];

  return {
    id: params.id || '',
    title: '分享模式对战',
    mode: 'share',
    status: 'pending',
    cost: `$${totalCost.toFixed(2)}`,
    totalOpened: '$0.00',
    battleType: 'solo',
    packs: normalizedPacks,
    participants,
    createdAt: new Date().toISOString(),
    playersCount,
  };
}

