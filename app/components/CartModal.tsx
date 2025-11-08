'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { api, type WarehouseItem } from '../lib/api';

interface CartItem {
  id: string; // expanded id e.g. wh_xxx#0
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

function buildVoucherSvg(price: number): string {
  const amount = `$${price.toFixed(2)}`;
  const uid = Math.random().toString(36).slice(2, 10);
  const id1 = `maskA_${uid}`;
  const id2 = `maskB_${uid}`;
  return `
<svg viewBox="0 0 551 491" fill="none" xmlns="http://www.w3.org/2000/svg">
  <mask id="${id1}" fill="white">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M529.671 176.803L189.949 23.8117C184.732 35.3593 171.215 40.5469 159.665 35.4687L156.89 41.6294C159.808 43.0379 161.088 46.5234 159.75 49.4952C158.411 52.467 154.953 53.8182 151.965 52.5671L148.678 59.8655C151.595 61.274 152.876 64.7594 151.537 67.7313C150.199 70.7031 146.74 72.0543 143.752 70.8032L140.465 78.1015C143.386 79.5033 144.757 82.7873 143.53 85.5115C142.303 88.2356 138.935 89.3853 135.95 88.1277L132.663 95.4259C135.581 96.8344 136.861 100.32 135.523 103.292C134.185 106.263 130.726 107.615 127.738 106.364L124.451 113.662C127.368 115.07 128.649 118.556 127.311 121.528C125.972 124.5 122.514 125.851 119.525 124.6L116.239 131.898C119.156 133.307 120.436 136.792 119.098 139.764C117.76 142.736 114.301 144.087 111.313 142.836L108.026 150.134C110.946 151.536 112.318 154.82 111.091 157.544C109.864 160.268 106.496 161.418 103.511 160.16L100.224 167.459C103.142 168.867 104.422 172.352 103.084 175.324C101.745 178.296 98.2868 179.647 95.2985 178.396L92.4596 184.7C103.926 189.987 108.999 203.564 103.791 215.13C103.767 215.183 103.742 215.237 103.718 215.29L443.44 368.282C443.464 368.228 443.488 368.174 443.512 368.12C448.688 356.627 462.082 351.42 473.593 356.344L476.433 350.037C476.383 350.016 476.333 349.994 476.284 349.972C473.262 348.611 471.916 345.059 473.277 342.037C474.637 339.016 478.19 337.67 481.211 339.03C481.261 339.053 481.31 339.076 481.359 339.099L484.645 331.801C484.609 331.785 484.572 331.77 484.535 331.753L484.496 331.736C481.475 330.375 480.036 327.027 481.284 324.257C482.531 321.488 485.991 320.345 489.013 321.706C489.063 321.728 489.112 321.751 489.161 321.775L492.447 314.476C492.397 314.456 492.348 314.434 492.298 314.412C489.276 313.051 487.93 309.499 489.291 306.477C490.652 303.456 494.204 302.109 497.225 303.47C497.247 303.48 497.269 303.49 497.29 303.5C497.318 303.512 497.345 303.526 497.373 303.539L500.66 296.24C500.61 296.22 500.56 296.198 500.51 296.176C497.489 294.815 496.143 291.262 497.503 288.241C498.864 285.22 502.416 283.873 505.438 285.234C505.487 285.256 505.537 285.279 505.585 285.303L508.872 278.004C508.843 277.992 508.814 277.98 508.785 277.967C508.764 277.958 508.744 277.949 508.723 277.939C505.701 276.579 504.355 273.026 505.716 270.005C507.076 266.983 510.629 265.637 513.65 266.998C513.7 267.02 513.749 267.043 513.798 267.067L517.085 259.768C517.035 259.747 516.985 259.726 516.935 259.703C513.914 258.343 512.476 254.994 513.723 252.225C514.97 249.455 518.431 248.313 521.452 249.673C521.482 249.687 521.512 249.701 521.542 249.715C521.561 249.724 521.581 249.733 521.6 249.742L524.886 242.444C524.837 242.423 524.787 242.401 524.737 242.379C521.716 241.018 520.369 237.466 521.73 234.444C523.091 231.423 526.643 230.077 529.665 231.437C529.696 231.451 529.726 231.465 529.757 231.48L529.784 231.493L529.812 231.506L533.099 224.208C533.049 224.187 532.999 224.165 532.95 224.143C529.928 222.782 528.582 219.23 529.943 216.208C531.303 213.187 534.856 211.841 537.877 213.201C537.927 213.224 537.976 213.247 538.025 213.27L540.8 207.106C529.493 201.754 524.514 188.291 529.671 176.803Z"></path>
  </mask>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M529.671 176.803L189.949 23.8117C184.732 35.3593 171.215 40.5469 159.665 35.4687L156.89 41.6294C159.808 43.0379 161.088 46.5234 159.75 49.4952C158.411 52.467 154.953 53.8182 151.965 52.5671L148.678 59.8655C151.595 61.274 152.876 64.7594 151.537 67.7313C150.199 70.7031 146.74 72.0543 143.752 70.8032L140.465 78.1015C143.386 79.5033 144.757 82.7873 143.53 85.5115C142.303 88.2356 138.935 89.3853 135.95 88.1277L132.663 95.4259C135.581 96.8344 136.861 100.32 135.523 103.292C134.185 106.263 130.726 107.615 127.738 106.364L124.451 113.662C127.368 115.07 128.649 118.556 127.311 121.528C125.972 124.5 122.514 125.851 119.525 124.6L116.239 131.898C119.156 133.307 120.436 136.792 119.098 139.764C117.76 142.736 114.301 144.087 111.313 142.836L108.026 150.134C110.946 151.536 112.318 154.82 111.091 157.544C109.864 160.268 106.496 161.418 103.511 160.16L100.224 167.459C103.142 168.867 104.422 172.352 103.084 175.324C101.745 178.296 98.2868 179.647 95.2985 178.396L92.4596 184.7C103.926 189.987 108.999 203.564 103.791 215.13C103.767 215.183 103.742 215.237 103.718 215.29L443.44 368.282C443.464 368.228 443.488 368.174 443.512 368.12C448.688 356.627 462.082 351.42 473.593 356.344L476.433 350.037C476.383 350.016 476.333 349.994 476.284 349.972C473.262 348.611 471.916 345.059 473.277 342.037C474.637 339.016 478.19 337.67 481.211 339.03C481.261 339.053 481.31 339.076 481.359 339.099L484.645 331.801C484.609 331.785 484.572 331.77 484.535 331.753L484.496 331.736C481.475 330.375 480.036 327.027 481.284 324.257C482.531 321.488 485.991 320.345 489.013 321.706C489.063 321.728 489.112 321.751 489.161 321.775L492.447 314.476C492.397 314.456 492.348 314.434 492.298 314.412C489.276 313.051 487.93 309.499 489.291 306.477C490.652 303.456 494.204 302.109 497.225 303.47C497.247 303.48 497.269 303.49 497.29 303.5C497.318 303.512 497.345 303.526 497.373 303.539L500.66 296.24C500.61 296.22 500.56 296.198 500.51 296.176C497.489 294.815 496.143 291.262 497.503 288.241C498.864 285.22 502.416 283.873 505.438 285.234C505.487 285.256 505.537 285.279 505.585 285.303L508.872 278.004C508.843 277.992 508.814 277.98 508.785 277.967C508.764 277.958 508.744 277.949 508.723 277.939C505.701 276.579 504.355 273.026 505.716 270.005C507.076 266.983 510.629 265.637 513.65 266.998C513.7 267.02 513.749 267.043 513.798 267.067L517.085 259.768C517.035 259.747 516.985 259.726 516.935 259.703C513.914 258.343 512.476 254.994 513.723 252.225C514.97 249.455 518.431 248.313 521.452 249.673C521.482 249.687 521.512 249.701 521.542 249.715C521.561 249.724 521.581 249.733 521.6 249.742L524.886 242.444C524.837 242.423 524.787 242.401 524.737 242.379C521.716 241.018 520.369 237.466 521.73 234.444C523.091 231.423 526.643 230.077 529.665 231.437C529.696 231.451 529.726 231.465 529.757 231.48L529.784 231.493L529.812 231.506L533.099 224.208C533.049 224.187 532.999 224.165 532.95 224.143C529.928 222.782 528.582 219.23 529.943 216.208C531.303 213.187 534.856 211.841 537.877 213.201C537.927 213.224 537.976 213.247 538.025 213.27L540.8 207.106C529.493 201.754 524.514 188.291 529.671 176.803Z" fill="#64A061"></path>
  <text transform="translate(513.242 200.112) rotate(114.244)" fill="white" fill-opacity="0.4" xml:space="preserve" font-family="Urbanist" font-size="25" font-weight="600" letter-spacing="5px" style="white-space: pre;"><tspan x="10.8403" y="31.25">0000000</tspan></text>
  <text transform="translate(183.094 51.2344) rotate(24.244)" fill="white" fill-opacity="0.4" xml:space="preserve" font-family="Urbanist" font-size="60" font-weight="900" letter-spacing="0px" style="white-space: pre;"><tspan x="16.9004" y="98">PackDraw</tspan></text>
  <mask id="${id2}" fill="white">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M446.766 275.262L107.044 122.272C101.827 133.819 88.3101 139.007 76.7599 133.929L73.912 140.253C76.9335 141.613 78.2798 145.166 76.9191 148.187C75.5584 151.209 72.006 152.555 68.9845 151.194L65.6995 158.489C68.721 159.849 70.0673 163.402 68.7066 166.423C67.3459 169.445 63.7935 170.791 60.772 169.43L57.4871 176.725C60.5085 178.085 61.9467 181.434 60.6995 184.203C59.4522 186.973 55.9916 188.115 52.9702 186.755L49.6852 194.049C52.7067 195.41 54.053 198.962 52.6923 201.984C51.3316 205.005 47.7792 206.351 44.7577 204.991L41.4727 212.285C44.4942 213.646 45.8405 217.198 44.4798 220.22C43.1191 223.241 39.5667 224.588 36.5452 223.227L33.2603 230.521C36.2817 231.882 37.628 235.434 36.2673 238.456C34.9067 241.477 31.3542 242.824 28.3328 241.463L25.0478 248.757C28.0692 250.118 29.5075 253.466 28.2602 256.236C27.0129 259.006 23.5524 260.148 20.5309 258.787L17.2459 266.082C20.2674 267.442 21.6137 270.995 20.253 274.016C18.8923 277.038 15.3399 278.384 12.3184 277.023L9.55478 283.16C21.0211 288.447 26.0945 302.024 20.886 313.59C20.8618 313.643 20.8374 313.697 20.8128 313.75L360.536 466.742C360.559 466.688 360.583 466.634 360.608 466.58C365.784 455.087 379.177 449.88 390.688 454.804L393.453 448.664C390.431 447.303 389.085 443.751 390.446 440.729C391.807 437.708 395.359 436.362 398.38 437.722L401.665 430.428C398.644 429.067 397.206 425.719 398.453 422.949C399.7 420.18 403.161 419.037 406.182 420.398L409.467 413.104C406.446 411.743 405.099 408.191 406.46 405.169C407.821 402.148 411.373 400.801 414.395 402.162L417.68 394.868C414.658 393.507 413.312 389.954 414.673 386.933C416.033 383.912 419.586 382.565 422.607 383.926L425.892 376.631C422.871 375.271 421.524 371.718 422.885 368.697C424.246 365.675 427.798 364.329 430.82 365.69L434.105 358.395C431.083 357.035 429.645 353.686 430.892 350.917C432.14 348.147 435.6 347.005 438.622 348.365L441.906 341.071C438.885 339.71 437.539 336.158 438.899 333.136C440.26 330.115 443.813 328.769 446.834 330.129L450.119 322.835C447.098 321.474 445.751 317.922 447.112 314.9C448.473 311.879 452.025 310.533 455.046 311.893L457.896 305.566C446.588 300.214 441.609 286.751 446.766 275.262Z"></path>
  </mask>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M108.47 153.622L422.131 294.877C426.663 296.918 428.683 302.246 426.642 306.778L370.797 430.784C368.756 435.316 363.427 437.336 358.895 435.295L326.07 420.512L389.306 280.094L385.659 278.452L322.423 418.87L45.234 294.04C40.7018 291.999 38.6823 286.67 40.7233 282.138L96.5681 158.133C98.6092 153.6 103.938 151.581 108.47 153.622ZM92.9209 156.49C95.8691 149.944 103.566 147.027 110.112 149.975L423.773 291.229C430.32 294.178 433.237 301.874 430.289 308.421L374.444 432.426C371.496 438.973 363.799 441.89 357.252 438.942L43.5915 297.687C37.045 294.739 34.128 287.042 37.0761 280.496L92.9209 156.49Z" fill="black" fill-opacity="0.1"></path>
  <text transform="translate(430.337 298.572) rotate(114.244)" fill="white" fill-opacity="0.4" xml:space="preserve" font-family="Urbanist" font-size="25" font-weight="600" letter-spacing="2px" style="white-space: pre;"><tspan x="13.5049" y="31.25">VOUCHER</tspan></text>
  <text transform="translate(100.264 149.926) rotate(24.244)" fill="white" xml:space="preserve" font-family="Urbanist" font-size="124" font-weight="900" letter-spacing="0.1px" style="white-space: pre;"><tspan x="160" y="90.4" dominant-baseline="middle" text-anchor="middle">${amount}</tspan></text>
</svg>`;
}

export default function CartModal({ isOpen, onClose, totalPrice = 1.38, items = [] }: CartModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortByPrice, setSortByPrice] = useState<'asc' | 'desc'>('desc');

