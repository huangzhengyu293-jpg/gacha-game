import type { FightDetailRaw } from '@/types/fight';

// ==================== 类型定义 ====================

export type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability: number;
  qualityId: string;
};

export type CatalogPack = {
  id: string;
  title: string;
  image: string;
  price: number;
  itemCount: number;
  items: CatalogItem[];
};

export interface CreateBattlePayload {
  num: number;
  person_team: 0 | 1;
  team_size: 0 | 1 | 2;
  mode: 0 | 1 | 2 | 3 | 4;
  fast: 0 | 1;
  finally: 0 | 1;
  type: 0 | 1;
  boxs: Array<string | number>;
}

export interface CreateBattleResult {
  id?: number | string;
  fight_id?: number | string;
  fightId?: number | string;
  [key: string]: any;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig extends Omit<RequestInit, 'body' | 'method'> {
  method?: HttpMethod;
  data?: any; // 请求体数据（会自动 JSON.stringify）
  params?: Record<string, string | number | boolean>; // URL 查询参数
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// ==================== 配置 ====================

const DEFAULT_CONFIG: RequestInit = {
  cache: 'no-store',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// ==================== Token 工具函数 ====================

/**
 * 从 localStorage 获取用户 token
 * 很多接口都需要使用这个 token
 */
export function getToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.data?.token || user.token || '';
    }
  } catch {}
  return '';
}

// ==================== 拦截器 ====================

// 需要登录的接口路径（不完全匹配，只要包含这些路径即可）
const AUTH_REQUIRED_PATHS = [
  '/api/box/favorite',
  '/api/box/open',
  '/api/box/userrecord',
  '/api/user/bean',
  '/api/user/storage',
  '/api/auth/userinfo',
  '/api/auth/logout',
  '/api/lucky/go',
  '/api/fight/save',
  '/api/fight/inviterobots',
  '/api/fight/detail',
];

function requestInterceptor(url: string, config: RequestInit): { url: string; config: RequestInit } {
  if (typeof window !== 'undefined') {
    const headers = config.headers as Record<string, string> || {};
    const hasAuth = headers['Authorization'] || headers['authorization'];
    
    let hasToken = false;
    
    // 只有在用户没有手动传入 Authorization 时，才自动添加
    if (!hasAuth) {
      const token = getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
        hasToken = true;
      }
    } else {
      hasToken = true;
    }
    
    // ✅ 检查是否需要登录但没有 token
    if (!hasToken) {
      const needsAuth = AUTH_REQUIRED_PATHS.some(path => url.includes(path));
      
      if (needsAuth) {
        // 触发显示登录弹窗
        window.dispatchEvent(new CustomEvent('auth:show-login'));
        
        // 显示提示
        import('../components/ToastProvider').then(({ showGlobalToast }) => {
          showGlobalToast({
            title: '提示',
            description: '请先登录',
            variant: 'error',
            durationMs: 2000,
          });
        });
        
        // 抛出错误，阻止请求继续
        throw new Error('未登录');
      }
    }
  }
  return { url, config };
}

function responseInterceptor<T>(data: T): T {
  // 检查业务状态码
  if (typeof window !== 'undefined' && data && typeof data === 'object' && 'code' in data) {
    const response = data as any;
    
    // code === 300000: token 过期
    if (response.code === 300000) {
      // 删除用户信息
      localStorage.removeItem('user');
      
      // 触发全局事件通知 AuthProvider
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'token_expired' } }));
      
      // 触发显示登录弹窗
      window.dispatchEvent(new CustomEvent('auth:show-login'));
      
      // 显示错误提示
      import('../components/ToastProvider').then(({ showGlobalToast }) => {
        showGlobalToast({
          title: '登录已过期',
          description: response.message || '请重新登录',
          variant: 'error',
          durationMs: 3000,
        });
      });
    }
    // code !== 100000 且 !== 300000 且 !== 200000: 显示通用错误提示
    // 300000: token 过期，已单独处理
    // 200000: 邮箱已注册未验证，由业务层处理
    else if (response.code !== 100000 ) {
      import('../components/ToastProvider').then(({ showGlobalToast }) => {
        showGlobalToast({
          title: '错误',
          description: response.message || '请求失败',
          variant: 'error',
          durationMs: 3000,
        });
      });
    }
  }
  return data;
}

