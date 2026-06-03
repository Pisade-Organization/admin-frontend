import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { shouldRefreshAdminSession } from '@/shared/lib/adminAuth';
import {
  applyAdminSessionCookies,
  clearAdminSessionCookies,
} from '@/shared/lib/adminSessionCookies';

type RefreshResponse = {
  success?: boolean;
  data?: {
    access_token?: string;
    refresh_token?: string;
  };
};

function getBackendBaseUrl() {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:4000'
  );
}

function canSkipAuthRefresh(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth/callback') ||
    pathname === '/favicon.ico'
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (canSkipAuthRefresh(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value?.trim() ?? null;
  const refreshToken =
    request.cookies.get('refreshToken')?.value?.trim() ?? null;

  if (!shouldRefreshAdminSession({ accessToken, refreshToken })) {
    return NextResponse.next();
  }

  try {
    const refreshResponse = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!refreshResponse.ok) {
      const response = NextResponse.next();

      if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        clearAdminSessionCookies(response);
      }

      return response;
    }

    const payload = (await refreshResponse.json()) as RefreshResponse;
    const nextAccessToken = payload.data?.access_token?.trim();
    const nextRefreshToken = payload.data?.refresh_token?.trim();

    if (!nextAccessToken || !nextRefreshToken) {
      const response = NextResponse.next();
      clearAdminSessionCookies(response);
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-access-token', nextAccessToken);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    applyAdminSessionCookies(response, nextAccessToken, nextRefreshToken);
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
