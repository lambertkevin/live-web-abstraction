import { server as makeServer } from '@hapi/hapi';
import startAccountWatcher from './watchers/AccountWatcher';
import { nodeConfig, prisma } from './config';
import apis from './api';

export default async () => {
  try {
    const server = makeServer(nodeConfig);
    await server.register(apis);
    await server.start();
    console.log('Server running on %s', server.info.uri);

    startAccountWatcher();

    server.events.on('stop', async () => {
      await prisma.$disconnect();
    });

    return server;
  } catch (err) /* istanbul ignore next */ {
    console.error('Fatal Error while starting the service', err);
    await prisma.$disconnect();
    return process.exit(1);
  }
};

// istanbul ignore if
if (process.env.NODE_ENV !== 'test') {
  process.on('unhandledRejection', async (err) => {
    console.error('unhandledRejection', err);
    await prisma.$disconnect();
    process.exit(1);
  });
}
