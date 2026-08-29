const VERSION_TOKEN = '__MATCHED_VERSION__';
const BUILD_TOKEN = '__MATCHED_BUILD__';

function resolved(token, fallback) {
  return token.startsWith('__MATCHED_') ? fallback : token;
}

const version = resolved(VERSION_TOKEN, 'dev');
const build = resolved(BUILD_TOKEN, 'local');
const label = `MATCHED? v${version} · build ${build}`;

for (const element of document.querySelectorAll('[data-build-info]')) {
  element.textContent = label;
}
