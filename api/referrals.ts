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
  /** 用户ID/用户名 */
  keyword?: string;
};

/**
 * 获取推荐人下级列表
 * 注意：后端字段可能会返回在 data.data / data.list / data.rows 等位置，页面侧会做兜底解析。
 */
export async function getReferralDownlines(params: GetReferralDownlinesParams): Promise<ApiResponse<any>> {
  const safeType = (typeof params?.type === 'number' ? params.type : 5) as ReferralDownlineRange;
  const keyword = typeof params?.keyword === 'string' ? params.keyword : '';
  // 文档标注 GET + form-data，这里同时兼容 params 与 body（不同后端实现都能吃到）
  const formData = new FormData();
  formData.append('type', String(safeType));
  formData.append('keyword', keyword);

  const resp = await axiosInstance.request<ApiResponse<any>>({
    url: '/api/user/userInviter',
    method: 'GET',
    params: { type: String(safeType), keyword },
    data: formData,
  });
  return resp.data;
}


