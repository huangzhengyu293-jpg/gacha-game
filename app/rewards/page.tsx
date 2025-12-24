'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../components/I18nProvider';
import BestLiveSidebar from '../components/BestLiveSidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function RewardsPage() {
  const { t } = useI18n();
  const { isAuthenticated, user, fetchUserBean } = useAuth();
  const queryClient = useQueryClient();
  const [dayCountdown, setDayCountdown] = useState(t('calculating'));
  const [weekCountdown, setWeekCountdown] = useState(t('calculating'));
  const [monthCountdown, setMonthCountdown] = useState(t('calculating'));
  const disableTextColor = '#2b6cb0';
  const buttonBg = '#4299e1';
  const buttonDisabledBg = '#292f34';
  const [claimingType, setClaimingType] = useState<1 | 2 | 3 | null>(null);

  // 进入页面即调用 box/list，type=5
  const { data: boxListData } = useQuery({
    queryKey: ['boxList', { type: '5' }],
    queryFn: () => api.getBoxList({ type: '5' }),
    staleTime: 30_000,
  });
  // 进入页面即调用用户返利接口
  const { data: rebateData, refetch: refetchRebate } = useQuery({
    queryKey: ['userRebate'],
    queryFn: () => api.getUserRebate(),
    staleTime: 30_000,
  });

  const dayStatus = rebateData?.data?.day?.status;
  const weekStatus = rebateData?.data?.week?.status;
  const monthStatus = rebateData?.data?.month?.status;
  const dayRebate = useMemo(() => {
    const raw = (rebateData as any)?.data?.day?.rebate ?? (rebateData as any)?.data?.day?.amount ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [rebateData]);
  const weekRebate = useMemo(() => {
    const raw = (rebateData as any)?.data?.week?.rebate ?? (rebateData as any)?.data?.week?.amount ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [rebateData]);
  const monthRebate = useMemo(() => {
    const raw = (rebateData as any)?.data?.month?.rebate ?? (rebateData as any)?.data?.month?.amount ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [rebateData]);

  // 工具：北京时间（UTC+8）
  const getGmt8Now = () => {
    const now = Date.now();
    const offsetMs = 8 * 60 * 60 * 1000;
    return new Date(now + offsetMs);
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}${t('timeUnitDay')} ${hours}${t('timeUnitHour')} ${minutes}${t('timeUnitMinute')} ${seconds}${t('timeUnitSecond')}`;
  };

  const computeDayTargetMs = () => {
    const gmt8 = getGmt8Now();
    const target = Date.UTC(gmt8.getUTCFullYear(), gmt8.getUTCMonth(), gmt8.getUTCDate() + 1, 0, 0, 0);
    return target - gmt8.getTime();
  };

  const computeWeekTargetMs = () => {
    const gmt8 = getGmt8Now();
    const day = gmt8.getUTCDay(); // 0-6 (基于偏移后的“本地”星期)
    const daysUntilMonday = (8 - day) % 7 || 7;
    const target = Date.UTC(gmt8.getUTCFullYear(), gmt8.getUTCMonth(), gmt8.getUTCDate() + daysUntilMonday, 0, 0, 0);
    return target - gmt8.getTime();
  };

  const computeMonthTargetMs = () => {
    const gmt8 = getGmt8Now();
    const year = gmt8.getUTCFullYear();
    const month = gmt8.getUTCMonth();
    const target = Date.UTC(year, month + 1, 1, 0, 0, 0);
    return target - gmt8.getTime();
  };

  // 日、周、月倒计时（北京时间）
  useEffect(() => {
    const dayWasActiveRef = { current: false } as React.MutableRefObject<boolean>;
    const weekWasActiveRef = { current: false } as React.MutableRefObject<boolean>;
    const monthWasActiveRef = { current: false } as React.MutableRefObject<boolean>;

    const tick = () => {
      const dayMs = computeDayTargetMs();
      const weekMs = computeWeekTargetMs();
      const monthMs = computeMonthTargetMs();

      const dayActive = dayMs > 0;
      const weekActive = weekMs > 0;
      const monthActive = monthMs > 0;

      // ✅ 倒计时结束：只触发一次接口刷新，获取最新按钮状态
      if (dayWasActiveRef.current && !dayActive) {
        refetchRebate();
      }
      if (weekWasActiveRef.current && !weekActive) {
        refetchRebate();
      }
      if (monthWasActiveRef.current && !monthActive) {
        refetchRebate();
      }

      dayWasActiveRef.current = dayActive;
      weekWasActiveRef.current = weekActive;
      monthWasActiveRef.current = monthActive;

      setDayCountdown(dayActive ? formatCountdown(dayMs) : '');
      setWeekCountdown(weekActive ? formatCountdown(weekMs) : '');
      setMonthCountdown(monthActive ? formatCountdown(monthMs) : '');
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [t, refetchRebate]);

  const showLoginDialog = () => {
    window.dispatchEvent(new CustomEvent('auth:show-login'));
  };

  const { mutateAsync: receiveRebate } = useMutation({
    mutationFn: (type: 1 | 2 | 3) => api.receiveRebate(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRebate'] });
      fetchUserBean?.();
    },
  });

  const handleClaim = async (type: 1 | 2 | 3) => {
    if (claimingType) return;
    setClaimingType(type);
    try {
      await receiveRebate(type);
    } catch (err) {
      // 静默失败，避免打扰
    } finally {
      setClaimingType(null);
    }
  };

  const buildButtonState = (
    status: number | undefined,
    countdown: string | undefined,
    type: 1 | 2 | 3,
    rebate: number,
  ) => {
    if (!isAuthenticated) {
      return { label: t('loginToClaim'), disabled: false, onClick: showLoginDialog };
    }
    // status=1：显示倒计时（禁用）
    if (status === 1) {
      return { label: countdown || t('calculating'), disabled: true };
    }
    // status=0：根据 rebate 决定是否可领取
    if (status === 0) {
      const isClaiming = claimingType === type;
      if (rebate !== 0) {
        return {
          label: isClaiming ? t('claiming') : t('claimReward'),
          disabled: isClaiming,
          onClick: () => handleClaim(type),
        };
      }
      return { label: t('nothingToClaim'), disabled: true };
    }
    return { label: t('nothingToClaim'), disabled: true };
  };

  const dayBtn = buildButtonState(dayStatus, dayCountdown, 1, dayRebate);
  const weekBtn = buildButtonState(weekStatus, weekCountdown, 2, weekRebate);
  const monthBtn = buildButtonState(monthStatus, monthCountdown, 3, monthRebate);

  const profileName = useMemo(() => {
    const info = (user as any)?.userInfo || user;
    return info?.name || 'Guest';
  }, [user]);
  const profileVip = useMemo(() => {
    const info = (user as any)?.userInfo || user;
    const vipInfo = info?.vip_info || info?.vipInfo || {};
    const vipId = Number(vipInfo?.vip_id ?? info?.vip ?? 0);
    const pctRaw = vipInfo?.percentage;
    let pct = 0;
    if (pctRaw !== undefined && pctRaw !== null) {
      const n = Number(pctRaw);
      if (Number.isFinite(n)) {
        pct = n <= 1 ? n * 100 : n;
      }
    }
    return {
      level: Number.isFinite(vipId) ? Math.max(0, Math.floor(vipId)) : 0,
      progress: Math.min(100, Math.max(0, pct)),
    };
  }, [user]);
  const profileLevel = profileVip.level;
  const profileProgressNumber = profileVip.progress;
  const profileProgressLabel = `${profileProgressNumber.toFixed(2).replace(/\.?0+$/, '')}%`;

  const renderButton = (btn: { label: string; disabled: boolean; onClick?: () => void }) => (
    <button
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6 w-48 sm:w-40 md:w-48"
      style={{
        backgroundColor: btn.disabled ? buttonBg : buttonBg,
        color: btn.disabled ? disableTextColor : '#ffffff',
        cursor: btn.disabled ? 'not-allowed' : 'pointer',
      }}
      disabled={btn.disabled}
      onClick={() => {
        if (btn.disabled) return;
        btn.onClick?.();
      }}
    >
      <span className="text-sm font-bold">{btn.label}</span>
    </button>
  );

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex flex-1 items-stretch gap-6" style={{ width: 'calc(100% - 16rem)' }}>
          <div className="flex flex-col flex-1 items-stretch max-w-full pb-48">
            <div className="flex flex-col w-full  pb-20 gap-10">
              <div className="flex flex-col w-full gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* 每日奖励卡片 */}
                  <div className="flex justify-center items-center rounded-2xl px-6 py-6 bg-reward-card-highlight" style={{ backgroundColor: '#22272b' }}>
                    <div className="flex flex-col items-center gap-4 sm:max-w-60">
                      <div className="flex size-12 sm:size-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#292f34' }}>
                        <div className="size-7 sm:size-8" style={{ color: '#4299e1' }}>
                          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.71275 11.4188L9.02206 14.7441C9.80906 15.3514 10.9413 15.1941 11.5329 14.3952L16.0886 8.24305L20.6561 14.4111C21.2384 15.1975 22.3474 15.3642 23.1352 14.7839L27.7528 11.3826L25.331 26.0999H6.86021L4.71275 11.4188Z" stroke="currentColor" strokeWidth="1.8"></path>
                            <ellipse cx="15.9225" cy="3.46154" rx="1.96154" ry="1.96154" fill="currentColor"></ellipse>
                            <path d="M5.46094 21.4421H26.384" stroke="currentColor" strokeWidth="1.8"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full gap-2">
                      <p className="text-base text-white text-center font-extrabold leading-tight">{t('dailyRewardTitle')}</p>
                        <p className="text-base text-center font-semibold leading-tight" style={{ color: '#7a8084' }}>{t('dailyRewardDesc')}</p>
                      </div>
                      {renderButton(dayBtn)}
                    </div>
                  </div>
                  
                  {/* 每周奖励卡片 */}
                  <div className="flex justify-center items-center rounded-2xl px-6 py-6 bg-reward-card-highlight" style={{ backgroundColor: '#22272b' }}>
                    <div className="flex flex-col items-center gap-4 sm:max-w-60">
                      <div className="flex size-12 sm:size-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#292f34' }}>
                        <div className="size-7 sm:size-8" style={{ color: '#4299e1' }}>
                          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.1283 8.64702L12.594 12.2487C12.0249 12.8286 12.4358 13.8074 13.2483 13.8074H14.4409C14.9472 13.8074 15.3576 14.2178 15.3576 14.724V16.9573C15.3576 17.7916 16.3816 18.1922 16.9476 17.5792L20.1811 14.0783C20.7233 13.4911 20.3069 12.5396 19.5077 12.5396H18.6159C18.1097 12.5396 17.6993 12.1292 17.6993 11.623V9.28905C17.6993 8.46821 16.7032 8.06114 16.1283 8.64702Z" fill="currentColor"></path>
                            <path d="M26.3231 12.8889C26.3231 18.4056 21.8509 22.8778 16.3342 22.8778C10.8175 22.8778 6.34531 18.4056 6.34531 12.8889C6.34531 7.37218 10.8175 2.9 16.3342 2.9C21.8509 2.9 26.3231 7.37218 26.3231 12.8889Z" stroke="currentColor" strokeWidth="1.8"></path>
                            <path d="M9.33398 19.1111V28.4572C9.33398 29.1527 10.0781 29.5948 10.689 29.2623L15.8957 26.4275C16.1689 26.2787 16.499 26.2787 16.7723 26.4275L21.979 29.2623C22.5898 29.5948 23.334 29.1527 23.334 28.4572V19.1111" stroke="currentColor" strokeWidth="1.8"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full gap-2">
                      <p className="text-base text-white text-center font-extrabold leading-tight">{t('weeklyRewardTitle')}</p>
                        <p className="text-base text-center font-semibold leading-tight" style={{ color: '#7a8084' }}>{t('weeklyRewardDesc')}</p>
                      </div>
                      {renderButton(weekBtn)}
                    </div>
                  </div>
                  
                  {/* 每月奖励卡片 */}
                  <div className="flex justify-center items-center rounded-2xl px-6 py-6 bg-reward-card-highlight" style={{ backgroundColor: '#22272b' }}>
                    <div className="flex flex-col items-center gap-4 sm:max-w-60">
                      <div className="flex size-12 sm:size-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#292f34' }}>
                        <div className="size-7 sm:size-8" style={{ color: '#4299e1' }}>
                          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.8708 7.53526L11.8303 11.6528C11.4763 12.0135 11.7318 12.6223 12.2372 12.6223H14.171C14.4859 12.6223 14.7412 12.8775 14.7412 13.1924V16.1068C14.7412 16.6258 15.3781 16.8749 15.7302 16.4937L19.4752 12.4387C19.8125 12.0736 19.5535 11.4818 19.0564 11.4818H17.418C17.1032 11.4818 16.8479 11.2265 16.8479 10.9116V7.93459C16.8479 7.42404 16.2284 7.17086 15.8708 7.53526Z" fill="currentColor"></path>
                            <path d="M24.5613 11.7962C24.5613 16.7341 20.5583 20.7371 15.6204 20.7371C10.6824 20.7371 6.67944 16.7341 6.67944 11.7962C6.67944 6.85821 10.6824 2.85522 15.6204 2.85522C20.5583 2.85522 24.5613 6.85821 24.5613 11.7962Z" stroke="currentColor" strokeWidth="1.71044"></path>
                            <path d="M8.16211 16.9902L5.52963 25.0982C5.37762 25.5664 5.84301 26.0158 6.289 25.8314L9.3466 24.5676C9.6089 24.4592 9.91496 24.572 10.0583 24.83L11.7349 27.8465C11.9778 28.2835 12.6016 28.2389 12.7561 27.7736L15.2728 20.1928" stroke="currentColor" strokeWidth="1.71044"></path>
                            <path d="M23.1113 16.9902L25.7438 25.0982C25.8958 25.5664 25.4304 26.0158 24.9844 25.8314L21.9268 24.5676C21.6645 24.4592 21.3585 24.572 21.2151 24.83L19.5361 27.8509C19.2936 28.2872 18.6711 28.2436 18.5155 27.7795L15.9719 20.1928" stroke="currentColor" strokeWidth="1.71044"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full gap-2">
                      <p className="text-base text-white text-center font-extrabold leading-tight">{t('monthlyRewardTitle')}</p>
                        <p className="text-base text-center font-semibold leading-tight" style={{ color: '#7a8084' }}>{t('monthlyRewardDesc')}</p>
                      </div>
                      {renderButton(monthBtn)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Free Packs 组件：接口数据 type=5 */}
              <div className="flex flex-col w-full gap-4">
                {isAuthenticated && (
                <div className="rounded-2xl flex p-5 md:p-6 items-center gap-4 md:gap-7" style={{ backgroundColor: '#22272b' }}>
                  <div className="relative flex">
                    <div className="overflow-hidden border rounded-full" style={{ borderWidth: 2, borderColor: '#34383C' }}>
                      <div className="relative rounded-full overflow-hidden" style={{ width: 64, height: 64 }}>
                        {((user as any)?.userInfo?.avatar || (user as any)?.avatar) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(user as any)?.userInfo?.avatar || (user as any)?.avatar}
                            alt="avatar"
                            width={64}
                            height={64}
                            style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                            <mask id="avatar_mask_rewards" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                              <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                            </mask>
                            <g mask="url(#avatar_mask_rewards)">
                              <rect width="36" height="36" fill="#333333"></rect>
                              <rect x="0" y="0" width="36" height="36" transform="translate(-1 5) rotate(305 18 18) scale(1.2)" fill="#0C8F8F" rx="36"></rect>
                              <g transform="translate(-1 1) rotate(5 18 18)">
                                <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
                                <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                              </g>
                            </g>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="px-1 py-0.5 flex items-center justify-center rounded-full border absolute z-10 -bottom-1 right-1 h-6 min-w-6" style={{ backgroundColor: '#292f34', borderColor: '#34383C' }}>
                      <span className="text-xs font-bold leading-none text-white">{profileLevel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col w-full">
                  <p className="text-base font-extrabold text-white mb-3 leading-none break-words">{t('welcomeUser').replace('{name}', profileName)}</p>
                    <div className="w-full border p-0.5 rounded-full h-4" style={{ borderColor: '#2F3337' }}>
                      <div className="relative overflow-hidden rounded-full w-full h-full" style={{ backgroundColor: '#22272b' }}>
                        <div className="h-full flex-1 transition-all" style={{ width: `${profileProgressNumber}%`, backgroundColor: '#4199e1' }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <p className="uppercase font-bold text-xs md:text-sm" style={{ color: '#7a8084' }}>{t('levelLabel').replace('{level}', String(profileLevel))}</p>
                      <p className="uppercase font-bold text-xs md:text-sm" style={{ color: '#7a8084' }}>{t('progressLabel').replace('{progress}', profileProgressLabel)}</p>
                    </div>
                  </div>
                </div>
                )}
                
                <h2 className="flex gap-2 items-center text-xl text-white font-extrabold mt-4">
                  <div className="size-6 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  {t('freePacks')}
                </h2>
                <div className="grid grid-cols-2 xxs:grid-cols-3 xs:grid-cols-4 md:grid-cols-5 gap-4">
                  {Array.isArray(boxListData?.data) && boxListData.data.length > 0 ? (
                    [...boxListData.data].reverse().map((pack: any) => {
                      const id = pack?.id || pack?.box_id || '';
                      const name = pack?.name || pack?.title || '';
                      const cover = pack?.cover || '';
                      const requiredLevel = Number(pack?.level ?? pack?.lv ?? pack?.vip ?? 0) || 0;
                      const isLocked = profileLevel < requiredLevel;
                      return (
                        <div key={id || name}>
                          <div className="relative">
                            <a className="flex relative rounded-lg" href={`/rewards/${id || ''}`}>
                              <img
                                alt={name || 'pack'}
                                loading="lazy"
                                width={200}
                                height={304}
                                decoding="async"
                                src={cover || 'images/placeholder.png'}
                                style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                              />
                            </a>
                            <div className="flex justify-center pt-3 pb-4">
                              <div className="font-bold text-md">
                                <div className="flex gap-2 items-center">
                                  {isLocked && (
                                    <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                                      <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                      </svg>
                                    </div>
                                  )}
                                  <p className="text-base text-white font-extrabold truncate max-w-[160px]">{name || t('freePackFallback')}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center text-sm text-gray-400 py-6">{t('noData')}</div>
                  )}
                </div>
              </div>

            
            </div>
          </div>
        </div>
        <BestLiveSidebar bestOpensTitle={t('bestOpens')} liveTitle={t('liveStart')} />
      </div>
    </div>
  );
}










