'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from './I18nProvider';
import { MainNavGameIcon } from './MainNavGameIcon';
import { MAIN_NAV_GAMES, type MainNavGameKey } from '@/app/lib/mainNavGames';

export type KeyDropAccountMenuPanelProps = {
  closeMenu: () => void;
  isAuthenticated: boolean;
  onLogout: () => void | Promise<void>;
  onOpenLogin?: () => void;
};

const radial = (rgb: string) =>
  `radial-gradient(43.68% 59.18% at 50.18% -16%, ${rgb} 0%, rgba(32, 32, 40, 0) 100%)`;

const GAME_TINT: Record<MainNavGameKey, string> = {
  packs: 'rgba(160, 117, 240, 0.4)',
  battles: 'rgba(119, 255, 157, 0.4)',
  deals: 'rgba(222, 172, 236, 0.4)',
  events: 'rgba(255, 172, 95, 0.35)',
  rewards: 'rgba(255, 200, 120, 0.35)',
};

const GAME_TEXT: Record<MainNavGameKey, string> = {
  packs: 'text-violet-300',
  battles: 'text-green-400',
  deals: 'text-pink-200',
  events: 'text-[#FFAC5F]',
  rewards: 'text-amber-200',
};

function SectionTitle({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <div
      className={`mb-3 text-center text-[11px] font-semibold uppercase leading-4 tracking-wide text-[#858DAD] sm:text-xs sm:leading-none ${
        first ? 'mt-0' : 'mt-5'
      }`}
      role="presentation"
    >
      {children}
    </div>
  );
}

/** 弹窗内暂不可点击：外观与可点项一致，点击无效果 */
function InertMenuRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      className="pointer-events-none flex min-h-[42px] cursor-default select-none items-center rounded-md border border-transparent bg-[#2E324480] px-3 py-2 text-white"
      aria-hidden
    >
      <span className="mr-4 flex h-6 w-6 shrink-0 items-center justify-center text-[#858DAD] [&>svg]:h-full [&>svg]:w-full">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left text-xs capitalize leading-snug">{label}</span>
    </div>
  );
}

function GameMenuTile({
  href,
  onClick,
  label,
  icon,
  tint,
  textClass,
  active,
}: {
  href: string;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  tint: string;
  textClass: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={`relative flex min-h-[5.25rem] cursor-pointer flex-col items-center justify-center gap-0 rounded-md border px-1.5 py-2 transition duration-200 sm:min-h-[4.875rem] ${
        active ? 'border-[#3A3F55] bg-[#2E3244]' : 'border-transparent bg-[#2E324480]'
      } ${textClass} hover:bg-[#343846]/90`}
      onClick={onClick}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-50"
        style={{ background: radial(tint) }}
      />
      <span className="relative z-[1] flex h-[22px] w-[22px] shrink-0 items-center justify-center sm:h-5 sm:w-5 [&>svg]:h-full [&>svg]:w-full">
        {icon}
      </span>
      <span className="relative z-[1] mt-2.5 max-w-[5.5rem] text-center text-[11px] leading-tight sm:mt-3 sm:max-w-none sm:text-xs">
        {label}
      </span>
    </Link>
  );
}

const IconProfile = () => (
  <svg viewBox="0 0 14 19" width="24" height="24" fill="currentColor" aria-hidden>
    <path d="M13.7037 18.2112H0.370361V16.5445C0.370361 15.4394 0.809348 14.3796 1.59075 13.5982C2.37215 12.8168 3.43196 12.3778 4.53703 12.3778H9.53703C10.6421 12.3778 11.7019 12.8168 12.4833 13.5982C13.2647 14.3796 13.7037 15.4394 13.7037 16.5445V18.2112ZM7.03703 10.7112C6.38042 10.7112 5.73024 10.5819 5.12361 10.3306C4.51698 10.0793 3.96579 9.71101 3.50149 9.24672C3.0372 8.78242 2.6689 8.23123 2.41763 7.6246C2.16636 7.01797 2.03703 6.36779 2.03703 5.71118C2.03703 5.05457 2.16636 4.40439 2.41763 3.79776C2.6689 3.19114 3.0372 2.63994 3.50149 2.17565C3.96579 1.71135 4.51698 1.34306 5.12361 1.09178C5.73024 0.84051 6.38042 0.711182 7.03703 0.711182C8.36311 0.711182 9.63488 1.23797 10.5726 2.17565C11.5102 3.11333 12.037 4.3851 12.037 5.71118C12.037 7.03726 11.5102 8.30903 10.5726 9.24672C9.63488 10.1844 8.36311 10.7112 7.03703 10.7112Z" />
  </svg>
);

