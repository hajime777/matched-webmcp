const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const packageJson = require(path.join(ROOT, 'package.json'));

const rootFiles = [
  'index.html',
  'observatory.html',
  'stats.html',
  'robots.txt',
];

const assetDirectories = [
  'css',
  'js',
];

function resolveBuildId() {
  const environmentSha = process.env.CF_PAGES_COMMIT_SHA || process.env.COMMIT_SHA;
  if (environmentSha) {
    return String(environmentSha).slice(0, 8);
  }

  try {
    return execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

fs.mkdirSync(OUT, { recursive: true });

for (const file of rootFiles) {
  fs.copyFileSync(path.join(ROOT, file), path.join(OUT, file));
}

for (const directory of assetDirectories) {
  fs.cpSync(path.join(ROOT, directory), path.join(OUT, directory), {
    recursive: true,
    force: true,
  });
}

const buildId = resolveBuildId();
const buildInfoPath = path.join(OUT, 'js', 'build-info.js');
let buildInfo = fs.readFileSync(buildInfoPath, 'utf8');
buildInfo = buildInfo
  .replace('__MATCHED_VERSION__', packageJson.version)
  .replace('__MATCHED_BUILD__', buildId);
fs.writeFileSync(buildInfoPath, buildInfo);

console.log(`MATCHED? v${packageJson.version} build ${buildId} prepared in ${OUT}`);
