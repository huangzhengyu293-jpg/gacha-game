'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postCommonWithdrawal, type CommonWithdrawalPayload } from '@/api/common';

export function sanitizeMoneyInput(raw: string) {
  // 只允许数字与一个小数点，最多两位小数（与钱包显示保持一致）
  const cleaned = (raw || '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const parts = cleaned.split('.');
  const intPartRaw = parts[0] ?? '';
  const hasDot = parts.length > 1;
  const decimalsRaw = parts.slice(1).join('');
  const decimals = decimalsRaw.slice(0, 2);

  const intPart = intPartRaw || (hasDot ? '0' : '');
  if (!hasDot) return intPart;
  return `${intPart}.${decimals}`;
}

export function useCommonWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommonWithdrawalPayload) => {
      const money = sanitizeMoneyInput(String(payload?.money ?? '')).trim();
      const walletAddress = String(payload?.walletAddress ?? '').trim();

      if (!money) throw new Error('pleaseEnterAmount');
      const n = Number(money);
      if (!Number.isFinite(n) || n <= 0) throw new Error('pleaseEnterValidNumber');
      if (!walletAddress) throw new Error('pleaseEnterWalletAddress');

      return postCommonWithdrawal({ id: '1', money, walletAddress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}


