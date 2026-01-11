'use client';

import { useI18n } from '../components/I18nProvider';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import BestLiveSidebar from '../components/BestLiveSidebar';
import { RaceLeaderboardSection } from '../components/RaceLeaderboardSection';
import { mapConsumeRanking } from '../lib/consumeLeaderboard';
import { RaceCountdownCard } from '../components/RaceCountdownCard';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

// 北京时间（UTC+8）
const BJT_OFFSET_MS = 8 * 60 * 60 * 1000;

const getBjtNow = () => {
  const now = Date.now();
  return new Date(now + BJT_OFFSET_MS);
};

const computeLimitedMsBjt = () => {
  const bjt = getBjtNow();
  // 截止到今年 2.28（北京时间）=> 2026-02-28 00:00 CST
  const target = Date.UTC(2026, 1, 28, 0, 0, 0);
  return Math.max(0, target - bjt.getTime());
};

export default function LimitedEventsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const currentUserId = Number((user as any)?.userInfo?.id ?? (user as any)?.id ?? 0);
  const canView = isAuthenticated && currentUserId === 13779;

  useEffect(() => {
    if (authLoading) return;
    if (canView) return;
    router.replace('/_not-found');
  }, [authLoading, canView, router]);

  const { data: consumeData } = useQuery({
    queryKey: ['consumeData'],
    queryFn: () => api.getConsume(),
    enabled: canView,
    staleTime: 30_000,
  });

  const formatOpened = (val: any) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return '--';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const PLAYER_PRIZES = useMemo(
    () => [
      '保时捷帕拉梅拉',
      '劳力士黑冰糖',
      '劳力士灰钻日志',
      ...Array.from({ length: 17 }, () => '苹果17 PRO MAX 1TB'),
    ],
    [],
  );

  const getPrizePlayer = (rank: number) => PLAYER_PRIZES[rank - 1] ?? '--';

  // 暂无接口：玩家赛暂用周赛数据占位
  const rankingPlayer = mapConsumeRanking(
    consumeData?.data?.ranking_week,
    'limited-player',
    getPrizePlayer,
    formatOpened,
  );

  if (authLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen">
        <span className="font-semibold text-base" style={{ color: '#FFFFFF' }}>
          {t('loading')}
        </span>
      </div>
    );
  }

  if (!canView) return null;

  return (
    <div
      className="w-full px-4 sm:px-6 md:px-8 pb-12"
      style={{
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
        fontFamily: 'Urbanist, sans-serif',
      }}
    >
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex flex-1 items-stretch gap-6" style={{ width: 'calc(100% - 16rem)' }}>
          <div className="flex flex-col flex-1 items-stretch max-w-full pb-48">
            <div className="flex flex-col w-full">
              {/* 倒计时固定：切换主播/玩家赛时不变 */}
              <RaceCountdownCard
                title={t('limitedEventsTitle')}
                getRemainingMs={computeLimitedMsBjt}
                format="dhms"
                labelKey="raceEndsIn"
                introImageSrc="/theme/default/11111.jpg"
                introAutoOpenSessionKey="limited_events_intro_seen_v1"
              />

              <div className="mt-4 interactive-focus">
                <RaceLeaderboardSection
                  title={t('limitedEventsTitle')}
                  idPrefix="limited-player"
                  countdown={{
                    getRemainingMs: computeLimitedMsBjt,
                    format: 'dhms',
                    labelKey: 'raceEndsIn',
                  }}
                  showCountdown={false}
                  equalizeDataColsOnMobile
                  mobileDataColsMode="3-2-2"
                  mobileRankColWidthPx={42}
                  topThree={rankingPlayer.topThree}
                  tableData={rankingPlayer.tableData}
                />
              </div>
            </div>
          </div>
        </div>
        <BestLiveSidebar bestOpensTitle={t('bestOpens')} liveTitle={t('liveStart')} />
      </div>
    </div>
  );
}


