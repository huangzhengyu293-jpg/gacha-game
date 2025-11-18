'use client';

import DealsTopSection, { SelectedProduct } from "../components/DealsTopSection";
import DealsSearchToolbar from "../components/DealsSearchToolbar";
import DealsProductGridSection, { ProductItem } from "../components/DealsProductGridSection";
import { useState } from "react";

export interface SearchFilters {
  name: string;
  priceSort: '1' | '2'; // 1=高到低, 2=低到高
  priceMin: number;
  priceMax: number;
}

export default function DealsPage() {
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
    priceSort: '1',
    priceMin: 200,
    priceMax: 5888,
  });

  const reselectSelected = () => {
    // 重置：取消选中商品
    setSelectedProduct(null);
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <DealsTopSection selectedProduct={selectedProduct} onReselectSelectedProduct={reselectSelected} />
        <div className="mt-6">
          <DealsSearchToolbar filters={filters} onFiltersChange={setFilters} />
        </div>
        <DealsProductGridSection
          filters={filters}
          onSelectProduct={(p: ProductItem) => {
            setSelectedProduct((prev) => {
              if (prev?.id === p.id) {
                return null;
              } else {
                const originalPrice = p.originalPrice || p.price;
                const rate = p.rate || 1;
                const percentValue = 1; // 默认1%
                const displayPrice = originalPrice * rate * (percentValue / 100);
                return {
                  id: p.id,
                  name: p.name,
                  image: p.image,
                  price: displayPrice,
                  originalPrice: originalPrice,
                  rate: rate,
                  percent: percentValue,
                };
              }
            });
          }}
          selectedId={selectedProduct?.id}
        />
      </div>
    </div>
  );
}


