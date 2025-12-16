'use client';

import { useQuery } from '@tanstack/react-query';
import { getRechargeLog } from '@/api/user';

export function useRechargeLog(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['rechargeLog'],
    queryFn: () => getRechargeLog(),
    enabled: typeof window !== 'undefined' && enabled,
    staleTime: 30_000,
  });
}


