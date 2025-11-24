import type { ReactNode } from 'react';

export type BattleGameMode = 'classic' | 'share' | 'jackpot' | 'sprint' | 'elimination';

export type SpecialOptionFlags = {
  isFastMode?: boolean;
  isLastChance?: boolean;
  isInverted?: boolean;
};

const MODE_PRESETS: Record<BattleGameMode, { label: string; accentColor: string }> = {
  classic: { label: '普通模式', accentColor: '#34383C' },
  share: { label: '分享模式', accentColor: '#57ABF8' },
  sprint: { label: '积分冲刺', accentColor: '#7C4BE2' },
  jackpot: { label: '大奖模式', accentColor: '#53E296' },
  elimination: { label: '淘汰模式', accentColor: '#FF9C49' },
};

export function getModeVisual(mode?: string | null, fallbackLabel = '普通模式') {
  if (mode && mode in MODE_PRESETS) {
    return MODE_PRESETS[mode as BattleGameMode];
  }
  return { label: fallbackLabel, accentColor: '#34383C' };
}

const FastModeIcon = () => (
  <svg key="fast" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-gray-300">
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
  </svg>
);

const LastChanceIcon = () => (
  <svg key="lastchance" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-gray-300">
    <path d="m12.5 17-.5-1-.5 1h1z"></path>
    <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path>
    <circle cx="15" cy="12" r="1"></circle>
    <circle cx="9" cy="12" r="1"></circle>
  </svg>
);

const InvertedIcon = () => (
  <svg key="inverted" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown rotate-180 size-4 text-gray-300">
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
    <path d="M5 21h14"></path>
  </svg>
);

export function getSpecialOptionIcons(options: SpecialOptionFlags): ReactNode[] {
  const icons: ReactNode[] = [];
  if (options.isFastMode) {
    icons.push(<FastModeIcon key="fast" />);
  }
  if (options.isLastChance) {
    icons.push(<LastChanceIcon key="lastchance" />);
  }
  if (options.isInverted) {
    icons.push(<InvertedIcon key="inverted" />);
  }
  return icons;
}

