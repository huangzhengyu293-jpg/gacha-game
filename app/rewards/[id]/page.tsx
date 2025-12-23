'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { getQualityFromLv, type DisplayProduct } from '@/app/lib/catalogV2';
import HorizontalSlotMachineClient from '@/app/packs/[id]/HorizontalSlotMachineClient';
import { LogoIcon } from '@/app/components/icons/Logo';
import { useAuth } from '@/app/hooks/useAuth';
import ProductCard from '@/app/packs/[id]/ProductCard';
import { useI18n } from '@/app/components/I18nProvider';

const PLACEHOLDER_IMAGE = '/theme/default/hidden-gold.png';

function mapBoxDetailToPackData(rawPack: any) {
  if (!rawPack) return null;

  const rawList =
    rawPack?.awards ??
    rawPack?.items ??
    rawPack?.award_items ??
    rawPack?.list ??
    [];
  const allAwards: any[] = Array.isArray(rawList) ? rawList : [];

  const items = allAwards
    .filter((item: any) => item)
    .map((item: any) => {
      const award = item?.awards || item || {};
      const lv = item?.lv ?? award?.lv ?? 0;
      const quality = getQualityFromLv(lv);
      const id = award?.id || award?.award_id || item?.id;
      return {
        id: id ? String(id) : '',
        name: award?.name || award?.item_name || award?.award_name || '',
        image: award?.cover || award?.image || PLACEHOLDER_IMAGE,
        price: Number(award?.bean ?? award?.price ?? 0),
        qualityId: quality.qualityId,
        description: award?.description || '',
        dropProbability: Number(
          item?.bili ??
            award?.bili ??
            award?.bili ??
            0
        ),
        backlightColor: quality.color,
      };
    })
    .filter((mapped) => mapped.id);
  
  return {
    id: rawPack?.id || rawPack?.box_id,
    title: rawPack?.name || rawPack?.title || '',
    price: Number(rawPack?.bean ?? rawPack?.price ?? 0),
    image: rawPack?.cover || rawPack?.image || PLACEHOLDER_IMAGE,
    items,
  };
}

