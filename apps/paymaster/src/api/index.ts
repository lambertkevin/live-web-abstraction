import { ServerRegisterPluginObject } from '@hapi/hapi';
import { ApiExample } from './ApiExample';

const plugins: ServerRegisterPluginObject<unknown>[] = [{ plugin: ApiExample, routes: { prefix: '/api' } }];

export default plugins;
