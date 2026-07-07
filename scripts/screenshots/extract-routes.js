const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { isDynamicRoute, joinRoutePath } = require('./route-utils');
const { projectRoot, routeManifestPath } = require('./paths');

const routerPath = path.join(projectRoot, 'src', 'app', 'router.js');

function getStaticString(node) {
  if (!node) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((quasi) => quasi.value.cooked).join('');
  }
  return null;
}

function getProperty(objectNode, name) {
  return objectNode.properties.find((property) => {
    if (property.type !== 'ObjectProperty') return false;
    const key = property.key;
    return (
      (key.type === 'Identifier' && key.name === name) ||
      (key.type === 'StringLiteral' && key.value === name)
    );
  });
}

function getBooleanProperty(objectNode, name) {
  const property = getProperty(objectNode, name);
  return property?.value?.type === 'BooleanLiteral' ? property.value.value : false;
}

function getChildren(objectNode) {
  const property = getProperty(objectNode, 'children');
  return property?.value?.type === 'ArrayExpression' ? property.value.elements.filter(Boolean) : [];
}

function expressionText(source, node) {
  if (!node) return '';
  return source.slice(node.start, node.end);
}

function collectPermissions(source, objectNode) {
  const text = expressionText(source, getProperty(objectNode, 'element')?.value);
  const requiredMatch = text.match(/required=\{\[([\s\S]*?)\]\}/);
  if (!requiredMatch) return [];

  return [...requiredMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function routeKindFromElement(source, objectNode, inheritedKind) {
  const text = expressionText(source, getProperty(objectNode, 'element')?.value);
  if (text.includes('AuthGuard')) return 'protected';
  if (text.includes('GuestGuard')) return 'guest';
  return inheritedKind || 'public';
}

function routeEntry(source, objectNode, parentPath, inheritedKind) {
  const pathProperty = getProperty(objectNode, 'path');
  const ownPath = getStaticString(pathProperty?.value);
  const isIndex = getBooleanProperty(objectNode, 'index');
  const fullPath = isIndex ? parentPath || '/' : joinRoutePath(parentPath, ownPath);
  const kind = routeKindFromElement(source, objectNode, inheritedKind);
  const elementText = expressionText(source, getProperty(objectNode, 'element')?.value);

  return {
    path: fullPath,
    routePath: ownPath || (isIndex ? '(index)' : ''),
    kind,
    protected: kind === 'protected',
    guestOnly: kind === 'guest',
    dynamic: isDynamicRoute(fullPath),
    wildcard: fullPath.includes('*'),
    permissions: collectPermissions(source, objectNode),
    source: {
      file: path.relative(projectRoot, routerPath).replace(/\\/g, '/'),
      line: source.slice(0, objectNode.start).split('\n').length,
    },
    hasElement: Boolean(elementText),
  };
}

function walkRoutes(source, routeNodes, parentPath = '/', inheritedKind = 'public', collected = []) {
  for (const node of routeNodes) {
    if (node.type !== 'ObjectExpression') continue;

    const entry = routeEntry(source, node, parentPath, inheritedKind);
    const children = getChildren(node);

    if (entry.hasElement || getProperty(node, 'path') || getBooleanProperty(node, 'index')) {
      collected.push(entry);
    }

    walkRoutes(source, children, entry.path, entry.kind, collected);
  }

  return collected;
}

function extractRoutes() {
  const source = fs.readFileSync(routerPath, 'utf8');
  const ast = parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'dynamicImport'],
    ranges: true,
  });

  let routesArray = null;
  traverse(ast, {
    CallExpression(pathRef) {
      if (pathRef.node.callee?.name !== 'createBrowserRouter') return;
      const [firstArg] = pathRef.node.arguments;
      if (firstArg?.type === 'ArrayExpression') {
        routesArray = firstArg;
        pathRef.stop();
      }
    },
  });

  if (!routesArray) {
    throw new Error(`Could not find createBrowserRouter([...]) in ${routerPath}`);
  }

  const routes = walkRoutes(source, routesArray.elements.filter(Boolean))
    .filter((route) => !route.wildcard)
    .filter((route, index, allRoutes) => {
      const firstIndex = allRoutes.findIndex((candidate) => candidate.path === route.path);
      return firstIndex === index;
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    generatedAt: new Date().toISOString(),
    framework: 'Create React App + React Router',
    routerSource: path.relative(projectRoot, routerPath).replace(/\\/g, '/'),
    counts: {
      total: routes.length,
      static: routes.filter((route) => !route.dynamic).length,
      dynamic: routes.filter((route) => route.dynamic).length,
      protected: routes.filter((route) => route.protected).length,
      public: routes.filter((route) => route.kind === 'public').length,
      guest: routes.filter((route) => route.guestOnly).length,
    },
    routes,
  };
}

function main() {
  const manifest = extractRoutes();
  fs.writeFileSync(routeManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${manifest.routes.length} routes to ${path.relative(projectRoot, routeManifestPath)}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  extractRoutes,
};
