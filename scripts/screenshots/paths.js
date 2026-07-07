const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const screenshotsRoot = path.join(projectRoot, 'screenshots');
const authDir = path.join(projectRoot, '.auth');
const storageStatePath = path.join(authDir, 'playwright-storage-state.json');
const routeManifestPath = path.join(__dirname, 'route-manifest.json');

module.exports = {
  authDir,
  projectRoot,
  routeManifestPath,
  screenshotsRoot,
  storageStatePath,
};
