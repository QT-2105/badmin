'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

const SESSION_EXPIRED_REASON = 'session-expired';
const SESSION_EXPIRED_NOTICE_KEY = 'badmin_session_expired_notice';

function shouldHandleUnauthorized(url: URL): boolean {
  if (!url.pathname.startsWith('/api/')) return false;
  if (url.pathname === '/api/auth/login') return false;
  if (url.pathname === '/api/auth/bootstrap') return false;
  if (url.pathname === '/api/auth/logout') return false;
  return true;
}

function getRequestUrl(input: RequestInfo | URL): URL | null {
  try {
    if (typeof input === 'string' || input instanceof URL) return new URL(input, window.location.origin);
    return new URL(input.url, window.location.origin);
  } catch {
    return null;
  }
}

function redirectToLogin(): void {
  if (window.location.pathname === '/login') return;

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const target = new URL('/login', window.location.origin);
  target.searchParams.set('reason', SESSION_EXPIRED_REASON);
  target.searchParams.set('next', currentPath || '/dashboard');
  window.sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
  window.location.assign(target.toString());
}

export function AuthSessionBoundary({ children }: { children: ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    let redirecting = false;

    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      const requestUrl = getRequestUrl(input);
      if (!redirecting && response.status === 401 && requestUrl && shouldHandleUnauthorized(requestUrl)) {
        redirecting = true;
        redirectToLogin();
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return children;
}

export function consumeSessionExpiredNotice(searchParams: URLSearchParams): string | null {
  if (typeof window === 'undefined') return null;
  const storedNotice = window.sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY);
  window.sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
  if (storedNotice) return storedNotice;
  if (searchParams.get('reason') === SESSION_EXPIRED_REASON) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.';
  }
  return null;
}
