const { startStaticServer, closeStaticServer } = require('../tools/static-server');

const TEST_HOST = '127.0.0.1';
const TEST_PORT = Number(process.env.MATCHED_TEST_PORT || 8080);

module.exports = async () => {
  let server;

  try {
    server = await startStaticServer({ host: TEST_HOST, port: TEST_PORT });
  } catch (error) {
    if (error?.code === 'EADDRINUSE') {
      throw new Error(`Port ${TEST_PORT} is already in use. Do not terminate the existing process; stop the test and report the conflict.`);
    }
    throw error;
  }

  console.log(`MATCHED? in-process test server listening on http://${TEST_HOST}:${TEST_PORT}`);

  return async () => {
    await closeStaticServer(server);
    console.log('MATCHED? in-process test server closed.');
  };
};
