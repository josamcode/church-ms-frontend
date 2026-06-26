jest.mock('../api/endpoints', () => ({
  authApi: {},
}));

import { resolveEffectivePermissions } from './auth.hooks';

describe('resolveEffectivePermissions', () => {
  it('trusts response effectivePermissions when it is an empty array', () => {
    const user = {
      role: 'superadmin',
      effectivePermissions: ['users:read'],
      extraPermissions: ['settings:update'],
    };

    expect(resolveEffectivePermissions(user, [])).toEqual([]);
  });

  it('trusts user effectivePermissions when it is an empty array', () => {
    const user = {
      role: 'superadmin',
      effectivePermissions: [],
      extraPermissions: ['settings:update'],
    };

    expect(resolveEffectivePermissions(user)).toEqual([]);
  });

  it('falls back to local computation only when backend value is non-array', () => {
    const user = {
      role: 'USER',
      effectivePermissions: null,
      extraPermissions: ['BOOKINGS_VIEW'],
      deniedPermissions: [],
    };

    expect(resolveEffectivePermissions(user)).toContain('BOOKINGS_VIEW');
  });
});