export default function RewardPackDetailPage() {
  const params = useParams();
  const packId = params?.id as string;
  const { user } = useAuth();
  const { t } = useI18n();
  const [isSpinning, setIsSpinning] = useState(false);
  const [quickActive, setQuickActive] = useState<boolean>(() => (typeof window !== 'undefined' ? !!(window as any).__slotMachineFastMode : false));
  const [hoverOpen, setHoverOpen] = useState(false);
  const [hoverDemo, setHoverDemo] = useState(false);
  const [hoverQuick, setHoverQuick] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['rewardBoxDetail', packId],
    queryFn: () => api.getBoxDetail(packId),
    enabled: !!packId,
    staleTime: 30_000,
  });

  const pack = data?.code === 100000 ? data.data : null;
  const packDataMap = useMemo(() => {
    if (!pack) return {};
    const mapped = mapBoxDetailToPackData(pack);
    if (!mapped) return {};
    return { [String(mapped.id)]: mapped };
  }, [pack]);

  const packKey = useMemo(() => String(pack?.id || pack?.box_id || packId || ''), [pack, packId]);

  const displayItems: DisplayProduct[] = useMemo(() => {
    const mappedPack = packDataMap[packKey];
    if (!mappedPack?.items) return [];
    return mappedPack.items.map((it: any) => ({
      id: it.id,
      name: it.name,
      description: it.description,
      image: it.image,
      price: it.price,
      probability: it.dropProbability ?? it.probability ?? 0,
      backlightColor: it.backlightColor,
    }));
  }, [packDataMap, packKey]);

  const userLevel = Number((user as any)?.userInfo?.vip ?? (user as any)?.vip ?? 0);
  const requiredLevel = Number(pack?.level ?? pack?.lv ?? pack?.vip ?? 0);
  const isLocked = userLevel < requiredLevel;

  // 监听老虎机是否在转动
  useEffect(() => {
    const checkSpinning = () => setIsSpinning(!!(window as any).__isSlotMachineSpinning);
    checkSpinning();
    const t = window.setInterval(checkSpinning, 150);
    return () => window.clearInterval(t);
  }, []);

  const btnBaseBg = '#34383C';
  const btnHoverBg = '#5A5E62';
  const disabledBg = '#23272B';
  const disabledText = '#7A8185';
  const openBg = '#48BB78';
  const openHoverBg = '#38a169';
  const lockedText = '#2F855A';

  const handleOpen = async () => {
    if (isLocked || isSpinning || !pack) return;
    const ids = String(pack.id || pack.box_id || packId);
    const isFastMode = (window as any).__slotMachineFastMode || quickActive;
    const animTime = isFastMode ? 1000 : 6000;
    try {
      const result = await api.openBox({
        ids: [ids],
        multiple: 1,
        anim: animTime,
      });
      if (result?.code === 100000 && Array.isArray(result.data)) {
        const spinFn = (window as any).spinSlotMachine;
        if (typeof spinFn === 'function') {
          const rounds = result.data.map((item: any) => [item]); // 单礼包，每次一轮
          spinFn(rounds);
        }
      }
    } catch (err) {
      // 保持静默，避免阻塞
    }
  };

  const handleDemo = () => {
    if (isSpinning) return;
    const spin = (window as any).spinSlotMachine;
    if (typeof spin === 'function') {
      spin(1); // 演示1轮随机
    } else {
      window.dispatchEvent(new CustomEvent('slot:demo'));
    }
  };

  const handleQuickToggle = () => {
    if (isSpinning) return;
    const next = !quickActive;
    setQuickActive(next);
    (window as any).__slotMachineFastMode = next;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        {t('loading')}
      </div>
    );
  }



  return (
    <div className="w-full pb-20 relative -mt-8">
      <div className="w-full rounded-xl relative" style={{ backgroundColor: '#1D2125' }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none z-10">
          <LogoIcon width={20} height={20} className="w-5 h-5" color="#FFFFFF" aria-hidden />
          <p className="text-white text-lg font-black">FlameDraw</p>
        </div>
        {pack && (
          <HorizontalSlotMachineClient
            slotPackIds={[String(pack.id || pack.box_id)]}
            allPacksData={packDataMap}
            placeholderImage="/theme/default/hidden-gold.webp"
            itemSize={225}
          />
        )}
        <div
          className="absolute left-0 right-0 bottom-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, rgba(95, 95, 95, 0.00) 4.24%, #5F5F5F 55.62%, rgba(95, 95, 95, 0.00) 99.39%)' }}
        />
      </div>
      {pack && (
        <div className="flex justify-center w-full px-4 mt-6">
          <div className="flex flex-col sm:flex-row w-full max-w-5xl sm:items-center gap-3">
            <div className="hidden sm:flex sm:flex-1 min-w-[230px] min-h-12" />
            <div className="flex w-full sm:w-auto sm:flex-1 items-center justify-center">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-11 px-6 w-full sm:max-w-56"
                disabled={isLocked || isSpinning}
                onMouseEnter={() => !isLocked && !isSpinning && setHoverOpen(true)}
                onMouseLeave={() => setHoverOpen(false)}
                onClick={handleOpen}
                style={{
                  backgroundColor: isLocked || isSpinning ? disabledBg : (hoverOpen ? openHoverBg : openBg),
                  color: isLocked ? lockedText : '#FFFFFF',
                  cursor: isLocked || isSpinning ? 'not-allowed' : 'pointer',
                  opacity: isSpinning ? 0.6 : 1,
                }}
              >
                {isLocked ? t('rewardPackLocked') : t('rewardOpenPack')}
              </button>
            </div>
            <div className="flex w-full sm:w-auto sm:flex-1 justify-center sm:justify-end items-center gap-2">
              <div className="flex sm:hidden"></div>
              <div className="flex items-center gap-2">
                {/* <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-11 md:w-auto sm:h-11 px-0 md:px-6"
                  disabled={isSpinning}
                  onMouseEnter={() => !isSpinning && setHoverDemo(true)}
                  onMouseLeave={() => setHoverDemo(false)}
                  onClick={handleDemo}
                  style={{
                    backgroundColor: isSpinning ? disabledBg : (hoverDemo ? btnHoverBg : btnBaseBg),
                    color: isSpinning ? disabledText : '#FFFFFF',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    opacity: isSpinning ? 0.5 : 1,
                  }}
                >
                  <div className="size-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                      <path d="M17 6.75L15.305 5.055C13.9475 3.75 12.14 3 10.25 3C8.91498 3 7.60993 3.39588 6.4999 4.13758C5.38987 4.87928 4.52471 5.93349 4.01382 7.16689C3.50292 8.40029 3.36925 9.75749 3.6297 11.0669C3.89015 12.3762 4.53303 13.579 5.47703 14.523C6.42104 15.467 7.62377 16.1098 8.93314 16.3703C10.2425 16.6307 11.5997 16.4971 12.8331 15.9862C14.0665 15.4753 15.1207 14.6101 15.8624 13.5001C16.3573 12.7595 16.6982 11.9321 16.8703 11.0669" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M17 3V6.75H13.25" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <span className="hidden md:flex">{t('demoSpin')}</span>
                </button> */}
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-11 p-0"
                  onMouseEnter={() => !isSpinning && setHoverQuick(true)}
                  onMouseLeave={() => setHoverQuick(false)}
                  onClick={handleQuickToggle}
                  style={{
                    backgroundColor: isSpinning ? disabledBg : (hoverQuick ? btnHoverBg : btnBaseBg),
                    color: isSpinning ? disabledText : '#FFFFFF',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    opacity: isSpinning ? 0.5 : 1,
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={quickActive ? '#EDD75A' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap size-4 min-w-4 min-h-4 ">
                    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {pack && displayItems.length > 0 && (
        <div className="w-full px-4 mt-10 flex justify-center">
          <div className="w-full max-w-5xl flex flex-col gap-6">
            <div className="self-stretch items-stretch space-y-3">
              <div className="flex items-center gap-2 py-3 flex-1 z-10 relative">
                <div className="size-5 text-white">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="text-lg font-extrabold text-white">
                  {t('rewardFreePackLevelTitle').replace('{level}', String(requiredLevel || 0))}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {displayItems.map((prod) => (
                  <ProductCard key={prod.id} prod={prod} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

