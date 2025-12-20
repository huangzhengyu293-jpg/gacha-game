'use client';
import { useMemo, useRef, Suspense } from 'react';
import { useI18n } from '../components/I18nProvider';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CatalogPack } from '../lib/api';
import PacksToolbar from '../components/PacksToolbar';
import PacksGrid from '../components/PacksGrid';
import RouteToast from '../components/RouteToast';
import { usePacksFilters } from '../hooks/usePacksFilters';
import BestLiveSidebar from '../components/BestLiveSidebar';

export default function PacksPage() {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  
  // 使用筛选 hook
  const { filters, updateFilters, reset } = usePacksFilters({ type: '1,2' });
  
  // 使用新接口 box/list
  const { data: boxListData } = useQuery({
    queryKey: ['boxList', filters],
    queryFn: () => api.getBoxList(filters as any),
    // 收藏列表不使用缓存，其他列表使用 30 秒缓存
    staleTime: filters.search_type === '3' ? 0 : 30_000,
  });

  // 使用新接口数据
  const displayPacks = useMemo(() => {
    if (boxListData?.code === 100000 && Array.isArray(boxListData.data)) {
      return boxListData.data.map((box: any) => ({
        id: box.id || box.box_id,
        coverSrc: box.cover,
        price: `$${Number(box.bean || 0).toFixed(2)}`,
        title: box.name || box.title || '',
        priceNumber: Number(box.bean || 0),
      }));
    }
    return [];
  }, [boxListData]);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex-1 xl:max-w-[992px]">
          <div>
            <PacksToolbar filters={filters} onFilterChange={updateFilters} onReset={reset} />
          </div>
          <div 
            ref={scrollRef}
            className="mt-6 overflow-y-auto custom-scrollbar" 
            style={{ 
              maxHeight: '2600px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937'
            }}
          >
            <PacksGrid items={displayPacks} scrollRef={scrollRef} />
          </div>
        </div>
        <BestLiveSidebar bestOpensTitle={t('bestOpens')} liveTitle={t('liveStart')} />
      </div>
      <Suspense>
        <RouteToast />
      </Suspense>
    </div>
  );
}

