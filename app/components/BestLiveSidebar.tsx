'use client';

import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import LiveFeedElement from './LiveFeedElement';
import LiveFeedTicker from './LiveFeedTicker';
import { getGlowColorFromProbability } from '../lib/catalogV2';
import { useLiveFeed } from './live-feed/LiveFeedProvider';
import { useI18n } from './I18nProvider';

type BestOpenItem = {
  id?: string;
  index?: number;
  href?: string;
  avatarUrl?: string;
  productImageUrl?: string;
  packImageUrl?: string;
  title?: string;
  priceLabel?: string;
  glowColor?: string;
};

type SidebarProps = {
  bestOpens?: BestOpenItem[];
  liveTickerMaxItems?: number;
  liveTickerIntervalMs?: number;
  livePollMs?: number;
  bestOpensTitle?: string;
  liveTitle?: string;
  bestOpensIcon?: ReactNode;
  liveIcon?: ReactNode;
  className?: string;
  width?: string | number;
};

const defaultStarIcon = (
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
);

const defaultCircleIcon = (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7.5" stroke="#EB4B4B" strokeOpacity="0.5"></circle>
    <circle cx="8" cy="8" r="2" fill="#EB4B4B"></circle>
  </svg>
);

export default function BestLiveSidebar({
  bestOpens = [],
  liveTickerMaxItems = 9,
  liveTickerIntervalMs = 2000,
  livePollMs = 10_000,
  bestOpensTitle,
  liveTitle,
  bestOpensIcon = defaultStarIcon,
  liveIcon = defaultCircleIcon,
  className = '',
  width = '224px',
}: SidebarProps) {
  const { t } = useI18n();
  const resolvedBestOpensTitle = bestOpensTitle ?? t("bestOpens");
  const resolvedLiveTitle = liveTitle ?? t("liveStart");
  const { push, setInitialItems } = useLiveFeed();
  const latestIdsRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);

  const { data: bestRecordResp } = useQuery({
    queryKey: ['boxBestRecord'],
    queryFn: () => api.getBoxBestRecord?.(),
    staleTime: 30_000,
  });

  const { data: liveRecordResp } = useQuery({
    queryKey: ['boxRecord2'],
    queryFn: () => api.getBoxRecord2?.(),
    refetchInterval: livePollMs,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const safeBestOpens = useMemo(() => (Array.isArray(bestOpens) ? bestOpens : []), [bestOpens]);

  const glowColorFromLevel = (lv?: number) => {
    switch (lv) {
      case 1: return '#E4AE33';
      case 2: return '#EB4B4B';
      case 3: return '#8847FF';
      case 4: return '#4B69FF';
      case 5: return '#829DBB';
      default: return undefined;
    }
  };
  
  const remoteBestOpens = useMemo<BestOpenItem[]>(() => {
    const list = Array.isArray(bestRecordResp?.data) ? bestRecordResp?.data : [];
    return list.map((item: any, idx: number) => {
      const priceNum = Number(item?.awards?.bean ?? item?.bean ?? item?.price ?? item?.box_price ?? 0);
      const priceLabel = priceNum > 0
        ? `$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '';
      const lv = Number(item?.awards?.lv ?? item?.lv);
      const coverFromAward = item?.awards?.cover ?? item?.awards?.image ?? item?.awards?.icon;
      const boxCover = item?.box?.cover ?? item?.box_cover;
      return {
        id: item?.id ? String(item.id) : `best-record-${idx}`,
        index: idx,
        href: item?.box_id ? `/packs/${item.box_id}` : undefined,
        avatarUrl: item?.user?.avatar ?? item?.avatar ?? item?.user_avatar ?? item?.userAvatar ?? '',
        productImageUrl: coverFromAward ?? item?.image ?? item?.product_image ?? item?.goods_image ?? item?.icon ?? '',
        packImageUrl: boxCover ?? item?.box_image ?? item?.pack_image ?? item?.cover ?? '',
        title: item?.awards?.name ?? item?.name ?? item?.title ?? item?.goods_name ?? item?.box_name ?? '',
        priceLabel,
        glowColor: glowColorFromLevel(lv) ?? getGlowColorFromProbability(item?.probability ?? item?.dropProbability),
      };
    });
  }, [bestRecordResp?.data]);

  const finalBestOpens = remoteBestOpens.length > 0 ? remoteBestOpens : safeBestOpens;

  // 将 /api/box/record2 的新增记录推送到 LiveFeedProvider，保留动画效果
  useEffect(() => {
    const list = Array.isArray(liveRecordResp?.data) ? liveRecordResp?.data : [];
    if (!list.length) return;

    // 初始化：首屏直接塞入（最多20条，不触发弹出）
    if (!hydratedRef.current) {
      const initialItems = list.slice(0, 20).map((item: any, idx: number) => {
        const id = String(item?.id ?? item?.record_id ?? `record-${idx}-${Date.now()}`);
        const priceNum = Number(item?.bean ?? item?.price ?? item?.awards?.bean ?? 0);
        const priceLabel = priceNum > 0
          ? `$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '$0.00';
        const coverFromAward = item?.awards?.cover ?? item?.awards?.image ?? item?.cover ?? item?.icon;
        const packCover = item?.box?.cover ?? item?.box_cover ?? item?.pack_image ?? '';
        const title = item?.awards?.name ?? item?.name ?? item?.title ?? item?.goods_name ?? '';
        const lv = Number(item?.awards?.lv ?? item?.lv);
        const glowColor = lv
          ? (() => {
              switch (lv) {
                case 1: return '#E4AE33';
                case 2: return '#EB4B4B';
                case 3: return '#8847FF';
                case 4: return '#4B69FF';
                case 5: return '#829DBB';
                default: return undefined;
              }
            })()
          : getGlowColorFromProbability(item?.probability ?? item?.dropProbability);

        return {
          id,
          href: item?.box_id ? `/packs/${item.box_id}` : '/packs',
          avatarUrl: item?.user?.avatar ?? item?.avatar ?? '',
          productImageUrl: coverFromAward ?? '',
          packImageUrl: packCover ?? '',
          title: title ?? '',
          priceLabel,
          glowColor,
        };
      });
      setInitialItems(initialItems);
      latestIdsRef.current = new Set(initialItems.map((it: { id?: string }) => it.id || ''));
      hydratedRef.current = true;
      return;
    }

    const nextIds = new Set<string>();
    const newItems: any[] = [];

    list.forEach((item: any, idx: number) => {
      const id = String(item?.id ?? item?.record_id ?? `record-${idx}-${Date.now()}`);
      nextIds.add(id);
      if (!latestIdsRef.current.has(id)) {
        newItems.push({ item, id });
      }
    });

    // 更新已知 id 集合，防止重复推送
    latestIdsRef.current = nextIds;

    if (!newItems.length) return;

    newItems.forEach(({ item }) => {
      const priceNum = Number(item?.bean ?? item?.price ?? item?.awards?.bean ?? 0);
      const priceLabel = priceNum > 0
        ? `$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00';
      const coverFromAward = item?.awards?.cover ?? item?.awards?.image ?? item?.cover ?? item?.icon;
      const packCover = item?.box?.cover ?? item?.box_cover ?? item?.pack_image ?? '';
      const title = item?.awards?.name ?? item?.name ?? item?.title ?? item?.goods_name ?? '';
      const lv = Number(item?.awards?.lv ?? item?.lv);
      const glowColor = lv
        ? (() => {
            switch (lv) {
              case 1: return '#E4AE33';
              case 2: return '#EB4B4B';
              case 3: return '#8847FF';
              case 4: return '#4B69FF';
              case 5: return '#829DBB';
              default: return undefined;
            }
          })()
        : getGlowColorFromProbability(item?.probability ?? item?.dropProbability);

      push({
        href: item?.box_id ? `/packs/${item.box_id}` : '/packs',
        avatarUrl: item?.user?.avatar ?? item?.avatar ?? '',
        productImageUrl: coverFromAward ?? '',
        packImageUrl: packCover ?? '',
        title: title ?? '',
        priceLabel,
        glowColor,
      });
    });
  }, [liveRecordResp?.data, push]);

  return (
    <div className={`hidden lg:block flex-shrink-0 ${className}`} style={{ width }}>
      <div className="rounded-lg px-0 pb-4 pt-0 h-fit">
        <div className="flex pb-4 gap-2 items-center">
          <div className="flex size-4 text-yellow-400">
            {bestOpensIcon}
          </div>
          <p className="text-base text-white font-extrabold">{resolvedBestOpensTitle}</p>
        </div>
        <div className="live-feed flex flex-col gap-3">
          {finalBestOpens.map((item, idx) => (
            <LiveFeedElement
              key={item.id ?? `${idx}-${item.title ?? 'item'}`}
              index={typeof item.index === 'number' ? item.index : idx}
              href={item.href}
              avatarUrl={item.avatarUrl || ''}
              productImageUrl={item.productImageUrl || ''}
              packImageUrl={item.packImageUrl || ''}
              title={item.title || ''}
              priceLabel={item.priceLabel || ''}
              glowColor={item.glowColor}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg px-0 pb-4 pt-0 h-fit mt-6">
        <div className="flex pb-4 gap-2 items-center">
          <div className="flex size-4 text-yellow-400">
            {liveIcon}
          </div>
          <p className="text-base text-white font-extrabold">{resolvedLiveTitle}</p>
        </div>
        <LiveFeedTicker maxItems={liveTickerMaxItems} intervalMs={liveTickerIntervalMs} />
      </div>
    </div>
  );
}

