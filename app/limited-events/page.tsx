'use client';

import { useI18n } from '../components/I18nProvider';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import BestLiveSidebar from '../components/BestLiveSidebar';
import { RaceLeaderboardSection } from '../components/RaceLeaderboardSection';
import { mapConsumeRanking } from '../lib/consumeLeaderboard';
import { RaceCountdownCard } from '../components/RaceCountdownCard';

// 北京时间（UTC+8）
const BJT_OFFSET_MS = 8 * 60 * 60 * 1000;

const getBjtNow = () => {
  const now = Date.now();
  return new Date(now + BJT_OFFSET_MS);
};

const computeLimitedMsBjt = () => {
  const bjt = getBjtNow();
  // 限時活動：按月循環，倒計時到「北京时间下月 1 日 00:00」
  const target = Date.UTC(bjt.getUTCFullYear(), bjt.getUTCMonth() + 1, 1, 0, 0, 0);
  return Math.max(0, target - bjt.getTime());
};

export default function LimitedEventsPage() {
  const { t } = useI18n();

  const { data: consumeData } = useQuery({
    queryKey: ['consumeData'],
    queryFn: () => api.getConsume(),
    staleTime: 30_000,
  });

  const formatOpened = (val: any) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return '--';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const PLAYER_PRIZES = useMemo(
    () => [
      t('limitedPrizePorschePanamera'),
      t('limitedPrizeRolexBlackSugar'),
      t('limitedPrizeRolexGreyDiamondDatejust'),
      ...Array.from({ length: 17 }, () => t('limitedPrizeIphone17ProMax1TB')),
    ],
    [t],
  );

  const getPrizePlayer = (rank: number) => PLAYER_PRIZES[rank - 1] ?? '--';

  // 限时活动排行榜：复用活动页同接口（getConsume），取 ranking_activitie
  const rankingPlayer = mapConsumeRanking(
    consumeData?.data?.ranking_activitie,
    'limited-player',
    getPrizePlayer,
    formatOpened,
  );

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


