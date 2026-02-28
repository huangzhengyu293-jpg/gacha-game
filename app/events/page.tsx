'use client';
import { useI18n } from '../components/I18nProvider';
import { memo, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import BestLiveSidebar from '../components/BestLiveSidebar';

type RaceType = 'weekly' | 'monthly';

// 北京时间（UTC+8）
const BJT_OFFSET_MS = 8 * 60 * 60 * 1000;

const getBjtNow = () => {
  const now = Date.now();
  return new Date(now + BJT_OFFSET_MS);
};

const computeWeeklyMsBjt = () => {
  const bjt = getBjtNow();
  // 到北京时间下周一 00:00（周一为 1；周日为 0）
  const day = bjt.getUTCDay(); // 0-6
  const daysUntilMonday = (8 - day) % 7 || 7;
  const target = Date.UTC(bjt.getUTCFullYear(), bjt.getUTCMonth(), bjt.getUTCDate() + daysUntilMonday, 0, 0, 0);
  return target - bjt.getTime();
};

const computeMonthlyMsBjt = () => {
  const bjt = getBjtNow();
  // 月赛：倒计时到「北京时间下月 1 日 00:00」
  const target = Date.UTC(bjt.getUTCFullYear(), bjt.getUTCMonth() + 1, 1, 0, 0, 0);
  return Math.max(0, target - bjt.getTime());
};

const RaceCountdownCard = memo(function RaceCountdownCard({
  title,
  raceType,
}: {
  title: string;
  raceType: RaceType;
}) {
  const { t } = useI18n();
  const [countdownText, setCountdownText] = useState<string>(t('calculating'));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const formatHMS = (ms: number) => {
      const unitHour = t('timeUnitHour');
      const unitMinute = t('timeUnitMinute');
      const unitSecond = t('timeUnitSecond');
      if (ms <= 0) return `0${unitHour} 0${unitMinute} 0${unitSecond}`;
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}${unitHour} ${minutes}${unitMinute} ${seconds}${unitSecond}`;
    };

    const formatDHMS = (ms: number) => {
      const unitDay = t('timeUnitDay');
      const unitHour = t('timeUnitHour');
      const unitMinute = t('timeUnitMinute');
      const unitSecond = t('timeUnitSecond');
      if (ms <= 0) return `0${unitDay} 0${unitHour} 0${unitMinute} 0${unitSecond}`;
      const totalSeconds = Math.floor(ms / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${days}${unitDay} ${hours}${unitHour} ${minutes}${unitMinute} ${seconds}${unitSecond}`;
    };

    const tick = () => {
      if (raceType === 'weekly') {
        setCountdownText(formatDHMS(computeWeeklyMsBjt()));
        return;
      }
      setCountdownText(formatDHMS(computeMonthlyMsBjt()));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [raceType, t]);

  return (
    <div className="rounded-lg p-4 md:p-8" style={{ backgroundColor: '#22272B' }}>
      <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: '#1d2125' }}>
        <div
          className="absolute -top-6 left-0 w-full overflow-hidden rounded-lg pointer-events-none"
          style={{ height: 'calc(100% + 1.5rem)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/theme/default/flag.png"
            alt=""
            className="absolute top-0 object-contain object-top w-[260px] h-[195px] xxs:w-[300px] xxs:h-[240px] sm:w-[426px] sm:h-[340px]"
            style={{ left: '-110px', zIndex: 0 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/theme/default/flag.png"
            alt=""
            className="absolute top-0 object-contain object-top w-[260px] h-[195px] xxs:w-[300px] xxs:h-[240px] sm:w-[426px] sm:h-[340px]"
            style={{ right: '-110px', transform: 'scaleX(-1)', zIndex: 0 }}
          />
        </div>
        <div className="relative flex flex-col items-center pt-9 pb-6 md:pb-12 px-3">
          <p className="font-changa text-base sm:text-[25px] lg:text-[32px] text-white mb-3 md:mb-4 leading-none text-center">
            {title}
          </p>
          <p
            className="flex items-center justify-center font-semibold text-white text-sm md:text-base border border-solid rounded-lg min-h-11 px-4 text-center"
            style={{ borderColor: '#34383c', backgroundColor: '#1d2125' }}
          >
            {t('raceEndsIn').replace('{time}', countdownText)}
          </p>
        </div>
      </div>
    </div>
  );
});

export default function EventsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'raceWeekly' | 'raceMonthly'>('raceWeekly');
  const { data: consumeData } = useQuery({
    queryKey: ['consumeData'],
    queryFn: () => api.getConsume(),
    staleTime: 30_000,
  });
  
  const formatMoney = (val: any) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return '--';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const WEEKLY_PRIZES = useMemo(
    () => [1000, 800, 650, 400, 350, 300, 250, 220, 200, 180, 160, 150, 140, 35, 32, 30, 28, 25, 25, 25],
    [],
  );
  const MONTHLY_PRIZES = useMemo(
    () => [3000, 2200, 1800, 1300, 1100, 900, 700, 600, 500, 450, 400, 360, 320, 280, 240, 210, 190, 170, 140, 140],
    [],
  );

  const formatPrize = (amount: number | undefined) => {
    if (!Number.isFinite(Number(amount))) return '--';
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPrizeByRank = (raceType: 'weekly' | 'monthly', rank: number) => {
    const idx = rank - 1;
    const list = raceType === 'weekly' ? WEEKLY_PRIZES : MONTHLY_PRIZES;
    return formatPrize(list[idx]);
  };

  const mapRanking = (
    raw: any,
    raceType: 'weekly' | 'monthly',
  ): { topThree: TopThreePlayer[]; tableData: TablePlayer[] } => {
    const list: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    const topThree = list.slice(0, 3).map((item, idx) => {
      const user = item?.user || {};
      const vip = user?.vip;
      const rank = idx + 1;
      return {
        rank,
        name: user?.name || '--',
        avatar: `r-top-${idx + 1}`,
        avatarImage: typeof user?.avatar === 'string' ? user.avatar : undefined,
        packCount: vip === 0 || vip ? String(vip) : '--',
        prize: getPrizeByRank(raceType, rank),
        opened: formatMoney(item?.bean),
      };
    });
    const tableData = list.slice(3).map((item, idx) => {
      const user = item?.user || {};
      const opened = formatMoney(item?.bean);
      const rank = idx + 4;
      return {
        rank,
        name: user?.name || '--',
        tickets: opened,
        prize: getPrizeByRank(raceType, rank),
        avatar: `r-row-${idx + 4}`,
        avatarImage: typeof user?.avatar === 'string' ? user.avatar : undefined,
      };
    });
    return { topThree, tableData };
  };

  const rankingMonth = mapRanking(consumeData?.data?.ranking_month, 'monthly');
  const rankingWeek = mapRanking(consumeData?.data?.ranking_week, 'weekly');

  // 比赛排行榜组件（周赛/月赛共用）
  type TopThreePlayer = {
    rank: number;
    name: string;
    avatar: string;
    packCount: string; // 显示 VIP 等级或占位
    prize: string;
    opened: string;
    avatarImage?: string;
  };

  type TablePlayer = {
    rank: number;
    name: string;
    tickets: string; // 展示已开启金额
    prize: string;
    avatar: string;
    avatarImage?: string;
  };

  const RaceLeaderboard = ({ 
    title, 
    raceType, 
    topThree, 
    tableData,
  }: { 
    title: string; 
    raceType: RaceType;
    topThree: TopThreePlayer[];
    tableData: TablePlayer[];
  }) => {
    const prefix = raceType === 'weekly' ? 'weekly' : 'monthly';
    const arrangedTopThree = topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;
    
    return (
      <>
        <RaceCountdownCard title={title} raceType={raceType} />

        {/* 排行榜 */}
        <div className="relative py-4 sm:py-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8">
              {arrangedTopThree.map((player, index) => {
                const placementClasses = {
                  1: { text: 'text-placement-first', border: 'border-placement-first', z: 'z-0' },
                  2: { text: 'text-placement-second', border: 'border-placement-second', z: 'z-10' },
                  3: { text: 'text-placement-third', border: 'border-placement-third', z: 'z-10' },
                };
                const placement = placementClasses[player.rank as keyof typeof placementClasses] || placementClasses[2];
                
                return (
                  <div key={player.rank}>
                    <div className={`rounded-lg w-full border border-solid relative ${placement.z}`} style={{ borderColor: '#34383c' }}>
                      <div className="absolute -top-[2px] left-1/2 -translate-x-1/2" style={{ zIndex: 50 }}>
                        <div className={`h-[18.9px] w-[54.97px] sm:h-[19px] sm:w-[55px] md:h-[32px] md:w-[93px] ${placement.text}`}>
                          <svg viewBox="0 0 93 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M0 4C0 1.79086 1.79086 0 4 0H89C91.2091 0 93 1.79086 93 4V20.6233C93 22.5735 91.5937 24.2394 89.6712 24.5666L46.3392 31.9423C46.1147 31.9805 45.8853 31.9801 45.661 31.941L3.31464 24.5765C1.39868 24.2432 0 22.5803 0 20.6356V4Z" fill="currentColor"></path>
                          </svg>
                        </div>
                        <p className="absolute top-0.5 text-center w-full font-extrabold text-[10px] sm:text-[12px] md:text-[14px] text-black">{t('placementLabel').replace('{rank}', String(player.rank))}</p>
                      </div>
                      <div className="relative flex flex-col gap-1 sm:gap-1 md:gap-2 items-center px-2 sm:px-4 md:px-7 pb-3 sm:pb-2 md:pb-4 pt-6 sm:pt-6 md:pt-12 w-full rounded-t-lg" style={{ backgroundColor: '#22272b' }}>
                        <div className="relative">
                          <div className={`overflow-hidden border rounded-full ${placement.border}`} style={{ borderWidth: '2px' }}>
                            <div className="relative rounded-full overflow-hidden w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                              {player.avatarImage ? (
                                <img
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="pointer-events-none"
                                  sizes="(min-width: 0px) 100px"
                                  srcSet={`${player.avatarImage}?tr=w-16,c-at_max 16w, ${player.avatarImage}?tr=w-32,c-at_max 32w, ${player.avatarImage}?tr=w-48,c-at_max 48w`}
                                  src={player.avatarImage}
                                  style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'cover', color: 'transparent' }}
                                />
                              ) : (
                                <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                  <mask id={`${prefix}-${player.avatar}`} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                                    <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                                  </mask>
                                  <g mask={`url(#${prefix}-${player.avatar})`}>
                                    <rect width="36" height="36" fill={player.rank === 1 ? "#0C8F8F" : "#333333"}></rect>
                                    <rect x="0" y="0" width="36" height="36" transform={player.rank === 1 ? "translate(7 7) rotate(157 18 18) scale(1.1)" : "translate(5 5) rotate(135 18 18) scale(1)"} fill={player.rank === 1 ? "#EDF2F7" : "#0C8F8F"} rx="6"></rect>
                                    <g transform={player.rank === 1 ? "translate(3.5 3.5) rotate(-7 18 18)" : "translate(7 3) rotate(-5 18 18)"}>
                                      <path d={player.rank === 1 ? "M13,20 a1,0.75 0 0,0 10,0" : "M13,19 a1,0.75 0 0,0 10,0"} fill={player.rank === 1 ? "#000000" : "#FFFFFF"}></path>
                                      <rect x={player.rank === 1 ? "12" : "14"} y="14" width="1.5" height="2" rx="1" stroke="none" fill={player.rank === 1 ? "#000000" : "#FFFFFF"}></rect>
                                      <rect x={player.rank === 1 ? "22" : "20"} y="14" width="1.5" height="2" rx="1" stroke="none" fill={player.rank === 1 ? "#000000" : "#FFFFFF"}></rect>
                                    </g>
                                  </g>
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="px-0.5 py-0.5 flex items-center justify-center rounded-full border absolute z-10 -bottom-0.5 sm:-bottom-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 -left-0.5 sm:-left-1" style={{ backgroundColor: '#22272b', borderColor: '#33373c' }}>
                            <span className="text-[8px] sm:text-[10px] md:text-[12px] font-bold leading-none text-white">{player.packCount}</span>
                          </div>
                        </div>
                        <p className="text-white text-[10px] sm:text-[12px] md:text-[14px] font-semibold mt-0.5 sm:mt-1">{player.name}</p>
                        <div className="border border-solid rounded-lg py-0.5 sm:py-1 md:py-2 w-full" style={{ borderColor: '#34383c' }}>
                          <p className="font-extrabold text-[10px] sm:text-[12px] md:text-[14px] w-full text-center" style={{ color: '#68d391' }}>{player.prize}</p>
                        </div>
                      </div>
                      <div className="py-2 sm:py-1.5 md:py-2 px-2 sm:px-3 md:px-4 w-full rounded-br-lg rounded-bl-lg" style={{ backgroundColor: '#292f34' }}>
                        <p className="text-[9px] sm:text-[11px] md:text-[13px] font-semibold text-center sm:leading-tight" style={{ color: '#cbd5db' }}>
                          <span className="block">{t('openedLabel')}</span>
                          <span className="block">{player.opened}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        
        {/* 表格：从第4名开始 */}
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors data-[state=selected]:bg-gray-600">
                <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 w-[25px]" style={{ color: '#7A8185' }}>#</th>
                <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 w-1/2" style={{ color: '#7A8185' }}>{t('raceWinners')}</th>
                <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0" style={{ color: '#7A8185' }}>{t('openedLabel')}</th>
                <th className="h-12 px-4 align-middle font-medium [&:has([role=checkbox])]:pr-0 text-right" style={{ color: '#7A8185' }}>{t('prizeLabel')}</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {tableData.map((row) => (
                <tr key={row.rank} className="border-b transition-colors hover:bg-[#111417] data-[state=selected]:bg-gray-600">
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-extrabold" style={{ color: '#7A8084' }}>{row.rank}</td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                    <div className="flex gap-2 items-center">
                      <div className="overflow-hidden border rounded-full border-white" style={{ borderWidth: '1px' }}>
                        <div className="relative rounded-full overflow-hidden" style={{ width: 24, height: 24 }}>
                          {row.avatarImage ? (
                            <img
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="pointer-events-none"
                              sizes="(min-width: 0px) 100px"
                              srcSet={`${row.avatarImage}?tr=w-16,c-at_max 16w, ${row.avatarImage}?tr=w-32,c-at_max 32w, ${row.avatarImage}?tr=w-48,c-at_max 48w`}
                              src={row.avatarImage}
                              style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'cover', color: 'transparent' }}
                            />
                          ) : (
                            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                              <mask id={`${prefix}-table-${row.avatar}`} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                              </mask>
                              <g mask={`url(#${prefix}-table-${row.avatar})`}>
                                <rect width="36" height="36" fill="#333333"></rect>
                                <rect x="0" y="0" width="36" height="36" transform="translate(4 4) rotate(30 18 18) scale(1)" fill="#0C8F8F" rx="6"></rect>
                                <g transform="translate(6 -5) rotate(0 18 18)">
                                  <path d="M15 19c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round"></path>
                                  <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                  <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                </g>
                              </g>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="relative flex w-full h-9 flex-1">
                        <div className="absolute flex inset-0 items-center">
                          <p className="text-white font-extrabold text-ellipsis overflow-hidden whitespace-nowrap">{row.name}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-white font-extrabold">{row.tickets.toLocaleString()}</td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right font-extrabold" style={{ color: '#68d391' }}>{row.prize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)', fontFamily: 'Urbanist, sans-serif' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex flex-1 items-stretch gap-6" style={{ width: 'calc(100% - 16rem)' }}>
          <div className="flex flex-col flex-1 items-stretch max-w-full pb-48">
            <div className="flex flex-col  w-full">
              <div dir="ltr" data-orientation="horizontal" className="w-full">
                <div
                  role="tablist"
                  aria-orientation="horizontal"
                  className="inline-flex w-full items-center justify-center rounded-md p-1 text-gray-400 h-16"
                  tabIndex={0}
                  data-orientation="horizontal"
                  style={{ outline: 'none', backgroundColor: '#22272B' }}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'raceWeekly'}
                    aria-controls="radix-tab-content-raceWeekly"
                    data-state={activeTab === 'raceWeekly' ? 'active' : 'inactive'}
                    id="radix-tab-trigger-raceWeekly"
                    onClick={() => setActiveTab('raceWeekly')}
                    className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 transition-colors duration-150 interactive-focus disabled:pointer-events-none disabled:opacity-50 text-base font-regular text-white h-14 font-bold cursor-pointer ${activeTab === 'raceWeekly' ? 'bg-[#34383c]' : ''}`}
                    tabIndex={activeTab === 'raceWeekly' ? 0 : -1}
                    data-orientation="horizontal"
                    data-radix-collection-item=""
                  >
                    <div className="size-5 mr-2 hidden sm:block">
                      <svg viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M3.33333 15C3.33333 15 4.16666 14.1667 6.66666 14.1667C9.16666 14.1667 10.8333 15.8333 13.3333 15.8333C15.8333 15.8333 16.6667 15 16.6667 15V4.99999C16.6667 4.99999 15.8333 5.83332 13.3333 5.83332C10.8333 5.83332 9.16666 4.16666 6.66666 4.16666C4.16666 4.16666 3.33333 4.99999 3.33333 4.99999V15Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M7.5 14.1667V5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M11.6667 15V5.83334"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M16.6667 9.99999C16.6667 9.99999 15.8333 10.8333 13.3333 10.8333C10.8333 10.8333 9.16666 9.16666 6.66666 9.16666C4.16666 9.16666 3.33333 9.99999 3.33333 9.99999"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </div>
                    {t('eventsWeeklyTab')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'raceMonthly'}
                    aria-controls="radix-tab-content-raceMonthly"
                    data-state={activeTab === 'raceMonthly' ? 'active' : 'inactive'}
                    id="radix-tab-trigger-raceMonthly"
                    onClick={() => setActiveTab('raceMonthly')}
                    className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 transition-colors duration-150 interactive-focus disabled:pointer-events-none disabled:opacity-50 text-base font-regular text-white h-14 font-bold cursor-pointer ${activeTab === 'raceMonthly' ? 'bg-[#34383c]' : ''}`}
                    tabIndex={activeTab === 'raceMonthly' ? 0 : -1}
                    data-orientation="horizontal"
                    data-radix-collection-item=""
                  >
                    <div className="size-5 mr-2 hidden sm:block">
                      <svg viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M3.33333 15C3.33333 15 4.16666 14.1667 6.66666 14.1667C9.16666 14.1667 10.8333 15.8333 13.3333 15.8333C15.8333 15.8333 16.6667 15 16.6667 15V4.99999C16.6667 4.99999 15.8333 5.83332 13.3333 5.83332C10.8333 5.83332 9.16666 4.16666 6.66666 4.16666C4.16666 4.16666 3.33333 4.99999 3.33333 4.99999V15Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M7.5 14.1667V5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M11.6667 15V5.83334"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M16.6667 9.99999C16.6667 9.99999 15.8333 10.8333 13.3333 10.8333C10.8333 10.8333 9.16666 9.16666 6.66666 9.16666C4.16666 9.16666 3.33333 9.99999 3.33333 9.99999"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </div>
                    {t('eventsMonthlyTab')}
                  </button>
                </div>
              </div>
              
              {/* 周赛 Tab 面板 */}
              {activeTab === 'raceWeekly' && (() => {
                const { topThree, tableData } = rankingWeek;
                return (
              <div
                data-state="active"
                data-orientation="horizontal"
                role="tabpanel"
                aria-labelledby="radix-tab-trigger-raceWeekly"
                id="radix-tab-content-raceWeekly"
                tabIndex={0}
                className="mt-4 interactive-focus"
              >
                <RaceLeaderboard
                  title={t('eventsWeeklyTab')}
                  raceType="weekly"
                  topThree={topThree}
                  tableData={tableData}
                />
              </div>
                );
              })()}

              {/* 月赛 Tab 面板 */}
              {activeTab === 'raceMonthly' && (() => {
                const { topThree, tableData } = rankingMonth;
                return (
              <div
                data-state="active"
                data-orientation="horizontal"
                role="tabpanel"
                aria-labelledby="radix-tab-trigger-raceMonthly"
                id="radix-tab-content-raceMonthly"
                tabIndex={0}
                className="mt-4 interactive-focus"
              >
                <RaceLeaderboard
                  title={t('eventsMonthlyTab')}
                  raceType="monthly"
                  topThree={topThree}
                  tableData={tableData}
                />
              </div>
                );
              })()}
            </div>
          </div>
        </div>
        <BestLiveSidebar bestOpensTitle={t('bestOpens')} liveTitle={t('liveStart')} />
      </div>
    </div>
  );
}


