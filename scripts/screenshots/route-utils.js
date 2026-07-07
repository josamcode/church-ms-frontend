function normalizeRoutePath(value) {
  if (!value || value === '/') return '/';
  return `/${String(value).replace(/^\/+|\/+$/g, '')}`;
}

function joinRoutePath(parentPath, childPath) {
  if (!childPath) return normalizeRoutePath(parentPath);
  if (childPath.startsWith('/')) return normalizeRoutePath(childPath);
  if (!parentPath || parentPath === '/') return normalizeRoutePath(childPath);
  return normalizeRoutePath(`${parentPath}/${childPath}`);
}

function isDynamicRoute(routePath) {
  return /(^|\/):[^/]+|\[[^/]+\]/.test(routePath);
}

function routeToFilename(routePath, viewportName) {
  const normalized = normalizeRoutePath(routePath);
  const withoutLeadingSlash = normalized === '/' ? 'home' : normalized.slice(1);
  const safePath = withoutLeadingSlash
    .replace(/[:[\]]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `${safePath || 'home'}-${viewportName}.png`;
}

module.exports = {
  isDynamicRoute,
  joinRoutePath,
  normalizeRoutePath,
  routeToFilename,
};
