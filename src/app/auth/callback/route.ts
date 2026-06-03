import { NextResponse } from 'next/server';

function buildRedirectUrl(request: Request) {
  return new URL('/overview', request.url);
}

function applySessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  });
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('access');
  const refreshToken = searchParams.get('refresh');
  const redirectUrl = buildRedirectUrl(request);

  if (!accessToken || !refreshToken) {
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  applySessionCookies(response, accessToken, refreshToken);

  return response;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        accessToken?: string;
        refreshToken?: string;
      }
    | null;

  const accessToken = body?.accessToken?.trim();
  const refreshToken = body?.refreshToken?.trim();

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: 'Missing access or refresh token' },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  applySessionCookies(response, accessToken, refreshToken);

  return response;
}
