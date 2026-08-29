const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

const rootFiles = [
  'index.html',
  'stats.html',
  'robots.txt',
];

const assetDirectories = [
  'css',
  'js',
];

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

console.log(`MATCHED? Pages assets prepared in ${OUT}`);
