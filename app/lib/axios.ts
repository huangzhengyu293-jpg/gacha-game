import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

// 创建 axios 实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 需要登录的接口路径（不完全匹配，只要包含这些路径即可）
const AUTH_REQUIRED_PATHS = [
  '/api/box/favorite',
  '/api/box/open',
  '/api/box/userrecord',
  '/api/box/cash',
  '/api/user/bean',
  '/api/user/storage',
  '/api/auth/userinfo',
  '/api/auth/logout',
  '/api/lucky/go',
];

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let hasToken = false;
    
    // 自动添加 token
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const token = user.data?.token || user.token;
          if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
            hasToken = true;
          }
        }
      } catch (error) {
        // ignore
      }
      
      // ✅ 检查是否需要登录但没有 token
      if (!hasToken) {
        const url = config.url || '';
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
          
          // 阻止请求继续
          return Promise.reject(new Error('未登录'));
        }
      }
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    
    // 检查业务状态码
    if (data && typeof data === 'object' && 'code' in data) {
      // code === 300000: token 过期
      if (data.code === 300000) {
        if (typeof window !== 'undefined') {
          // 删除用户信息和 token
          localStorage.removeItem('user');
          
          // 触发全局事件通知 AuthProvider
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'token_expired' } }));
          
          // 触发显示登录弹窗
          window.dispatchEvent(new CustomEvent('auth:show-login'));
          
          // 显示错误提示
          import('../components/ToastProvider').then(({ showGlobalToast }) => {
            showGlobalToast({
              title: '登录已过期',
              description: data.message || '请重新登录',
              variant: 'error',
              durationMs: 3000,
            });
          });
        }
        return Promise.reject(new Error('Token expired'));
      }
      
      // code !== 100000 且 !== 300000 且 !== 200000: 显示错误提示
      // 300000: token 过期，已单独处理
      // 200000: 邮箱已注册未验证，由业务层处理
      if (data.code !== 100000 && data.code !== 300000 ) {
        if (typeof window !== 'undefined') {
          import('../components/ToastProvider').then(({ showGlobalToast }) => {
            showGlobalToast({
              title: '错误',
              description: data.message || '请求失败',
              variant: 'error',
              durationMs: 3000,
            });
          });
        }
      }
      
      // code === 100000: 成功
    }
    
    return response;
  },
  (error: any) => {
    // HTTP 错误处理
    if (error.response) {
      const { status, data } = error.response;
      
      if (typeof window !== 'undefined') {
        import('../components/ToastProvider').then(({ showGlobalToast }) => {
          showGlobalToast({
            title: `错误 ${status}`,
            description: data?.message || error.message || '网络请求失败',
            variant: 'error',
            durationMs: 3000,
          });
        });
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
    //   if (typeof window !== 'undefined') {
    //     import('../components/ToastProvider').then(({ showGlobalToast }) => {
    //       showGlobalToast({
    //         title: '网络错误',
    //         description: '请检查网络连接',
    //         variant: 'error',
    //         durationMs: 3000,
    //       });
    //     });
    //   }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

