'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Customer } from '@/types';
import {
  getToken,
  setToken,
  removeToken,
  getStoredCustomer,
  setStoredCustomer,
  apiLogin,
  apiRegister,
  apiLogout,
  apiMe,
  getSocialLoginUrl,
} from '@/lib/auth';
import { AuthModal } from '@/components/shared/AuthModal';

export interface AuthContextValue {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, turnstileToken: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'facebook') => void;
  logout: () => Promise<void>;
  setAuth: (token: string, customer: Customer) => void;
  openAuthModal: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setTokenState]  = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Callback to execute after successful auth (e.g. retry a like action)
  const postAuthCallback = useRef<(() => void) | null>(null);

  // ── Rehydrate from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    const storedToken    = getToken();
    const storedCustomer = getStoredCustomer();

    if (storedToken && storedCustomer) {
      setTokenState(storedToken);
      setCustomer(storedCustomer);
      // Verify token is still valid in background
      apiMe(storedToken)
        .then(({ customer: fresh }) => {
          setCustomer(fresh);
          setStoredCustomer(fresh);
        })
        .catch(() => {
          removeToken();
          setTokenState(null);
          setCustomer(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setAuth = useCallback((t: string, c: Customer) => {
    setToken(t);
    setStoredCustomer(c);
    setTokenState(t);
    setCustomer(c);
    setIsModalOpen(false);
    postAuthCallback.current?.();
    postAuthCallback.current = null;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { customer: c, token: t } = await apiLogin(email, password);
    setAuth(t, c);
  }, [setAuth]);

  const register = useCallback(async (
    name: string, email: string, password: string, passwordConfirmation: string, turnstileToken: string,
  ) => {
    const { customer: c, token: t } = await apiRegister(name, email, password, passwordConfirmation, turnstileToken);
    setAuth(t, c);
  }, [setAuth]);

  const logout = useCallback(async () => {
    if (token) await apiLogout(token).catch(() => {});
    removeToken();
    setTokenState(null);
    setCustomer(null);
  }, [token]);

  const loginWithSocial = useCallback((provider: 'google' | 'facebook') => {
    const url    = getSocialLoginUrl(provider);
    const popup  = window.open(url, 'oauth', 'width=500,height=620,scrollbars=yes,resizable=yes');

    function handleMessage(event: MessageEvent) {
      // Only trust messages with a token payload
      if (event.data?.token && event.data?.customer) {
        setAuth(event.data.token as string, event.data.customer as Customer);
        window.removeEventListener('message', handleMessage);
        popup?.close();
      } else if (event.data?.error) {
        window.removeEventListener('message', handleMessage);
      }
    }

    window.addEventListener('message', handleMessage);
  }, [setAuth]);

  const openAuthModal = useCallback((onSuccess?: () => void) => {
    postAuthCallback.current = onSuccess ?? null;
    setIsModalOpen(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{ customer, token, isLoading, login, register, loginWithSocial, logout, setAuth, openAuthModal }}
    >
      {children}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        login={login}
        register={register}
        loginWithSocial={loginWithSocial}
      />
    </AuthContext.Provider>
  );
}
