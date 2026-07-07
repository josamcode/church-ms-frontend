# Automated Screenshots

This frontend has a Playwright screenshot system for the React Router app.

## Install

From `frontend`:

```bash
npm install
npx playwright install chromium
```

## Routes

Routes are discovered from `src/app/router.js`, not maintained by hand. Generate or refresh the manifest with:

```bash
npm run screenshots:routes
```

The manifest is written to `scripts/screenshots/route-manifest.json`.

## Auth State

Protected dashboard pages need an authenticated browser storage state. Add these values to your local `.env` or shell environment:

```bash
SCREENSHOT_BASE_URL=http://localhost:3000
SCREENSHOT_API_URL=http://localhost:5000/api
SCREENSHOT_USER=your-login-identifier
SCREENSHOT_PASSWORD=your-password
```

Then start the frontend and backend locally, and run:

```bash
npm run screenshots:auth
```

This saves `.auth/playwright-storage-state.json`. The `.auth` folder is ignored by git.

## Capture Screenshots

With the app running:

```bash
npm run screenshots
```

Screenshots are saved under:

```text
screenshots/<YYYY-MM-DD-HH-mm>/desktop
screenshots/<YYYY-MM-DD-HH-mm>/tablet
screenshots/<YYYY-MM-DD-HH-mm>/mobile
```

The viewports are:

- Desktop: `1440x1000`
- Tablet: `768x1024`
- Mobile: `390x844`

Each run also writes:

```text
screenshots/<run-id>/screenshots-report.json
```

The report includes successful screenshots, skipped dynamic routes, failed route visits, error messages, and screenshot paths.

## Dynamic Routes

Dynamic routes such as `/dashboard/users/:id` are resolved only from known read-only API endpoints and the saved auth token. If no safe real ID can be found, the route is skipped and listed in `skippedDynamicRoutes`.

## Clean Output

Remove generated screenshots with:

```bash
npm run screenshots:clean
```
