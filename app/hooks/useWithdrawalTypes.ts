'use client';

import { useQuery } from '@tanstack/react-query';
import { getWithdrawalTypes } from '@/api/common';
import type { WithdrawalType } from '@/types/withdrawal';

export function useWithdrawalTypes(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['withdrawalType'],
    queryFn: async () => {
      const data = await getWithdrawalTypes();
      return Array.isArray(data) ? data : [];
    },
    enabled: typeof window !== 'undefined' && enabled,
    staleTime: 5 * 60_000,
  });
}


