'use client';

import DealsTopSection, { SelectedProduct } from "../components/DealsTopSection";
import DealsSearchToolbar from "../components/DealsSearchToolbar";
import DealsProductGridSection, { ProductItem } from "../components/DealsProductGridSection";
import { useState } from "react";
export default function DealsPage() {
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const reselectSelected = () => {
    if (!selectedProduct) return;
    const p = selectedProduct;
    setSelectedProduct({ id: p.id, name: p.name, image: p.image, price: p.price, percent: p.percent });
  };
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <DealsTopSection selectedProduct={selectedProduct} onReselectSelectedProduct={reselectSelected} />
        <div className="mt-6">
          <DealsSearchToolbar />
        </div>
        <DealsProductGridSection
          onSelectProduct={(p: ProductItem) =>
            setSelectedProduct((prev) => (prev?.id === p.id ? null : { id: p.id, name: p.name, image: p.image, price: p.price, percent: p.percent }))
          }
          selectedId={selectedProduct?.id}
        />
      </div>
    </div>
  );
}