// ==================== 核心请求函数 ====================

async function request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { method = 'GET', data, params, headers, ...restConfig } = config;

  // ✅ 如果是 /api/ 开头的路径，添加后端 API 地址
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';
  let url = endpoint.startsWith('/api/') ? `${API_BASE_URL}${endpoint}` : endpoint;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const requestConfig: RequestInit = {
    ...DEFAULT_CONFIG,
    ...restConfig,
    method,
    headers: {
      ...DEFAULT_CONFIG.headers,
      ...headers,
    },
  };

  if (data !== undefined) {
    // 如果 Content-Type 是 application/x-www-form-urlencoded，直接使用 data（已经是字符串）
    // 否则使用 JSON.stringify
    const headersObj = headers as Record<string, string> | undefined;
    const defaultHeadersObj = DEFAULT_CONFIG.headers as Record<string, string> | undefined;
    const contentType = headersObj?.['Content-Type'] || defaultHeadersObj?.['Content-Type'];
    if (contentType === 'application/x-www-form-urlencoded' && typeof data === 'string') {
      requestConfig.body = data;
    } else {
      requestConfig.body = JSON.stringify(data);
    }
  }

  const intercepted = requestInterceptor(url, requestConfig);
  const response = await fetch(intercepted.url, intercepted.config);

  if (!response.ok) {
    try {
      const text = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      
      throw new Error(errorMessage);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`HTTP ${response.status}`);
    }
  }

  const responseData = await response.json();
  return responseInterceptor(responseData) as T;
}

// ==================== 便捷方法 ====================

function get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<T> {
  return request<T>(endpoint, { ...config, method: 'GET' });
}

function post<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<T> {
  return request<T>(endpoint, { ...config, method: 'POST', data });
}

function put<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<T> {
  return request<T>(endpoint, { ...config, method: 'PUT', data });
}

function del<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<T> {
  return request<T>(endpoint, { ...config, method: 'DELETE' });
}

function patchRequest<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<T> {
  return request<T>(endpoint, { ...config, method: 'PATCH', data });
}

