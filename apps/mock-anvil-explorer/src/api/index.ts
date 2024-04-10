import { ServerRegisterPluginObject } from '@hapi/hapi';
import ExplorerApi from './ExplorerApi';

const plugins: ServerRegisterPluginObject<unknown>[] = [{ plugin: ExplorerApi, routes: { prefix: '/api' } }];

export default plugins;
