import { NextResponse } from 'next/server';
import { clearAdminSessionCookies } from '@/shared/lib/adminSessionCookies';

function getRedirectTarget(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl')?.trim();

  if (callbackUrl) {
    return new URL(callbackUrl, request.url);
  }

  return new URL('/', request.url);
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(getRedirectTarget(request));
  clearAdminSessionCookies(response);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAdminSessionCookies(response);
  return response;
}
