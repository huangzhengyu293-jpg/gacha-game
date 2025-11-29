'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import InlineSelect from '../components/InlineSelect';
import { useI18n } from '../components/I18nProvider';
import BattleModes from '../components/BattleModes';
import LiveFeedElement from '../components/LiveFeedElement';
import LiveFeedTicker from '../components/LiveFeedTicker';

export default function BattlesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [sortValue, setSortValue] = useState<'priceDesc' | 'latest'>('priceDesc');
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreateHover, setIsCreateHover] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<'solo' | 'team' | null>(null);
  const [isCloseHover, setIsCloseHover] = useState(false);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCreateOpen(false);
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex-1 xl:max-w-[992px] min-w-0">
          <div className="flex flex-1 flex-col-reverse sm:flex-row justify-between items-stretch gap-3">
            <InlineSelect
              value={sortValue}
              onChange={(v) => setSortValue((v as 'priceDesc' | 'latest'))}
              options={[
                { label: '价格：从高到低', value: 'priceDesc' },
                { label: '最新', value: 'latest' },
              ]}
            />
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative select-none h-10 px-6 w-full sm:w-[140px] cursor-pointer"
              style={{ backgroundColor: isCreateHover ? '#3B82F6' : '#60A5FA', color: '#FFFFFF' }}
              onMouseEnter={() => setIsCreateHover(true)}
              onMouseLeave={() => setIsCreateHover(false)}
              onClick={() => setCreateOpen(true)}
            >
              <div className="flex items-center gap-2">
                <div className="size-5">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </div>
                <p className="font-bold">创建对战</p>
              </div>
            </button>
          </div>
          {createOpen && (
            <div data-state="open" className="fixed px-4 inset-0 z-50 overflow-y-auto flex justify-center items-start py-16" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(0, 0, 0, 0.48)' }} onClick={() => setCreateOpen(false)}>
              <div role="dialog" aria-modal="true" data-state="open" className="overflow-hidden z-50 grid w-full gap-4 p-6 shadow-lg duration-200 rounded-lg relative max-w-xl mt-20 pt-14 pb-4 md:p-20 px-4 md:px-16" tabIndex={-1} style={{ pointerEvents: 'auto', backgroundColor: '#161A1D' }} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}></h2>
                <p className="text-xl font-semibold text-center" style={{ color: '#FFFFFF' }}>选择游戏类型</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    className="text-card-foreground shadow-sm p-4 md:py-8 flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer"
                    style={{ backgroundColor: '#22272B', borderRadius: '1rem', border: `1px solid ${hoveredCard === 'solo' ? '#60A5FA' : '#34383C'}` }}
                    onMouseEnter={() => setHoveredCard('solo')}
                    onMouseLeave={() => setHoveredCard((prev) => (prev === 'solo' ? null : prev))}
                    onClick={() => { setCreateOpen(false); router.push('/create-battle?type=solo&playersInSolo=2&gameMode=classic&fastBattle=true'); }}
                  >
                    <div className="size-6" style={{ color: '#60A5FA' }}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </div>
                    <p className="font-semibold cursor-default" style={{ color: '#FFFFFF' }}>单人对战</p>
                  </button>
                  <button
                    className="text-card-foreground shadow-sm p-4 md:py-8 flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer"
                    style={{ backgroundColor: '#22272B', borderRadius: '1rem', border: `1px solid ${hoveredCard === 'team' ? '#60A5FA' : '#34383C'}` }}
                    onMouseEnter={() => setHoveredCard('team')}
                    onMouseLeave={() => setHoveredCard((prev) => (prev === 'team' ? null : prev))}
                    onClick={() => { setCreateOpen(false); router.push('/create-battle?type=team&teamStructure=2v2&gameMode=classic&fastBattle=true'); }}
                  >
                    <div className="flex gap-2 items-center" style={{ color: '#60A5FA' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <div className="size-6">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <p className="font-semibold cursor-default" style={{ color: '#FFFFFF' }}>团队对战</p>
                  </button>
                </div>
                <button
                  type="button"
                  className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center"
                  style={{ color: isCloseHover ? '#FFFFFF' : '#7A8084' }}
                  onMouseEnter={() => setIsCloseHover(true)}
                  onMouseLeave={() => setIsCloseHover(false)}
                  onClick={() => setCreateOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>
          )}
          <div className="mt-6">
            <BattleModes sortValue={sortValue} />
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


