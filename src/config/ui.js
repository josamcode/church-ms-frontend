/*
 * Global UI switches — one place to turn shared UI features on/off app-wide.
 *
 * BREADCRUMBS_ENABLED controls the breadcrumb trail on EVERY page at once. The
 * shared <Breadcrumbs /> component reads this flag and renders nothing when it
 * is false, so you never have to touch individual pages.
 *
 * How to switch:
 *   • Quick / permanent : flip DEFAULT_BREADCRUMBS_ENABLED below.
 *   • Without editing code (build time): set REACT_APP_BREADCRUMBS_ENABLED to
 *     "true" or "false" in your .env, then restart the dev server / rebuild.
 */

// ⬇️  Flip this single value: false = hide breadcrumbs everywhere, true = show.
const DEFAULT_BREADCRUMBS_ENABLED = false;

const breadcrumbsEnvOverride = process.env.REACT_APP_BREADCRUMBS_ENABLED;

export const BREADCRUMBS_ENABLED =
  breadcrumbsEnvOverride === 'true'
    ? true
    : breadcrumbsEnvOverride === 'false'
      ? false
      : DEFAULT_BREADCRUMBS_ENABLED;
