const fs = require('fs');
const path = require('path');
const { projectRoot, screenshotsRoot } = require('./paths');

if (fs.existsSync(screenshotsRoot)) {
  fs.rmSync(screenshotsRoot, { recursive: true, force: true });
  console.log(`Removed ${path.relative(projectRoot, screenshotsRoot)}`);
} else {
  console.log('No screenshots directory to clean.');
}
