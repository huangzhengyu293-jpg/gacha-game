'use client';

import { useState, useEffect, useMemo, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../hooks/useCart';
import { showGlobalToast } from './ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from './I18nProvider';
import WithdrawCryptoModal from './WithdrawCryptoModal';
import { useWithdrawalStorageMutation } from '../hooks/useWithdrawalStorageMutation';


interface CartItem {
  id: string; // unique key per card, may include suffix
  warehouseId?: string; // actual warehouse id for API
  productId: string; // warehouse productId key
  name: string;
  price: number;
  image: string;
  selected?: boolean;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPrice?: number;
  items?: CartItem[];
}



export default function CartModal({ isOpen, onClose, totalPrice: _totalPrice = 1.38, items }: CartModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  // 初始不带 price_sort，用户点击价格按钮后再传
  const [sortByPrice, setSortByPrice] = useState<'asc' | 'desc' | undefined>(undefined);
  const [claimableActive, setClaimableActive] = useState(false);

  // 使用购物车 hook 获取数据，当可领取物品按钮激活时传递 from=exchange 参数
  const { cartItems, isLoading: warehouseLoading, refetch: refetchCart } = useCart(sortByPrice, claimableActive ? 'exchange' : undefined);
  const { fetchUserBean, user } = useAuth();
  const [viewMode, setViewMode] = useState<'cart' | 'shop'>('cart');
  const isShopMode = viewMode === 'shop';
  const [shopItems, setShopItems] = useState<CartItem[]>([]);
  const [isShopLoading, setIsShopLoading] = useState(false);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  // 确认出售弹窗状态
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const [confirmGain, setConfirmGain] = useState(0);
  const [confirmPayload, setConfirmPayload] = useState<string[]>([]);
  const [withdrawCryptoOpen, setWithdrawCryptoOpen] = useState(false);
  const withdrawalStorageMutation = useWithdrawalStorageMutation();

  // 将购物车数据转换为 CartItem 格式（如果外部未传入 items 则使用购物车数据）
  const expandedWarehouseItems: CartItem[] = cartItems.map((item, index) => ({
    ...item,
    id: item.id || `cart_${index}`,
  }));

  const hasExternalItems = Array.isArray(items) && items.length > 0;
  const shouldShowWarehouseLoading = warehouseLoading && !hasExternalItems;
  const defaultItems: CartItem[] = useMemo(
    () => {
      const baseItems = hasExternalItems ? (items as CartItem[]) : expandedWarehouseItems;
      return baseItems.map((item, index) => {
        const baseId =
          item.warehouseId ??
          (typeof item.id === 'string' && item.id.includes('#') ? item.id.split('#')[0] : item.id) ??
          `cart_${index}`;
        return {
          ...item,
          warehouseId: baseId,
        };
      });
    },
    [hasExternalItems, items, expandedWarehouseItems],
  );

  const mapShopItems = (payload: any): CartItem[] => {
    const rows = Array.isArray(payload?.data?.data)
      ? payload.data.data
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
    return rows.map((item: any, index: number) => {
      const baseId = String(item.id ?? item.box_id ?? `shop_${index}`);
      const fallbackName = t("itemPlaceholder").replace("{index}", String(index + 1));
      return {
        id: baseId,
        warehouseId: baseId,
        productId: String(item.product_id ?? item.id ?? baseId),
        name: item.name ?? item.title ?? item.awards?.name ?? fallbackName,
        price: Number(item.bean ?? item.price ?? item.amount ?? item.awards?.bean ?? 0),
        image: item.cover ?? item.image ?? item.icon ?? item.awards?.cover ?? '',
      };
    });
  };

  const handleOpenCart = () => {
    setViewMode('cart');
    setShopItems([]);
    setActiveTab('all');
    setSelectedItems(new Set());
    setSelectionOrder([]);
    refetchCart();
  };

  const handleOpenShop = async () => {
    if (isShopLoading) return;
    setViewMode('shop');
    setActiveTab('all');
    setSelectedItems(new Set());
    setSelectionOrder([]);
    setIsShopLoading(true);
    try {
      const response = await api.getShopList();
      if (response.code === 100000) {
        setShopItems(mapShopItems(response));
      } else {
        throw new Error(response.message || t('shopFetchFail'));
      }
    } catch (error: any) {
      showGlobalToast({
        title: t('error'),
        description: error?.message || t('shopFetchFail'),
        variant: 'error',
      });
      setShopItems([]);
    } finally {
      setIsShopLoading(false);
    }
  };

  const handleToggleMode = () => {
    if (isShopMode) {
      handleOpenCart();
    } else {
      handleOpenShop();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      refetchCart();
    } else {
      setViewMode('cart');
      setShopItems([]);
      setActiveTab('all');
      setSelectedItems(new Set());
      setSelectionOrder([]);
      setConfirmOpen(false);
      setWithdrawCryptoOpen(false);
    }
  }, [isOpen, refetchCart]);

  const [selectionOrder, setSelectionOrder] = useState([] as string[]);

  const handleToggleClaimable = useCallback(() => {
    if (isShopMode) return;
    // ✅ 用户要求：只要切换（可认领 <-> 非可认领）就全部清空
    setSelectedItems(new Set());
    setSelectionOrder([]);
    setActiveTab('all');
    setClaimableActive((prev) => !prev);
  }, [isShopMode]);

  // 同一数据源刷新（例如领取/出售后 refetch）时，移除已经不存在的选中项；
  // 注意：加载中/列表为空时不做 prune，避免切换 queryKey 时把选择误清空。
  useEffect(() => {
    if (isShopMode) return;
    if (shouldShowWarehouseLoading) return;
    if (defaultItems.length === 0) return;

    const existingIds = new Set(defaultItems.map((it) => it.id));

    setSelectedItems((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (existingIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });

    setSelectionOrder((prev) => {
      if (!prev.length) return prev;
      const next = prev.filter((id) => existingIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [defaultItems, isShopMode, shouldShowWarehouseLoading]);
  const queryClient = useQueryClient();
  const router = useRouter();
  const goExchange = useCallback(() => {
    onClose();
    router.push('/exchange');
  }, [onClose, router]);
  const listSourceItems = isShopMode ? shopItems : defaultItems;
  const displayedItems = activeTab === 'all' ? listSourceItems : listSourceItems.filter(item => selectedItems.has(item.id));
  const selectedCount = isShopMode ? 0 : selectedItems.size;
  const selectedTotal = isShopMode
    ? 0
    : defaultItems
        .filter(item => selectedItems.has(item.id))
        .reduce((sum, item) => sum + item.price, 0);
  const cartTotal = defaultItems.reduce((sum, item) => sum + item.price, 0);
  const listLoading = isShopMode ? isShopLoading : shouldShowWarehouseLoading;
  const listLoadingText = isShopMode ? t('shopLoading') : t('warehouseLoadingText');
  const emptyListText = isShopMode ? t('shopEmpty') : t('warehouseEmpty');
  const actionButtonLabel = isShopMode ? t('cartTitle') : t('shop');
  const actionButtonDisabled = isShopLoading;
  const headerTitle = isShopMode ? t('shop') : t('cartTitle');
  const allTabLabel = `${t('allItems')} (${defaultItems.length})`;
  const selectedTabLabel = `${t('selectedItems')} (${selectedCount})`;
  const selectAllChecked = (selectedItems.size === defaultItems.length && defaultItems.length > 0);
  const selectAllLabel = selectAllChecked ? t('unselectAll') : `${t('selectAll')} (${defaultItems.length})`;
  const selectedSummaryText = t('selectedSummary')
    .replace('{count}', String(selectedCount))
    .replace('{amount}', `$${selectedTotal.toFixed(2)}`);

  const openWithdrawCrypto = () => {
    if (isShopMode) return;
    if (selectedCount === 0) return;
    const MIN_WITHDRAW_USD = 15;
    if (!Number.isFinite(selectedTotal) || selectedTotal < MIN_WITHDRAW_USD) {
      showGlobalToast({
        title: t('withdrawCryptoTitle'),
        description: t('withdrawMinAmountNotice'),
        variant: 'error',
        durationMs: 3000,
      });
      return;
    }
    setWithdrawCryptoOpen(true);
  };



  // ✅ 暂时禁用分割功能，等待后续实现仓库接口
  const splitMutation = useMutation({
    mutationFn: async (item: CartItem) => {
      throw new Error(t('warehouseUnavailable'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const buyShopItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!productId) {
        throw new Error(t('invalidProduct'));
      }
      const response = await api.buyShopItem(productId);
      if (response.code !== 100000) {
        throw new Error(response.message || t('buyFailRetry'));
      }
      return response;
    },
    onSuccess: () => {
      showGlobalToast({
        title: t('buySuccess'),
        description: t('balanceUpdated'),
        variant: 'success',
      });
      fetchUserBean().catch(() => {});
    },
    onError: (error: any) => {
      showGlobalToast({
        title: t('buyFail'),
        description: error?.message || t('retryLater'),
        variant: 'error',
      });
    },
  });

  const itemMap = useMemo(() => {
    const map = new Map<string, CartItem>();
    defaultItems.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [defaultItems]);

  // ✅ 领取实体物品
  const claimPhysicalMutation = useMutation({
    mutationFn: async (item: CartItem) => {
      if (!item.warehouseId && !item.id) {
        throw new Error(t('invalidProduct'));
      }
      // 获取用户信息的 address_info
      const info = (user as any)?.userInfo ?? user;
      const addrRaw = (info as any)?.address_info ?? (info as any)?.addressInfo;
      let addressInfo: Record<string, any> = {};
      
      // 解析 address_info（JSON 字符串转对象）
      if (addrRaw != null) {
        if (typeof addrRaw === 'string') {
          try {
            const parsed = JSON.parse(addrRaw);
            if (parsed && typeof parsed === 'object') {
              addressInfo = parsed;
            }
          } catch {
            addressInfo = {};
          }
        } else if (typeof addrRaw === 'object') {
          addressInfo = addrRaw;
        }
      }
      
      // 检查地址信息是否完整
      const requiredFields = ['name', 'phone', 'address_1', 'address_2', 'countries', 'state', 'city', 'postal_code'];
      const missingFields = requiredFields.filter(field => !addressInfo?.[field] || (typeof addressInfo[field] === 'string' && !addressInfo[field].trim()));
      
      if (missingFields.length > 0) {
        // 使用特殊的错误标记，让 onError 能够识别这是个人信息不完整的情况
        const error: any = new Error(t('pleaseFillPersonalInfo'));
        error.isPersonalInfoIncomplete = true;
        throw error;
      }
      
      return api.receivePhysical({
        storage_id: item.warehouseId || item.id,
        name: addressInfo.name || '',
        phone: addressInfo.phone || '',
        address_1: addressInfo.address_1 || '',
        address_2: addressInfo.address_2 || '',
        countries: addressInfo.countries || '',
        state: addressInfo.state || '',
        city: addressInfo.city || '',
        postal_code: addressInfo.postal_code || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStorage'] });
      showGlobalToast({
        title: t('claimSuccess') || t('success'),
        description: t('claimSuccessDesc') || t('actionSuccess'),
        variant: 'success',
      });
      refetchCart();
    },
    onError: (error: any) => {
      // 如果是个人信息不完整，跳转到个人信息页面
      if (error?.isPersonalInfoIncomplete) {
        showGlobalToast({
          title: t('error'),
          description: error.message || t('pleaseFillPersonalInfo'),
          variant: 'error',
          durationMs: 3000,
        });
        // 延迟关闭购物车并跳转，让用户看到提示
        setTimeout(() => {
          onClose();
          router.push('/account');
        }, 1000);
      } else {
        showGlobalToast({
          title: t('error'),
          description: error?.message || t('retryLater'),
          variant: 'error',
        });
      }
    },
  });

  // ✅ 暂时禁用出售功能，等待后续实现仓库接口
  const confirmSellMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) {
        throw new Error(t('selectItemsFirst'));
      }
      return api.cashOutBoxes(ids);
    },
    onSuccess: () => {
      setSelectedItems(new Set());
      setSelectionOrder([]);
      queryClient.invalidateQueries({ queryKey: ['userStorage'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      showGlobalToast({
        title: t('sellSuccess'),
        description: t('balanceUpdated'),
        variant: 'success',
      });
      fetchUserBean().catch(() => {});
      setConfirmOpen(false);
    },
  });

  const buildSelectedSellIds = (): string[] => {
    const ids: string[] = [];
    for (const uniqueId of selectedItems) {
      const item = itemMap.get(uniqueId);
      if (!item?.warehouseId) continue;
      ids.push(item.warehouseId);
    }
    return ids;
  };

  const buildSelectedStorageIds = (): string[] => buildSelectedSellIds();

  const openConfirmForSelected = () => {
    if (selectedCount === 0) return;
    const payload = buildSelectedSellIds();
    setConfirmPayload(payload);
    setConfirmCount(payload.length);
    setConfirmGain(selectedTotal);
    setConfirmOpen(true);
  };

  const openConfirmForSingle = (item: CartItem) => {
    const warehouseId =
      item.warehouseId ?? (typeof item.id === 'string' && item.id.includes('#') ? item.id.split('#')[0] : item.id);
    setConfirmPayload([warehouseId]);
    setConfirmCount(1);
    setConfirmGain(item.price);
    setConfirmOpen(true);
  };

  const handleBuyShopItem = (item: CartItem) => {
    if (!item?.productId) {
      showGlobalToast({
        title: t('error'),
        description: t('missingProductInfo'),
        variant: 'error',
      });
      return;
    }
    if (buyShopItemMutation.isPending) return;
    setBuyingProductId(item.productId);
    buyShopItemMutation.mutate(item.productId, {
      onSettled: () => setBuyingProductId(null),
    });
  };

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (isShopMode) return;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      setSelectionOrder((prev) => prev.filter((x) => x !== id));
    } else {
      newSelected.add(id);
      setSelectionOrder((prev) => prev.includes(id) ? prev : [...prev, id]);
    }
    setSelectedItems(new Set(newSelected));
  };

  const selectAll = () => {
    if (isShopMode) return;
    if (selectedItems.size === defaultItems.length) {
      setSelectedItems(new Set());
      setSelectionOrder([]);
    } else {
      const allIds = defaultItems.map(item => item.id);
      setSelectedItems(new Set(allIds));
      setSelectionOrder(allIds);
    }
  };

  const sortedItems = displayedItems; // 由后端根据 price_sort 排序

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      className="fixed inset-0 z-50 bg-black/[0.48] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 flex justify-center items-start sm:items-start sm:py-16 sm:px-4 p-4"
      style={{
        pointerEvents: 'auto',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        // iOS 刘海/底部手势条安全区，避免底部按钮/内容被盖住
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-describedby="cart-description"
        aria-labelledby="cart-title"
        data-state={isOpen ? 'open' : 'closed'}
        className="z-50 max-w-lg w-full gap-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg relative sm:max-w-4xl p-0 flex flex-col"
        tabIndex={-1}
        style={{ 
          pointerEvents: 'auto', 
          backgroundColor: '#161A1D',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex-col gap-1.5 text-center sm:text-left p-4 pt-6 sm:pt-4 h-16 flex justify-center flex-shrink-0" style={{ borderBottom: '1px solid #2E3134' }}>
          <div className="flex items-center">
            <h2 id="cart-title" className="tracking-tight text-left text-base font-extrabold pr-3" style={{ color: '#FEFEFE' }}>
              {headerTitle}
            </h2>
            {!isShopMode && (
              <p className="flex gap-2 items-center pl-3" style={{ borderLeft: '1px solid #2E3134' }}>
                <span className="font-extrabold" style={{ color: '#FEFEFE' }}>${cartTotal.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>

        {/* 移动端标签页 */}
        <div dir="ltr" data-orientation="horizontal" className="w-full sm:hidden flex flex-col px-4 sm:px-6 flex-1 min-h-0 pt-4">
          <div role="tablist" aria-orientation="horizontal" className="inline-flex items-center justify-center rounded-md p-1 w-full h-10 sm:h-12 text-sm sm:text-base flex-shrink-0" tabIndex={0} data-orientation="horizontal" style={{ outline: 'none', backgroundColor: '#22272B' }}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              aria-controls="cart-content-all"
              data-state={activeTab === 'all' ? 'active' : 'inactive'}
              id="cart-trigger-all"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 h-full transition-all interactive-focus disabled:pointer-events-none disabled:opacity-50 text-base font-regular text-white flex-1"
              tabIndex={-1}
              data-orientation="horizontal"
              onClick={() => setActiveTab('all')}
              style={{ backgroundColor: activeTab === 'all' ? '#34383C' : 'transparent' }}
            >
              <span className="font-extrabold" style={{ color: '#FFFFFF' }}>{allTabLabel}</span>
            </button>
            {!isShopMode && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'selected'}
                aria-controls="cart-content-selected"
                data-state={activeTab === 'selected' ? 'active' : 'inactive'}
                id="cart-trigger-selected"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 h-full transition-all interactive-focus disabled:pointer-events-none disabled:opacity-50 text-base font-regular flex-1"
                tabIndex={-1}
                data-orientation="horizontal"
                onClick={() => setActiveTab('selected')}
                style={{ backgroundColor: activeTab === 'selected' ? '#34383C' : 'transparent' }}
              >
                <span className="font-extrabold" style={{ color: '#FFFFFF' }}>{selectedTabLabel}</span>
              </button>
            )}
          </div>

          {/* 移动端内容 */}
          <div
            data-state={activeTab === 'all' ? 'active' : 'inactive'}
            data-orientation="horizontal"
            role="tabpanel"
            aria-labelledby="cart-trigger-all"
            id="cart-content-all"
            tabIndex={0}
            className="flex-1 flex flex-col min-h-0"
            style={{ display: activeTab === 'all' ? 'flex' : 'none' }}
          >
            <div className="my-3 w-full flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-2 font-semibold text-xs sm:h-10 sm:px-3 sm:text-sm"
                  style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                  onClick={() => setSortByPrice(sortByPrice === 'asc' ? 'desc' : 'asc')}
                  type="button"
                >
                  <span className="truncate">{t('priceLabel')}</span>
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
                    className={`lucide lucide-arrow-down transition-transform shrink-0 ${sortByPrice === 'desc' ? 'rotate-180' : ''}`}
                  >
                    <path d="M12 5v14"></path>
                    <path d="m19 12-7 7-7-7"></path>
                  </svg>
                </button>
                {!isShopMode && (
                  <button
                    className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-2 font-semibold text-xs sm:h-10 sm:px-3 sm:text-sm"
                    style={{ backgroundColor: '#161A1D', color: '#FFFFFF', border: `1px solid ${claimableActive ? '#4299E1' : '#45484A'}`, cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#161A1D'; }}
                    onClick={handleToggleClaimable}
                    type="button"
                  >
                    <span className="truncate">{t('claimableItems')}</span>
                  </button>
                )}
              </div>

              {!isShopMode && (
                <button
                  className="inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-2 font-semibold text-xs group sm:h-10 sm:px-3 sm:text-sm ml-auto"
                  style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                  onClick={selectAll}
                  type="button"
                >
                    <div
                      className="size-5 shrink-0 rounded border flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: (selectedItems.size === defaultItems.length && defaultItems.length > 0) ? '#4299E1' : '#22272B',
                        borderColor: '#5A5E62',
                        borderWidth: 1,
                      }}
                    >
                      {(selectedItems.size === defaultItems.length && defaultItems.length > 0) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                      )}
                    </div>
                    {selectAllLabel}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(var(--app-vh, 1vh) * 100 - 320px)' }}>
              {listLoading ? (
                <div className="flex h-full items-center justify-center font-semibold" style={{ color: '#7A8084' }}>{listLoadingText}</div>
              ) : displayedItems.length > 0 ? (
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 pb-4">
                  {sortedItems?.length>0&&sortedItems.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      isShopMode={isShopMode}
                      isSelected={!isShopMode && selectedItems.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onSplit={splitMutation.mutate}
                      onSell={(it) => openConfirmForSingle(it)}
                      isClaimable={claimableActive}
                      onClaim={claimPhysicalMutation.mutate}
                      isClaiming={claimPhysicalMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center w-full text-center font-semibold" style={{ color: '#7A8084', minHeight: '120px' }}>
                  {emptyListText}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2 mb-6 rounded-lg flex-col sm:flex-row items-center flex-shrink-0 pt-2 pb-4" style={{ backgroundColor: '#161A1D' }}>
              <div className="hidden sm:block">
                <div className="flex gap-1 items-center">
                  {selectedCount > 0 && (
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                      type="button"
                      onClick={() => { setSelectedItems(new Set()); setSelectionOrder([]); }}
                      style={{ cursor: 'pointer', color: '#FFFFFF' }}
                    >
                      <div className="size-5">
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="currentColor"></path>
                        </svg>
                      </div>
                    </button>
                  )}
                  <p className="font-extrabold" style={{ color: selectedCount > 0 ? '#FFFFFF' : '#7A8084' }}>{selectedSummaryText}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:min-w-28 font-bold"
                  style={{ backgroundColor: selectedCount === 0 ? '#34383C' : '#4299E1', color: selectedCount === 0 ? '#2B6CB0' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                  disabled={selectedCount === 0}
                  onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  onClick={() => { if (selectedCount > 0) openConfirmForSelected(); }}
                >
                  {t('sell')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: selectedCount === 0 ? '#7A8084' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                  disabled={selectedCount === 0}
                  onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onClick={openWithdrawCrypto}
                >
                  {t('withdraw')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onClick={goExchange}
                >
                  {t('exchange')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: actionButtonDisabled ? '#7A8084' : '#FFFFFF', cursor: actionButtonDisabled ? 'default' : 'pointer' }}
                  disabled={actionButtonDisabled}
                  onMouseEnter={(e) => { if (!actionButtonDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { if (!actionButtonDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onClick={handleToggleMode}
                >
                  {actionButtonLabel}
                </button>
              </div>
            </div>
          </div>
          <div
            data-state={activeTab === 'selected' ? 'active' : 'inactive'}
            data-orientation="horizontal"
            role="tabpanel"
            aria-labelledby="cart-trigger-selected"
            id="cart-content-selected"
            tabIndex={0}
            className="flex-1 flex flex-col min-h-0"
            style={{ display: activeTab === 'selected' ? 'flex' : 'none' }}
          >
            {/* 已选择数量显示 */}
            <div className="flex gap-1 items-center flex-shrink-0 my-3">
              {selectedCount > 0 ? (
                <div className="flex gap-1 items-center">
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                    type="button"
                    onClick={() => { setSelectedItems(new Set()); setSelectionOrder([]); }}
                    style={{ cursor: 'pointer', color: '#FFFFFF' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
                  >
                    <div className="size-5 text-white">
                      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </button>
                  <p className="font-extrabold" style={{ color: '#FFFFFF' }}>{selectedSummaryText}</p>
                </div>
              ) : (
                <p className="font-extrabold" style={{ color: '#7A8084' }}>{selectedSummaryText}</p>
              )}
            </div>
            
            {/* 物品区域 */}
            <div
              className="flex-1 overflow-y-auto min-h-0 rounded-lg"
              style={{
                backgroundColor: '#1D2125',
                // ✅ 空态也要“撑起来”：给父容器一个自适应高度
                // - 下限：避免被压扁
                // - 中值：跟随视口高度（dvh 优先，vh 兜底）
                // - 上限：避免过高影响底部按钮区
                
              }}
            >
              {selectedCount === 0 ? (
                <div className="flex h-full items-center justify-center font-semibold" style={{ color: '#7A8084',height: 'clamp(180px, calc(var(--app-vh, 1vh) * 100 - 320px), 520px)',
                  maxHeight: 'calc(var(--app-vh, 1vh) * 100 - 320px)', }}>{t('manageHint')}</div>
              ) : (
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 p-4">
                  {selectionOrder.filter((id) => selectedItems.has(id)).map((id) => {
                    const it = defaultItems.find((d) => d.id === id);
                    if (!it) return null;
                    return (
                      <SelectedCartItemCard
                        key={it.id}
                        item={it}
                        onRemove={() => toggleSelect(it.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* 按钮区域 */}
            <div className="flex justify-between mt-2 mb-6 rounded-lg flex-col sm:flex-row items-center flex-shrink-0 pt-2 pb-4" style={{ backgroundColor: '#161A1D' }}>
              <div className="hidden sm:block">
                <div className="flex gap-1 items-center">
                  {selectedCount > 0 && (
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                      type="button"
                      onClick={() => { setSelectedItems(new Set()); setSelectionOrder([]); }}
                      style={{ cursor: 'pointer', color: '#FFFFFF' }}
                    >
                      <div className="size-5">
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="currentColor"></path>
                        </svg>
                      </div>
                    </button>
                  )}
                  <p className="font-extrabold" style={{ color: selectedCount > 0 ? '#FFFFFF' : '#7A8084' }}>{selectedSummaryText}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:min-w-28 font-bold"
                  style={{ backgroundColor: selectedCount === 0 ? '#34383C' : '#4299E1', color: selectedCount === 0 ? '#2B6CB0' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                  disabled={selectedCount === 0}
                  onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  onClick={() => { if (selectedCount > 0) openConfirmForSelected(); }}
                >
                  {t('sell')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: selectedCount === 0 ? '#7A8084' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                  disabled={selectedCount === 0}
                  onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onClick={openWithdrawCrypto}
                >
                  {t('withdraw')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onClick={goExchange}
                >
                  {t('exchange')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: actionButtonDisabled ? '#7A8084' : '#FFFFFF', cursor: actionButtonDisabled ? 'default' : 'pointer' }}
                  disabled={actionButtonDisabled}
                  onMouseEnter={(e) => { if (!actionButtonDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { if (!actionButtonDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                  onClick={handleToggleMode}
                >
                  {actionButtonLabel}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 桌面端内容 */}
        <div className="hidden sm:block pb-4 px-4 sm:px-6 flex-1 min-h-0 flex flex-col">
          <>
          <div className="flex justify-between mt-2 mb-4 rounded-lg flex-col sm:flex-row items-center">
            <div className="hidden sm:block">
              <div className="flex gap-1 items-center">
                {selectedCount > 0 && (
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
                    type="button"
                    onClick={() => { setSelectedItems(new Set()); setSelectionOrder([]); }}
                    style={{ cursor: 'pointer', color: '#FFFFFF' }}
                  >
                    <div className="size-5">
                      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </button>
                )}
                <p className="font-extrabold" style={{ color: selectedCount > 0 ? '#FFFFFF' : '#7A8084' }}>{selectedSummaryText}</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:min-w-28 font-bold"
                style={{ backgroundColor: selectedCount === 0 ? '#34383C' : '#4299E1', color: selectedCount === 0 ? '#2B6CB0' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                disabled={selectedCount === 0}
                onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                onClick={() => { if (selectedCount > 0) openConfirmForSelected(); }}
              >
                {t('sell')}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                style={{ backgroundColor: '#34383C', color: selectedCount === 0 ? '#7A8084' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                disabled={selectedCount === 0}
                onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                onClick={openWithdrawCrypto}
              >
                {t('withdraw')}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                onClick={goExchange}
              >
                {t('exchange')}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                style={{ backgroundColor: '#34383C', color: actionButtonDisabled ? '#7A8084' : '#FFFFFF', cursor: actionButtonDisabled ? 'default' : 'pointer' }}
                disabled={actionButtonDisabled}
                onMouseEnter={(e) => { if (!actionButtonDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                onMouseLeave={(e) => { if (!actionButtonDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                onClick={handleToggleMode}
              >
                {actionButtonLabel}
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg overflow-y-auto p-4 self-stretch flex-1 min-h-0" style={{ backgroundColor: '#1D2125' }}>
            {shouldShowWarehouseLoading ? (
              <div className="flex h-full sm:h-[150px] items-center justify-center font-semibold" style={{ color: '#7A8084' }}>{t('warehouseLoadingText')}</div>
            ) : selectedCount === 0 ? (
              <div className="flex h-full sm:h-[150px] items-center justify-center font-semibold" style={{ color: '#7A8084' }}>{t('selectItemsToManage')}</div>
            ) : (
              <div className="h-full w-full grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 grid-rows-[repeat(2,min-content)] sm:grid-rows-[auto]">
                {selectionOrder.filter((id) => selectedItems.has(id)).map((id) => {
                  const it = defaultItems.find((d) => d.id === id);
                  if (!it) return null;
                  return (
                  <div key={it.id} className="aspect-square relative">
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus text-base text-white font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px] absolute top-1 right-1"
                      aria-label="remove"
                      onClick={() => toggleSelect(it.id)}
                      style={{ backgroundColor: '#34383C', cursor: 'pointer' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                    >
                      <div className="size-4">
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="currentColor"></path></svg>
                      </div>
                    </button>
                    <div data-component="BaseProductCard" className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 ease-in-out p-3" style={{ boxSizing: 'border-box', backgroundColor: '#22272B' }}>
                      <p className="font-semibold h-6 text-base" style={{ color: '#7A8084' }}></p>
                      <div className="relative flex-1 flex w-full justify-center">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px] bg-pack-none"></div>
                        <img
                            alt={it.name}
                            src={it.image}
                            style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }}
                          />
                      </div>
                      <div className="flex flex-col w-full gap-0.5">
                        <p className="font-semibold truncate max-w-full text-center text-base" style={{ color: '#7A8084' }}>{it.name}</p>
                        <div className="flex justify-center">
                          <p className="font-extrabold text-base" style={{ color: '#FAFAFA' }}>${it.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* 可认领/价格/全选工具条（位置：列表容器下方） */}
          <div className="flex justify-between my-3 sm:my-6 gap-2 w-full flex-nowrap rounded-md">
            <div className="gap-2 shrink-0 hidden sm:flex p-2">
              {!isShopMode && (
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm sm:h-10"
                  style={{ backgroundColor: '#161A1D', color: '#FFFFFF', border: `1px solid ${claimableActive ? '#4299E1' : '#45484A'}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#161A1D'; }}
                    onClick={handleToggleClaimable}
                  type="button"
                >
                  {t('claimableItems')}
                </button>
              )}
            </div>
            <div className="flex gap-2 shrink-0 flex-1 sm:flex-initial sm:w-auto items-center p-2">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm sm:h-10 shrink-0"
                style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                onClick={() => setSortByPrice(sortByPrice === 'asc' ? 'desc' : 'asc')}
                type="button"
              >
                {t('priceLabel')}
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
                  className={`lucide lucide-arrow-down transition-transform ${sortByPrice === 'desc' ? 'rotate-180' : ''}`}
                >
                  <path d="M12 5v14"></path>
                  <path d="m19 12-7 7-7-7"></path>
                </svg>
              </button>
              {!isShopMode && (
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm sm:hidden shrink-0"
                  style={{ backgroundColor: '#161A1D', color: '#FFFFFF', border: `1px solid ${claimableActive ? '#4299E1' : '#45484A'}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#161A1D'; }}
                  onClick={handleToggleClaimable}
                  type="button"
                >
                  {t('claimableItems')}
                </button>
              )}
              {!isShopMode && (
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm group sm:h-10 shrink-0 ml-auto"
                  style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                  onClick={selectAll}
                  type="button"
                >
                  <div
                    className="size-5 shrink-0 rounded border flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: (selectedItems.size === defaultItems.length && defaultItems.length > 0) ? '#4299E1' : '#22272B',
                      borderColor: '#5A5E62',
                      borderWidth: 1,
                    }}
                  >
                    {(selectedItems.size === defaultItems.length && defaultItems.length > 0) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                  <span className="truncate">
                    <span className="xs:hidden">{selectAllChecked ? t('unselectAll') : t('selectAll')}</span>
                    <span className="hidden xs:inline">{selectAllLabel}</span>
                  </span>
                </button>
              )}
            </div>
          </div>
          {/* 仓库商品网格（在工具条下面） */}
          {!warehouseLoading  && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                {sortedItems?.length>0&&sortedItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    isShopMode={isShopMode}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onSplit={splitMutation.mutate}
                    onSell={(it) => openConfirmForSingle(it)}
                    onBuy={handleBuyShopItem}
                    isBuying={buyingProductId === item.productId && buyShopItemMutation.isPending}
                    isClaimable={claimableActive}
                    onClaim={claimPhysicalMutation.mutate}
                    isClaiming={claimPhysicalMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
          </>
        </div>

        {/* 关闭按钮 */}
        <button
          type="button"
          className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer"
          style={{ color: '#7A8084' }}
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span className="sr-only">Close</span>
        </button>

        {/* 确认出售弹窗 */}
        {confirmOpen && (
          <div
            className="fixed px-4 inset-0 z-[100] bg-black/[0.48] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-y-auto flex justify-center items-start py-16"
            style={{ pointerEvents: 'auto' }}
            onClick={() => { if (!confirmSellMutation.isPending) setConfirmOpen(false); }}
          >
            <div
              role="dialog"
              aria-describedby="sell-confirm-desc"
              aria-labelledby="sell-confirm-title"
              data-state="open"
              className="overflow-hidden z-[110] grid w-full gap-4 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg relative max-w-2xl"
              tabIndex={-1}
              style={{ pointerEvents: 'auto', backgroundColor: '#161A1D', color: '#FFFFFF', fontFamily: 'Urbanist, sans-serif', fontWeight: 700 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1.5 text-center sm:text-left">
                <h2 id="sell-confirm-title" className="text-xl font-bold leading-none tracking-tight text-left">
                  {t('sellConfirmTitle').replace('{count}', String(confirmCount))}
                </h2>
              </div>
              <div className="flex flex-col items-start gap-4 py-2" id="sell-confirm-desc">
                <p>{t('sellConfirmGain').replace('{amount}', `$${confirmGain.toFixed(2)}`)}</p>
                <div className="flex flex-col items-start gap-4 rounded-lg p-4" style={{ border: '1px solid #161A1D', backgroundColor: '#161A1D' }}>
                  <p className="font-bold">{t('sellNoticeTitle')}</p>
                  <p className="text-sm">{t('sellNoticeLine1')}</p>
                  <p className="text-sm">{t('sellNoticeLine2')}</p>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none h-10 px-6"
                  onClick={() => setConfirmOpen(false)}
                  disabled={confirmSellMutation.isPending}
                  style={{ color: '#7A8084', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7A8084'; }}
                >
                  {t('cancel')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6"
                  onClick={() => {
                    if (!confirmSellMutation.isPending && confirmPayload.length > 0) {
                      confirmSellMutation.mutate(confirmPayload);
                    }
                  }}
                  disabled={confirmSellMutation.isPending || confirmPayload.length === 0}
                  style={{ backgroundColor: '#4299E1', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  {t('continueAction')}
                </button>
              </div>
              <button
                type="button"
                className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer"
                onClick={() => { if (!confirmSellMutation.isPending) setConfirmOpen(false); }}
                style={{ color: '#7A8084' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7A8084'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        )}

        <WithdrawCryptoModal
          isOpen={withdrawCryptoOpen}
          onClose={() => setWithdrawCryptoOpen(false)}
          amountUsd={selectedTotal}
          estimatedFeeUsd={0}
          isSubmitting={withdrawalStorageMutation.isPending}
          requestDisabled={withdrawalStorageMutation.isPending}
          onRequestWithdraw={({ assetId, address }) => {
            const storageIds = buildSelectedStorageIds();
            if (!assetId || storageIds.length === 0 || !address) return;
            withdrawalStorageMutation.mutate(
              { id: String(assetId), storageIds, walletAddress: String(address) },
              {
                onSuccess: (resp: any) => {
                  if (resp?.code === 100000) {
                    showGlobalToast({
                      title: t('success'),
                      description: resp?.message || t('balanceUpdated'),
                      variant: 'success',
                    });
                    setWithdrawCryptoOpen(false);
                    setSelectedItems(new Set());
                    setSelectionOrder([]);
                    fetchUserBean().catch(() => {});
                  } else {
                    showGlobalToast({
                      title: t('error'),
                      description: resp?.message || t('retryLater'),
                      variant: 'error',
                    });
                  }
                },
                onError: (error: any) => {
                  showGlobalToast({
                    title: t('error'),
                    description: error?.message || t('retryLater'),
                    variant: 'error',
                  });
                },
              },
            );
          }}
        />
      </div>
    </div>
  );
}

function SelectedCartItemCard({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const isVoucher = item.productId?.startsWith('voucher:') || item.name === 'Voucher' || item.price === 0.01;

  return (
    <div className="relative rounded-lg aspect-square" data-component="BaseProductCard" style={{ backgroundColor: '#22272B' }}>
      <div className="absolute top-1 right-1 z-10">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
          aria-label="remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ backgroundColor: '#34383C', cursor: 'pointer', color: '#FFFFFF' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
        >
          <div className="size-4">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="currentColor"></path>
            </svg>
          </div>
        </button>
      </div>
      <div className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 ease-in-out p-3 pb-2" style={{ boxSizing: 'border-box', backgroundColor: '#22272B' }}>
        <p className="font-semibold h-6 text-base" style={{ color: '#7A8084' }}></p>
        <div className="relative flex-1 flex w-full justify-center" style={{ minHeight: 0 }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px] bg-pack-none"></div>
          <img
              alt={item.name}
              src={item.image}
              style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }}
            />
        </div>
        <div className="flex flex-col w-full gap-0.5">
          <p className="font-semibold truncate max-w-full text-center text-base" style={{ color: '#7A8084' }}>{item.name}</p>
          <div className="flex justify-center">
            <p className="font-extrabold text-base" style={{ color: '#FAFAFA' }}>${item.price.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemCard({
  item,
  isSelected,
  onToggleSelect,
  onSplit,
  onSell,
  isShopMode,
  onBuy,
  isBuying,
  isClaimable,
  onClaim,
  isClaiming,
}: {
  item: CartItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSplit: (item: CartItem) => void;
  onSell: (item: CartItem) => void;
  isShopMode?: boolean;
  onBuy?: (item: CartItem) => void;
  isBuying?: boolean;
  isClaimable?: boolean;
  onClaim?: (item: CartItem) => void;
  isClaiming?: boolean;
}) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const depthForMenu = (item.productId?.startsWith('voucher:') ? Number(item.productId.split(':').pop()) || 1 : 0);
  const sellPriceLabel = `${t('sellPricePrefix')} $${item.price.toFixed(2)}`;
  const claimLabel = t('claimItem');
  const detailsLabel = t('itemDetails');
  const menuItems: string[] = depthForMenu >= 2
    ? [sellPriceLabel, detailsLabel]
    : depthForMenu === 1
    ? [sellPriceLabel,  detailsLabel]
    : [sellPriceLabel,  claimLabel, detailsLabel];

  const isBuyingState = Boolean(isBuying);
  const isClaimingState = Boolean(isClaiming);
  const actionLabel = isShopMode 
    ? (isBuyingState ? t('purchasing') : t('purchase')) 
    : (isClaimable ? (isClaimingState ? t('claiming') || t('claim') : t('claim')) : t('sell'));

  const handleCardClick = () => {
    if (isShopMode) return;
    onToggleSelect();
  };

  const handleActionClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isShopMode) {
      if (isBuyingState) return;
      onBuy?.(item);
      return;
    }
    if (isClaimable) {
      if (isClaimingState) return;
      onClaim?.(item);
      return;
    }
    onSell?.(item);
  };

  return (
    <div className="relative rounded-lg border" data-component="CartItemCard" style={{ backgroundColor: '#22272B', borderColor: isSelected ? '#4299E1' : '#22272B', borderWidth: 1, cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      onClick={handleCardClick}
    >
      {isShopMode ? null : (
        <div className="absolute right-2 top-2 shrink-0 transition-opacity duration-200" style={{ opacity: (hovered || isSelected) ? 1 : 0 }}>
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            data-state={isSelected ? 'checked' : 'unchecked'}
            value="on"
            className="peer shrink-0 rounded border size-5"
            aria-label="Select item"
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.cursor = 'pointer'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#4299E1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = isSelected ? '#4299E1' : '#5A5E62'; }}
            style={{ border: '1px solid ' + (isSelected ? '#4299E1' : (hovered ? '#4299E1' : '#5A5E62')), backgroundColor: isSelected ? '#4299E1' : 'transparent' }}
          >
            <span data-state={isSelected ? 'checked' : 'unchecked'} className="flex items-center justify-center text-current" style={{ pointerEvents: 'none' }}>
              {isSelected && (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-4 w-4 text-white">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              )}
            </span>
          </button>
        </div>
      )}
      <div className="h-32 sm:h-36">
        <div
          data-component="BaseProductCard"
          className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 ease-in-out p-3"
          style={{ boxSizing: 'border-box', backgroundColor: '#22272B' }}
        >
          <p className="font-semibold text-gray-400 h-6 text-sm"></p>
          <div className="relative flex-1 flex w-full justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px] bg-pack-none"></div>
            <img
                alt={item.name}
                src={item.image}
                style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }}
              />
          </div>
          <div className="flex flex-col w-full gap-0.5">
            <p className="font-semibold truncate max-w-full text-center text-sm" style={{ color: '#7A8084' }}>{item.name}</p>
            <div className="flex justify-center">
              <p className="font-extrabold text-sm" style={{ color: '#FAFAFA' }}>${item.price.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full px-2 pb-2 gap-2">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative text-white font-bold select-none h-9 px-6 w-full rounded-lg text-sm"
          disabled={isShopMode ? isBuyingState : (isClaimable ? isClaimingState : false)}
          style={{
            backgroundColor: '#34383C',
            cursor: isShopMode ? (isBuyingState ? 'not-allowed' : 'pointer') : (isClaimable && isClaimingState ? 'not-allowed' : 'pointer'),
            opacity: (isShopMode && isBuyingState) || (isClaimable && isClaimingState) ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if ((isShopMode && isBuyingState) || (isClaimable && isClaimingState)) return;
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62';
          }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onClick={handleActionClick}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

