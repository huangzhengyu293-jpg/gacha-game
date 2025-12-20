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

        const warehouseId = String(item.id ?? item.awards_id ?? item.awards?.id ?? `cart_${index}`);
        const productId = String(item.awards?.id ?? item.product_id ?? warehouseId);
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

