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

export type GetUserInviterParams = {
  /** 1=当天 2=昨天 3=本月 4=上周 5=全部；自定义时间时不要传 */
  type?: ReferralDownlineRange;
  /** 用户名关键字（可空字符串） */
  keyword?: string;
  /** 页码，从 1 开始 */
  page?: number;
  /** 开始时间：YYYY-MM-DD HH:mm:ss（自定义时间时传） */
  start_datetime?: string;
  /** 结束时间：YYYY-MM-DD HH:mm:ss（自定义时间时传） */
  end_datetime?: string;
};

/**
 * 获取推荐人下级列表（支持 type 或 自定义时间 + keyword + page）
 *
 * 注意：后端在不同环境可能读取 querystring 或 form-data；这里两者都带上，最大化兼容。
 */
export async function getUserInviter(params: GetUserInviterParams): Promise<ApiResponse<any>> {
  const page = Number(params?.page ?? 1);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const keyword = typeof params?.keyword === 'string' ? params.keyword : '';

  const typeRaw = params?.type;
  const safeType =
    typeof typeRaw === 'number' && [1, 2, 3, 4, 5].includes(typeRaw)
      ? (typeRaw as ReferralDownlineRange)
      : undefined;

  const startDatetime = typeof params?.start_datetime === 'string' ? params.start_datetime.trim() : '';
  const endDatetime = typeof params?.end_datetime === 'string' ? params.end_datetime.trim() : '';

  const formData = new FormData();
  formData.append('keyword', keyword);
  formData.append('page', String(safePage));
  if (startDatetime) formData.append('start_datetime', startDatetime);
  if (endDatetime) formData.append('end_datetime', endDatetime);
  if (safeType !== undefined) formData.append('type', String(safeType));

  const queryParams: Record<string, string> = {
    keyword,
    page: String(safePage),
  };
  if (startDatetime) queryParams.start_datetime = startDatetime;
  if (endDatetime) queryParams.end_datetime = endDatetime;
  if (safeType !== undefined) queryParams.type = String(safeType);

  const resp = await axiosInstance.request<ApiResponse<any>>({
    url: '/api/user/userInviter',
    method: 'GET',
    params: queryParams,
    // 默认 axios 会把 querystring 里的空格编码成 “+”，部分后端不会按空格解码。
    // 这里自定义序列化：
    // - 时间字符串只编码空格（-> %20），保留 ":"，让 querystring 更接近文档展示
    // - 其他参数（如 keyword）使用 encodeURIComponent
    paramsSerializer: {
      serialize: (p) =>
        Object.entries(p)
          .map(([k, v]) => {
            const raw = String(v);
            const encodedValue = /^[0-9:\-\s]+$/.test(raw)
              ? raw.replace(/ /g, '%20')
              : encodeURIComponent(raw);
            return `${encodeURIComponent(k)}=${encodedValue}`;
          })
          .join('&'),
    },
    data: formData,
  });
  return resp.data;
}

/**
 * 获取推荐人下级列表
 * 注意：后端字段可能会返回在 data.data / data.list / data.rows 等位置，页面侧会做兜底解析。
 */
export async function getReferralDownlines(params: GetReferralDownlinesParams): Promise<ApiResponse<any>> {
  const safeType = (typeof params?.type === 'number' ? params.type : 5) as ReferralDownlineRange;
  return getUserInviter({ type: safeType, page: 1, keyword: '' });
}


