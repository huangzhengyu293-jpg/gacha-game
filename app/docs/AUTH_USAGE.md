# 用户认证系统使用指南

## 文件结构

```
app/
├── lib/
│   ├── axios.ts              # axios 实例 + 拦截器（客户端）
│   └── serverFetcher.ts      # 服务端请求使用 fetch 带 token
├── providers/
│   └── AuthProvider.tsx      # 全局 Context Provider
└── hooks/
    └── useAuth.ts            # 登录登出 hook
```

## 拦截器逻辑

### HTTP 状态码
- **200 OK**: 正常处理

### 业务状态码
- **code === 100000**: 成功拿到数据
- **code === 300000**: Token 过期，自动删除用户信息和 token，触发全局登出事件
- **code === 400001 或 200007**: 显示全局错误提示
- **其他 code**: 可由业务层自行处理

## 使用方法

### 1. 在组件中使用认证

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { 
    user,                  // 用户信息
    isAuthenticated,       // 是否已登录
    isLoading,            // 初始化加载中
    isSubmitting,         // 提交中（登录/注册等）
    login,                // 登录方法
    logout,               // 登出方法
    updateUser,           // 更新用户信息
    fetchUserInfo,        // 获取用户信息
    fetchUserBean,        // 获取用户余额
  } = useAuth();

  // 登录示例
  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: '123456'
    });
    
    if (result.success) {
      console.log('登录成功', result.data);
    } else {
      console.error('登录失败', result.message);
    }
  };

  // 登出示例
  const handleLogout = async () => {
    await logout();
  };

  // 更新用户信息示例
  const updateUserInfo = () => {
    updateUser({ name: '新名字', bean: 1000 });
  };

  // 获取用户信息示例
  const refreshUserInfo = async () => {
    const result = await fetchUserInfo();
    if (result.success) {
      console.log('用户信息', result.data);
    }
  };

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated) {
    return <button onClick={handleLogin}>登录</button>;
  }

  return (
    <div>
      <p>欢迎, {user?.name}</p>
      <p>余额: {user?.bean}</p>
      <button onClick={handleLogout}>登出</button>
      <button onClick={refreshUserInfo}>刷新信息</button>
    </div>
  );
}
```

### 2. 客户端 API 调用（使用 axios）

```tsx
import axiosInstance from '@/lib/axios';

// GET 请求
const fetchData = async () => {
  const response = await axiosInstance.get('/api/some-endpoint');
  if (response.data.code === 100000) {
    console.log('数据:', response.data.data);
  }
};

// POST 请求
const submitData = async () => {
  const response = await axiosInstance.post('/api/some-endpoint', {
    key: 'value'
  });
  if (response.data.code === 100000) {
    console.log('成功');
  }
};

// Form-data 请求
const submitFormData = async () => {
  const formData = new URLSearchParams();
  formData.append('key', 'value');
  
  const response = await axiosInstance.post('/api/some-endpoint', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};
```

### 3. 服务端 API 调用（Server Components）

```tsx
import { serverGet, serverPost, getServerToken } from '@/lib/serverFetcher';

// 在 Server Component 中
async function MyServerComponent() {
  // 获取 token（如果需要）
  const token = getServerToken();
  
  // GET 请求
  const result = await serverGet('/api/some-endpoint', {
    token: token,
    params: { id: '123' }
  });
  
  if (result.code === 100000) {
    return <div>{JSON.stringify(result.data)}</div>;
  }
  
  return <div>获取数据失败</div>;
}

// POST 请求
async function postData() {
  const token = getServerToken();
  
  const result = await serverPost('/api/some-endpoint', {
    key: 'value'
  }, {
    token: token
  });
  
  return result;
}
```

### 4. 注册和验证邮件

```tsx
const { register, sendVerificationEmail, activateAccount } = useAuth();

// 发送验证邮件
const handleSendEmail = async () => {
  const result = await sendVerificationEmail('user@example.com', 'register');
  if (result.success) {
    console.log('验证邮件已发送');
  }
};

// 注册
const handleRegister = async () => {
  const result = await register({
    name: '用户名',
    email: 'user@example.com',
    password: '123456'
  });
  if (result.success) {
    console.log('注册成功');
  }
};

// 激活账号
const handleActivate = async (email: string, code: string) => {
  const result = await activateAccount({ email, code });
  if (result.success) {
    console.log('激活成功');
  }
};
```

## 特性

### 自动功能

1. **自动添加 Token**: 所有请求自动从 localStorage 读取 token 并添加到请求头
2. **Token 过期处理**: 当收到 `code === 300000` 时，自动清除用户信息并显示错误提示
3. **全局错误提示**: `code === 400001` 或 `200007` 时自动显示错误 toast
4. **持久化存储**: 用户信息自动保存到 localStorage
5. **全局状态同步**: 使用 Context 在整个应用中共享用户状态

### 事件系统

当 token 过期时，会触发全局事件 `auth:logout`，你可以监听这个事件来执行自定义逻辑：

```tsx
useEffect(() => {
  const handleLogout = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.reason === 'token_expired') {
      // 执行自定义逻辑，例如跳转到登录页
      window.location.href = '/login';
    }
  };

  window.addEventListener('auth:logout', handleLogout);
  return () => window.removeEventListener('auth:logout', handleLogout);
}, []);
```

## 注意事项

1. **客户端组件**: `useAuth` 只能在客户端组件（`'use client'`）中使用
2. **服务端组件**: 在 Server Components 中使用 `serverFetcher.ts` 的方法
3. **Token 管理**: Token 自动从 localStorage 读取，无需手动管理
4. **错误处理**: 所有 API 错误都会自动显示 toast，无需手动处理
5. **类型安全**: 所有方法都有完整的 TypeScript 类型定义

##完成状态

✅ axios 实例已创建（`app/lib/axios.ts`）
✅ 拦截器已配置（请求/响应）
✅ AuthProvider 已创建（`app/providers/AuthProvider.tsx`）
✅ useAuth hook 已创建（`app/hooks/useAuth.ts`）
✅ serverFetcher 已创建（`app/lib/serverFetcher.ts`）
✅ 已集成到 `app/layout.tsx`
✅ 所有拦截器逻辑已实现
✅ Token 过期自动处理
✅ 全局错误提示


