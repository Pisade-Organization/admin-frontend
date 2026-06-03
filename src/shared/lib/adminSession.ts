import { normalizeAvatarSrc } from './avatar.ts';

export type AdminProfileResponse = {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  profile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
};

export type AdminShellUser = {
  name: string;
  email: string;
  avatarSrc: string | null;
};

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

export function createAdminApiError(input: {
  message: string;
  status: number;
  code?: string;
}) {
  const code =
    input.code ??
    (input.status === 401
      ? 'ADMIN_AUTH_REQUIRED'
      : input.status === 403
        ? 'ADMIN_FORBIDDEN'
        : 'ADMIN_REQUEST_FAILED');

  return new AdminApiError(input.message, input.status, code);
}

export function isAdminAuthError(error: unknown) {
  return (
    error instanceof AdminApiError &&
    (error.status === 401 || error.status === 403)
  );
}

export function normalizeAdminShellUser(
  profile: AdminProfileResponse,
): AdminShellUser {
  return {
    name: profile.profile?.fullName ?? profile.fullName ?? profile.email,
    email: profile.email,
    avatarSrc: normalizeAvatarSrc(
      profile.profile?.avatarUrl ?? profile.avatarUrl,
    ),
  };
}

export async function resolveAdminShellUser(
  deps: {
    getAccessToken: () => Promise<string | null>;
    fetchProfile: (accessToken?: string | null) => Promise<AdminProfileResponse>;
    refreshAccessToken?: () => Promise<string | null>;
  },
): Promise<AdminShellUser | null> {
  const accessToken = await deps.getAccessToken();

  if (accessToken) {
    try {
      return normalizeAdminShellUser(await deps.fetchProfile(accessToken));
    } catch (error) {
      if (!deps.refreshAccessToken) {
        throw error;
      }
    }
  }

  if (!deps.refreshAccessToken) {
    return null;
  }

  const refreshedAccessToken = await deps.refreshAccessToken();

  if (!refreshedAccessToken) {
    return null;
  }

  const profile = await deps.fetchProfile(refreshedAccessToken);

  return normalizeAdminShellUser(profile);
}
