'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Banner from './components/Banner';
import BattleRecordBanner, { type BattleRecordData } from './components/BattleRecordBanner';
import PackRecordBanner, { type PackRecordData } from './components/PackRecordBanner';
import SectionHeader from './components/SectionHeader';
import { useI18n } from './components/I18nProvider';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import type { CatalogPack } from './lib/api';
import PackCard from './components/PackCard';
import BattleModes from './components/BattleModes';
import TradeHighlights from './components/TradeHighlights';
import HowItWorks from './components/HowItWorks';
import BestLiveSidebar from './components/BestLiveSidebar';
import { useAuthContext } from './providers/AuthProvider';

export default function HomePageClient({
  initialBoxNewList,
  initialFightBestRecord,
  initialLuckyBestRecord,
  initialBoxBestRecord,
  initialBoxRecord2,
}: {
  initialBoxNewList: any;
  initialFightBestRecord: any;
  initialLuckyBestRecord: any;
  initialBoxBestRecord: any;
  initialBoxRecord2: any;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthContext();
  const loginKey = typeof user?.loginTime === 'string' && user.loginTime ? user.loginTime : 'guest';

  // ✅ 获取最新礼包列表（sort_type: '2' = 最新）
  const { data: boxNewListData } = useQuery({
    queryKey: ['boxNewListHome'],
    queryFn: () => api.getBoxNewList(),
    staleTime: 30_000,
    ...(initialBoxNewList ? { initialData: initialBoxNewList, initialDataUpdatedAt: Date.now() } : {}),
  });

  const { data: fightMyBestRecord } = useQuery({
    queryKey: ['fightMyBestRecord', loginKey],
    queryFn: () => api.getFightMyBestRecord(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const { data: luckyMyBestRecord } = useQuery({
    queryKey: ['luckyMyBestRecord', loginKey],
    queryFn: () => api.getLuckyMyBestRecord(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const { data: boxMyRecentData } = useQuery({
    queryKey: ['boxMyRecent', loginKey],
    queryFn: () => api.getBoxMyRecent(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const bestBattleRecord = useMemo<BattleRecordData | undefined>(() => {
    const payload = fightMyBestRecord as any;
    if (!payload || typeof payload !== 'object' || payload.code !== 100000) return undefined;
    const data = payload.data;
    if (!data) return undefined;
    if (Array.isArray(data)) {
      const firstValid = data.find((item) => item && typeof item === 'object' && Object.keys(item).length > 0);
      return firstValid ? (firstValid as BattleRecordData) : undefined;
    }
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      return data as BattleRecordData;
    }
    return undefined;
  }, [fightMyBestRecord]);

  const battleBannerTitle = t(bestBattleRecord ? 'yourBestBattle' : 'firstBattleWin');
  const battleBannerHref =
    bestBattleRecord && bestBattleRecord.id !== undefined && bestBattleRecord.id !== null
      ? `/battles/${bestBattleRecord.id}`
      : '/battles';

  const bestPackRecord = useMemo<PackRecordData | undefined>(() => {
    const normalize = (item: any): PackRecordData => ({
      id: item?.box_id ?? item?.id ?? item?.pack_id ?? item?.packId,
      cover: item?.awards?.cover ?? item?.cover ?? item?.box_cover ?? item?.image,
      // 最佳开启道具金额：只取外层 bean（不取 awards.bean）
      bean: item?.bean ?? item?.price ?? item?.amount,
      name: item?.awards?.name ?? item?.name ?? item?.title ?? item?.box_name,
      awards: item?.awards,
    });

    const payload = boxMyRecentData as any;
    if (!payload || typeof payload !== 'object' || payload.code !== 100000) return undefined;
    const data = payload.data;
    if (!data) return undefined;
    if (Array.isArray(data)) {
      const firstValid = data.find((item: any) => item && typeof item === 'object' && Object.keys(item).length > 0);
      return firstValid ? normalize(firstValid) : undefined;
    }
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      return normalize(data);
    }
    return undefined;
  }, [boxMyRecentData]);

  const packBannerTitle = t(bestPackRecord ? 'yourBestPack' : 'openFirstPack');
  const packBannerHref =
    bestPackRecord && bestPackRecord.id !== undefined && bestPackRecord.id !== null
      ? `/packs/${bestPackRecord.id}`
      : '/packs';

  const bestTradeRecord = useMemo<PackRecordData | undefined>(() => {
    const payload = luckyMyBestRecord as any;
    if (!payload || typeof payload !== 'object' || payload.code !== 100000) return undefined;
    const data = payload.data;
    if (!data) return undefined;
    const resolvedData = Array.isArray(data)
      ? data.find((item: any) => item && typeof item === 'object' && Object.keys(item).length > 0)
      : data;
    if (!resolvedData || typeof resolvedData !== 'object' || Object.keys(resolvedData).length === 0) return undefined;
    const steam = (resolvedData as any).steam;
    const productId = (resolvedData as any).id ?? (resolvedData as any).box_id;
    if (steam && typeof steam === 'object' && Object.keys(steam).length > 0) {
      if (steam && typeof steam === 'object') {
        return {
          id: steam.id ?? productId,
          steamId: steam.id,
          productId,
          cover: steam.cover,
          bean: steam.bean,
          name: steam.name,
          awards: {
            cover: steam.cover,
            bean: steam.bean,
            name: steam.name,
          },
        };
      }
      return {
        id: productId,
        productId,
        cover: (resolvedData as any).cover,
        bean: (resolvedData as any).bean,
        name: (resolvedData as any).name,
        awards: (resolvedData as any).awards,
      };
    }
    return undefined;
  }, [luckyMyBestRecord]);

  const tradeBannerHref = useMemo(() => {
    if (bestTradeRecord) {
      const params = new URLSearchParams();
      if (bestTradeRecord.productId !== undefined && bestTradeRecord.productId !== null) {
        params.set('productId', String(bestTradeRecord.productId));
      }
      if (bestTradeRecord.steamId !== undefined && bestTradeRecord.steamId !== null) {
        params.set('steamId', String(bestTradeRecord.steamId));
      } else if (bestTradeRecord.id !== undefined && bestTradeRecord.id !== null) {
        params.set('steamId', String(bestTradeRecord.id));
      }
      const qs = params.toString();
      if (qs) return `/deals?${qs}`;
      return '/deals';
    }
    return '/deals';
  }, [bestTradeRecord]);

  // 将新接口数据映射为旧格式
  const packs = useMemo(() => {
    if (boxNewListData?.code === 100000 && Array.isArray(boxNewListData.data)) {
      return boxNewListData.data.map((box: any) => ({
        id: String(box.id || box.box_id),
        title: box.name || box.title || '',
        image: box.cover || '',
        price: Number(box.bean || box.price || 0),
        itemCount: 0,
        items: [],
      }));
    }
    return [];
  }, [boxNewListData]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 min-h-screen pt-0">
        <div
          className="w-full px-4 sm:px-6 md:px-8 pb-12"
          style={{
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
          }}
        >
          <div className="flex gap-8 max-w-[1248px] mx-auto">
            <div className="flex-1 xl:max-w-[992px] min-w-0">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Banner
                    title={battleBannerTitle}
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
                    href={battleBannerHref}
                  >
                    {bestBattleRecord && <BattleRecordBanner record={bestBattleRecord} />}
                  </Banner>
                  <Banner
                    title={packBannerTitle}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    }
                    bgClass="bg-new-player-packs-banner"
                    href={packBannerHref}
                  >
                    {bestPackRecord && <PackRecordBanner record={bestPackRecord} />}
                  </Banner>
                  <Banner
                    title={t('yourBestDeal')}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 3.06729C4.23742 4.71411 2 8.09576 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 8.09576 19.7626 4.71411 16.5 3.06729" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                        <path d="M8.6822 7C7.06551 8.07492 6 9.91303 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 9.91303 16.9345 8.07492 15.3178 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                        <path d="M13.8534 2H13.2857H10.7143H10.1466C9.71002 2 9.48314 2.5203 9.78021 2.84023L11.6336 4.83619C11.8314 5.04922 12.1686 5.04922 12.3664 4.83619L14.2198 2.84023C14.5169 2.5203 14.29 2 13.8534 2Z" fill="currentColor"></path>
                      </svg>
                    }
                    bgClass="bg-new-player-deal-banner"
                    href={tradeBannerHref}
                  >
                    {bestTradeRecord && <PackRecordBanner record={bestTradeRecord} />}
                  </Banner>
                </div>
              </div>

              <SectionHeader
                title={t('newPacks')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                }
                onViewAll={() => router.push('/packs')}
                viewAllText={t('viewAll')}
                className="mt-12 mb-3"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 self-stretch min-w-0">
                {packs.slice(0, 5).map((pack: CatalogPack) => (
                  <div className="relative flex flex-col items-stretch w-full" key={pack.id}>
                    <PackCard
                      imageUrl={`${pack.image}?tr=q-50,w-640,c-at_max`}
                      alt={pack.title}
                      width={200}
                      height={304}
                      href={`/packs/${pack.id}`}
                      hoverTilt
                      showActions
                      packId={pack.id}
                      packTitle={pack.title}
                      packPrice={pack.price}
                    />
                    <div className="flex justify-center pt-3">
                      <p className="font-bold text-base" style={{ color: '#FFFFFF' }}>
                        {`$${pack.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </p>
                    </div>
                  </div>
                ))}
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
                onViewAll={() => router.push('/battles')}
                viewAllText={t('viewAll')}
                className="mt-12 mb-3"
              />
              <div className="mt-4">
                <BattleModes useBestRecord enablePolling={false} initialFightBestRecord={initialFightBestRecord} />
              </div>

              <SectionHeader
                title={t('tradeHighlights')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 3.06729C4.23742 4.71411 2 8.09576 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 8.09576 19.7626 4.71411 16.5 3.06729" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                    <path d="M8.6822 7C7.06551 8.07492 6 9.91303 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 9.91303 16.9345 8.07492 15.3178 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
                    <path d="M13.8534 2H13.2857H10.7143H10.1466C9.71002 2 9.48314 2.5203 9.78021 2.84023L11.6336 4.83619C11.8314 5.04922 12.1686 5.04922 12.3664 4.83619L14.2198 2.84023C14.5169 2.5203 14.29 2 13.8534 2Z" fill="currentColor"></path>
                  </svg>
                }
                onViewAll={() => router.push('/deals')}
                viewAllText={t('viewAll')}
                className="mt-12 mb-3"
              />
              <div className="mt-6">
                <TradeHighlights initialLuckyBestRecord={initialLuckyBestRecord} />
              </div>

              <div className="mt-10">
                <HowItWorks />
              </div>
            </div>

            <BestLiveSidebar
              liveTickerMaxItems={9}
              liveTickerIntervalMs={2000}
              initialBoxBestRecord={initialBoxBestRecord}
              initialBoxRecord2={initialBoxRecord2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

