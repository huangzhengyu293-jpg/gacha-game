'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DealsLeftPanel from './DealsLeftPanel';
import DealsCenterPanel from './DealsCenterPanel';
import DealsRightPanel from './DealsRightPanel';

export interface SelectedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  percent: number; // 1..80
}

interface DealsTopSectionProps {
  selectedProduct?: SelectedProduct | null;
  onReselectSelectedProduct?: () => void;
}

export default function DealsTopSection({ selectedProduct = null, onReselectSelectedProduct }: DealsTopSectionProps) {
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
      const p = Number((selectedProduct.percent ?? 0).toFixed(2));
      const clamped = Math.min(80, Math.max(1, p));
      setPercent(clamped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  const spinPrice = useMemo(() => 3780 * percent, [percent]);

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
          />
        </div>
        <div className="w-full lg:flex-1 xl:w-[521.14px] order-0 lg:order-1">
          <DealsCenterPanel
            percent={percent}
            onPercentChange={(p) => updatePercentFrom('center', p)}
            onDragStart={() => setActiveController('center')}
            onDragEnd={() => setActiveController(null)}
            uiLocked={uiLocked || inactive}
            onLockChange={(locked: boolean) => setUiLocked(locked)}
            spinPrice={spinPrice}
            inactive={inactive}
            productId={selectedProduct?.id || null}
            productImage={selectedProduct?.image || null}
            productTitle={selectedProduct?.name || null}
            productPrice={selectedProduct?.price ?? null}
          />
        </div>
        <div className="hidden lg:block lg:w-[339.44px] lg:order-2">
          <DealsRightPanel percent={percent} inactive={inactive} product={selectedProduct ? { name: selectedProduct.name, image: selectedProduct.image, price: selectedProduct.price } : null} />
        </div>
      </div>
    </div>
  );
}


