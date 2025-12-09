import { useState, useCallback } from 'react';
import { useAuthContext, User } from '../providers/AuthProvider';
import axiosInstance from '../lib/axios';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export function useAuth() {
  const { user, isLoading, isAuthenticated, favoriteIds, setUser, updateUser, setFavoriteIds, addFavoriteId, removeFavoriteId, logout: contextLogout } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // 登录
  const login = useCallback(async (params: LoginParams) => {
    setIsSubmitting(true);
    try {
      const formData = new URLSearchParams();
      formData.append('email', params.email);
      formData.append('password', params.password);

      const response = await axiosInstance.post<ApiResponse>('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.code === 100000 && response.data.data) {
        const loginData = response.data.data;
        
        // 构建初始用户数据
        const userData: any = {
          token: loginData.access_token,
          refreshToken: loginData.refresh_token,
          tokenType: loginData.token_type || 'Bearer',
          expiresIn: loginData.expires_in,
          loginTime: new Date().toISOString(),
        };
        
        // 先保存 token，这样后续请求才能带上 Authorization
        setUser(userData);
        
        // 立即获取用户详细信息、余额和收藏列表
        try {
          const [userInfoRes, userBeanRes, favoritesRes] = await Promise.all([
            axiosInstance.get<ApiResponse>('/api/auth/userinfo'),
            axiosInstance.get<ApiResponse>('/api/user/bean'),
            api.getFavoriteList(),
          ]);
          
          if (userInfoRes.data.code === 100000 && userInfoRes.data.data) {
            userData.userInfo = userInfoRes.data.data;
          }
          
          if (userBeanRes.data.code === 100000 && userBeanRes.data.data) {
            userData.bean = userBeanRes.data.data;
          }
          
          // 获取收藏列表的 ID 数组
          if (favoritesRes.code === 100000 && Array.isArray(favoritesRes.data)) {
            const favoriteIdsList = favoritesRes.data.map((item: any) => String(item.id || item.box_id));
            setFavoriteIds(favoriteIdsList);
          }
          
          // 更新完整的用户数据
          setUser(userData);
        } catch (error) {
          // 即使获取详细信息失败，也返回成功（token 已保存）
          console.error('获取用户详细信息失败:', error);
        }
        
        return { success: true, data: userData };
      } else {
        return { success: false, message: response.data.message || '登录失败' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' };
    } finally {
      setIsSubmitting(false);
    }
  }, [setUser, setFavoriteIds]);

  // 注册
  const register = useCallback(async (params: RegisterParams) => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post<ApiResponse>('/api/auth/register', params);

      if (response.data.code === 100000) {
        return { success: true, message: response.data.message || '注册成功', code: response.data.code };
      } else if (response.data.code === 200000) {
        // 邮箱已注册但未验证
        return { success: false, message: response.data.message || '邮箱已注册，请验证', code: response.data.code };
      } else {
        return { success: false, message: response.data.message || '注册失败', code: response.data.code };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '注册失败' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (user?.token) {
        await axiosInstance.post('/api/auth/logout');
      }
    } catch (error) {
      // 忽略登出接口错误，继续清除本地数据
    } finally {
      contextLogout();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      setIsSubmitting(false);
    }
  }, [user, contextLogout]);

  // 获取用户信息
  const fetchUserInfo = useCallback(async () => {
    if (!user?.token) return { success: false, message: '未登录' };

    try {
      const response = await axiosInstance.get<ApiResponse>('/api/auth/userinfo');

      if (response.data.code === 100000 && response.data.data) {
        const userData = response.data.data;
        updateUser(userData);
        return { success: true, data: userData };
      } else {
        return { success: false, message: response.data.message || '获取用户信息失败' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '获取用户信息失败' };
    }
  }, [user, updateUser]);

  // 获取用户余额
  const fetchUserBean = useCallback(async () => {
    if (!user?.token) return { success: false, message: '未登录' };

    try {
      const response = await axiosInstance.get<ApiResponse>('/api/user/bean');

      if (response.data.code === 100000 && response.data.data) {
        const beanData = response.data.data;
        // 更新用户余额（整个对象）
        updateUser({ bean: beanData });
        return { success: true, data: beanData };
      } else {
        return { success: false, message: response.data.message || '获取余额失败' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '获取余额失败' };
    }
  }, [user, updateUser]);

  // 发送验证邮件
  const sendVerificationEmail = useCallback(async (email: string, type: string = 'register') => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post<ApiResponse>('/api/index/sendemail', {
        to: email,
        type: type,
        debug: 1,
      });

      if (response.data.code === 100000) {
        return {
          success: true,
          message: response.data.message || '验证邮件已发送',
          codeValue: (response.data as any)?.data?.code,
        };
      } else {
        return { success: false, message: response.data.message || '发送失败' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '发送失败' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 激活账号
  const activateAccount = useCallback(async (code: string) => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post<ApiResponse>('/api/auth/activation', {
        code: code,
      });

      if (response.data.code === 100000) {
        return { success: true, message: response.data.message || '激活成功' };
      } else {
        return { success: false, message: response.data.message || '激活失败' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '激活失败' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 切换收藏
  const toggleFavorite = useCallback(async (packId: string | number) => {
    if (!user?.token) {
      return { success: false, message: '请先登录' };
    }

    try {
      const result = await api.toggleFavorite(packId);
      
      if (result.code === 100000) {
        // 调用接口成功后，重新获取收藏列表
        const refreshResult = await api.getFavoriteList();
        if (refreshResult.code === 100000 && Array.isArray(refreshResult.data)) {
          const favoriteIdsList = refreshResult.data.map((item: any) => String(item.id || item.box_id));
          setFavoriteIds(favoriteIdsList);
        }
        
        // 使所有 boxList 查询失效，强制重新获取
        queryClient.invalidateQueries({ queryKey: ['boxList'] });
        
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || '操作失败' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '操作失败' };
    }
  }, [user, setFavoriteIds, queryClient]);

  // 刷新收藏列表
  const refreshFavorites = useCallback(async () => {
    if (!user?.token) return { success: false, message: '未登录' };

    try {
      const result = await api.getFavoriteList();
      
      if (result.code === 100000 && Array.isArray(result.data)) {
        const favoriteIdsList = result.data.map((item: any) => String(item.id || item.box_id));
        setFavoriteIds(favoriteIdsList);
        return { success: true, data: favoriteIdsList };
      } else {
        return { success: false, message: result.message || '获取收藏列表失败' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || '获取收藏列表失败' };
    }
  }, [user, setFavoriteIds]);

  return {
    // 用户状态
    user,
    isLoading,
    isAuthenticated,
    isSubmitting,
    
    // 用户操作
    login,
    register,
    logout,
    updateUser,
    
    // 用户信息获取
    fetchUserInfo,
    fetchUserBean,
    
    // 收藏功能
    favoriteIds,
    toggleFavorite,
    refreshFavorites,
    
    // 其他
    sendVerificationEmail,
    activateAccount,
  };
}