const IconAffiliate = () => (
  <svg viewBox="0 0 16 18" width="24" height="24" fill="currentColor" aria-hidden>
    <path d="M8.03703 8.06958C9.08684 8.06958 10.0937 8.50857 10.836 9.28997C11.5783 10.0714 11.9954 11.1312 11.9954 12.2362V17.2362H4.07869V12.2362C4.07869 11.1312 4.49573 10.0714 5.23806 9.28997C5.98039 8.50857 6.98721 8.06958 8.03703 8.06958ZM2.72336 10.5746C2.59737 11.0219 2.52295 11.4836 2.50169 11.9496L2.49536 12.2362V17.2362H0.120361V13.4862C0.120206 12.7676 0.372134 12.0741 0.827822 11.5389C1.28351 11.0037 1.91087 10.6645 2.58957 10.5862L2.72415 10.5746H2.72336ZM13.3507 10.5746C14.0552 10.6198 14.7168 10.9462 15.2005 11.4873C15.6842 12.0283 15.9536 12.7433 15.9537 13.4862V17.2362H13.5787V12.2362C13.5787 11.6587 13.4995 11.1012 13.3507 10.5746ZM2.89119 5.56958C3.4161 5.56958 3.91951 5.78907 4.29068 6.17977C4.66184 6.57048 4.87036 7.10038 4.87036 7.65291C4.87036 8.20545 4.66184 8.73535 4.29068 9.12605C3.91951 9.51675 3.4161 9.73625 2.89119 9.73625C2.36629 9.73625 1.86288 9.51675 1.49171 9.12605C1.12055 8.73535 0.912028 8.20545 0.912028 7.65291C0.912028 7.10038 1.12055 6.57048 1.49171 6.17977C1.86288 5.78907 2.36629 5.56958 2.89119 5.56958ZM13.1829 5.56958C13.7078 5.56958 14.2112 5.78907 14.5823 6.17977C14.9535 6.57048 15.162 7.10038 15.162 7.65291C15.162 8.20545 14.9535 8.73535 14.5823 9.12605C14.2112 9.51675 13.7078 9.73625 13.1829 9.73625C12.658 9.73625 12.1545 9.51675 11.7834 9.12605C11.4122 8.73535 11.2037 8.20545 11.2037 7.65291C11.2037 7.10038 11.4122 6.57048 11.7834 6.17977C12.1545 5.78907 12.658 5.56958 13.1829 5.56958ZM8.03703 0.56958C8.87688 0.56958 9.68233 0.92077 10.2762 1.54589C10.8701 2.17101 11.2037 3.01886 11.2037 3.90291C11.2037 4.78697 10.8701 5.63481 10.2762 6.25994C9.68233 6.88506 8.87688 7.23625 8.03703 7.23625C7.19718 7.23625 6.39172 6.88506 5.79786 6.25994C5.20399 5.63481 4.87036 4.78697 4.87036 3.90291C4.87036 3.01886 5.20399 2.17101 5.79786 1.54589C6.39172 0.92077 7.19718 0.56958 8.03703 0.56958Z" />
  </svg>
);

const IconRedeemGrid = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
    <path d="M3 17H21V19H3V17ZM3 11H6V14H3V11ZM8 11H11V14H8V11ZM3 5H6V8H3V5ZM13 5H16V8H13V5ZM18 5H21V8H18V5ZM13 11H16V14H13V11ZM18 11H21V14H18V11ZM8 5H11V8H8V5Z" />
  </svg>
);

const IconSupport = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6.45455 19L2 22.5V4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V18C22 18.5523 21.5523 19 21 19H6.45455ZM8 10V12H16V10H8Z" />
  </svg>
);

const IconBlog = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21 1.99669C6 1.99669 4 15.9967 3 21.9967C3.66667 21.9967 4.33275 21.9967 4.99824 21.9967C5.66421 18.6636 7.33146 16.8303 10 16.4967C14 15.9967 17 12.4967 18 9.49669L16.5 8.49669C16.8333 8.16336 17.1667 7.83002 17.5 7.49669C18.5 6.49669 19.5042 4.99669 21 1.99669Z" />
  </svg>
);

const IconProvablyFair = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M3.78307 2.82598L12 1L20.2169 2.82598C20.6745 2.92766 21 3.33347 21 3.80217V13.7889C21 15.795 19.9974 17.6684 18.3282 18.7812L12 23L5.6718 18.7812C4.00261 17.6684 3 15.795 3 13.7889V3.80217C3 3.33347 3.32553 2.92766 3.78307 2.82598Z" />
  </svg>
);

export function KeyDropAccountMenuPanel({
  closeMenu,
  isAuthenticated,
  onLogout,
}: KeyDropAccountMenuPanelProps) {
  const { t } = useI18n();
  const pathname = usePathname() ?? '';

  return (
    <div className="box-border px-4 pb-8 pt-4 text-center md:px-5 md:pt-5 lg:pb-7" role="presentation">
      <SectionTitle first>{t('kdMenuAccountAndCode')}</SectionTitle>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-4" role="presentation">
        <InertMenuRow label={t('kdMenuMyAccount')} icon={<IconProfile />} />
        <InertMenuRow label={t('kdMenuAffiliate')} icon={<IconAffiliate />} />
        <InertMenuRow label={t('kdMenuUseCode')} icon={<IconRedeemGrid />} />
      </div>

      <SectionTitle>{t('games')}</SectionTitle>
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-3 md:gap-4" role="presentation">
        {MAIN_NAV_GAMES.map((item) => (
          <GameMenuTile
            key={item.key}
            href={item.href}
            onClick={closeMenu}
            label={item.label}
            icon={<MainNavGameIcon name={item.key} className="h-[18px] w-[18px] sm:h-5 sm:w-5" />}
            tint={GAME_TINT[item.key]}
            textClass={GAME_TEXT[item.key]}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}
      </div>

      <SectionTitle>{t('kdMenuOther')}</SectionTitle>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-4" role="presentation">
        <InertMenuRow label={t('support')} icon={<IconSupport />} />
        <InertMenuRow label={t('kdMenuBlog')} icon={<IconBlog />} />
        <InertMenuRow label={t('kdMenuProvablyFair')} icon={<IconProvablyFair />} />
      </div>

      <div className="mt-4 border-b border-[#2E3244]" role="separator" />

      {isAuthenticated ? (
        <button
          type="button"
          className="mb-3 mt-2 flex min-h-[40px] w-full cursor-pointer items-center justify-center py-2 text-[#858DAD] transition duration-200 hover:bg-[#23232D]"
          onClick={() => void onLogout()}
        >
          <span className="text-xs capitalize leading-none">{t('logoutBtn')}</span>
        </button>
      ) : null}
    </div>
  );
}
