const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { loadScreenshotEnv } = require('./env');
const { extractRoutes } = require('./extract-routes');
const { resolveDynamicRoutes } = require('./dynamic-routes');
const { projectRoot, routeManifestPath, screenshotsRoot, storageStatePath } = require('./paths');
const { routeToFilename } = require('./route-utils');

loadScreenshotEnv(projectRoot);

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

function makeRunId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

async function waitForPageReady(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page
    .waitForFunction(() => document.fonts?.status === 'loaded', null, { timeout: 10000 })
    .catch(() => {});
  await page
    .locator('.animate-spin, [aria-busy="true"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(Number(process.env.SCREENSHOT_SETTLE_MS || 1000));
}

async function captureRoute(page, route, viewport, outputDir) {
  const url = new URL(route.path, baseUrl).toString();
  const filename = routeToFilename(route.pattern || route.path, viewport.name);
  const filePath = path.join(outputDir, viewport.name, filename);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForPageReady(page);
  await page.screenshot({ path: filePath, fullPage: true });

  return filePath;
}

async function main() {
  const manifest = extractRoutes();
  fs.writeFileSync(routeManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const hasStorageState = fs.existsSync(storageStatePath);
  const staticRoutes = manifest.routes.filter((route) => !route.dynamic);
  const { resolved, skipped } = await resolveDynamicRoutes(manifest.routes);
  const routesToCapture = [...staticRoutes, ...resolved].sort((a, b) => a.path.localeCompare(b.path));

  const runId = process.env.SCREENSHOT_RUN_ID || makeRunId();
  const outputDir = path.join(screenshotsRoot, runId);
  const report = {
    runId,
    baseUrl,
    generatedAt: new Date().toISOString(),
    routeManifest: path.relative(projectRoot, routeManifestPath).replace(/\\/g, '/'),
    storageState: hasStorageState ? path.relative(projectRoot, storageStatePath).replace(/\\/g, '/') : null,
    viewports,
    successfulRoutes: [],
    skippedDynamicRoutes: skipped,
    failedRoutes: [],
  };

  const browser = await chromium.launch({ headless: process.env.SCREENSHOT_HEADLESS !== 'false' });
  const contextOptions = hasStorageState ? { storageState: storageStatePath } : {};

  try {
    for (const viewport of viewports) {
      const publicContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const authContext = hasStorageState
        ? await browser.newContext({
            ...contextOptions,
            viewport: { width: viewport.width, height: viewport.height },
          })
        : null;

      const publicPage = await publicContext.newPage();
      const authPage = authContext ? await authContext.newPage() : null;

      for (const route of routesToCapture) {
        try {
          if (route.protected && !hasStorageState) {
            report.failedRoutes.push({
              path: route.path,
              viewport: viewport.name,
              error: 'Protected route requires saved auth state. Run npm run screenshots:auth first.',
            });
            continue;
          }

          const page = route.protected ? authPage : publicPage;
          const filePath = await captureRoute(page, route, viewport, outputDir);
          report.successfulRoutes.push({
            path: route.path,
            pattern: route.pattern || route.path,
            viewport: viewport.name,
            filePath: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
          });
          console.log(`[ok] ${viewport.name} ${route.path}`);
        } catch (error) {
          report.failedRoutes.push({
            path: route.path,
            pattern: route.pattern || route.path,
            viewport: viewport.name,
            error: error.message || String(error),
          });
          console.error(`[failed] ${viewport.name} ${route.path}: ${error.message || error}`);
        }
      }

      if (authContext) await authContext.close();
      await publicContext.close();
    }
  } finally {
    await browser.close();
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, 'screenshots-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote screenshot report to ${path.relative(projectRoot, reportPath)}`);

  if (report.failedRoutes.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
