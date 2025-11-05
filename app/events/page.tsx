'use client';
import { useI18n } from '../components/I18nProvider';
import LiveFeedElement from '../components/LiveFeedElement';
import LiveFeedTicker from '../components/LiveFeedTicker';
import { useState, useEffect } from 'react';

export default function EventsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'raffle' | 'raceWeekly' | 'raceMonthly'>('raffle');
  
  // 倒计时逻辑
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);

  // 从后端获取抽奖结束时间
  useEffect(() => {
    const fetchEndTime = async () => {
      try {
        // TODO: 替换为实际的 API 端点
        // const response = await fetch('/api/raffle/end-time');
        // const data = await response.json();
        // const endTimeString = data.endTime; // 后端返回的 ISO 时间字符串或时间戳
        // setEndTime(new Date(endTimeString).getTime());

        // 临时 mock 数据，实际使用时删除此部分
        const mockEndTime = new Date(Date.now() + 8 * 60 * 60 * 1000 + 39 * 60 * 1000 + 25 * 1000).toISOString(); // 8小时39分25秒后
        setEndTime(new Date(mockEndTime).getTime());
      } catch (error) {
        console.error('获取抽奖结束时间失败:', error);
        // 如果获取失败，可以设置一个默认值或显示错误信息
      }
    };

    fetchEndTime();
  }, []);

  // 倒计时更新逻辑
  useEffect(() => {
    if (endTime === null) return;

    const updateCountdown = () => {
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    // 立即更新一次
    updateCountdown();

    // 每秒更新一次
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime]); // 依赖 endTime，当结束时间变化时重新启动倒计时

  const formatCountdown = () => {
    if (!timeLeft) return '计算中...';
    if (isExpired) return '抽奖已开始';
    return `${timeLeft.hours}时 ${timeLeft.minutes}分 ${timeLeft.seconds}秒`;
  };

  // 比赛倒计时格式化（显示天数）
  const formatRaceCountdown = () => {
    if (!timeLeft) return '计算中...';
    if (isExpired) return '比赛已结束';
    const days = Math.floor((timeLeft.hours || 0) / 24);
    const hours = (timeLeft.hours || 0) % 24;
    return `${days}天 ${hours}时 ${timeLeft.minutes}分 ${timeLeft.seconds}秒`;
  };

  // 排行榜数据（从后端获取，目前使用 mock 数据）
  // TODO: 根据 activeTab 从后端获取对应的排行榜数据
  const getLeaderboardData = () => {
    // 周赛/月赛的前三名数据
    const topThree = [
      { rank: 2, name: 'bou******api', avatar: 'r8m6', packCount: 99, prize: '$20,000', opened: '$759,276.15' },
      { rank: 1, name: 'And***321', avatar: 'r8m7', packCount: 93, prize: '$50,000', opened: '$2,071,381.01' },
      { rank: 3, name: 'bi**op', avatar: 'r8m8', packCount: 78, prize: '$10,000', opened: '$216,446.16', avatarImage: 'https://ik.imagekit.io/hr727kunx/profile_pictures/clv0ycua5005rxtp7lvedytlw/clv0ycua5005rxtp7lvedytlw_3-s2_mpgC.png?tr=w-3840,c-at_max' },
    ];
    
    // 表格数据（从第4名开始）
    const tableData = [
      { rank: 4, name: 'Ven***zer', tickets: 6517, prize: '$125.00', avatar: 'r1s5' },
      { rank: 5, name: 'ten*********fly', tickets: 6000, prize: '$100.00', avatar: 'r1s6' },
      { rank: 6, name: 'Ae**rr', tickets: 10294, prize: '$75.00', avatar: 'r1s7' },
      { rank: 7, name: 'Bos*****low', tickets: 8690, prize: '$55.00', avatar: 'r1s8' },
      { rank: 8, name: 'Ma**em', tickets: 208, prize: '$55.00', avatar: 'r1s9' },
      { rank: 9, name: 'Jac******ver', tickets: 248, prize: '$35.00', avatar: 'r1sa' },
      { rank: 10, name: 'H**e', tickets: 2845, prize: '$35.00', avatar: 'r1sb' },
      { rank: 11, name: 'bou******api', tickets: 382518, prize: '$35.00', avatar: 'r1sc' },
      { rank: 12, name: 'Win********ess', tickets: 956, prize: '$35.00', avatar: 'r1sd' },
      { rank: 13, name: 'Mr****ot', tickets: 23653, prize: '$25.00', avatar: 'r1se' },
      { rank: 14, name: 'r1c*****212', tickets: 1431, prize: '$25.00', avatar: 'r1sf' },
      { rank: 15, name: 'Nic****002', tickets: 1349, prize: '$25.00', avatar: 'r1sg' },
    ];
    
    return { topThree, tableData };
  };

  // 比赛排行榜组件（周赛/月赛共用）
  type TopThreePlayer = {
    rank: number;
    name: string;
    avatar: string;
    packCount: number;
    prize: string;
    opened: string;
    avatarImage?: string;
  };

  type TablePlayer = {
    rank: number;
    name: string;
    tickets: number;
    prize: string;
    avatar: string;
  };

  const RaceLeaderboard = ({ 
    title, 
    raceType, 
    topThree, 
    tableData 
  }: { 
    title: string; 
    raceType: 'weekly' | 'monthly';
    topThree: TopThreePlayer[];
    tableData: TablePlayer[];
  }) => {
    const prefix = raceType === 'weekly' ? 'weekly' : 'monthly';
    
    return (
      <>
        {/* 组件1：比赛倒计时卡片 */}
        <div className="rounded-lg p-4 md:p-8" style={{ backgroundColor: '#22272B' }}>
          <div className="relative rounded-lg" style={{ backgroundColor: '#1d2125' }}>
            <div className="absolute -top-6 left-0 w-full overflow-hidden rounded-lg" style={{ height: 'calc(100% + 1.5rem)' }}>
              <img src="https://packdraw.com/_next/static/media/flag.a3897cd0.png" alt="" className="absolute top-0 object-contain object-top w-[260px] h-[195px] xxs:w-[300px] xxs:h-[240px] sm:w-[426px] sm:h-[340px]" style={{ left: '-110px', zIndex: 0 }} />
              <img src="https://packdraw.com/_next/static/media/flag.a3897cd0.png" alt="" className="absolute top-0 object-contain object-top w-[260px] h-[195px] xxs:w-[300px] xxs:h-[240px] sm:w-[426px] sm:h-[340px]" style={{ right: '-110px', transform: 'scaleX(-1)', zIndex: 0 }} />
            </div>
            <div className="relative flex flex-col items-center pt-9 pb-6 md:pb-12">
              <p className="font-changa text-base sm:text-[25px] lg:text-[32px] text-white mb-3 md:mb-4 leading-none">{title}</p>
              <p className="flex items-center font-semibold text-white text-sm md:text-base border border-solid rounded-lg h-11 px-4" style={{ borderColor: '#34383c', backgroundColor: '#1d2125' }}>
                比赛将在 {formatRaceCountdown()} 结束
              </p>
            </div>
          </div>
        </div>
        
        {/* 组件2：排行榜（替换"关于每日抽奖"） */}
        <div className="relative py-4 sm:py-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8">
              {topThree.map((player, index) => {
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
                        <p className="absolute top-0.5 text-center w-full font-extrabold text-[10px] sm:text-[12px] md:text-[14px] text-black">第 {player.rank} 名</p>
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
                          <span className="block">已开启</span>
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
                <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 w-1/2" style={{ color: '#7A8185' }}>{title.split(' ')[0]} #245 获奖者</th>
                <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0" style={{ color: '#7A8185' }}>门票</th>
                <th className="h-12 px-4 align-middle font-medium [&:has([role=checkbox])]:pr-0 text-right" style={{ color: '#7A8185' }}>奖励</th>
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
                    aria-selected={activeTab === 'raffle'}
                    aria-controls="radix-tab-content-raffle"
                    data-state={activeTab === 'raffle' ? 'active' : 'inactive'}
                    id="radix-tab-trigger-raffle"
                    onClick={() => setActiveTab('raffle')}
                    className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 transition-colors duration-150 interactive-focus disabled:pointer-events-none disabled:opacity-50 text-base font-regular text-white h-14 font-bold cursor-pointer ${activeTab === 'raffle' ? 'bg-[#34383c]' : ''}`}
                    tabIndex={activeTab === 'raffle' ? 0 : -1}
                    data-orientation="horizontal"
                    data-radix-collection-item=""
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-ticket mr-2 hidden sm:block"
                    >
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                      <path d="M13 5v2"></path>
                      <path d="M13 17v2"></path>
                      <path d="M13 11v2"></path>
                    </svg>
                    抽奖
                  </button>
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
                    周赛
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
                    月赛
                  </button>
                </div>
              </div>
              
              {/* 抽奖 Tab 面板 */}
              {activeTab === 'raffle' && (
              <div
                data-state="active"
                data-orientation="horizontal"
                role="tabpanel"
                aria-labelledby="radix-tab-trigger-raffle"
                id="radix-tab-content-raffle"
                tabIndex={0}
                className="mt-4 interactive-focus"
              >
                <div className="rounded-lg p-4 md:p-8" style={{ backgroundColor: '#22272B' }}>
                  <div className="relative mb-4 px-8">
                    <img src="https://packdraw.com/_next/static/media/raffle-ticket.49e185ba.svg" alt="" className="absolute top-0 left-2 sm:left-1 h-full aspect-[32/170] object-contain" style={{ zIndex: 0 }} />
                    {/* 背景色与父容器一致，因为两边的图片后面可能会加 */}
                    <div className="py-6 sm:py-8 gap-3 sm:gap-4" style={{ backgroundColor: '#1d2125' }}>
                      <div className="relative z-10 flex flex-col items-center justify-center rounded-lg border border-solid px-5 sm:px-9 py-4 sm:py-5 gap-3 sm:gap-4" style={{ borderColor: '#34383c', backgroundColor: '#1d2125' }}>
                        <div className="flex justify-center items-center gap-3 w-full font-changa text-white text-center md:px-16 mt-0.5">
                          <span className="hidden md:block flex-1 h-[1px]" style={{ backgroundColor: '#34383c' }}></span>
                          <p className="md:flex-none flex flex-col sm:flex-row text-center text-base sm:text-[25px] lg:text-[32px] leading-none">
                            <span className="sm:mr-2 inline-block">每日抽奖 #246</span>
                            <span>$2,500</span>
                          </p>
                          <span className="hidden md:block flex-1 h-[1px]" style={{ backgroundColor: '#34383c' }}></span>
                        </div>
                        <p className="flex items-center font-semibold text-white text-sm md:text-base border border-solid rounded-lg h-9 md:h-11 px-4" style={{ borderColor: '#34383c', backgroundColor: '#1d2125' }}>
                          抽奖将在 {formatCountdown()} 开始
                        </p>
                      </div>
                    </div>
                    <img src="https://packdraw.com/_next/static/media/raffle-ticket.49e185ba.svg" alt="" className="absolute top-0 right-2 sm:right-1 h-full aspect-[32/170] object-contain" style={{ transform: 'scaleX(-1)', zIndex: 0 }} />
                  </div>
                </div>
                
                <div className="flex flex-col rounded-lg p-4 pt-6 md:p-8 my-6" style={{ backgroundColor: '#22272B' }}>
                  <div className="flex flex-col md:flex-row mb-4 md:mb-6 xl:mb-8 gap-2 md:gap-8">
                    <p className="text-white font-semibold text-lg md:text-xl md:w-1/3 flex-none leading-none">关于每日抽奖</p>
                    <p className="text-sm md:text-base font-semibold leading-5" style={{ color: '#7a8084' }}>
                      消费 1 美元或更多即可有机会赢取高达 1,000.00 美元！每天随机选择 20 位幸运获奖者。如果您获胜，只需点击领取即可获得奖品。不要错过机会 - 立即开启礼包，看看今天是否是您的幸运日！
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 rounded-lg relative flex justify-end overflow-hidden items-center min-h-[90px] xl:min-h-[115px] py-4 xl:py-7 px-3" style={{ backgroundColor: '#1d2125' }}>
                      <img src="https://packdraw.com/_next/static/media/about-raffle-1.fa7b7732.svg" alt="" className="absolute h-full w-full top-0 left-0 object-cover" style={{ left: '-50px', zIndex: 0 }} />
                      <p className="text-base xl:text-xl font-semibold text-white w-2/3 sm:w-3/5 lg:w-3/5 text-balance leading-tight h-auto relative z-10">
                        开启每日礼包以获得获胜机会！
                      </p>
                    </div>
                    <div className="flex-1 rounded-lg relative flex justify-end overflow-hidden pl-2 items-center min-h-[90px] xl:min-h-[115px]" style={{ backgroundColor: '#1d2125' }}>
                      <img src="https://packdraw.com/_next/static/media/about-raffle-2.0aef317d.svg" alt="" className="absolute h-full object-contain object-left" style={{ width: '66.666%', left: '-20px', zIndex: 0 }} />
                      <p className="text-base xl:text-xl font-semibold text-white text-balance leading-tight h-auto py-4 xl:py-7 pr-5 w-2/3 sm:w-3/5 lg:w-3/5 relative z-10">
                        时间正在流逝 -- 不要错过您的机会！
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors data-[state=selected]:bg-gray-600">
                        <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 w-[25px]" style={{ color: '#7A8185' }}>#</th>
                        <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 w-1/2" style={{ color: '#7A8185' }}>抽奖 #245 获奖者</th>
                        <th className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0" style={{ color: '#7A8185' }}>门票</th>
                        <th className="h-12 px-4 align-middle font-medium [&:has([role=checkbox])]:pr-0 text-right" style={{ color: '#7A8185' }}>奖励</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {[
                        { rank: 1, name: 'dis**********ine', tickets: 37948, prize: '$1,000.00', avatar: 'r1s2' },
                        { rank: 2, name: 'V**x', tickets: 79471, prize: '$500.00', avatar: 'r1s3' },
                        { rank: 3, name: 'P***u', tickets: 10740, prize: '$250.00', avatar: 'r1s4' },
                        { rank: 4, name: 'Ven***zer', tickets: 6517, prize: '$125.00', avatar: 'r1s5' },
                        { rank: 5, name: 'ten*********fly', tickets: 6000, prize: '$100.00', avatar: 'r1s6' },
                        { rank: 6, name: 'Ae**rr', tickets: 10294, prize: '$75.00', avatar: 'r1s7' },
                        { rank: 7, name: 'Bos*****low', tickets: 8690, prize: '$55.00', avatar: 'r1s8' },
                        { rank: 8, name: 'Ma**em', tickets: 208, prize: '$55.00', avatar: 'r1s9' },
                        { rank: 9, name: 'Jac******ver', tickets: 248, prize: '$35.00', avatar: 'r1sa' },
                        { rank: 10, name: 'H**e', tickets: 2845, prize: '$35.00', avatar: 'r1sb' },
                        { rank: 11, name: 'bou******api', tickets: 382518, prize: '$35.00', avatar: 'r1sc' },
                        { rank: 12, name: 'Win********ess', tickets: 956, prize: '$35.00', avatar: 'r1sd' },
                        { rank: 13, name: 'Mr****ot', tickets: 23653, prize: '$25.00', avatar: 'r1se' },
                        { rank: 14, name: 'r1c*****212', tickets: 1431, prize: '$25.00', avatar: 'r1sf' },
                        { rank: 15, name: 'Nic****002', tickets: 1349, prize: '$25.00', avatar: 'r1sg' },
                        { rank: 16, name: 'ora********sum', tickets: 4379, prize: '$25.00', avatar: 'r1sh' },
                        { rank: 17, name: 'tru******ape', tickets: 5158, prize: '$25.00', avatar: 'r1si' },
                        { rank: 18, name: 'TOM****TTI', tickets: 2693, prize: '$25.00', avatar: 'r1sj' },
                        { rank: 19, name: 'iSw*******lex', tickets: 85, prize: '$25.00', avatar: 'r1sk' },
                        { rank: 20, name: 'Jui*******Dad', tickets: 1226, prize: '$25.00', avatar: 'r1sl' },
                      ].map((row) => (
                        <tr key={row.rank} className="border-b transition-colors hover:bg-[#111417] data-[state=selected]:bg-gray-600">
                          <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-extrabold" style={{ color: '#7A8084' }}>{row.rank}</td>
                          <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                            <div className="flex gap-2 items-center">
                              <div className="overflow-hidden border rounded-full border-white" style={{ borderWidth: '1px' }}>
                                <div className="relative rounded-full overflow-hidden" style={{ width: 24, height: 24 }}>
                                  <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                                    <mask id={row.avatar} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                                      <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                                    </mask>
                                    <g mask={`url(#${row.avatar})`}>
                                      <rect width="36" height="36" fill="#333333"></rect>
                                      <rect x="0" y="0" width="36" height="36" transform="translate(4 4) rotate(30 18 18) scale(1)" fill="#0C8F8F" rx="6"></rect>
                                      <g transform="translate(6 -5) rotate(0 18 18)">
                                        <path d="M15 19c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round"></path>
                                        <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                        <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                      </g>
                                    </g>
                                  </svg>
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
              </div>
              )}

              {/* 周赛 Tab 面板 */}
              {activeTab === 'raceWeekly' && (() => {
                const { topThree, tableData } = getLeaderboardData();
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
                <RaceLeaderboard title="周赛 30,000 美元" raceType="weekly" topThree={topThree} tableData={tableData} />
              </div>
                );
              })()}

              {/* 月赛 Tab 面板 */}
              {activeTab === 'raceMonthly' && (() => {
                const { topThree, tableData } = getLeaderboardData();
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
                <RaceLeaderboard title="月赛 30,000 美元" raceType="monthly" topThree={topThree} tableData={tableData} />
              </div>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="hidden lg:block flex-shrink-0" style={{ width: '224px' }}>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit" >
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_2938_10681)">
                    <path d="M7.34447 1.87599C7.37304 1.72306 7.45419 1.58493 7.57387 1.48553C7.69355 1.38614 7.84423 1.33173 7.99981 1.33173C8.15538 1.33173 8.30606 1.38614 8.42574 1.48553C8.54542 1.58493 8.62657 1.72306 8.65514 1.87599L9.35581 5.58132C9.40557 5.84475 9.53359 6.08707 9.72316 6.27664C9.91273 6.46621 10.155 6.59423 10.4185 6.64399L14.1238 7.34466C14.2767 7.37322 14.4149 7.45437 14.5143 7.57405C14.6137 7.69374 14.6681 7.84441 14.6681 7.99999C14.6681 8.15557 14.6137 8.30624 14.5143 8.42592C14.4149 8.54561 14.2767 8.62676 14.1238 8.65532L10.4185 9.35599C10.155 9.40575 9.91273 9.53377 9.72316 9.72334C9.53359 9.91291 9.40557 10.1552 9.35581 10.4187L8.65514 14.124C8.62657 14.2769 8.54542 14.415 8.42574 14.5144C8.30606 14.6138 8.15538 14.6683 7.99981 14.6683C7.84423 14.6683 7.69355 14.6138 7.57387 14.5144C7.45419 14.415 7.37304 14.2769 7.34447 14.124L6.64381 10.4187C6.59404 10.1552 6.46602 9.91291 6.27645 9.72334C6.08688 9.53377 5.84457 9.40575 5.58114 9.35599L1.87581 8.65532C1.72287 8.62676 1.58475 8.54561 1.48535 8.42592C1.38595 8.30624 1.33154 8.15557 1.33154 7.99999C1.33154 7.84441 1.38595 7.69374 1.48535 7.57405C1.58475 7.45437 1.72287 7.37322 1.87581 7.34466L5.58114 6.64399C5.84457 6.59423 6.08688 6.46621 6.27645 6.27664C6.46602 6.08707 6.59404 5.84475 6.64381 5.58132L7.34447 1.87599Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.3335 1.33331V3.99998" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M14.6667 2.66669H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_2938_10681">
                      <rect width="16" height="16" fill="currentColor"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <p className="text-base text-white font-extrabold">{t('bestOpens')}</p>
            </div>
            <div className="live-feed flex flex-col gap-3">
              <LiveFeedElement
                index={0}
                href="/packs/1"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/products/cm9ln14rj0002l50g0sajx4dg_2344464__pFeElsrMCp?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-1080,c-at_max"
                title="Audemars Piguet Stainless Steel USA Edition"
                priceLabel="$65,000.00"
              />
              <LiveFeedElement
                index={1}
                href="/packs/2"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-1080,c-at_max"
                title="Limited Edition Pack"
                priceLabel="$2.99"
                glowColor="#FACC15"
              />
              <LiveFeedElement
                index={2}
                href="/packs/3"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-1080,c-at_max"
                title="Special Drop"
                priceLabel="$5.00"
                glowColor="#FACC15"
              />
            </div>
          </div>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit mt-6" >
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="#EB4B4B" strokeOpacity="0.5"></circle><circle cx="8" cy="8" r="2" fill="#EB4B4B"></circle></svg>
              </div>
              <p className="text-base text-white font-extrabold">{t('liveStart')}</p>
            </div>
            <LiveFeedTicker maxItems={9} intervalMs={2000} />
          </div>
        </div>
      </div>
    </div>
  );
}


