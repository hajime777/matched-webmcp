const { startStaticServer, closeStaticServer } = require('../tools/static-server');

module.exports = async () => {
  let server;

  try {
    server = await startStaticServer({ host: '127.0.0.1', port: 8080 });
  } catch (error) {
    if (error?.code === 'EADDRINUSE') {
      throw new Error('Port 8080 is already in use. Do not terminate the existing process; stop the test and report the conflict.');
    }
    throw error;
  }

  console.log('MATCHED? in-process test server listening on http://127.0.0.1:8080');

  return async () => {
    await closeStaticServer(server);
    console.log('MATCHED? in-process test server closed.');
  };
};
