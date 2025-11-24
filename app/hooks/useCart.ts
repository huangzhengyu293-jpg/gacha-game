'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  selected?: boolean;
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

export function useCart() {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userStorage'],
    queryFn: async () => {
      const response = await api.getUserStorage();
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
        if (item.awards) {
          items.push({
            id: `cart_${index}`,
            productId: `product_${index}`,
            name: item.awards.name || '',
            price: Number(item.awards.bean) || 0,
            image: item.awards.cover || '',
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
    count: cartItems.length,
  };
}

