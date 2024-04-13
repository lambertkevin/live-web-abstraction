import { ServerRegisterPluginObject } from '@hapi/hapi';
import { LockApi } from './LockApi';
import { AccountApi } from './AccountApi';
import { HealthApi } from './HealthApi';

const plugins: ServerRegisterPluginObject<unknown>[] = [
  { plugin: LockApi, routes: { prefix: '/lock' } },
  { plugin: AccountApi, routes: { prefix: '/account' } },
  { plugin: HealthApi, routes: { prefix: '/health' } },
];

export default plugins;
