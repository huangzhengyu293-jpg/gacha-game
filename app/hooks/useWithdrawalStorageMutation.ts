'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postWithdrawalStorage, type WithdrawalStoragePayload } from '@/api/user';

export function useWithdrawalStorageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: WithdrawalStoragePayload) => {
      if (!payload?.id) throw new Error('Missing withdrawal type id');
      const safeIds = Array.isArray(payload.storageIds) ? payload.storageIds.filter(Boolean) : [];
      if (safeIds.length === 0) throw new Error('Missing storage ids');
      if (!payload.walletAddress) throw new Error('Missing wallet address');
      return postWithdrawalStorage({ ...payload, storageIds: safeIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStorage'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}


