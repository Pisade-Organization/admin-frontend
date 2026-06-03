const ACCESS_TOKEN_EXPIRY_SKEW_SECONDS = 30;

type AdminSessionTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

function decodeJwtPayload(token: string) {
  const segments = token.split('.');

  if (segments.length < 2 || !segments[1]) {
    return null;
  }

  try {
    const normalizedSegment = segments[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(segments[1].length / 4) * 4, '=');
    const payload = atob(normalizedSegment);
    return JSON.parse(payload) as { exp?: unknown };
  } catch {
    return null;
  }
}

export function isAdminAccessTokenExpired(
  token: string,
  now = Date.now(),
  skewSeconds = ACCESS_TOKEN_EXPIRY_SKEW_SECONDS,
) {
  const payload = decodeJwtPayload(token);
  const exp =
    typeof payload?.exp === 'number'
      ? payload.exp
      : typeof payload?.exp === 'string'
        ? Number(payload.exp)
        : Number.NaN;

  if (!Number.isFinite(exp) || exp <= 0) {
    return true;
  }

  return exp <= Math.floor(now / 1000) + skewSeconds;
}

export function shouldRefreshAdminSession({
  accessToken,
  refreshToken,
}: AdminSessionTokens) {
  if (!refreshToken) {
    return false;
  }

  if (!accessToken) {
    return true;
  }

  return isAdminAccessTokenExpired(accessToken);
}
