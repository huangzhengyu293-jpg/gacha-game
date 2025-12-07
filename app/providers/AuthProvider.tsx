'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../lib/axios';
import { api } from '../lib/api';

export interface User {
  token?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  loginTime?: string;
  userInfo?: {
    id?: string | number;
    name?: string;
    email?: string;
    avatar?: string;
    [key: string]: any;
  };
  bean?: {
    bean?: number;
    integral?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  favoriteIds: string[];
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setFavoriteIds: (ids: string[]) => void;
  addFavoriteId: (id: string) => void;
  removeFavoriteId: (id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIdsState] = useState<string[]>([]);
  const refreshingRef = useRef(false);

  // 初始化：从 localStorage 读取用户信息
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // 兼容不同的数据结构
        const finalUser = parsedUser.data || parsedUser;
        setUserState(finalUser);
      }
    } catch (error) {
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 监听全局登出事件（由 axios 拦截器触发）
  useEffect(() => {
    const handleLogout = (event: Event) => {
      const customEvent = event as CustomEvent;
      setUserState(null);
      
      // 如果是 token 过期，可以跳转到登录页
      if (customEvent.detail?.reason === 'token_expired') {
        // 可选：跳转到登录页
        // window.location.href = '/login';
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // 设置用户
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      // 保存到 localStorage
      localStorage.setItem('user', JSON.stringify({ data: newUser }));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  // 更新用户信息
  const updateUser = useCallback((updates: Partial<User>) => {
    setUserState(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify({ data: updated }));
      return updated;
    });
  }, []);

  // 设置收藏列表
  const setFavoriteIds = useCallback((ids: string[]) => {
    setFavoriteIdsState(ids);
    localStorage.setItem('favoriteIds', JSON.stringify(ids));
  }, []);

  // 添加收藏
  const addFavoriteId = useCallback((id: string) => {
    setFavoriteIdsState(prev => {
      if (prev.includes(id)) return prev;
      const newIds = [...prev, id];
      localStorage.setItem('favoriteIds', JSON.stringify(newIds));
      return newIds;
    });
  }, []);

  // 移除收藏
  const removeFavoriteId = useCallback((id: string) => {
    setFavoriteIdsState(prev => {
      const newIds = prev.filter(fid => fid !== id);
      localStorage.setItem('favoriteIds', JSON.stringify(newIds));
      return newIds;
    });
  }, []);

  // 登出
  const logout = useCallback(() => {
    setUserState(null);
    setFavoriteIdsState([]);
    localStorage.removeItem('user');
    localStorage.removeItem('favoriteIds');
  }, []);

  // 页面刷新后自动拉取最新的用户信息 / 余额 / 收藏
  useEffect(() => {
    const syncUser = async () => {
      if (!user?.token || refreshingRef.current) return;
      refreshingRef.current = true;
      try {
        const [userInfoRes, userBeanRes, favoritesRes] = await Promise.all([
          axiosInstance.get('/api/auth/userinfo'),
          axiosInstance.get('/api/user/bean'),
          api.getFavoriteList(),
        ]);

        setUserState((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (userInfoRes?.data?.code === 100000 && userInfoRes.data.data) {
            next.userInfo = userInfoRes.data.data;
          }
          if (userBeanRes?.data?.code === 100000 && userBeanRes.data.data) {
            next.bean = userBeanRes.data.data;
          }
          localStorage.setItem('user', JSON.stringify({ data: next }));
          return next;
        });

        if (favoritesRes?.code === 100000 && Array.isArray(favoritesRes.data)) {
          const favoriteIdsList = favoritesRes.data.map((item: any) => String(item.id || item.box_id));
          setFavoriteIdsState(favoriteIdsList);
          localStorage.setItem('favoriteIds', JSON.stringify(favoriteIdsList));
        }
      } catch {
        // 静默失败，不阻塞页面
      } finally {
        refreshingRef.current = false;
      }
    };
    syncUser();
  }, [user?.token]);

  // 初始化：从 localStorage 读取收藏列表
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('favoriteIds');
      if (storedFavorites) {
        setFavoriteIdsState(JSON.parse(storedFavorites));
      }
    } catch (error) {
      localStorage.removeItem('favoriteIds');
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    favoriteIds,
    setUser,
    updateUser,
    setFavoriteIds,
    addFavoriteId,
    removeFavoriteId,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

