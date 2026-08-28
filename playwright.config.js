const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
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
    baseURL: 'http://127.0.0.1:8080',
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
  webServer: {
    command: 'npx http-server . -p 8080 -c-1',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 15000,
  },
});
