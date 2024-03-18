import type { Plugin } from '@hapi/hapi';

export const ApiExample: Plugin<unknown> = {
  name: 'ApiExample',
  version: '1.0.0',
  register: (server) => {
    server.route({
      method: 'GET',
      path: '/test',
      handler: () => {
        return 'Hello World';
      },
    });
  },
};

export default ApiExample;
