'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DealsLeftPanel from './DealsLeftPanel';
import DealsCenterPanel from './DealsCenterPanel';
import DealsRightPanel from './DealsRightPanel';

export interface SelectedProduct {
  id: string;
  name: string;
  image: string;
  price: number; // 显示价格（会根据百分比动态计算）
  originalPrice: number; // 商品原价
  rate: number; // 系数
  percent: number; // 1..80
  level?: number; // 道具等级，用于恭喜弹窗光晕 (1~5)
}

interface DealsTopSectionProps {
  selectedProduct?: SelectedProduct | null;
  onReselectSelectedProduct?: () => void;
  onUiLockChange?: (locked: boolean) => void;
}

export default function DealsTopSection({ selectedProduct = null, onReselectSelectedProduct, onUiLockChange }: DealsTopSectionProps) {
  const [percent, setPercent] = useState<number>(0);
  const [activeController, setActiveController] = useState<null | 'left' | 'center'>(null);
  const [uiLocked, setUiLocked] = useState<boolean>(false);

  const inactive = !selectedProduct;

  useEffect(() => {
    if (inactive) {
      setPercent(0);
      setUiLocked(true);
    } else {
      setUiLocked(false);
      // 默认百分比为1%
      const p = selectedProduct?.percent ?? 1;
      const clamped = Math.min(80, Math.max(1, p));
      setPercent(clamped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // 价格计算：百分比 × 商品原价 × 系数
  // 没选择商品时价格为0
  const spinPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    const originalPrice = selectedProduct.originalPrice || 0;
    const rate = selectedProduct.rate || 1;
    const percentValue = percent / 100; // 转换为小数（1% = 0.01）
    return originalPrice * rate * percentValue;
  }, [selectedProduct, percent]);

  function updatePercentFrom(source: 'left' | 'center', p: number) {
    if (inactive) return; // ignore updates when no product selected
    if (activeController === null || activeController === source) {
      setPercent(p);
    }
  }

  return (
    <div className="flex flex-col items-stretch self-stretch py-8">
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        <div className="w-full lg:w-[339.43px] xl:w-[339.43px] order-1 lg:order-0">
          <DealsLeftPanel
            onPercentChange={(p) => updatePercentFrom('left', p)}
            initialSlider={percent}
            onSliderInteractionStart={() => setActiveController('left')}
            onSliderInteractionEnd={() => setActiveController(null)}
            disabled={uiLocked || inactive}
            inactive={inactive}
            onReset={onReselectSelectedProduct}
            calculatedPrice={spinPrice}
          />
        </div>
        <div className="w-full lg:flex-1 xl:w-[521.14px] order-0 lg:order-1">
          <DealsCenterPanel
            percent={percent}
            onPercentChange={(p) => updatePercentFrom('center', p)}
            onDragStart={() => setActiveController('center')}
            onDragEnd={() => setActiveController(null)}
            uiLocked={uiLocked || inactive}
            onLockChange={(locked: boolean) => {
              setUiLocked(locked);
              onUiLockChange?.(locked);
            }}
            spinPrice={spinPrice}
            inactive={inactive}
            productId={selectedProduct?.id || null}
            productImage={selectedProduct?.image || null}
            productTitle={selectedProduct?.name || null}
            productPrice={spinPrice}
            productLevel={selectedProduct?.level}
          />
        </div>
        <div className="hidden lg:block lg:w-[339.44px] lg:order-2">
          <DealsRightPanel 
            percent={percent} 
            inactive={inactive} 
            product={selectedProduct ? { name: selectedProduct.name, image: selectedProduct.image, price: spinPrice } : null}
            originalPrice={selectedProduct?.originalPrice || 0}
            rate={selectedProduct?.rate || 1}
          />
        </div>
      </div>
    </div>
  );
}


