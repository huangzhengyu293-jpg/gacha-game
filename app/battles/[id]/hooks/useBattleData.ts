import { useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import type { BattleData } from '../types';
import type { CatalogPack } from '@/app/lib/api';

type NormalizedPack = {
  id: string;
  image: string;
  name: string;
  value: string;
  openedBy?: string;
  items: CatalogPack['items'];
};

export function useBattleData(): BattleData {
  const params = useParams();
  const searchParams = useSearchParams();

  const packIdsParam = searchParams?.get('packIds') || '';
  const packIds = packIdsParam ? packIdsParam.split(',').filter(Boolean) : [];
  const playersParam = searchParams?.get('players') || '';
  const parsedPlayers = Number(playersParam);
  const playersCount = Number.isFinite(parsedPlayers) && parsedPlayers > 0 ? Math.floor(parsedPlayers) : 2;
  
  // 读取战斗类型和团队结构
  const battleTypeParam = searchParams?.get('type') || 'solo';
  const battleType = battleTypeParam === 'team' ? 'team' : 'solo';
  const teamStructureParam = searchParams?.get('teamStructure');
  const teamStructure = (teamStructureParam === '2v2' || teamStructureParam === '3v3' || teamStructureParam === '2v2v2') 
    ? teamStructureParam 
    : undefined;
  
  // 读取游戏模式
  const gameModeParam = searchParams?.get('gameMode') || 'classic';
  const gameMode = ['classic', 'share', 'sprint', 'jackpot', 'elimination'].includes(gameModeParam) 
    ? gameModeParam 
    : 'classic';
  
  // 读取快速对战模式
  const isFastModeParam = searchParams?.get('fastBattle') || 'false';
  const isFastMode = isFastModeParam === 'true';
  
  // 读取最后的机会模式
  const isLastChanceParam = searchParams?.get('lastChance') || 'false';
  const isLastChance = isLastChanceParam === 'true';
  
  // 读取倒置模式
  const isInvertedParam = searchParams?.get('upsideDown') || 'false';
  const isInverted = isInvertedParam === 'true';

  const { data: boxListData } = useQuery({
    queryKey: ['boxList', {}],
    queryFn: () => api.getBoxList({
      sort_type: '1',
      volatility: '1',
    }),
    staleTime: 30_000,
  });

  // 将新接口数据映射为旧格式
  const allPacks = useMemo(() => {
    if (boxListData?.code === 100000 && Array.isArray(boxListData.data)) {
      return boxListData.data.map((box: any) => ({
        id: String(box.id || box.box_id), // ✅ 统一转为字符串
        title: box.name || box.title || '',
        image: box.cover || '',
        price: Number(box.bean || 0),
        itemCount: 0,
        items: [],
      }));
    }
    return [];
  }, [boxListData]);

  // 🔍 从 localStorage 读取用户信息（因为接口已更新，使用本地缓存）
  const currentUser = typeof window !== 'undefined' 
    ? (() => {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
          const user = JSON.parse(userData);
          return {
            id: String(user.userInfo?.id || user.id || 'local-user'),  // 🔧 确保是字符串
            username: user.userInfo?.name || user.username || '我的账号',
            name: user.userInfo?.name || user.name || '我的账号',
            avatar: user.userInfo?.avatar || user.avatar || '',
          };
          }
        } catch {}
        return null;
      })()
    : null;
  
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

  const normalizedPacks = useMemo<NormalizedPack[]>(() => {
    if (selectedPacks.length > 0) {
      return selectedPacks;
    }

    if (allPacks.length > 0) {
      const packLimit = Math.max(1, Math.min(playersCount, allPacks.length));
      return allPacks.slice(0, packLimit).map((pack: CatalogPack) => ({
        id: pack.id,
        image: pack.image,
        name: pack.title || 'Pack',
        value: `$${Number(pack.price || 0).toFixed(2)}`,
        openedBy: undefined,
        items: pack.items ?? [],
      }));
    }

    return [
      {
        id: 'fallback-pack',
        image: '',
        name: '默认卡包',
        value: '$0.00',
        openedBy: undefined,
        items: [],
      },
    ];
  }, [selectedPacks, allPacks, playersCount]);

  const totalCost = normalizedPacks.reduce((sum, pack) => {
    const price = parseFloat(pack.value.replace('$', '').replace(/,/g, '')) || 0;
    return sum + price;
  }, 0);

  const currentUserName = currentUser?.username ?? '我的账号';
  const currentUserId = currentUser?.id ?? 'local-user';
  const avatarSeed = encodeURIComponent(currentUserName);
  const currentUserAvatar = `https://avatar.vercel.sh/${avatarSeed}.svg`;

  // 生成参与者列表 - 只有当前用户，其他位置留空等待加入
  const participants = [{
    id: currentUserId,
    name: currentUserName,
    avatar: currentUserAvatar,
    totalValue: '$0.00',
    isWinner: false,
    teamId: battleType === 'team' ? 'team-1' : undefined, // 当前用户总是在team-1
    items: [],
  }];

  // 根据游戏模式设置标题
  let title = '';
  if (battleType === 'team') {
    title = '团队对战';
  } else {
    switch (gameMode) {
      case 'classic': title = '经典模式对战'; break;
      case 'share': title = '分享模式对战'; break;
      case 'sprint': title = '积分冲刺对战'; break;
      case 'jackpot': title = '大奖模式对战'; break;
      case 'elimination': title = '淘汰模式对战'; break;
      default: title = '对战';
    }
  }

  // 🚀 使用 useMemo 稳定返回对象，避免每次渲染都创建新对象导致无限循环
  return useMemo(() => ({
    id: params.id || '',
    title,
    mode: gameMode,
    status: 'pending' as const,
    cost: `$${totalCost.toFixed(2)}`,
    totalOpened: '$0.00',
    battleType,
    teamStructure,
    packs: normalizedPacks,
    participants,
    createdAt: new Date().toISOString(),
    playersCount,
    isFastMode,
    isLastChance,
    isInverted,
  }), [
    params.id,
    title,
    gameMode,
    totalCost,
    battleType,
    teamStructure,
    normalizedPacks,
    currentUserId,
    currentUserName,
    playersCount,
    isFastMode,
    isLastChance,
    isInverted,
  ]);
}

