import type { Plugin } from '@hapi/hapi';

export const HealthApi: Plugin<unknown> = {
  name: 'health',
  version: '1.0.0',
  register: (server) => {
    server.route({
      method: 'GET',
      path: '/',
      handler: (request, h) => {
        return h.response().code(200);
      },
    });
  },
};

export default HealthApi;
