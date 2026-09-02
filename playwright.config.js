const { defineConfig } = require('@playwright/test');

const TEST_HOST = '127.0.0.1';
const TEST_PORT = Number(process.env.MATCHED_TEST_PORT || 8080);

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/global-setup.js'),
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: `http://${TEST_HOST}:${TEST_PORT}`,
    browserName: 'chromium',
    channel: 'chrome',
    headless: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: [
        '--enable-experimental-web-platform-features',
        '--enable-features=WebMCPTesting,DevToolsWebMCPSupport',
      ],
    },
  },
});
