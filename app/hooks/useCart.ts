'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export interface CartItem {
  id: string;
  warehouseId: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  selected?: boolean;
  quantity?: number;
}

export interface StorageItem {
  awards: {
    bean: number;
    name: string;
    cover: string;
    [key: string]: any;
  };
  [key: string]: any;
}

function toStringSafe(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function pickWarehouseId(raw: StorageItem, index: number): string {
  // 不同接口/不同 from 参数可能会返回不同字段名，这里尽量挑真正的“仓库条目 id”
  // 常见：storage_id / storageId / id；兜底再用 awards_id 等
  const candidate =
    raw?.storage_id ??
    raw?.storageId ??
    raw?.storageID ??
    raw?.user_storage_id ??
    raw?.userStorageId ??
    raw?.id ??
    raw?.sid ??
    raw?.awards_id ??
    raw?.awardsId ??
    raw?.box_id ??
    raw?.boxId ??
    raw?.data_id ??
    raw?.dataId ??
    raw?.awards?.storage_id ??
    raw?.awards?.id;

  const str = toStringSafe(candidate).trim();
  if (str) return str;

  // 最终兜底：保证至少有稳定的字符串，避免 undefined 导致 key 抖动
  return `cart_${index}`;
}

export function useCart(priceSort?: 'asc' | 'desc', from?: string) {
  const { isAuthenticated, user } = useAuth();
  const loginKey = typeof user?.loginTime === 'string' && user.loginTime ? user.loginTime : 'guest';
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userStorage', loginKey, priceSort ?? 'none', from ?? 'none'],
    queryFn: async () => {
      const response = await api.getUserStorage(0, priceSort, from);
      return response;
    },
    enabled: typeof window !== 'undefined' && isAuthenticated,
    staleTime: 30_000,
  });

  // 转换数据格式：从 data.data 数组中提取 awards
  const cartItems: CartItem[] = useMemo(() => {
    const items: CartItem[] = [];
    if (data?.code === 100000 && Array.isArray(data.data?.data)) {
      data.data.data.forEach((item: StorageItem, index: number) => {
        if (!item.awards) return;

        const warehouseId = pickWarehouseId(item, index);
        const productId = toStringSafe(item.awards?.id ?? item.product_id ?? item.productId ?? warehouseId);
        const name = item.awards.name || '';
        const price = Number(item.bean ?? item.awards.bean) || 0;
        const image = item.awards.cover || '';
        const quantity = Math.max(1, Number(item.num ?? item.quantity ?? 1));

        for (let i = 0; i < quantity; i += 1) {
          items.push({
            id: quantity > 1 ? `${warehouseId}#${i}` : warehouseId,
            warehouseId,
            productId,
            name,
            price,
            image,
            quantity,
          });
        }
      });
    }
    return items;
  }, [data]);

  return {
    cartItems,
    isLoading,
    error,
    refetch,
    count: data?.data?.total ?? 0,
  };
}

