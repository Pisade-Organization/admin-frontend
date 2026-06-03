import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAdminAccessTokenExpired,
  shouldRefreshAdminSession,
} from '../adminAuth.ts';

function createJwt(payload: Record<string, unknown>) {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}

test('marks expired admin access tokens as expired', () => {
  const token = createJwt({
    exp: Math.floor(Date.now() / 1000) - 10,
  });

  assert.equal(isAdminAccessTokenExpired(token), true);
});

test('keeps valid admin access tokens active before expiry skew', () => {
  const token = createJwt({
    exp: Math.floor(Date.now() / 1000) + 5 * 60,
  });

  assert.equal(isAdminAccessTokenExpired(token), false);
});

test('refreshes the admin session when the access token is expired but the refresh token exists', () => {
  const expiredToken = createJwt({
    exp: Math.floor(Date.now() / 1000) - 10,
  });

  assert.equal(
    shouldRefreshAdminSession({
      accessToken: expiredToken,
      refreshToken: 'refresh-token',
    }),
    true,
  );
});

test('does not refresh the admin session when the access token is still valid', () => {
  const validToken = createJwt({
    exp: Math.floor(Date.now() / 1000) + 5 * 60,
  });

  assert.equal(
    shouldRefreshAdminSession({
      accessToken: validToken,
      refreshToken: 'refresh-token',
    }),
    false,
  );
});
