type CookieResponse = {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  };
};

function isSecureCookie() {
  return process.env.NODE_ENV === 'production';
}

function getBaseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecureCookie(),
    path: '/',
  };
}

export function applyAdminSessionCookies(
  response: CookieResponse,
  accessToken: string,
  refreshToken: string,
) {
  const options = getBaseCookieOptions();

  response.cookies.set('accessToken', accessToken, options);
  response.cookies.set('refreshToken', refreshToken, options);
}

export function clearAdminSessionCookies(response: CookieResponse) {
  const options = getBaseCookieOptions();

  response.cookies.set('accessToken', '', {
    ...options,
    maxAge: 0,
  });
  response.cookies.set('refreshToken', '', {
    ...options,
    maxAge: 0,
  });
}
