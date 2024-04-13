import { ServerRegisterPluginObject } from '@hapi/hapi';
import { SponsorApi } from './SponsorApi';
import { HealthApi } from './HealthApi';

const plugins: ServerRegisterPluginObject<unknown>[] = [
  { plugin: SponsorApi },
  { plugin: HealthApi, routes: { prefix: '/health' } },
];

export default plugins;
