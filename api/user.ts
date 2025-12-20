import axiosInstance from '@/app/lib/axios';
import type { ApiResponse } from '@/app/lib/api';

export type WithdrawalStoragePayload = {
  id: string; // 支付方式 id
  storageIds: string[]; // 背包选中的道具 id 集合
  walletAddress: string; // 钱包地址
};

export async function postWithdrawalStorage(payload: WithdrawalStoragePayload): Promise<ApiResponse<any>> {
  const formData = new FormData();
  formData.append('id', payload.id);
  formData.append('wallet_address', payload.walletAddress);
  const safeIds = Array.isArray(payload.storageIds) ? payload.storageIds : [];
  safeIds.forEach((sid, idx) => {
    const v = typeof sid === 'string' ? sid : sid == null ? '' : String(sid);
    if (!v) return;
    formData.append(`storage_ids[${idx}]`, v);
  });

  const resp = await axiosInstance.post<ApiResponse<any>>('/api/common/withdrawalStorage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data;
}

export async function getRechargeLog(): Promise<ApiResponse<any>> {
  const resp = await axiosInstance.get<ApiResponse<any>>('/api/common/rechargeLog');
  return resp.data;
}

export async function getReceivePhysicalLogs(): Promise<ApiResponse<any>> {
  const resp = await axiosInstance.get<ApiResponse<any>>('/api/user/receivePhysicalLogs');
  return resp.data;
}


