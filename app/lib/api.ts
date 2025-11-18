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

export type WarehouseItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  qualityId?: string;
  quantity: number;
  obtainedAt: string;
  updatedAt?: string;
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

// ==================== 拦截器 ====================

function requestInterceptor(url: string, config: RequestInit): { url: string; config: RequestInit } {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const token = user.data?.token || user.token;
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`,
          };
        }
      } catch {}
    }
  }
  return { url, config };
}

function responseInterceptor<T>(data: T): T {
  if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
    const apiData = data as any;
    if (apiData.code !== 200) {
      throw new Error(apiData.message || `API Error: ${apiData.code}`);
    }
  }
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
    requestConfig.body = JSON.stringify(data);
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

  // Products
  getProducts: () => get<CatalogItem[]>('/api/products'),
  getProductById: async (id: string) => {
    const all = await get<CatalogItem[]>('/api/products');
    return all.find(p => p.id === id);
  },
  createProduct: (payload: CatalogItem) =>
    post<CatalogItem>('/api/products', payload),
  updateProduct: (id: string, patchData: Partial<CatalogItem>) =>
    patchRequest<CatalogItem>(`/api/products/${id}`, patchData),
  deleteProduct: (id: string) => del<{ ok: true }>(`/api/products/${id}`),

  // Pack Backgrounds
  getPackBackgroundUrls: () => get<string[]>('/api/packbg'),

  // User & Warehouse
  getCurrentUser: () => get<{ id: string; username: string; balance: number; warehouse: WarehouseItem[] }>('/api/user'),
  updateUser: (patchData: Partial<{ balance: number }>) =>
    patchRequest<{ id: string; username: string; balance: number; warehouse: WarehouseItem[] }>('/api/user', patchData),
  getUserWarehouse: () => get<WarehouseItem[]>('/api/user/warehouse'),
  addUserWarehouseItems: (items: Array<Partial<WarehouseItem>>) =>
    post<{ ok: true }>('/api/user/warehouse', { items }),
  getUserWarehouseItem: (id: string) => get<WarehouseItem>(`/api/user/warehouse/${id}`),
  updateUserWarehouseItem: (id: string, patchData: Partial<WarehouseItem>) =>
    patchRequest<WarehouseItem>(`/api/user/warehouse/${id}`, patchData),
  deleteUserWarehouseItem: (id: string) => del<{ ok: true }>(`/api/user/warehouse/${id}`),
  sellUserWarehouseItems: (items: Array<{ id: string; count?: number }>) =>
    post<{ ok: true; sold: number; gained: number; balance: number }>('/api/user/warehouse/sell', { items }),
  collectLotteryItems: (items: Array<Partial<WarehouseItem>>) =>
    post<{ ok: true; inserted: number; updated: number }>('/api/user/warehouse/collect', { items }),
};

export { request, get, post, put, del as delete, patchRequest as patch };
