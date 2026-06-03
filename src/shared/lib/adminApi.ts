import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import {
  AdminApiError,
  type AdminProfileResponse,
  createAdminApiError,
  resolveAdminShellUser,
} from '@/shared/lib/adminSession';
export {
  type AdminProfileResponse,
  type AdminShellUser,
  AdminApiError,
  createAdminApiError,
  isAdminAuthError,
  normalizeAdminShellUser,
} from '@/shared/lib/adminSession';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:4000'
  );
}

export async function getAdminAccessToken() {
  const requestHeaders = await headers();
  const cookieStore = await cookies();

  return (
    requestHeaders.get('x-admin-access-token') ||
    cookieStore.get('accessToken')?.value ||
    cookieStore.get('access_token')?.value ||
    process.env.ADMIN_ACCESS_TOKEN ||
    null
  );
}

export async function getAdminRefreshToken() {
  const requestHeaders = await headers();
  const cookieStore = await cookies();

  return (
    requestHeaders.get('x-admin-refresh-token') ||
    cookieStore.get('refreshToken')?.value ||
    cookieStore.get('refresh_token')?.value ||
    process.env.ADMIN_REFRESH_TOKEN ||
    null
  );
}

export async function hasAdminSessionTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    getAdminAccessToken(),
    getAdminRefreshToken(),
  ]);

  return Boolean(accessToken || refreshToken);
}

export async function fetchAdminApi<T>(
  path: string,
  init?: RequestInit,
  accessTokenOverride?: string | null,
): Promise<T> {
  const accessToken = accessTokenOverride ?? (await getAdminAccessToken());
  const headers = new Headers(init?.headers);

  headers.set('Accept', 'application/json');

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : 'Backend request failed before a response was received.';

    logAdminRequestFailure('fetchAdminApi', `${getBackendBaseUrl()}${path}`, {
      message,
      error,
      hasAccessToken: Boolean(accessToken),
    });

    throw createAdminApiError({
      message,
      status: 503,
      code: 'ADMIN_BACKEND_UNREACHABLE',
    });
  }

  if (!response.ok) {
    logAdminRequestFailure('fetchAdminApi', `${getBackendBaseUrl()}${path}`, {
      status: response.status,
      message: await getApiErrorMessage(response),
      hasAccessToken: Boolean(accessToken),
    });

    throw createAdminApiError({
      message: await getApiErrorMessage(response),
      status: response.status,
    });
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export async function fetchPublicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw createAdminApiError({
      message: await getApiErrorMessage(response),
      status: response.status,
      code: 'PUBLIC_REQUEST_FAILED',
    });
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export async function getAdminShellUser(
  deps: {
    getAccessToken?: () => Promise<string | null>;
    fetchProfile?: (accessToken?: string | null) => Promise<AdminProfileResponse>;
    refreshAccessToken?: () => Promise<string | null>;
  } = {},
) {
  try {
    return await resolveAdminShellUser({
      getAccessToken: deps.getAccessToken ?? getAdminAccessToken,
      fetchProfile:
        deps.fetchProfile ??
        ((accessToken) =>
          fetchAdminApi<AdminProfileResponse>('/v1/me', undefined, accessToken)),
      refreshAccessToken: deps.refreshAccessToken ?? refreshAdminAccessToken,
    });
  } catch (error) {
    logAdminShellError('getAdminShellUser', error);
    throw error;
  }
}

async function refreshAdminAccessToken() {
  const refreshToken = await getAdminRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw createAdminApiError({
      message: await getApiErrorMessage(response),
      status: response.status,
    });
  }

  const payload = (await response.json()) as unknown;

  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  if ('data' in payload) {
    const data = payload as { data?: { access_token?: string } };
    return data.data?.access_token?.trim() || null;
  }

  if ('access_token' in payload) {
    const flat = payload as { access_token?: string };
    return flat.access_token?.trim() || null;
  }

  return null;
}

function logAdminShellError(scope: string, error: unknown) {
  const details =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          status: error instanceof AdminApiError ? error.status : undefined,
          code: error instanceof AdminApiError ? error.code : undefined,
        }
      : { value: error };

  console.error(`[admin] ${scope} failed`, details);
}

export function logAdminRequestFailure(
  scope: string,
  url: string,
  details: Record<string, unknown>,
) {
  console.error(`[admin] ${scope} request failed`, {
    url,
    ...details,
  });
}

async function getApiErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string | string[] };
    };
    const message = payload.error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  } catch {
    // Ignore invalid JSON responses and fall back to status text.
  }

  return response.statusText || `Request failed with status ${response.status}`;
}
