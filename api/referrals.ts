import axiosInstance from '@/app/lib/axios';
import type { ApiResponse } from '@/app/lib/api';

export type ReferralDownlineRange = 1 | 2 | 3 | 4 | 5;

export type ReferralDownlineRow = {
  id?: string | number;
  name?: string;
  username?: string;
  user_name?: string;
  recharge?: string | number;
  deposit?: string | number;
  consume?: string | number;
  flow?: string | number;
  [key: string]: any;
};

export type GetReferralDownlinesParams = {
  /** 1=当天 2=昨天 3=本月 4=上周 5=全部 */
  type: ReferralDownlineRange;
};

/**
 * 获取推荐人下级列表
 * 注意：后端字段可能会返回在 data.data / data.list / data.rows 等位置，页面侧会做兜底解析。
 */
export async function getReferralDownlines(params: GetReferralDownlinesParams): Promise<ApiResponse<any>> {
  const safeType = (typeof params?.type === 'number' ? params.type : 5) as ReferralDownlineRange;
  // 最新文档：GET /api/user/userInviter 只需要 type，keyword 不用传
  const formData = new FormData();
  formData.append('type', String(safeType));

  const resp = await axiosInstance.request<ApiResponse<any>>({
    url: '/api/user/userInviter',
    method: 'GET',
    params: { type: String(safeType) },
    data: formData,
  });
  return resp.data;
}


