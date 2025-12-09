'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getQualityFromLv } from '../../lib/catalogV2';
import ActionBarClient from './ActionBarClient';
import PackMediaStrip from './PackMediaStrip';
import HorizontalSlotMachineClient from './HorizontalSlotMachineClient';
import { LogoIcon } from '../../components/icons/Logo';

// 统一的数据映射函数
function mapBoxDetailToPackData(rawPack: any) {
  const allAwards = rawPack.awards || [];
  const items = allAwards.map((item: any) => {
    const award = item.awards || item;
    const lv = item.lv || award.lv;
    const quality = getQualityFromLv(lv);

    return {
      id: award.id || award.award_id,
      name: award.name || award.item_name || award.award_name || '',
      image: award.cover || award.image || '',
      price: Number(award.bean || award.price || 0),
      qualityId: quality.qualityId,
      description: award.description || '',
      dropProbability: Number(item.bili||award.drop_probability || award.bili || award.dropProbability|| 0),
      backlightColor: quality.color,
    };
  });

  return {
    id: rawPack.id || rawPack.box_id,
    title: rawPack.name || rawPack.title || '',
    price: Number(rawPack.bean || rawPack.price || 0),
    image: rawPack.cover || rawPack.image || '',
    items: items,
  };
}

export default function PackDetailPage() {
  const params = useParams();
  const primaryPackId = params.id as string;

  // 管理选中的卡包列表（最多6个，第一个是主卡包）
  const [slotPackIds, setSlotPackIds] = useState<string[]>([primaryPackId]);

  // 缓存已获取的卡包数据
  const [packsDataCache, setPacksDataCache] = useState<Record<string, any>>({});

  // 获取主卡包数据
  const { data: primaryBoxData, isLoading: primaryLoading, error: primaryError } = useQuery({
    queryKey: ['boxDetail', primaryPackId],
    queryFn: () => api.getBoxDetail(primaryPackId),
    staleTime: 30_000,
  });

  // 更新主卡包到缓存
  useEffect(() => {
    if (primaryBoxData?.code === 100000 && primaryBoxData.data) {
      const packData = mapBoxDetailToPackData(primaryBoxData.data);
      setPacksDataCache(prev => ({
        ...prev,
        [primaryPackId]: packData
      }));
    }
  }, [primaryBoxData, primaryPackId]);

  // 监听 slotPackIds 变化，为新的 ID 获取数据
  useEffect(() => {
    const uniqueIds = Array.from(new Set(slotPackIds));

    uniqueIds.forEach(id => {
      if (!packsDataCache[id]) {
        api.getBoxDetail(id).then(response => {
          if (response.code === 100000 && response.data) {
            const packData = mapBoxDetailToPackData(response.data);
            setPacksDataCache(prev => ({
              ...prev,
              [id]: packData
            }));
          }
        }).catch(() => { });
      }
    });
  }, [slotPackIds, packsDataCache]);


  if (primaryLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen">
        <span className="font-semibold text-base" style={{ color: '#FFFFFF' }}>加载中...</span>
      </div>
    );
  }



  return (
    <div className="flex flex-col flex-1 items-stretch relative mt-[-32px]">
      <div className="flex flex-1 flex-col gap-6 pb-48 pt-2">
        <div className="flex self-center w-full max-w-screen-xl px-4 justify-between items-center mx-auto">
          <a href="/packs" className="inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold hover:text-white select-none h-10 px-0 gap-0" style={{ color: '#7A8084' }}>
            <div className="size-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M8 3L3 8L8 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path><path d="M13 8L3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
            <p className="text-sm text-white font-bold ml-2">返回包裹</p>
          </a>
          <div className="flex justify-center items-center gap-1">
            <LogoIcon width={20} height={20} className="mr-1 w-5 h-5" color="#FFFFFF" aria-hidden />
            <p className="text-white text-lg font-black">FlameDraw</p>
          </div>
          <div className="flex gap-2 w-[113.5px]"></div>
        </div>

        <HorizontalSlotMachineClient
          slotPackIds={slotPackIds}
          allPacksData={packsDataCache}
        />

        <div className="flex self-center w-full max-w-screen-xl px-4">
          <ActionBarClient allPacksData={packsDataCache} slotPackIds={slotPackIds} />
        </div>

        <PackMediaStrip
          slotPackIds={slotPackIds}
          onSlotPackIdsChange={setSlotPackIds}
          allPacksData={packsDataCache}
          primaryPackId={primaryPackId}
        />
      </div>
    </div>
  );
}
