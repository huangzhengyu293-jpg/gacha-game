import axiosInstance from '@/app/lib/axios';
import type { ApiResponse } from '@/app/lib/api';
import type { WithdrawalType } from '@/types/withdrawal';

type WithdrawalTypeRaw = Record<string, any>;

function toStringSafe(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function toStatus(value: unknown): 0 | 1 {
  const n = Number(value);
  return n === 1 ? 1 : 0;
}

function mapWithdrawalType(raw: WithdrawalTypeRaw, index: number): WithdrawalType | null {
  const id = toStringSafe(raw?.id).trim() || toStringSafe(raw?.currency_id).trim() || String(index);
  const cover =
    toStringSafe(raw?.cover).trim() ||
    toStringSafe(raw?.currency_cover).trim() ||
    toStringSafe(raw?.icon).trim() ||
    toStringSafe(raw?.logo).trim();
  const currency_name =
    toStringSafe(raw?.currency_name).trim() ||
    toStringSafe(raw?.currencyName).trim() ||
    toStringSafe(raw?.name).trim();
  const currency_chain =
    toStringSafe(raw?.currency_chain).trim() ||
    toStringSafe(raw?.currencyChain).trim() ||
    toStringSafe(raw?.chain).trim();
  const status = toStatus(raw?.status ?? raw?.enabled);

  if (!id) return null;
  if (!currency_name && !currency_chain) return null;

  return {
    id,
    cover,
    currency_name,
    currency_chain,
    status,
  };
}

export async function getWithdrawalTypes(): Promise<WithdrawalType[]> {
  const resp = await axiosInstance.get<ApiResponse<any>>('/api/common/withdrawalType');
  const payload = resp?.data;

  const rows =
    Array.isArray(payload?.data?.data) ? payload.data.data
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload) ? payload
    : [];

  const mapped = rows
    .map((raw: any, idx: number) => mapWithdrawalType(raw ?? {}, idx))
    .filter((x: WithdrawalType | null): x is WithdrawalType => Boolean(x));

  return mapped;
}

export async function getWithdrawalLog(): Promise<ApiResponse<any>> {
  // 文档：GET /api/common/withdrawalLog；当前不需要传参
  const resp = await axiosInstance.get<ApiResponse<any>>('/api/common/withdrawalLog');
  return resp.data;
}

export type CommonWithdrawalPayload = {
  /** 固定传 1 */
  id?: string;
  /** 提现金额（字符串） */
  money: string;
  /** 钱包地址 */
  walletAddress: string;
};

export async function postCommonWithdrawal(payload: CommonWithdrawalPayload): Promise<ApiResponse<any>> {
  const formData = new FormData();
  formData.append('id', payload?.id ? String(payload.id) : '1');
  formData.append('money', String(payload.money ?? ''));
  formData.append('wallet_address', String(payload.walletAddress ?? ''));

  const resp = await axiosInstance.post<ApiResponse<any>>('/api/common/withdrawal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data;
}