// ==================== API 接口定义 ====================

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    post<{ ok: true; user?: { id: string; name: string; email: string } }>('/api/auth/register', payload),
  sendVerificationEmail: (payload: { to: string; type: string }) =>
    post<ApiResponse>('/api/auth/sendemail', payload),
  activateAccount: (payload: { code: string }) =>
    post<ApiResponse>('/api/auth/activation', payload),
  login: (payload: { email: string; password: string }) =>
    post<ApiResponse>('/api/auth/login', payload),
  getUserInfo: (token: string) =>
    request<ApiResponse>('/api/auth/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),
  getUserBean: (token: string) =>
    request<ApiResponse>('/api/user/bean', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),
  logout: (token: string) =>
    request<ApiResponse>('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),

  // Lucky (交易页面)
  getLuckyList: async (params: {
    name?: string;
    price_sort?: string | number;
    price_min?: string | number;
    price_max?: string | number;
  }) => {
    const formData = new URLSearchParams();
    if (params.name !== undefined) formData.append('name', String(params.name));
    if (params.price_sort !== undefined) formData.append('price_sort', String(params.price_sort));
    if (params.price_min !== undefined) formData.append('price_min', String(params.price_min));
    if (params.price_max !== undefined) formData.append('price_max', String(params.price_max));
    
    const result = await request<ApiResponse>('/api/lucky/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },
  goLucky: async (params: {
    id: string | number;
    type?: string | number;
    percent: string | number;
  }) => {
    const formData = new URLSearchParams();
    formData.append('id', String(params.id));
    if (params.type !== undefined) formData.append('type', String(params.type));
    formData.append('percent', String(params.percent));
    
    const result = await request<ApiResponse>('/api/lucky/go', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },

  getBoxList: async (params: {
    search_type?: string;  // 1官方 2社区 3最喜欢
    sort_type?: string;     // 1最受欢迎 2最新
    price_sort?: string;    // 1由高到低 2由低到高
    volatility?: string;    // 波动性 1-9
    price_min?: string;
    price_max?: string;
  }) => {
    const formData = new URLSearchParams();
    if (params.search_type) formData.append('search_type', params.search_type);
    if (params.sort_type) formData.append('sort_type', params.sort_type);
    if (params.price_sort) formData.append('price_sort', params.price_sort);
    if (params.price_min) formData.append('price_min', params.price_min);
    if (params.price_max) formData.append('price_max', params.price_max);
    if (params.volatility) formData.append('volatility', params.volatility);
    
    const result = await request<ApiResponse>('/api/box/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },
  
  // 收藏/取消收藏礼包
  toggleFavorite: async (id: string | number) => {
    const formData = new URLSearchParams();
    formData.append('id', String(id));
    
    const result = await request<ApiResponse>('/api/box/favorite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },
  
  // 获取收藏列表（使用 search_type=3）
  getFavoriteList: async () => {
    const formData = new URLSearchParams();
    formData.append('search_type', '3');
    
    const result = await request<ApiResponse>('/api/box/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },
  getBoxDetail: async (boxId: string) => {
    const result = await request<ApiResponse>(`/api/box/detail?id=${boxId}`, {
      method: 'GET',
    });
    return result;
  },
  openBox: async (params: {
    ids: string;
    multiple: number;
    anim: number;
    authorization?: string;
  }) => {
    const formData = new URLSearchParams();
    formData.append('ids', params.ids);
    formData.append('multiple', String(params.multiple));
    formData.append('anim', String(params.anim));
    
    const result = await request<ApiResponse>('/api/box/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(params.authorization ? { 'authorization': params.authorization } : {}),
      },
      data: formData.toString(),
    });
    return result;
  },
  createBattle: async (payload: CreateBattlePayload) => {
    const formData = new URLSearchParams();
    formData.append('num', String(payload.num));
    formData.append('person_team', String(payload.person_team));
    formData.append('team_size', String(payload.team_size));
    formData.append('mode', String(payload.mode));
    formData.append('fast', String(payload.fast));
    formData.append('finally', String(payload.finally));
    formData.append('type', String(payload.type));
    payload.boxs.forEach((boxId, index) => {
      formData.append(`boxs[${index}]`, String(boxId));
    });

    const result = await request<ApiResponse<CreateBattleResult>>('/api/fight/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },
  getFightDetail: async (id: string | number) => {
    const result = await request<ApiResponse<FightDetailRaw>>('/api/fight/detail', {
      method: 'GET',
      params: {
        id: String(id),
      },
    });
    return result;
  },
  getFightList: async (params?: { page?: number | string }) => {
    const requestParams =
      params && params.page !== undefined
        ? { page: String(params.page) }
        : undefined;
    const result = await request<ApiResponse>('/api/fight/list', {
      method: 'GET',
      params: requestParams,
    });
    return result;
  },
  getMyBattleList: async () => {
    const result = await request<ApiResponse<any>>('/api/fight/mylist', {
      method: 'GET',
    });
    return result;
  },
  inviteRobots: async (params: { id: string | number; order: string | number }) => {
    const formData = new URLSearchParams();
    formData.append('id', String(params.id));
    formData.append('order', String(params.order));

    const result = await request<ApiResponse>('/api/fight/inviterobots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },
  joinFight: async (params: { id: string | number; order: string | number; user_id: string | number; debug?: string | number }) => {
    const formData = new URLSearchParams();
    formData.append('id', String(params.id));
    formData.append('order', String(params.order));
    formData.append('user_id', String(params.user_id));
    formData.append('debug', String(params.debug ?? 1));

    const result = await request<ApiResponse>('/api/fight/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    return result;
  },
  collectLotteryItems: (_items: any) => Promise.resolve({ ok: true, inserted: 0, updated: 0 } as any),
  
  // ✅ 获取用户箱子记录
  getBoxUserRecord: async () => {
    const result = await request<ApiResponse>('/api/box/userrecord', {
      method: 'GET',
    });
    return result;
  },
  
  // ✅ 获取用户仓库
  getUserStorage: async () => {
    const result = await request<ApiResponse>('/api/user/storage', {
      method: 'GET',
    });
    return result;
  },
};

export { request, get, post, put, del as delete, patchRequest as patch };
