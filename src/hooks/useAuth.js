import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../lib/axios';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken } = {}) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// 여러 컴포넌트(News, Admin 등)가 같은 로그인 상태를 공유하도록 하는 모듈 스토어.
// 새로고침해도 토큰이 남아 있으면 로그인 상태를 유지합니다.
let current = !!localStorage.getItem(ACCESS_KEY);
const listeners = new Set();

function setLogin(value) {
  current = value;
  listeners.forEach((notify) => notify(value));
}

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(current);

  useEffect(() => {
    const notify = (v) => setIsAdmin(v);
    listeners.add(notify);
    return () => listeners.delete(notify);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log({email, password})
      const res = await axiosInstance.post('/api/auth/login', { "email": email, "password": password });
      if (!res.data?.accessToken) return false; // isSuccess=false 방어
      tokenStore.set(res.data);
      setLogin(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setLogin(false);
  }, []);

  return { isAdmin, login, logout };
}
