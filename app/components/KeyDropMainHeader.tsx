'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyDropAccountMenuPanel } from './KeyDropAccountMenuPanel';
import { keyDropPoppins } from './KeyDropPoppins';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useI18n } from './I18nProvider';
import { LogoIcon } from './icons/Logo';
import { MainNavGameIcon } from './MainNavGameIcon';
import { MAIN_NAV_GAMES } from '@/app/lib/mainNavGames';

export type KeyDropMainHeaderProps = {
  isAuthenticated?: boolean;
  onAccountLogout?: () => void | Promise<void>;
  onOpenLogin?: () => void;
  /** 钱包余额（美元），与 Navbar user.bean.bean 一致 */
  walletBalanceUsd?: number;
  /** 打开与原先 Navbar 相同的存款弹窗（钱包 / 支付方式） */
  onOpenWalletDeposit?: () => void;
  /** 已登录：头像，点击跳转个人中心 */
  userAvatarUrl?: string | null;
  userDisplayName?: string;
  profileHref?: string;
  vipLevel?: number;
  /** 底部经验条 0–100，无数据时为 0 */
  xpProgressPercent?: number;
};

export function KeyDropMainHeader({
  isAuthenticated = false,
  onAccountLogout,
  onOpenLogin,
  walletBalanceUsd = 0,
  onOpenWalletDeposit,
  userAvatarUrl = null,
  userDisplayName = '',
  profileHref = '/account',
  vipLevel = 0,
  xpProgressPercent = 0,
}: KeyDropMainHeaderProps) {
  const { t } = useI18n();
  const balanceLabel = useMemo(
    () =>
      `US$${Number(walletBalanceUsd).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    [walletBalanceUsd],
  );
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const languageSettingsAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const node = accountMenuRef.current;
      if (node && !node.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [accountMenuOpen]);

  const closeMenu = useCallback(() => setAccountMenuOpen(false), []);
  const toggleMenu = useCallback(() => setAccountMenuOpen((v) => !v), []);

  const handleLogoutClick = useCallback(async () => {
    closeMenu();
    await onAccountLogout?.();
  }, [closeMenu, onAccountLogout]);

  return (
    <div
      data-testid="kd-main-header-div"
      className={`${keyDropPoppins.className} relative z-20 flex h-[50px] items-center gap-4 bg-[#1B1B22] bg-[radial-gradient(circle_at_0%_360%,#47475d,transparent_80%)] bg-[length:320px] bg-[0_0] bg-no-repeat px-3 sm:gap-6 md:h-[70px] md:pl-5 md:pr-0 2xl:gap-9 min-[2560px]:h-[90px]`}
    >
      <Link
        href="/"
        data-testid="main-header-logo"
        className="flex shrink-0 items-center gap-1.5"
      >
        <LogoIcon
          color="#FFFFFF"
          aria-hidden
          width={32}
          height={32}
          className="block h-auto max-h-[24px] w-auto max-w-full shrink-0 object-contain md:max-h-[32px]"
        />
        <span className="whitespace-nowrap text-left text-[11px] font-bold leading-tight text-white md:text-xs min-[1600px]:text-[13px] min-[2560px]:text-sm">
          {t('brand')}
        </span>
      </Link>
      <div className="hidden h-full items-center gap-2 min-[910px]:flex min-[1400px]:gap-6">
        {MAIN_NAV_GAMES.map((item) => (
          <Link key={item.key} href={item.href} className="group flex h-full flex-shrink-0 items-center">
            <div className="relative flex flex-shrink-0 items-center gap-2 whitespace-nowrap text-[12px] font-bold text-navy-200 transition duration-500 ease-expo group-hover:text-white min-[2560px]:text-[14px]">
              <div className="relative">
                <div className="grid-stack grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded bg-navy-600 xl:h-auto xl:w-auto xl:bg-transparent">
                  <div style={{ opacity: 1, transform: 'none' }}>
                    <MainNavGameIcon
                      name={item.key}
                      className={`h-3.5 w-3.5 3xl:h-4 3xl:w-4 ${item.key === 'packs' ? 'scale-[1.2]' : ''}`}
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2.5 left-1/2 z-10 -translate-x-1/2 xl:hidden"></div>
              </div>
              <span className="hidden flex-shrink-0 xl:block">{item.label}</span>
              <div className="hidden xl:block"></div>
            </div>
          </Link>
        ))}
      </div>
      <div className="order-5 ml-auto flex items-center gap-3 self-stretch rounded-md md:m-[7px] md:ml-auto md:bg-navy-500/15 md:p-[7px] min-[2560px]:m-[10px] min-[2560px]:ml-auto min-[2560px]:p-[10px]">
        {isAuthenticated ? (
          <div className="group relative z-50">
            <button
              type="button"
              data-testid="refill-deposit-btn"
              aria-label={`${t('walletBalanceNav')} ${balanceLabel}`}
              onClick={() => {
                setAccountMenuOpen(false);
                onOpenWalletDeposit?.();
              }}
              className="relative z-10 flex h-[31px] w-full min-w-0 cursor-pointer items-center gap-x-3 rounded border-0 bg-[#3A4719] px-[6px] text-left md:h-[42px] md:min-w-[185px] min-[2560px]:h-[50px] min-[2560px]:px-[10px]"
            >
              <div className="hidden h-[20px] w-[20px] shrink-0 items-center justify-center rounded-sm bg-[#556824] text-[12px] font-semibold leading-[normal] text-[#D6FF6F] min-[400px]:flex md:h-[30px] md:w-[30px] md:text-[16px]">
                $
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tabular-nums leading-none text-[#D6FF6F] md:text-[12px] min-[1600px]:text-[14px]">
                  <span className="relative inline-block">
                    <span data-testid="header-account-money-balance" className="absolute left-0">
                      {balanceLabel}
                    </span>
                    <span className="pointer-events-none opacity-0">{balanceLabel}</span>
                  </span>
                </p>
                <p className="mt-[2px] hidden whitespace-nowrap text-[10px] font-semibold uppercase leading-none tracking-wider text-white md:flex">
                  {t('walletBalanceNav')}
                </p>
              </div>
              <div className="ml-auto flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-sm bg-[#D6FF6F] text-lg font-semibold text-navy-800 md:h-[30px] md:w-[30px]">
                <svg className="icon h-4 w-4 shrink-0 xs:h-[1.125rem] xs:w-[1.125rem]" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
                  <path d="M16.499 4.5h-5.25a4.5 4.5 0 1 0 0 9h5.25V15a.75.75 0 0 1-.75.75h-13.5a.75.75 0 0 1-.75-.75V3a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 .75.75v1.5ZM11.249 6h6v6h-6a3 3 0 0 1 0-6Zm0 2.25v1.5h2.25v-1.5h-2.25Z" />
                </svg>
              </div>
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-testid="login-via-steam-main-page-btn"
            data-login-link="true"
            onClick={() => onOpenLogin?.()}
            className="button inline-flex h-[31px] max-w-full cursor-pointer items-center justify-center whitespace-nowrap rounded border border-[#77ff9d] bg-[#18331f] px-5 text-center text-[10px] font-bold text-[#77ff9d] transition-colors hover:bg-[#1e422f] md:h-[42px] md:rounded-md md:text-[12px] min-[2560px]:h-[50px] min-[2560px]:px-8 min-[2560px]:text-[14px]"
          >
            {t('login')}
          </button>
        )}
        <div
          ref={languageSettingsAnchorRef}
          className="relative flex h-full items-center"
          data-headlessui-state=""
        >
          <button
            className="group flex aspect-square h-[31px] items-center justify-center rounded bg-[#23232d] text-navy-400 transition-colors duration-200 hover:bg-[#2e2e39] hover:text-navy-300 md:h-[42px] min-[2560px]:h-[50px]"
            data-testid="language-and-currency-open-menu"
            type="button"
            aria-expanded={languageModalOpen}
            data-headlessui-state=""
            id="headlessui-popover-button-:r30:"
            onClick={() => {
              setAccountMenuOpen(false);
              setLanguageModalOpen((v) => !v);
            }}
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth={0}
              viewBox="0 0 24 24"
              className="transition-transform duration-200 group-hover:rotate-90"
              height="20"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.95401 2.2106C11.2876 1.93144 12.6807 1.92263 14.0449 2.20785C14.2219 3.3674 14.9048 4.43892 15.9997 5.07103C17.0945 5.70313 18.364 5.75884 19.4566 5.3323C20.3858 6.37118 21.0747 7.58203 21.4997 8.87652C20.5852 9.60958 19.9997 10.736 19.9997 11.9992C19.9997 13.2632 20.5859 14.3902 21.5013 15.1232C21.29 15.7636 21.0104 16.3922 20.6599 16.9992C20.3094 17.6063 19.9049 18.1627 19.4559 18.6659C18.3634 18.2396 17.0943 18.2955 15.9997 18.9274C14.9057 19.559 14.223 20.6294 14.0453 21.7879C12.7118 22.067 11.3187 22.0758 9.95443 21.7906C9.77748 20.6311 9.09451 19.5595 7.99967 18.9274C6.90484 18.2953 5.63539 18.2396 4.54272 18.6662C3.61357 17.6273 2.92466 16.4164 2.49964 15.1219C3.41412 14.3889 3.99968 13.2624 3.99968 11.9992C3.99968 10.7353 3.41344 9.60827 2.49805 8.87524C2.70933 8.23482 2.98894 7.60629 3.33942 6.99923C3.68991 6.39217 4.09443 5.83576 4.54341 5.33257C5.63593 5.75881 6.90507 5.703 7.99967 5.07103C9.09364 4.43942 9.7764 3.3691 9.95401 2.2106ZM11.9997 14.9992C13.6565 14.9992 14.9997 13.6561 14.9997 11.9992C14.9997 10.3424 13.6565 8.99923 11.9997 8.99923C10.3428 8.99923 8.99967 10.3424 8.99967 11.9992C8.99967 13.6561 10.3428 14.9992 11.9997 14.9992Z"></path>
            </svg>
          </button>
          <LanguageSettingsModal
            open={languageModalOpen}
            onClose={() => setLanguageModalOpen(false)}
            anchorRef={languageSettingsAnchorRef}
          />
        </div>
        <div className="z-50 flex items-stretch">
          {isAuthenticated ? (
            <Link
              href={profileHref}
              data-testid="header-user-avatar-btn"
              onClick={() => setAccountMenuOpen(false)}
              className="relative aspect-square h-[31px] shrink-0 overflow-hidden rounded-l bg-[#23232d] md:h-[42px] min-[2560px]:h-[50px]"
            >
              {userAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatarUrl}
                  alt={`${userDisplayName || 'User'} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-navy-600 text-[11px] font-bold uppercase text-navy-200 md:text-sm">
                  {(userDisplayName || '?').trim().charAt(0) || '?'}
                </div>
              )}
              <div
                data-testid="user-avatar-level-xp-label"
                className="absolute bottom-[2px] left-0 hidden h-[13px] w-full items-center justify-center bg-navy-800/50 text-center text-[8px] font-bold text-white backdrop-blur-[2px] md:flex"
              >
                {vipLevel}
              </div>
              <div className="absolute bottom-0 left-0 hidden h-[2px] w-full bg-[#8a7324] md:block">
                <div
                  className="h-full bg-[#e8d48a]"
                  style={{ width: `${Math.min(100, Math.max(0, xpProgressPercent))}%` }}
                />
              </div>
            </Link>
          ) : null}
          <div className="md:relative" ref={accountMenuRef}>
            <button
              data-testid="account-menu-dropdown-expand-btn"
              type="button"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              aria-controls="keydrop-account-menu-panel"
              id="keydrop-account-menu-button"
              onClick={toggleMenu}
              className={`flex aspect-square h-[31px] cursor-pointer items-center justify-center bg-[#23232d] text-navy-200 transition-colors duration-200 hover:bg-[#2e2e39] hover:text-white md:h-[42px] min-[2560px]:h-[50px] ${
                isAuthenticated
                  ? `rounded-r ${accountMenuOpen ? 'text-white' : ''}`
                  : accountMenuOpen
                    ? 'rounded-r text-white'
                    : 'rounded'
              }`}
            >
              <svg
                className={`group w-9 select-none transition-all duration-500 ease-expo ${accountMenuOpen ? 'rotate-45' : ''}`}
                viewBox="0 0 100 100"
                aria-hidden
              >
                <path
                  className={`fill-none stroke-[5.5px] transition-all duration-500 [stroke-dasharray:40_160] [stroke-linecap:round] ${accountMenuOpen ? 'stroke-white [stroke-dashoffset:-64px]' : 'stroke-current group-hover:stroke-white'}`}
                  d="m 30,33 h 40 c 3.722839,0 7.5,3.126468 7.5,8.578427 0,5.451959 -2.727029,8.421573 -7.5,8.421573 h -20"
                />
                <path
                  className={`fill-none stroke-[5.5px] transition-all duration-500 [stroke-linecap:round] [stroke-dasharray:40_142] ${accountMenuOpen ? 'origin-[50%] rotate-90 stroke-white' : 'origin-[72px_center] scale-x-[0.6] stroke-current group-hover:stroke-white'}`}
                  d="m 30,50 h 40"
                />
                <path
                  className={`fill-none stroke-[5.5px] transition-all duration-500 [stroke-linecap:round] [stroke-dasharray:40_85] ${accountMenuOpen ? 'stroke-white [stroke-dashoffset:-64px]' : 'origin-[50%] stroke-current group-hover:stroke-white'}`}
                  d="m 70,67 h -40 c 0,0 -7.5,-0.802118 -7.5,-8.365747 0,-7.563629 7.5,-8.634253 7.5,-8.634253 h 20"
                />
              </svg>
            </button>
            {accountMenuOpen && (
              <div
                id="keydrop-account-menu-panel"
                role="menu"
                aria-labelledby="keydrop-account-menu-button"
                className="custom-scrollbar fixed left-0 right-0 top-[50px] z-[999] max-h-[calc(100dvh-50px)] overflow-x-hidden overflow-y-auto rounded-t-none rounded-b-xl bg-[#1F1F27] pb-[60px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:left-auto md:right-3 md:top-[70px] md:max-h-[calc(100dvh-70px)] md:w-[41.2rem] md:max-w-[min(41.2rem,calc(100vw-1.5rem))] md:pb-0 md:shadow-[0_16px_48px_rgba(0,0,0,0.4)] min-[2560px]:top-[90px] min-[2560px]:max-h-[calc(100dvh-90px)] min-[2560px]:right-4"
              >
                <KeyDropAccountMenuPanel
                  closeMenu={closeMenu}
                  isAuthenticated={isAuthenticated}
                  onLogout={handleLogoutClick}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
