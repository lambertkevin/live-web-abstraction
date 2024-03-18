import { ServerRegisterPluginObject } from '@hapi/hapi';
import { LockApi } from './LockApi';
import { AccountApi } from './AccountApi';

const plugins: ServerRegisterPluginObject<unknown>[] = [
  { plugin: LockApi, routes: { prefix: '/lock' } },
  { plugin: AccountApi, routes: { prefix: '/account' } },
];

export default plugins;
