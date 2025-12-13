'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ExchangeItemCard, { type ExchangeItem } from '../components/ExchangeItemCard';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { showGlobalToast } from '../components/ToastProvider';
import { useI18n } from '../components/I18nProvider';

type SortOrder = 'asc' | 'desc';

type SectionProps = {
  id: string;
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  sortOrder: SortOrder;
  onToggleSort: () => void;
  items: ExchangeItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  loading: boolean;
  emptyTip: string;
  maxValue: string;
  selectedCount: number;
  selectedTotal: number;
  onClearSelected: () => void;
  disableMessage?: string;
  isSparklesButton?: boolean;
  hideCollapsible?: boolean;
};

function SectionPanel({
  id,
  title,
  search,
  onSearchChange,
  sortOrder,
  onToggleSort,
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  loading,
  emptyTip,
  maxValue,
  selectedCount,
  selectedTotal,
  onClearSelected,
  disableMessage,
  isSparklesButton,
  hideCollapsible,
}: SectionProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(true);
  const selectedItems = useMemo(() => items.filter((item) => selectedIds.has(item.id)), [items, selectedIds]);

  const renderGrid = () => {
    if (disableMessage) {
      return (
        <div className="flex items-center justify-center h-full text-sm font-semibold text-center text-gray-400">
          {disableMessage}
        </div>
      );
    }
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full text-sm font-semibold text-center text-gray-400">
          {t('loadingText')}
        </div>
      );
    }
    if (!items.length) {
      return (
        <div className="flex items-center justify-center h-full text-sm font-semibold text-center text-gray-400">
          {emptyTip}
        </div>
      );
    }
    return (
      <div className="h-full overflow-y-auto exchange-scroll">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {items.map((item) => (
            <ExchangeItemCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggle={() => onToggleSelect(item.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSelectedGrid = () => {
    if (!selectedItems.length) {
      return (
        <div className="flex items-center justify-center h-full text-sm font-semibold text-center" style={{ color: '#7A8084' }}>
          {emptyTip}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-4 gap-4">
        {selectedItems.map((item) => (
          <div key={item.id} className="h-28 relative">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus text-base text-white font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px] absolute top-1 right-1 z-10"
        aria-label={t('remove')}
              type="button"
              style={{ backgroundColor: '#34383C', cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3E4144';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#34383C';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(item.id);
              }}
            >
              <div className="size-4">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
            </button>
            <div
              data-component="BaseProductCard"
              className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 ease-in-out p-1.5 pb-4"
              style={{ boxSizing: 'border-box', backgroundColor: '#22272b' }}
            >
              <p className="font-semibold text-gray-400 h-6 text-xs"></p>
              <div className="relative flex-1 flex w-full justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px] bg-pack-none"></div>
                <img
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none"
                  src={item.image || '/logo.svg'}
                  style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent', zIndex: 1 }}
                />
              </div>
              <div className="flex flex-col w-full gap-0.5">
                <p className="font-semibold truncate max-w-full text-center text-xs" style={{ color: '#7A8084' }}>{item.name}</p>
                <div className="flex justify-center">
                  <p className="font-extrabold text-xs text-white">${Number(item.price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3 w-full">
      {!hideCollapsible && (
        <div
          className="w-full rounded-lg hidden lg:block"
          data-state="open"
          style={{ backgroundColor: '#161a1d' }}
        >
          <div
            className="w-full flex justify-between py-3 px-4 border-b border-white/5 cursor-pointer"
            role="button"
            aria-controls={id}
            aria-expanded={isOpen}
            data-state={isOpen ? 'open' : 'closed'}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <div className="flex items-center text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`lucide lucide-chevron-down size-5 mr-2 text-white transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
              <p className="font-extrabold mr-3 text-white">{title}</p>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors relative text-base font-bold select-none min-h-8 min-w-8 max-h-8 max-w-8 rounded-lg size-7"
                style={{ backgroundColor: '#22272B', color: '#7A8084' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSelected();
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#34383c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#22272B';
                }}
                aria-label={t('clearSelection')}
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-trash size-4"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <div className="flex gap-3 items-center">
              <div
                className="rounded-lg size-7 font-semibold text-sm flex items-center justify-center text-white"
                style={{ backgroundColor: '#22272B' }}
              >
                {selectedCount}
              </div>
              <p className="font-extrabold text-white">{t('totalAmountLabel')} ${selectedTotal.toFixed(2)}</p>
            </div>
          </div>
          {isOpen && (
            <div data-state="open" id={id} style={{ transitionDuration: '0s', animationName: 'none' }}>
              <div className="p-4 h-40 overflow-y-auto exchange-scroll">{renderSelectedGrid()}</div>
            </div>
          )}
        </div>
      )}

      <div
        className="lg:rounded-lg p-4 space-y-4 md:space-y-6 h-full"
        style={{ backgroundColor: '#161a1d' }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex w-full">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-search text-white size-5"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <input
                className="flex h-10 rounded-md px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 pl-10 font-semibold border-none w-full pr-10 text-[#7A8084] placeholder-[#7A8084] bg-[#22272b]"
                placeholder={t('searchPlaceholder')}
                enterKeyHint="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"></div>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <div className="flex-1">
              <div className="flex gap-2">
                <div
                  className="relative flex flex-1 rounded-md items-center h-10"
                  style={{ backgroundColor: '#34383c' }}
                >
                  <div className="rounded-tl-md rounded-bl-md flex items-center h-full font-bold text-sm gap-2 px-3 text-white">
                    <span>{t('max')}</span>
                  </div>
                  <div className="flex flex-1 relative items-center">
                    <input
                      className="flex h-10 w-full px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 border-0 font-semibold rounded-md"
                      value={maxValue}
                      readOnly
                      style={{ backgroundColor: '#22272b', color: '#FFFFFF', borderRadius: '0.375rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors relative text-base font-bold select-none h-10 rounded-md px-3"
              style={{ backgroundColor: '#22272b', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34383c')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22272b')}
              onClick={onToggleSort}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-down h-4 w-4 mr-1"
              >
                <path d="M12 5v14"></path>
                <path d="m19 12-7 7-7-7"></path>
              </svg>
              {t('priceLabel')}
            </button>
            {isSparklesButton ? (
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors relative text-base font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
                style={{ backgroundColor: '#22272b', color: '#7A8084' }}
                disabled
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-wand-sparkles"
                >
                  <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                  <path d="m14 7 3 3"></path>
                  <path d="M5 6v4"></path>
                  <path d="M19 14v4"></path>
                  <path d="M10 2v2"></path>
                  <path d="M7 8H3"></path>
                  <path d="M21 16h-4"></path>
                  <path d="M11 3H9"></path>
                </svg>
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 rounded-md px-3"
                style={{ backgroundColor: '#22272b', color: '#FFFFFF' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34383c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22272b')}
              type="button"
              onClick={() => {
                if (items.length) onSelectAll(items.map((it) => it.id));
              }}
              >
                {t('selectAll')}
                <div
                  className="size-4 shrink-0 rounded border flex items-center justify-center transition-all"
                  style={{ backgroundColor: '#22272b', borderColor: '#6B7280' }}
                ></div>
              </button>
            )}
          </div>
        </div>
        <div className="rounded-lg h-[calc(100vh-300px)] lg:h-[calc(100vh-475px)] lg:min-h-[calc(100vh-475px)]">
          <div className="flex-1 h-full">
            <div className="w-full h-full relative">{renderGrid()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 交换页滚动条样式（仅作用于带 exchange-scroll 的容器）
function ExchangeScrollStyles() {
  return (
    <style jsx global>{`
      .exchange-scroll {
        scrollbar-color: #9f9f9f #2c2c2c;
        scrollbar-width: thin;
      }
      .exchange-scroll::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .exchange-scroll::-webkit-scrollbar-track {
        background: #2c2c2c;
      }
      .exchange-scroll::-webkit-scrollbar-thumb {
        background: #9f9f9f;
        border-radius: 9999px;
      }
      .exchange-scroll::-webkit-scrollbar-button {
        background: #9f9f9f;
        height: 8px;
        width: 8px;
      }
      .exchange-scroll::-webkit-scrollbar-corner {
        background: #2c2c2c;
      }
    `}</style>
  );
}

export default function ExchangePage() {
  const { t } = useI18n();
  const [mobileTab, setMobileTab] = useState<'yourItems' | 'youReceive'>('yourItems');
  const mapShopItems = (payload: any): ExchangeItem[] => {
    const rows = Array.isArray(payload?.data?.data)
      ? payload.data.data
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
    return rows
      .filter((item: any) => !!item)
      .map((item: any, index: number) => {
        const baseId = String(item.id ?? item.box_id ?? `shop_${index}`);
        return {
          id: baseId,
          warehouseId: baseId,
          productId: String(item.product_id ?? item.id ?? baseId),
          name: item.name ?? item.title ?? item.awards?.name ?? t('freePackFallback'),
          price: Number(item.bean ?? item.price ?? item.amount ?? item.awards?.bean ?? 0),
          image: item.cover ?? item.image ?? item.icon ?? item.awards?.cover ?? '',
        };
      });
  };

  const filterAndSort = (list: ExchangeItem[], keyword: string, sort: SortOrder) => {
    const safeList = Array.isArray(list) ? list : [];
    const filtered = keyword.trim()
      ? safeList.filter((item) => (item?.name || '').toLowerCase().includes(keyword.trim().toLowerCase()))
      : safeList;
    return [...filtered].sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));
  };
  const [yourSearch, setYourSearch] = useState('');
  const [receiveSearch, setReceiveSearch] = useState('');
  const [yourSort, setYourSort] = useState<SortOrder>('asc');
  const [receiveSort, setReceiveSort] = useState<SortOrder>('asc');
  const [selectedYour, setSelectedYour] = useState<Set<string>>(new Set());
  const [selectedReceive, setSelectedReceive] = useState<Set<string>>(new Set());

  const { isAuthenticated } = useAuth();
  const { cartItems, isLoading: cartLoading } = useCart(yourSort);

  const { data: shopResponse, isLoading: shopLoading } = useQuery({
    queryKey: ['shop-list'],
    queryFn: api.getShopList,
    staleTime: 30_000,
  });

  const yourItemsRaw: ExchangeItem[] = useMemo(() => {
    if (!Array.isArray(cartItems)) return [];
    return cartItems.map((item, index) => ({
      id: item.id || `cart_${index}`,
      warehouseId: item.warehouseId,
      productId: item.productId,
      name: item.name || '',
      price: Number(item.price ?? 0),
      image: item.image || '',
    }));
  }, [cartItems]);

  const receiveItemsRaw: ExchangeItem[] = useMemo(() => mapShopItems(shopResponse), [shopResponse]);

  const yourItems = useMemo(() => filterAndSort(yourItemsRaw, yourSearch, yourSort), [yourItemsRaw, yourSearch, yourSort]);
  const receiveItems = useMemo(() => filterAndSort(receiveItemsRaw, receiveSearch, receiveSort), [receiveItemsRaw, receiveSearch, receiveSort]);

  useEffect(() => {
    setSelectedYour((prev) => {
      const next = new Set<string>();
      yourItems.forEach((item) => {
        if (prev.has(item.id)) next.add(item.id);
      });
      return next;
    });
  }, [yourItems]);

  useEffect(() => {
    setSelectedReceive((prev) => {
      const next = new Set<string>();
      receiveItems.forEach((item) => {
        if (prev.has(item.id)) next.add(item.id);
      });
      return next;
    });
  }, [receiveItems]);

  const toggleYourSelect = (id: string) => {
    setSelectedYour((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleReceiveSelect = (id: string) => {
    setSelectedReceive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearAll = () => {
    setSelectedYour(new Set());
    setSelectedReceive(new Set());
  };

  const selectAllYour = (ids: string[]) => {
    setSelectedYour(new Set(ids));
  };
  const selectAllReceive = (ids: string[]) => {
    setSelectedReceive(new Set(ids));
  };

  const yourSelectedItems = useMemo(
    () => yourItems.filter((item) => selectedYour.has(item.id)),
    [yourItems, selectedYour],
  );
  const receiveSelectedItems = useMemo(
    () => receiveItems.filter((item) => selectedReceive.has(item.id)),
    [receiveItems, selectedReceive],
  );

  const yourSelectedTotal = useMemo(
    () => yourSelectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [yourSelectedItems],
  );
  const receiveSelectedTotal = useMemo(
    () => receiveSelectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [receiveSelectedItems],
  );
  const yourTotal = useMemo(() => yourItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0), [yourItems]);
  const receiveTotal = useMemo(
    () => receiveItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [receiveItems],
  );

  const leftTotal = yourSelectedTotal;
  const rightTotal = receiveSelectedTotal;
  const diff = leftTotal - rightTotal;
  const exchangeLabel = diff > 0 ? t('creditBalance') : t('exchangeNeeded');
  const exchangeAmount = diff > 0 ? diff : Math.max(-diff, 0);
  const canExchange = leftTotal > 0 && rightTotal > 0 && leftTotal >= rightTotal;

  const exchangeMutation = useMutation({
    mutationFn: async () => {
      const storageIds = Array.from(
        new Set(
          yourSelectedItems.map((item) => item.warehouseId || (item.id.includes('#') ? item.id.split('#')[0] : item.id)),
        ),
      );
      const shopIds = Array.from(new Set(receiveSelectedItems.map((item) => item.id)));
      return api.exchangeItems({ storageIds, shopIds });
    },
    onSuccess: (res: any) => {
      if (res?.code === 100000) {
        showGlobalToast({
          title: t('success'),
          description: t('exchangeSuccess'),
          variant: 'success',
        });
        setSelectedYour(new Set());
        setSelectedReceive(new Set());
      } else {
        throw new Error(res?.message || t('exchangeFailed'));
      }
    },
    onError: (error: any) => {
      showGlobalToast({
        title: t('error'),
        description: error?.message || t('exchangeFailedRetry'),
        variant: 'error',
      });
    },
  });

  const yourDisableMessage = isAuthenticated ? '' : t('loginToViewItems');

  return (
    <>
      <ExchangeScrollStyles />
      <div className="flex flex-col flex-1 items-stretch relative" style={{ marginTop: '-32px' }}>
        <div className="container max-w-[1280px] mx-auto py-6 px-4 gap-4 items-start relative flex-1 hidden lg:flex">
        <SectionPanel
          id="exchange-my-items"
          title={t('yourItemsTitle')}
          search={yourSearch}
          onSearchChange={setYourSearch}
          sortOrder={yourSort}
          onToggleSort={() => setYourSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          items={yourItems}
          selectedIds={selectedYour}
          onToggleSelect={toggleYourSelect}
          onSelectAll={selectAllYour}
          loading={cartLoading}
          emptyTip={t('yourItemsEmpty')}
          maxValue={`$${yourTotal.toFixed(2)}`}
          selectedCount={selectedYour.size}
          selectedTotal={yourSelectedTotal}
          onClearSelected={() => setSelectedYour(new Set())}
          disableMessage={yourDisableMessage}
        />
        <div
          className="rounded-lg sticky top-20 p-2"
          style={{ backgroundColor: '#161a1d' }}
        >
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors relative text-base font-bold select-none h-10 px-6 w-full rounded-lg"
            disabled={!canExchange || exchangeMutation.isPending}
            style={{ backgroundColor: '#4299e1', color: canExchange ? '#FFFFFF' : '#2b6cb0', cursor: canExchange ? 'pointer' : 'not-allowed' }}
            onClick={() => {
              if (!canExchange || exchangeMutation.isPending) return;
              exchangeMutation.mutate();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left-right"
            >
              <path d="M8 3 4 7l4 4"></path>
              <path d="M4 7h16"></path>
              <path d="m16 21 4-4-4-4"></path>
              <path d="M20 17H4"></path>
            </svg>
            {t('exchangeItems')}
          </button>
          <div className="flex flex-col items-center gap-2 p-4 pt-6 min-w-44 min-h-40">
            <p className="font-semibold text-sm" style={{ color: '#7A8084' }}>
              {exchangeLabel}
            </p>
            <p className="font-extrabold text-white">${exchangeAmount.toFixed(2)}</p>
          </div>
        </div>
        <SectionPanel
          id="exchange-receive-items"
          title={t('youReceiveTitle')}
          search={receiveSearch}
          onSearchChange={setReceiveSearch}
          sortOrder={receiveSort}
          onToggleSort={() => setReceiveSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          items={receiveItems}
          selectedIds={selectedReceive}
          onToggleSelect={toggleReceiveSelect}
          onSelectAll={selectAllReceive}
          loading={shopLoading}
          emptyTip={t('youReceiveEmpty')}
          maxValue={`$${receiveTotal.toFixed(2)}`}
          selectedCount={selectedReceive.size}
          selectedTotal={receiveSelectedTotal}
          onClearSelected={() => setSelectedReceive(new Set())}
          isSparklesButton
        />
        </div>

      <div className="lg:hidden flex flex-col h-full pb-14">
        <div dir="ltr" data-orientation="horizontal" className="w-full h-full pt-4">
          <div className="px-4 pt-2">
            <div
              role="tablist"
              aria-orientation="horizontal"
              className="inline-flex items-center justify-center rounded-md p-1 w-full h-14 text-base mb-3"
              tabIndex={0}
              data-orientation="horizontal"
              style={{ outline: 'none', backgroundColor: '#22272b' }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === 'yourItems'}
                aria-controls="mobile-tab-yourItems"
                data-state={mobileTab === 'yourItems' ? 'active' : 'inactive'}
                id="mobile-tab-trigger-yourItems"
                className="inline-flex items-center whitespace-nowrap rounded-md px-3 py-1 h-full transition-all interactive-focus disabled:opacity-50 data-[state=active]:bg-gray-600 text-base font-regular flex-1 text-gray-400 data-[state=active]:text-white justify-start gap-2"
                tabIndex={-1}
                data-orientation="horizontal"
                onClick={() => setMobileTab('yourItems')}
                style={{ backgroundColor: mobileTab === 'yourItems' ? '#34383c' : 'transparent' }}
              >
                <span className="size-7 rounded-lg text-sm flex items-center justify-center" style={{ backgroundColor: '#22272b', color: '#FFFFFF' }}>
                  {selectedYour.size}
                </span>
                <div className="flex flex-col items-start text-white">
                  <span className="font-extrabold leading-tight">{t('yourItemsTitle')}</span>
                  <span className="font-extrabold text-sm leading-tight">${yourSelectedTotal.toFixed(2)}</span>
                </div>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === 'youReceive'}
                aria-controls="mobile-tab-youReceive"
                data-state={mobileTab === 'youReceive' ? 'active' : 'inactive'}
                id="mobile-tab-trigger-youReceive"
                className="inline-flex items-center whitespace-nowrap rounded-md px-3 py-1 h-full transition-all interactive-focus disabled:opacity-50 data-[state=active]:bg-gray-600 text-base font-regular flex-1 text-gray-400 data-[state=active]:text-white justify-start gap-2"
                tabIndex={-1}
                data-orientation="horizontal"
                onClick={() => setMobileTab('youReceive')}
                style={{ backgroundColor: mobileTab === 'youReceive' ? '#34383c' : 'transparent' }}
              >
                <span className="size-7 rounded-lg text-sm flex items-center justify-center" style={{ backgroundColor: '#22272b', color: '#FFFFFF' }}>
                  {selectedReceive.size}
                </span>
                <div className="flex flex-col items-start text-white">
                  <span className="font-extrabold leading-tight">{t('youReceiveTitle')}</span>
                  <span className="font-extrabold text-sm leading-tight">${receiveSelectedTotal.toFixed(2)}</span>
                </div>
              </button>
            </div>
          </div>

          {mobileTab === 'yourItems' && (
            <div
              data-state="active"
              data-orientation="horizontal"
              role="tabpanel"
              aria-labelledby="mobile-tab-trigger-yourItems"
              id="mobile-tab-yourItems"
              tabIndex={0}
              className="h-full"
            >
              <div className="bg-gray-900 lg:rounded-lg space-y-4 md:space-y-6 h-full" style={{ backgroundColor: '#161a1d' }}>
                <SectionPanel
                  id="mobile-your-items-section"
                  title={t('yourItemsTitle')}
                  search={yourSearch}
                  onSearchChange={setYourSearch}
                  sortOrder={yourSort}
                  onToggleSort={() => setYourSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  items={yourItems}
                  selectedIds={selectedYour}
                  onToggleSelect={toggleYourSelect}
                onSelectAll={selectAllYour}
                  loading={cartLoading}
                  emptyTip={t('yourItemsEmpty')}
                  maxValue={`$${yourTotal.toFixed(2)}`}
                  selectedCount={selectedYour.size}
                  selectedTotal={yourSelectedTotal}
                  onClearSelected={() => setSelectedYour(new Set())}
                  disableMessage={yourDisableMessage}
                  hideCollapsible
                />
              </div>
            </div>
          )}

          {mobileTab === 'youReceive' && (
            <div
              data-state="active"
              data-orientation="horizontal"
              role="tabpanel"
              aria-labelledby="mobile-tab-trigger-youReceive"
              id="mobile-tab-youReceive"
              tabIndex={0}
              className="h-full"
            >
              <div className="bg-gray-900 lg:rounded-lg space-y-4 md:space-y-6 h-full" style={{ backgroundColor: '#161a1d' }}>
                <SectionPanel
                  id="mobile-receive-items-section"
                  title={t('youReceiveTitle')}
                  search={receiveSearch}
                  onSearchChange={setReceiveSearch}
                  sortOrder={receiveSort}
                  onToggleSort={() => setReceiveSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  items={receiveItems}
                  selectedIds={selectedReceive}
                  onToggleSelect={toggleReceiveSelect}
                onSelectAll={selectAllReceive}
                  loading={shopLoading}
                  emptyTip={t('youReceiveEmpty')}
                  maxValue={`$${receiveTotal.toFixed(2)}`}
                  selectedCount={selectedReceive.size}
                  selectedTotal={receiveSelectedTotal}
                  onClearSelected={() => setSelectedReceive(new Set())}
                  isSparklesButton
                  hideCollapsible
                />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 left-0 right-0 z-50 mt-3 px-4 pb-4" style={{ backgroundColor: '#1d2125' }}>
          <div className="flex items-center justify-center h-16 rounded-lg mb-2" style={{ backgroundColor: '#161a1d' }}>
            <p className="font-semibold text-sm text-center space-x-2" style={{ color: '#7A8084' }}>
              <span>{exchangeLabel}</span>
              <span className="font-extrabold text-blue-400">${exchangeAmount.toFixed(2)}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors relative text-base font-bold select-none px-6 h-12 cursor-pointer flex-shrink-0"
              style={{ backgroundColor: '#22272b', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34383c')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22272b')}
              onClick={clearAll}
              type="button"
            >
              {t('clearAll')}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors relative text-base font-bold select-none px-6 h-12 w-full cursor-pointer flex-shrink"
              style={{ backgroundColor: '#4299e1', color: canExchange ? '#FFFFFF' : '#2b6cb0' }}
              disabled={!canExchange || exchangeMutation.isPending}
              onMouseEnter={(e) => {
                if (!canExchange) return;
                e.currentTarget.style.backgroundColor = '#5aa8ea';
              }}
              onMouseLeave={(e) => {
                if (!canExchange) return;
                e.currentTarget.style.backgroundColor = '#4299e1';
              }}
              onClick={() => {
                if (!canExchange || exchangeMutation.isPending) return;
                exchangeMutation.mutate();
              }}
              type="button"
            >
              {t('exchangeItems')}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

