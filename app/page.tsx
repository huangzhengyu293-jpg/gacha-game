'use client';
import Banner from './components/Banner';
import SectionHeader from './components/SectionHeader';
import { useI18n } from './components/I18nProvider';
import InteractiveCard from './components/InteractiveCard';
import LiveFeedElement from './components/LiveFeedElement';
import LiveFeedTicker from './components/LiveFeedTicker';
import BattleModes from './components/BattleModes';
import TradeHighlights from './components/TradeHighlights';

export default function Home() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col min-h-screen" >
      <div className="flex-1 min-h-screen pt-0">
        <div
          className="w-full px-4 sm:px-6 md:px-8 pb-12"
          style={{
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)'
          }}
        >
          {/* Main Content Layout */}
          <div className="flex gap-8 max-w-[1248px] mx-auto">
            {/* Left Content Area - 992px wide on large screens, full width on smaller screens */}
            <div className="flex-1 xl:max-w-[992px]">
              {/* Banner Section */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Banner
                    title="您的首次对战胜利"
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    }
                    bgClass="bg-new-player-battle-banner py-0.5"
                    href="/battles"
                  />
                  <Banner
                    title="开启您的第一个礼包！"
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    }
                    bgClass="bg-new-player-packs-banner"
                    href="/packs"
                  />
                  <Banner
                    title="您的最佳交易"
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 3.06729C4.23742 4.71411 2 8.09576 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 8.09576 19.7626 4.71411 16.5 3.06729" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                        <path d="M8.6822 7C7.06551 8.07492 6 9.91303 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 9.91303 16.9345 8.07492 15.3178 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                        <path d="M13.8534 2H13.2857H10.7143H10.1466C9.71002 2 9.48314 2.5203 9.78021 2.84023L11.6336 4.83619C11.8314 5.04922 12.1686 5.04922 12.3664 4.83619L14.2198 2.84023C14.5169 2.5203 14.29 2 13.8534 2Z" fill="currentColor"></path>
                      </svg>
                    }
                    bgClass="bg-new-player-deal-banner"
                    href="/deals"
                  />
                </div>
              </div>

              {/* Section Header */}
              <SectionHeader
                title={t('newPacks')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                }
                onViewAll={() => console.log(t('newPacks'))}
                viewAllText={t('viewAll')}
                className="mt-12 mb-3"
              />
              

              {/* Interactive Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 self-stretch">
                <InteractiveCard
                  imageUrl="https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=q-50,w-640,c-at_max"
                  alt="Pack card 1"
                  width={200}
                  height={304}
                  href="/zh/cmh2lqffk001al10paqslua2f"
                />
                <InteractiveCard
                  imageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=q-50,w-640,c-at_max"
                  alt="Pack card 2"
                  width={200}
                  height={304}
                  href="/zh/cmh2lqffk001al10paqslua2f"
                />
                <InteractiveCard
                  imageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=q-50,w-640,c-at_max"
                  alt="Pack card 3"
                  width={200}
                  height={304}
                  href="/zh/cmh2lqffk001al10paqslua2f"
                />
                <InteractiveCard
                  imageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgmum72x0000k30grhv2wirb_2135691__sXf7GAAU6?tr=q-50,w-640,c-at_max"
                  alt="Pack card 4"
                  width={200}
                  height={304}
                  href="/zh/cmh2lqffk001al10paqslua2f"
                />
                <InteractiveCard
                  imageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=q-50,w-640,c-at_max"
                  alt="Pack card 5"
                  width={200}
                  height={304}
                  href="/zh/cmh2lqffk001al10paqslua2f"
                />
              </div>
              <SectionHeader
                title={t('battleHighlights')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                }
                onViewAll={() => console.log(t('battleHighlights'))}
                viewAllText={t('viewAll')}
                className="mt-12 mb-3"
              />
              
              {/* Battle Modes replicated block */}
              <div className="mt-4">
                <BattleModes />
              </div>
              {/* Trade Highlights replicated block */}
              
              <SectionHeader
                 title={t('tradeHighlights')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 3.06729C4.23742 4.71411 2 8.09576 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 8.09576 19.7626 4.71411 16.5 3.06729" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                    <path d="M8.6822 7C7.06551 8.07492 6 9.91303 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 9.91303 16.9345 8.07492 15.3178 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                    <path d="M13.8534 2H13.2857H10.7143H10.1466C9.71002 2 9.48314 2.5203 9.78021 2.84023L11.6336 4.83619C11.8314 5.04922 12.1686 5.04922 12.3664 4.83619L14.2198 2.84023C14.5169 2.5203 14.29 2 13.8534 2Z" fill="currentColor"></path>
                  </svg>

                }
                 onViewAll={() => console.log(t('tradeHighlights'))}
                 viewAllText={t('viewAll')}
                className="mt-12 mb-3"
              />
               <div className="mt-6">
                <TradeHighlights />
              </div>

              
            </div>

            {/* Right Sidebar - 224px wide, hidden on screens smaller than 1024px */}
            <div className="hidden xl:block flex-shrink-0" style={{ width: '224px' }}>
              <div className="rounded-lg px-4 pb-4 pt-0 h-fit" >
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
                  <p className="text-base text-white font-extrabold">最佳开启</p>
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
                    glowColor="#6EE7B7"
                  />
                  <LiveFeedElement
                    index={2}
                    href="/packs/3"
                    avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                    productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-1080,c-at_max"
                    packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-1080,c-at_max"
                    title="Special Drop"
                    priceLabel="$5.00"
                    glowColor="#60A5FA"
                  />
                </div>
              </div>
              <div className="rounded-lg px-4 pb-4 pt-0 h-fit mt-6" >
                <div className="flex pb-4 gap-2 items-center">
                  <div className="flex size-4 text-yellow-400">
                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="#EB4B4B" strokeOpacity="0.5"></circle><circle cx="8" cy="8" r="2" fill="#EB4B4B"></circle></svg>
                  </div>
                  <p className="text-base text-white font-extrabold">直播开启</p>
                </div>
                <LiveFeedTicker maxItems={9} intervalMs={2000} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
