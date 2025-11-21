// 服务端请求工具（用于 Server Components 和 API Routes）

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

interface FetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean>;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 服务端 fetch 封装
 * 用于 Server Components 和 API Routes
 */
export async function serverFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { token, params, headers, ...restOptions } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  // 处理查询参数
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

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };

  // 添加 token
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
      cache: 'no-store', // 禁用缓存
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * GET 请求
 */
export async function serverGet<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return serverFetch<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST 请求
 */
export async function serverPost<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return serverFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 请求
 */
export async function serverPut<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return serverFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 请求
 */
export async function serverDelete<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return serverFetch<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * 从 cookies 或其他地方获取 token
 * 用于 Server Components
 */
export function getServerToken(): string | undefined {
  // 这里可以根据实际情况从 cookies 或其他地方获取 token
  // 例如使用 next/headers
  try {
    if (typeof window === 'undefined') {
      // 服务端环境
      // const { cookies } = require('next/headers');
      // const token = cookies().get('token')?.value;
      // return token;
    }
  } catch (error) {
    // ignore
  }
  return undefined;
}


