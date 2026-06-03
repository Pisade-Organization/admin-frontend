import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AdminApiError,
  createAdminApiError,
  isAdminAuthError,
  resolveAdminShellUser,
} from '../adminSession.ts';

test('marks 401 and 403 responses as auth errors', () => {
  const unauthorized = createAdminApiError({
    message: 'Unauthorized',
    status: 401,
    code: 'ADMIN_AUTH_REQUIRED',
  });
  const forbidden = createAdminApiError({
    message: 'Forbidden',
    status: 403,
    code: 'ADMIN_FORBIDDEN',
  });

  assert.equal(unauthorized instanceof AdminApiError, true);
  assert.equal(forbidden instanceof AdminApiError, true);
  assert.equal(isAdminAuthError(unauthorized), true);
  assert.equal(isAdminAuthError(forbidden), true);
});

test('returns null shell user when token is missing', async () => {
  const result = await resolveAdminShellUser({
    getAccessToken: async () => null,
    fetchProfile: async () => {
      throw new Error('should not be called');
    },
  });

  assert.equal(result, null);
});

test('refreshes the shell user when the access token is missing but refresh succeeds', async () => {
  let profileCalls = 0;

  const result = await resolveAdminShellUser({
    getAccessToken: async () => null,
    refreshAccessToken: async () => 'fresh-access-token',
    fetchProfile: async (accessToken) => {
      profileCalls += 1;
      assert.equal(accessToken, 'fresh-access-token');
      return {
        id: 'user-1',
        email: 'admin@example.com',
        fullName: 'Admin User',
        avatarUrl: null,
      };
    },
  });

  assert.equal(profileCalls, 1);
  assert.deepEqual(result, {
    name: 'Admin User',
    email: 'admin@example.com',
    avatarSrc: null,
  });
});
