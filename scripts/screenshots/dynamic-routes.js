const fs = require('fs');
const { storageStatePath } = require('./paths');

function getApiBaseUrl() {
  return process.env.SCREENSHOT_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
}

function readAuthToken() {
  if (!fs.existsSync(storageStatePath)) return null;

  const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));
  for (const origin of state.origins || []) {
    const token = origin.localStorage?.find((entry) => entry.name === 'church_access_token')?.value;
    if (token) return token;
  }

  return null;
}

function pickId(value) {
  if (!value || typeof value !== 'object') return null;
  return value.id || value._id || value.userId || value.memberId || value.bookingTypeId || null;
}

function pickList(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

async function getJson(endpoint, token) {
  const url = new URL(endpoint, getApiBaseUrl().replace(/\/?$/, '/'));
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url.pathname}`);
  }

  return response.json();
}

async function firstId(endpoint, token) {
  const payload = await getJson(endpoint, token);
  return pickId(pickList(payload)[0]);
}

async function resolveMeetingMember(meetingId, token) {
  const payload = await getJson(`meetings/${meetingId}`, token);
  const meeting = payload?.data?.data || payload?.data || payload;
  const members = meeting?.members || meeting?.servants || [];
  const firstMember = Array.isArray(members) ? members[0] : null;
  return pickId(firstMember?.user || firstMember);
}

async function resolveDivineLiturgyAttendance(token) {
  const payload = await getJson('divine-liturgies', token);
  const data = payload?.data?.data || payload?.data || payload;
  const recurring = Array.isArray(data?.recurring) ? data.recurring[0] : null;
  const exceptions = Array.isArray(data?.exceptions) ? data.exceptions[0] : null;
  if (recurring && pickId(recurring)) return { entryType: 'recurring', id: pickId(recurring) };
  if (exceptions && pickId(exceptions)) return { entryType: 'exception', id: pickId(exceptions) };
  return null;
}

async function resolveConcreteRoute(pattern, token) {
  if (pattern === '/dashboard/users/:id' || pattern === '/dashboard/users/:id/edit') {
    const id = await firstId('users?limit=1', token);
    return id ? pattern.replace(':id', encodeURIComponent(id)) : null;
  }

  if (pattern === '/dashboard/visitations/:id') {
    const id = await firstId('visitations?limit=1', token);
    return id ? pattern.replace(':id', encodeURIComponent(id)) : null;
  }

  if (pattern === '/dashboard/notifications/:id' || pattern === '/dashboard/notifications/:id/edit') {
    const id = await firstId('notifications/content?limit=1', token);
    return id ? pattern.replace(':id', encodeURIComponent(id)) : null;
  }

  if (pattern === '/dashboard/lords-brethren/aid-history/notifications/:id') {
    const id = await firstId('notifications/content?limit=1&sourceType=aid_recurring', token);
    return id ? pattern.replace(':id', encodeURIComponent(id)) : null;
  }

  if (pattern === '/dashboard/bookings/types/:id/edit') {
    const id = await firstId('bookings/types', token);
    return id ? pattern.replace(':id', encodeURIComponent(id)) : null;
  }

  if (pattern === '/dashboard/meetings/sectors/:id' || pattern === '/dashboard/meetings/sectors/:id/edit') {
    const id = await firstId('meetings/sectors?limit=1', token);
    return id ? pattern.replace(':id', encodeURIComponent(id)) : null;
  }

  if (
    pattern === '/dashboard/meetings/list/:id' ||
    pattern === '/dashboard/meetings/list/:id/attendance' ||
    pattern === '/dashboard/meetings/list/:id/documentation' ||
    pattern === '/dashboard/meetings/list/:id/settings' ||
    pattern === '/dashboard/meetings/:id/edit'
  ) {
    const id = await firstId('meetings?limit=1', token);
    return id ? pattern.replace(':id', encodeURIComponent(id)) : null;
  }

  if (pattern === '/dashboard/meetings/list/:meetingId/members/:memberId') {
    const meetingId = await firstId('meetings?limit=1', token);
    if (!meetingId) return null;
    const memberId = await resolveMeetingMember(meetingId, token);
    return memberId
      ? pattern
          .replace(':meetingId', encodeURIComponent(meetingId))
          .replace(':memberId', encodeURIComponent(memberId))
      : null;
  }

  if (pattern === '/dashboard/divine-liturgies/attendance/:entryType/:id') {
    const sample = await resolveDivineLiturgyAttendance(token);
    return sample
      ? pattern
          .replace(':entryType', encodeURIComponent(sample.entryType))
          .replace(':id', encodeURIComponent(sample.id))
      : null;
  }

  return null;
}

async function resolveDynamicRoutes(routes) {
  const token = readAuthToken();
  const resolved = [];
  const skipped = [];

  for (const route of routes.filter((candidate) => candidate.dynamic)) {
    try {
      if (route.protected && !token) {
        skipped.push({
          path: route.path,
          reason: 'No saved auth state/token available for protected dynamic route.',
        });
        continue;
      }

      const concretePath = await resolveConcreteRoute(route.path, token);
      if (concretePath) {
        resolved.push({ ...route, path: concretePath, pattern: route.path, dynamic: false });
      } else {
        skipped.push({
          path: route.path,
          reason: 'No safe sample ID could be discovered from known read-only API endpoints.',
        });
      }
    } catch (error) {
      skipped.push({
        path: route.path,
        reason: error.message || String(error),
      });
    }
  }

  return { resolved, skipped };
}

module.exports = {
  resolveDynamicRoutes,
};
