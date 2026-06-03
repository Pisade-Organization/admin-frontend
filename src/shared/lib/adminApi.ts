import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import {
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

export async function fetchAdminApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await getAdminAccessToken();
  const headers = new Headers(init?.headers);

  headers.set('Accept', 'application/json');

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
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
    fetchProfile?: () => Promise<AdminProfileResponse>;
  } = {},
) {
  return resolveAdminShellUser({
    getAccessToken: deps.getAccessToken ?? getAdminAccessToken,
    fetchProfile:
      deps.fetchProfile ?? (() => fetchAdminApi<AdminProfileResponse>('/v1/me')),
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
