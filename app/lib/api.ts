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

function requestInterceptor(url: string, config: RequestInit): { url: string; config: RequestInit } {
  if (typeof window !== 'undefined') {
    const headers = config.headers as Record<string, string> || {};
    const hasAuth = headers['Authorization'] || headers['authorization'];
    
    // 只有在用户没有手动传入 Authorization 时，才自动添加
    if (!hasAuth) {
      const token = getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      }
    }
  }
  return { url, config };
}

function responseInterceptor<T>(data: T): T {
  // 不再检查 code，由各个接口自己处理业务逻辑
  return data;
}

// ==================== 核心请求函数 ====================

async function request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { method = 'GET', data, params, headers, ...restConfig } = config;

  let url = endpoint;
  
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
  getLuckyList: (params: {
    name?: string;
    price_sort?: string | number;
    price_min?: string | number;
    price_max?: string | number;
  }) =>
    post<ApiResponse>('/api/lucky/list', params),
  goLucky: (params: {
    id: string | number;
    type?: string | number;
    percent: string | number;
  }) =>
    request<ApiResponse>('/api/lucky/go', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      data: params,
    }),

  // Packs
  getPacks: () => get<CatalogPack[]>('/api/packs'),
  getPackById: async (id: string) => {
    const all = await get<CatalogPack[]>('/api/packs');
    return all.find(p => p.id === id);
  },
  createPack: (payload: { title: string; image: string; price: number; items: CatalogItem[]; id?: string }) =>
    post<CatalogPack>('/api/packs', payload),
  updatePack: (id: string, patchData: Partial<Omit<CatalogPack, 'id'>>) =>
    patchRequest<CatalogPack>(`/api/packs/${id}`, patchData),
  deletePack: (id: string) => del<{ ok: true }>(`/api/packs/${id}`),

  // Products (使用新的后端接口)
  getProducts: async () => {
    // 构造 form-data 格式的请求体
    const formData = new URLSearchParams();
    formData.append('name', '');
    formData.append('price_sort', '1');
    formData.append('price_min', '200');
    formData.append('price_max', '5888');
    
    const result = await request<ApiResponse>('/api/lucky/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    // 将后端返回的数据映射为 CatalogItem 格式
    if (result.data && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        id: String(item.id || Math.random()),
        name: item.steam?.name || 'Unknown',
        image: item.steam?.cover || '',
        price: item.steam?.bean || 0,
        dropProbability: 0.01, // 默认概率
        qualityId: item.qualityId || '',
        description: item.description || '',
      })) as CatalogItem[];
    }
    return [];
  },
  getProductById: async (id: string) => {
    const all = await api.getProducts();
    return all.find(p => p.id === id);
  },
  // 以下方法保留但不再使用（新后端不支持）
  createProduct: (payload: CatalogItem) =>
    post<CatalogItem>('/api/products', payload),
  updateProduct: (id: string, patchData: Partial<CatalogItem>) =>
    patchRequest<CatalogItem>(`/api/products/${id}`, patchData),
  deleteProduct: (id: string) => del<{ ok: true }>(`/api/products/${id}`),

  // Pack Backgrounds
  getPackBackgroundUrls: () => get<string[]>('/api/packbg'),

  // 旧的用户相关API（占位方法，待对接新后端）
  getCurrentUser: () => Promise.resolve({ id: '', username: '', balance: 0, warehouse: [] } as any),
  updateUser: (_patchData: any) => Promise.resolve({ id: '', username: '', balance: 0, warehouse: [] } as any),
  getUserWarehouse: () => Promise.resolve([] as any),
  addUserWarehouseItems: (_items: any) => Promise.resolve({ ok: true } as any),
  getUserWarehouseItem: (_id: string) => Promise.resolve({} as any),
  updateUserWarehouseItem: (_id: string, _patchData: any) => Promise.resolve({} as any),
  deleteUserWarehouseItem: (_id: string) => Promise.resolve({ ok: true } as any),
  sellUserWarehouseItems: (_items: any) => Promise.resolve({ ok: true, sold: 0, gained: 0, balance: 0 } as any),
  collectLotteryItems: (_items: any) => Promise.resolve({ ok: true, inserted: 0, updated: 0 } as any),
};

export { request, get, post, put, del as delete, patchRequest as patch };