  // 仓库数据（作为购物车弹窗展示的数据源）
  const { data: warehouse = [], isLoading: warehouseLoading } = useQuery({
    queryKey: ['warehouse'],
    queryFn: api.getUserWarehouse,
    staleTime: 0,
  });

  // 将仓库项展开（按 quantity 次数展开为多件），若外部未传入 items 则使用仓库数据
  const expandedWarehouseItems: CartItem[] = (warehouse as WarehouseItem[]).flatMap((w) => {
    const qty = Math.max(1, Number((w as WarehouseItem).quantity ?? 1));
    const unit: CartItem = { id: String((w as WarehouseItem).id), productId: String((w as WarehouseItem).productId ?? ''), name: String((w as WarehouseItem).name ?? ''), price: Number((w as WarehouseItem).price ?? 0), image: String((w as WarehouseItem).image ?? '') };
    return Array.from({ length: qty }, (_, i) => ({ ...unit, id: `${unit.id}#${i}` }));
  });

  const defaultItems: CartItem[] = items.length > 0 ? items : expandedWarehouseItems;

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

  const [selectionOrder, setSelectionOrder] = useState([] as string[]);
  const [claimableActive, setClaimableActive] = useState(false);
  const queryClient = useQueryClient();
  const displayedItems = activeTab === 'all' ? defaultItems : defaultItems.filter(item => selectedItems.has(item.id));
  const selectedCount = selectedItems.size;
  const selectedTotal = defaultItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);
  const cartTotal = defaultItems.reduce((sum, item) => sum + item.price, 0);

  function getDepthFromProductId(productId: string): number {
    if (!productId?.startsWith('voucher:')) return 0;
    const parts = productId.split(':');
    const depthStr = parts[parts.length - 1];
    const d = Number(depthStr);
    return Number.isFinite(d) ? d : 1;
  }

  function getSourceProductId(productId: string): string {
    if (!productId?.startsWith('voucher:')) return productId;
    const parts = productId.split(':');
    return parts[1] ?? productId;
  }

  function toCents(v: number) { return Math.round(v * 100); }
  function fromCents(c: number) { return Math.max(0.01, Math.round(c) / 100); }

  const splitMutation = useMutation({
    mutationFn: async (item: CartItem) => {
      const warehouseId = item.id.split('#')[0];
      const base = await api.getUserWarehouseItem(warehouseId);
      const depth = getDepthFromProductId(item.productId);
      if (depth >= 2) return;
      const sourceProductId = getSourceProductId(item.productId || base.productId);
      const denomCents = Math.floor(toCents(item.price) / 2);
      const denom = fromCents(denomCents);
      const newVoucherKey = `voucher:${sourceProductId}:${denomCents}:${depth + 1}`;

      // decrement one from original stack
      const nextQty = Math.max(0, (base.quantity ?? 1) - 1);
      await api.updateUserWarehouseItem(base.id, { quantity: nextQty });

      // add two vouchers (merged by productId)
      await api.addUserWarehouseItems([
        {
          productId: newVoucherKey,
          name: 'Voucher',
          image: '',
          price: denom,
          quantity: 2,
        },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // 确认出售弹窗状态
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const [confirmGain, setConfirmGain] = useState(0);
  const [confirmPayload, setConfirmPayload] = useState<Array<{ id: string; count: number }>>([]);

  const confirmSellMutation = useMutation({
    mutationFn: async (payload: Array<{ id: string; count: number }>) => {
      if (!payload.length) return;
      await api.sellUserWarehouseItems(payload);
    },
    onSuccess: () => {
      setSelectedItems(new Set());
      setSelectionOrder([]);
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onSettled: () => {
      setConfirmOpen(false);
    },
  });

  const buildSelectedSellPayload = (): Array<{ id: string; count: number }> => {
    const counts = new Map<string, number>();
    for (const id of selectedItems) {
      const baseId = id.split('#')[0];
      counts.set(baseId, (counts.get(baseId) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([id, count]) => ({ id, count }));
  };

  const openConfirmForSelected = () => {
    if (selectedCount === 0) return;
    const payload = buildSelectedSellPayload();
    setConfirmPayload(payload);
    setConfirmCount(selectedCount);
    setConfirmGain(selectedTotal);
    setConfirmOpen(true);
  };

  const openConfirmForSingle = (item: CartItem) => {
    const warehouseId = item.id.split('#')[0];
    setConfirmPayload([{ id: warehouseId, count: 1 }]);
    setConfirmCount(1);
    setConfirmGain(item.price);
    setConfirmOpen(true);
  };

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
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
    if (selectedItems.size === defaultItems.length) {
      setSelectedItems(new Set());
      setSelectionOrder([]);
    } else {
      const allIds = defaultItems.map(item => item.id);
      setSelectedItems(new Set(allIds));
      setSelectionOrder(allIds);
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
        className="overflow-hidden z-50 max-w-lg w-full gap-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg relative sm:max-w-4xl p-0 sm:h-auto flex flex-col h-full"
        tabIndex={-1}
        style={{ pointerEvents: 'auto', backgroundColor: '#161A1D' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex-col gap-1.5 text-center sm:text-left p-4 h-16 flex justify-center flex-shrink-0" style={{ borderBottom: '1px solid #2E3134' }}>
          <div className="flex">
            <h2 id="cart-title" className="tracking-tight text-left text-base font-extrabold pr-3" style={{ color: '#FEFEFE' }}>您的购物车</h2>
            <p className="flex gap-2 items-center pl-3" style={{ borderLeft: '1px solid #2E3134' }}>
              <span className="font-extrabold" style={{ color: '#FEFEFE' }}>${cartTotal.toFixed(2)}</span>
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
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 h-full transition-all interactive-focus disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-600 text-base font-regular text白 flex-1"
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
              <div className="gap-2 shrink-0 hidden sm:flex">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm sm:h-10"
                  style={{ backgroundColor: '#161A1D', color: '#FFFFFF', border: '1px solid #45484A' }}
                  type="button"
                >
                  可认领物品
                </button>
              </div>
              <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-between">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm sm:h-10"
                  style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                  onClick={() => setSortByPrice(sortByPrice === 'asc' ? 'desc' : 'asc')}
                  type="button"
                >
                  价格
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down">
                    <path d="M12 5v14"></path>
                    <path d="m19 12-7 7-7-7"></path>
                  </svg>
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm group sm:h-10"
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
                  {(selectedItems.size === defaultItems.length && defaultItems.length > 0) ? '取消全选' : `全选 (${defaultItems.length})`}
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
                    onSplit={splitMutation.mutate}
                    onSell={(it) => openConfirmForSingle(it)}
                  />
                ))}
              </div>
            </div>
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
                  <p className="font-extrabold" style={{ color: selectedCount > 0 ? '#FFFFFF' : '#7A8084' }}>已选择 {selectedCount} 个 ${selectedTotal.toFixed(2)}</p>
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
                  出售
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: selectedCount === 0 ? '#7A8084' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                  disabled={selectedCount === 0}
                  onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                >
                  提款
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                  style={{ backgroundColor: '#34383C', color: selectedCount === 0 ? '#7A8084' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                  disabled={selectedCount === 0}
                  onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                  onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
                >
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
                <p className="font-extrabold" style={{ color: selectedCount > 0 ? '#FFFFFF' : '#7A8084' }}>已选择 {selectedCount} 个 ${selectedTotal.toFixed(2)}</p>
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
                出售
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                style={{ backgroundColor: '#34383C', color: selectedCount === 0 ? '#7A8084' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                disabled={selectedCount === 0}
                onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
              >
                提款
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative select-none h-10 px-4 w-full sm:sm:min-w-28 font-bold"
                style={{ backgroundColor: '#34383C', color: selectedCount === 0 ? '#7A8084' : '#FFFFFF', cursor: selectedCount === 0 ? 'default' : 'pointer' }}
                disabled={selectedCount === 0}
                onMouseEnter={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
                onMouseLeave={(e) => { if (selectedCount > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
              >
                交换
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg overflow-y-auto p-4 self-stretch h-full sm:h-auto sm:max-h-[600px] sm:min-h-[182px]" style={{ backgroundColor: '#1D2125' }}>
            {warehouseLoading && items.length === 0 ? (
              <div className="flex h-full sm:h-[150px] items-center justify-center font-semibold" style={{ color: '#7A8084' }}>正在加载仓库...</div>
            ) : selectedCount === 0 ? (
              <div className="flex h-full sm:h-[150px] items-center justify-center font-semibold" style={{ color: '#7A8084' }}>选择物品来管理它们</div>
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
                        {(it.productId?.startsWith('voucher:') || it.name === 'Voucher' || it.price === 0.01) ? (
                          <div className="flex justify-center items-center mx-4 w-full h-full" style={{ zIndex: 1 }}>
                            <div className="flex-1 relative w-full h-full">
                              <div className="absolute top-0 left-0 h-full w-full flex justify-center" dangerouslySetInnerHTML={{ __html: buildVoucherSvg(it.price) }}></div>
                            </div>
                          </div>
                        ) : (
                          <img
                            alt={it.name}
                            loading="lazy"
                            decoding="async"
                            data-nimg="fill"
                            className="pointer-events-none"
                            sizes="(min-width: 0px) 100px"
                            srcSet={`${it.image}?tr=w-16,c-at_max 16w, ${it.image}?tr=w-32,c-at_max 32w, ${it.image}?tr=w-48,c-at_max 48w, ${it.image}?tr=w-64,c-at_max 64w, ${it.image}?tr=w-96,c-at_max 96w, ${it.image}?tr=w-128,c-at_max 128w, ${it.image}?tr=w-256,c-at_max 256w, ${it.image}?tr=w-384,c-at_max 384w, ${it.image}?tr=w-640,c-at_max 640w, ${it.image}?tr=w-750,c-at_max 750w, ${it.image}?tr=w-828,c-at_max 828w, ${it.image}?tr=w-1080,c-at_max 1080w, ${it.image}?tr=w-1200,c-at_max 1200w, ${it.image}?tr=w-1920,c-at_max 1920w, ${it.image}?tr=w-2048,c-at_max 2048w, ${it.image}?tr=w-3840,c-at_max 3840w`}
                            src={`${it.image}?tr=w-3840,c-at_max`}
                            style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent', zIndex: 1 }}
                          />
                        )}
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
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm sm:h-10"
                style={{ backgroundColor: '#161A1D', color: '#FFFFFF', border: `1px solid ${claimableActive ? '#4299E1' : '#45484A'}`, cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3C4044'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#161A1D'; }}
                onClick={() => setClaimableActive(!claimableActive)}
                type="button"
              >
                可认领物品
              </button>
            </div>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-between p-2">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm sm:h-10"
                style={{ backgroundColor: '#22272B', color: '#FFFFFF' }}
                onClick={() => setSortByPrice(sortByPrice === 'asc' ? 'desc' : 'asc')}
                type="button"
              >
                价格
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down">
                  <path d="M12 5v14"></path>
                  <path d="m19 12-7 7-7-7"></path>
                </svg>
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative h-9 px-3 font-semibold text-sm group sm:h-10"
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
                {(selectedItems.size === defaultItems.length && defaultItems.length > 0) ? '取消全选' : `全选 (${defaultItems.length})`}
              </button>
            </div>
          </div>
          {/* 仓库商品网格（在工具条下面） */}
          {(!warehouseLoading && defaultItems.length > 0) && (
            <div className="self-stretch space-y-6 z-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sortedItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onSplit={splitMutation.mutate}
                    onSell={(it) => openConfirmForSingle(it)}
                  />
                ))}
              </div>
            </div>
          )}
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
                  出售 {confirmCount} 个物品
                </h2>
              </div>
              <div className="flex flex-col items-start gap-4 py-2" id="sell-confirm-desc">
                <p>您的余额将增加 ${confirmGain.toFixed(2)}</p>
                <div className="flex flex-col items-start gap-4 rounded-lg p-4" style={{ border: '1px solid #161A1D', backgroundColor: '#161A1D' }}>
                  <p className="font-bold">请注意</p>
                  <p className="text-sm">一旦您出售物品，它将无法恢复。请确保您想要出售这些物品，然后再继续。</p>
                  <p className="text-sm">您的余额将在销售完成后立即入账。</p>
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
                  取消
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6"
                  onClick={() => { if (!confirmSellMutation.isPending) confirmSellMutation.mutate(confirmPayload); }}
                  disabled={confirmSellMutation.isPending}
                  style={{ backgroundColor: '#4299E1', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  继续
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
      </div>
    </div>
  );
}

function CartItemCard({ item, isSelected, onToggleSelect, onSplit, onSell }: { item: CartItem; isSelected: boolean; onToggleSelect: () => void; onSplit: (item: CartItem) => void; onSell: (item: CartItem) => void }) {
  const isVoucher = item.productId?.startsWith('voucher:') || item.name === 'Voucher' || item.price === 0.01;
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const depthForMenu = (item.productId?.startsWith('voucher:') ? Number(item.productId.split(':').pop()) || 1 : 0);
  const menuItems: string[] = depthForMenu >= 2
    ? ['出售价格 $' + item.price.toFixed(2), '物品详情']
    : depthForMenu === 1
    ? ['出售价格 $' + item.price.toFixed(2), '分成 2 份', '物品详情']
    : ['出售价格 $' + item.price.toFixed(2), '分成 2 份', '领取物品', '物品详情'];

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  return (
    <div className="relative rounded-lg border" data-component="CartItemCard" style={{ backgroundColor: '#22272B', borderColor: isSelected ? '#4299E1' : '#22272B', borderWidth: 1, cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      onClick={onToggleSelect}
    >
      <div className="absolute top-0.5 left-2 flex gap-2 z-10">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
          aria-label="Options"
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          ref={triggerRef}
          style={{ color: '#7A8084', cursor: 'pointer' }}
        >
          <div className="size-5 flex justify-center">
            <svg viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.00002 2.00001C4.00002 3.10459 3.10459 4.00002 2.00001 4.00002C0.895433 4.00002 0 3.10459 0 2.00001C0 0.895433 0.895433 0 2.00001 0C3.10459 0 4.00002 0.895433 4.00002 2.00001Z" fill="currentColor"></path>
              <path d="M11 2.00001C11 3.10459 10.1046 4.00002 9.00003 4.00002C7.89545 4.00002 7.00002 3.10459 7.00002 2.00001C7.00002 0.895433 7.89545 0 9.00003 0C10.1046 0 11 0.895433 11 2.00001Z" fill="currentColor"></path>
              <path d="M18.0001 2.00001C18.0001 3.10459 17.1046 4.00002 16.0001 4.00002C14.8955 4.00002 14 3.10459 14 2.00001C14 0.895433 14.8955 0 16.0001 0C17.1046 0 18.0001 0.895433 18.0001 2.00001Z" fill="currentColor"></path>
            </svg>
          </div>
        </button>
        {menuOpen && (
          <div ref={menuRef} style={{ position: 'absolute', left: 0, top: 28, zIndex: 50 }}>
            <div role="menu" aria-orientation="vertical" className="z-50 w-40 rounded-lg p-1 shadow-md" style={{ backgroundColor: '#1D2125', color: '#7A8084', fontFamily: 'Urbanist, sans-serif', fontWeight: 600 }}>
              {menuItems.map((label: string) => (
                <div key={label}
                  role="menuitem"
                  className="relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (label.includes('分成')) { onSplit(item); setMenuOpen(false); return; }
                    // 其他项待接入：出售价格/领取物品/物品详情
                    setMenuOpen(false);
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#3C4044'; (e.currentTarget as HTMLDivElement).style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = '#7A8084'; }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
      <div className="h-32 sm:h-36">
        <div
          data-component="BaseProductCard"
          className="group flex flex-col w-full h-full items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 ease-in-out p-3"
          style={{ boxSizing: 'border-box', backgroundColor: '#22272B' }}
        >
          <p className="font-semibold text-gray-400 h-6 text-sm"></p>
          <div className="relative flex-1 flex w-full justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 md:group-hover:opacity-90 filter blur-[25px] bg-pack-none"></div>
            {isVoucher ? (
              <div className="flex justify-center items-center mx-4 w-full h-full" style={{ zIndex: 1 }}>
                <div className="flex-1 relative w-full h-full">
                  <div className="absolute top-0 left-0 h-full w-full flex justify-center" dangerouslySetInnerHTML={{ __html: buildVoucherSvg(item.price) }}></div>
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
          style={{ backgroundColor: '#34383C', cursor: 'pointer' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onClick={(e) => { e.stopPropagation(); onSell(item); }}
        >
          出售
        </button>
      </div>
    </div>
  );
}

