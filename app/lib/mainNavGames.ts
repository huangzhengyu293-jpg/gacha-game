/** 主导航游戏区（抽奖已下线，不包含 Draw） */
export type MainNavGameKey = 'packs' | 'battles' | 'deals' | 'events' | 'rewards';

export type MainNavGameItem = {
  key: MainNavGameKey;
  /** 主导航文案固定英文 */
  label: string;
  href: string;
};

export const MAIN_NAV_GAMES: MainNavGameItem[] = [
  { key: 'packs', label: 'Packs', href: '/packs' },
  { key: 'battles', label: 'Battles', href: '/battles' },
  { key: 'deals', label: 'Deals', href: '/deals' },
  { key: 'events', label: 'Events', href: '/events' },
  { key: 'rewards', label: 'Rewards', href: '/rewards' },
];
