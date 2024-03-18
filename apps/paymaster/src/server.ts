import { server as makeServer } from '@hapi/hapi';
import { nodeConfig } from './config';
import apis from './api';

export default async () => {
  try {
    const server = makeServer(nodeConfig);
    await server.register(apis);
    await server.start();
    console.log('Server running on %s', server.info.uri);

    return server;
  } catch (err) /* istanbul ignore next */ {
    console.error('Fatal Error while starting the service', err);
    return process.exit(1);
  }
};

// istanbul ignore if
if (process.env.NODE_ENV !== 'test') {
  process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection', err);
    process.exit(1);
  });
}
