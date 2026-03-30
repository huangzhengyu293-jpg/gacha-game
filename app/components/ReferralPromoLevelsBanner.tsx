'use client';

import { useCallback } from 'react';
import { useI18n } from '@/app/components/I18nProvider';
import { useAuth } from '@/app/hooks/useAuth';

const REFERRAL_LEVEL_ROWS: ReadonlyArray<{ level: number; thresholdUsd: number; percent: number }> = [
  { level: 1, thresholdUsd: 0, percent: 1 },
  { level: 2, thresholdUsd: 10_000, percent: 2 },
  { level: 3, thresholdUsd: 50_000, percent: 3 },
  { level: 4, thresholdUsd: 100_000, percent: 4 },
  { level: 5, thresholdUsd: 250_000, percent: 5 },
  { level: 6, thresholdUsd: 500_000, percent: 6 },
];

export default function ReferralPromoLevelsBanner() {
  const { t } = useI18n();
  const { user } = useAuth();
  const levelBadge = (n: number) => t('referralLevelBadge').replace(/\{n\}/g, String(n));
  const isLoggedIn = Boolean(user?.token);

  const onPrimary = useCallback(() => {
    if (isLoggedIn) {
      document.getElementById('referral-share-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.dispatchEvent(new CustomEvent('auth:show-register'));
  }, [isLoggedIn]);

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)] lg:items-stretch lg:gap-3">
      <div
        className="relative min-h-[11rem] min-w-0 overflow-hidden rounded-lg lg:h-full lg:min-h-0"
        style={{
          background: 'linear-gradient(148deg, #1D2125 0%, #22272B 45%, #2a3238 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-lg"
          style={{
            backgroundImage: 'url(/images/fenlie.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
            backgroundSize: 'auto 100%',
          }}
        />
        <div
          className="pointer-events-none absolute -left-10 top-1/2 z-0 h-[12rem] w-[12rem] -translate-y-1/2 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(96,165,250,0.35) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-[1] flex min-h-[11rem] w-full flex-col justify-center gap-3 px-4 py-5 sm:min-h-0 sm:gap-4 sm:px-5 sm:py-6 lg:h-full lg:min-h-0">
          <div className="w-full max-w-full sm:max-w-[min(26rem,58%)]">
            <p className="text-lg font-medium italic text-white/95 md:text-xl">{t('referralPromoTitle')}</p>
            <p className="mt-3 text-sm font-normal leading-relaxed" style={{ color: '#9CA3AF' }}>
              {t('referralPromoSubtitle')}
            </p>
            <button
              type="button"
              onClick={onPrimary}
              className="mt-4 inline-flex h-12 shrink-0 cursor-default items-center justify-center rounded-lg px-5 text-sm font-semibold interactive-focus outline-none select-none"
              style={{
                backgroundColor: '#DDBF7D',
                color: '#1C1917',
              }}
            >
              {isLoggedIn ? t('referralPromoCtaShare') : t('referralPromoCtaRegister')}
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex min-h-0 min-w-0 flex-col rounded-lg p-3 lg:h-full"
        style={{ backgroundColor: '#22272B' }}
      >
        <div className="mb-2 text-xs font-semibold" style={{ color: '#FFFFFF' }}>
          {t('referralLevelsTitle')}
        </div>
        <ul className="flex flex-1 flex-col justify-stretch gap-1 w-full min-w-0">
          {REFERRAL_LEVEL_ROWS.map((row) => (
            <li
              key={row.level}
              className="flex min-h-8 max-h-9 w-full grow items-center rounded-md px-2 py-1"
              style={{ backgroundColor: 'rgba(52, 56, 60, 0.55)' }}
            >
              <div
                className="flex h-6 min-w-[2.75rem] shrink-0 items-center justify-center rounded-md text-[10px] font-semibold"
                style={{ backgroundColor: 'rgba(96, 165, 250, 0.12)', color: '#93C5FD' }}
              >
                {levelBadge(row.level)}
              </div>
              <div className="ml-2 text-xs font-medium shrink-0" style={{ color: '#E4AE33' }}>
                ${row.thresholdUsd.toLocaleString('en-US')}
              </div>
              <div className="ml-auto text-xs font-semibold" style={{ color: '#F3F4F6' }}>
                {row.percent}%
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
