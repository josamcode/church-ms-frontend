const fs = require('fs');
const { chromium } = require('playwright');
const { loadScreenshotEnv } = require('./env');
const { authDir, projectRoot, storageStatePath } = require('./paths');

loadScreenshotEnv(projectRoot);

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
const username = process.env.SCREENSHOT_USER || process.env.SCREENSHOT_IDENTIFIER;
const password = process.env.SCREENSHOT_PASSWORD;

async function main() {
  if (!username || !password) {
    throw new Error('Set SCREENSHOT_USER and SCREENSHOT_PASSWORD before running screenshots:auth.');
  }

  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch({ headless: process.env.SCREENSHOT_HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  try {
    await page.goto(new URL('/auth/login', baseUrl).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.locator('input:not([type="password"])').first().fill(username);
    await page.locator('input[type="password"]').fill(password);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 60000 }),
      page.locator('button[type="submit"]').click(),
    ]);

    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.context().storageState({ path: storageStatePath });
    console.log(`Saved authenticated storage state to ${storageStatePath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
