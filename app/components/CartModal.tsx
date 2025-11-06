'use client';

import { useState, useEffect } from 'react';

interface CartItem {
  id: string;
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

export default function CartModal({ isOpen, onClose, totalPrice = 1.38, items = [] }: CartModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortByPrice, setSortByPrice] = useState<'asc' | 'desc'>('desc');

  // 示例数据
  const defaultItems: CartItem[] = items.length > 0 ? items : [
    {
      id: '1',
      name: 'The Crew 2 (Xbox One) Xbox Live Key UNITED STATES',
      price: 1.37,
      image: 'https://ik.imagekit.io/hr727kunx/products/cm20jrrb30001kh7qlr3mosm8_3713920__09qyVkWOX?tr=w-3840,c-at_max',
    },
    {
      id: '2',
      name: 'Voucher',
      price: 0.01,
      image: '',
    },
  ];

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

  if (!isOpen) return null;

  const displayedItems = activeTab === 'all' ? defaultItems : defaultItems.filter(item => selectedItems.has(item.id));
  const selectedCount = selectedItems.size;
  const selectedTotal = defaultItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === defaultItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(defaultItems.map(item => item.id)));
    }
  };

  const sortedItems = [...displayedItems].sort((a, b) => {
    return sortByPrice === 'asc' ? a.price - b.price : b.price - a.price;
  });

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      className="fixed px-4 inset-0 z-50 bg-black/[0.48] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-y-auto flex justify-center items-start py-16"
      style={{ pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-describedby="cart-description"
        aria-labelledby="cart-title"
        data-state={isOpen ? 'open' : 'closed'}
        className="overflow-hidden z-50 max-w-lg w-full gap-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg relative sm:max-w-4xl bg-gray-900 p-0 sm:h-auto flex flex-col h-full"
        tabIndex={-1}
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex-col gap-1.5 text-center sm:text-left border-b border-white/5 p-4 h-16 flex justify-center flex-shrink-0">
          <div className="flex">
            <h2 id="cart-title" className="text-white tracking-tight text-left text-base font-extrabold pr-3">您的购物车</h2>
            <p className="flex gap-2 items-center border-l border-white/10 pl-3">
              <span className="font-extrabold">${totalPrice.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* 移动端标签页 */}
        <div dir="ltr" data-orientation="horizontal" className="w-full sm:hidden h-full pb-4 px-4 sm:px-6">
          <div role="tablist" aria-orientation="horizontal" className="inline-flex items-center justify-center rounded-md bg-gray-700 p-1 text-muted-foreground w-full h-10 sm:h-12 text-sm sm:text-base" tabIndex={0} data-orientation="horizontal" style={{ outline: 'none' }}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              aria-controls="cart-content-all"
              data-state={activeTab === 'all' ? 'active' : 'inactive'}
              id="cart-trigger-all"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 h-full transition-all interactive-focus disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-600 text-base font-regular text-white flex-1"
              tabIndex={-1}
              data-orientation="horizontal"
              onClick={() => setActiveTab('all')}
            >
              <span className="font-extrabold">所有物品 ({defaultItems.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'selected'}
              aria-controls="cart-content-selected"
              data-state={activeTab === 'selected' ? 'active' : 'inactive'}
              id="cart-trigger-selected"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 h-full transition-all interactive-focus disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-600 text-base font-regular text-white flex-1"
              tabIndex={-1}
              data-orientation="horizontal"
              onClick={() => setActiveTab('selected')}
            >
              <span className="font-extrabold">已选择的物品 </span>
            </button>
          </div>

          {/* 移动端内容 */}
          <div
            data-state={activeTab === 'all' ? 'active' : 'inactive'}
            data-orientation="horizontal"
            role="tabpanel"
            aria-labelledby="cart-trigger-all"
            id="cart-content-all"
            tabIndex={0}
            className="h-full"
            style={{ display: activeTab === 'all' ? 'block' : 'none' }}
          >
            <div className="flex justify-between my-3 sm:my-6 gap-2 w-full flex-nowrap">
              <div className="gap-2 shrink-0 hidden sm:flex"></div>
              <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-between">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-700 text-white hover:bg-gray-600 disabled:text-gray-400 select-none h-9 px-3 font-semibold text-sm sm:h-10"
                  onClick={() => setSortByPrice(sortByPrice === 'asc' ? 'desc' : 'asc')}
                >
                  价格
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down">
                    <path d="M12 5v14"></path>
                    <path d="m19 12-7 7-7-7"></path>
                  </svg>
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-700 text-white hover:bg-gray-600 disabled:text-gray-400 select-none h-9 px-3 font-semibold text-sm group sm:h-10"
                  onClick={selectAll}
                >
                  <div className={`size-5 shrink-0 rounded border flex items-center justify-center group-hover:bg-gray-600 transition-all bg-gray-700 border-gray-500 ${selectedItems.size === defaultItems.length ? 'bg-blue-400 border-blue-400' : ''}`}>
                    {selectedItems.size === defaultItems.length && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                  全选 ({defaultItems.length})
                </button>
              </div>
            </div>
            <div className="self-stretch space-y-6 z-10">
              <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 overflow-y-auto auto-rows-max items-start" style={{ height: '375px' }}>
                {sortedItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-2 mb-4 rounded-lg flex-col sm:flex-row items-center">
              <div className="hidden sm:block">
                <div className="flex gap-1">
                  <p className="font-extrabold text-gray-400">已选择 {selectedCount} 个 ${selectedTotal.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none h-10 px-4 w-full sm:min-w-28" disabled={selectedCount === 0}>
                  出售
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-10 px-4 w-full sm:sm:min-w-28" disabled={selectedCount === 0}>
                  提款
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-10 px-4 w-full sm:sm:min-w-28" disabled={selectedCount === 0}>
                  交换
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
            className="h-full"
            style={{ display: activeTab === 'selected' ? 'block' : 'none' }}
          >
            {/* 已选择物品内容 */}
          </div>
        </div>

        {/* 桌面端内容 */}
        <div className="hidden sm:block pb-4 px-4 sm:px-6 flex-1">
          <div className="flex justify-between mt-2 mb-4 rounded-lg flex-col sm:flex-row items-center">
            <div className="hidden sm:block">
              <div className="flex gap-1">
                <p className="font-extrabold text-gray-400">已选择 {selectedCount} 个 ${selectedTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none h-10 px-4 w-full sm:min-w-28" disabled={selectedCount === 0}>
                出售
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-10 px-4 w-full sm:sm:min-w-28" disabled={selectedCount === 0}>
                提款
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-10 px-4 w-full sm:sm:min-w-28" disabled={selectedCount === 0}>
                交换
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg overflow-y-auto p-4 self-stretch h-full sm:h-auto sm:max-h-[600px] sm:min-h-[182px]">
            {defaultItems.length === 0 ? (
              <div className="flex h-full sm:h-[150px] items-center justify-center text-gray-400 font-semibold">选择物品来管理它们</div>
            ) : (
              <>
                <div className="flex justify-between my-3 sm:my-6 gap-2 w-full flex-nowrap">
                  <div className="gap-2 shrink-0 hidden sm:flex"></div>
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-between">
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-700 text-white hover:bg-gray-600 disabled:text-gray-400 select-none h-9 px-3 font-semibold text-sm sm:h-10"
                      onClick={() => setSortByPrice(sortByPrice === 'asc' ? 'desc' : 'asc')}
                    >
                      价格
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down">
                        <path d="M12 5v14"></path>
                        <path d="m19 12-7 7-7-7"></path>
                      </svg>
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-700 text-white hover:bg-gray-600 disabled:text-gray-400 select-none h-9 px-3 font-semibold text-sm group sm:h-10"
                      onClick={selectAll}
                    >
                      <div className={`size-5 shrink-0 rounded border flex items-center justify-center group-hover:bg-gray-600 transition-all bg-gray-700 border-gray-500 ${selectedItems.size === defaultItems.length ? 'bg-blue-400 border-blue-400' : ''}`}>
                        {selectedItems.size === defaultItems.length && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                        )}
                      </div>
                      全选 ({defaultItems.length})
                    </button>
                  </div>
                </div>
                <div className="self-stretch space-y-6 z-10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sortedItems.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItems.has(item.id)}
                        onToggleSelect={() => toggleSelect(item.id)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          type="button"
          className="absolute right-5 top-[18px] rounded-lg text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

function CartItemCard({ item, isSelected, onToggleSelect }: { item: CartItem; isSelected: boolean; onToggleSelect: () => void }) {
  const isVoucher = item.name === 'Voucher' || item.price === 0.01;

  return (
    <div className="relative bg-gray-700 rounded-lg border border-gray-700" data-component="CartItemCard">
      <div className="absolute top-0.5 left-2 flex gap-2 z-10">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8 hover:text-gray-300 text-gray-400"
          aria-label="Options"
          type="button"
        >
          <div className="size-5 flex justify-center">
            <svg viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.00002 2.00001C4.00002 3.10459 3.10459 4.00002 2.00001 4.00002C0.895433 4.00002 0 3.10459 0 2.00001C0 0.895433 0.895433 0 2.00001 0C3.10459 0 4.00002 0.895433 4.00002 2.00001Z" fill="currentColor"></path>
              <path d="M11 2.00001C11 3.10459 10.1046 4.00002 9.00003 4.00002C7.89545 4.00002 7.00002 3.10459 7.00002 2.00001C7.00002 0.895433 7.89545 0 9.00003 0C10.1046 0 11 0.895433 11 2.00001Z" fill="currentColor"></path>
              <path d="M18.0001 2.00001C18.0001 3.10459 17.1046 4.00002 16.0001 4.00002C14.8955 4.00002 14 3.10459 14 2.00001C14 0.895433 14.8955 0 16.0001 0C17.1046 0 18.0001 0.895433 18.0001 2.00001Z" fill="currentColor"></path>
            </svg>
          </div>
        </button>
      </div>
      <div className="absolute right-2 top-2 shrink-0 transition-opacity duration-200" style={{ opacity: isSelected ? 1 : 0 }}>
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          data-state={isSelected ? 'checked' : 'unchecked'}
          value="on"
          className="peer shrink-0 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground size-5"
          aria-label="Select item"
          onClick={onToggleSelect}
        >
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '2px' }}>
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          )}
        </button>
      </div>
      <div className="h-32 sm:h-36">
        <div
          data-component="BaseProductCard"
          className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 ease-in-out p-1.5 sm:p-3 bg-gray-700 hover:bg-gray-700"
          style={{ boxSizing: 'border-box' }}
        >
          <p className="font-semibold text-gray-400 h-6 text-[11px] sm:text-sm"></p>
          <div className="relative flex-1 flex w-full justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px] bg-pack-none"></div>
            {isVoucher ? (
              <div className="flex justify-center items-center mx-4 w-full h-full" style={{ zIndex: 1 }}>
                <div className="flex-1 relative w-full h-full">
                  <div className="absolute top-0 left-0 h-full w-full flex justify-center">
                    <div className="flex items-center justify-center w-full h-full text-gray-500 text-xs font-bold">
                      VOUCHER
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <img
                alt={item.name}
                loading="lazy"
                decoding="async"
                data-nimg="fill"
                className="pointer-events-none"
                sizes="(min-width: 0px) 100px"
                srcSet={`${item.image}?tr=w-16,c-at_max 16w, ${item.image}?tr=w-32,c-at_max 32w, ${item.image}?tr=w-48,c-at_max 48w, ${item.image}?tr=w-64,c-at_max 64w, ${item.image}?tr=w-96,c-at_max 96w, ${item.image}?tr=w-128,c-at_max 128w, ${item.image}?tr=w-256,c-at_max 256w, ${item.image}?tr=w-384,c-at_max 384w, ${item.image}?tr=w-640,c-at_max 640w, ${item.image}?tr=w-750,c-at_max 750w, ${item.image}?tr=w-828,c-at_max 828w, ${item.image}?tr=w-1080,c-at_max 1080w, ${item.image}?tr=w-1200,c-at_max 1200w, ${item.image}?tr=w-1920,c-at_max 1920w, ${item.image}?tr=w-2048,c-at_max 2048w, ${item.image}?tr=w-3840,c-at_max 3840w`}
                src={`${item.image}?tr=w-3840,c-at_max`}
                style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }}
              />
            )}
          </div>
          <div className="flex flex-col w-full gap-0.5">
            <p className="font-semibold truncate max-w-full text-gray-400 text-center text-[11px] sm:text-sm">{item.name}</p>
            <div className="flex justify-center">
              <p className="font-extrabold text-[11px] sm:text-sm">${item.price.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full px-2 pb-2 gap-2">
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-9 px-6 w-full rounded-lg text-sm">
          出售
        </button>
      </div>
    </div>
  );
}

