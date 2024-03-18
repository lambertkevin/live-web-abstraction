import { ServerRegisterPluginObject } from '@hapi/hapi';
import { SponsorApi } from './SponsorApi';

const plugins: ServerRegisterPluginObject<unknown>[] = [{ plugin: SponsorApi }];

export default plugins;
