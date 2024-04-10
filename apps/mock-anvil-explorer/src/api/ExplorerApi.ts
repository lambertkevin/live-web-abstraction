import { notFound } from '@hapi/boom';
import type { Plugin } from '@hapi/hapi';
import {
  explorerERC20EventsByAddress,
  explorerERC721EventsByAddress,
  explorerInternalByAddress,
  explorerOperationByAddress,
  indexBlocks,
} from '../watchers/blockWatcher';

export const ExplorerApi: Plugin<unknown> = {
  name: 'ExplorerApi',
  version: '1.0.0',
  register: (server) => {
    indexBlocks();

    server.route<{
      Query: {
        module: 'account';
        action: 'txlist' | 'tokentx' | 'tokennfttx' | 'txlistinternal';
        address: `0x${string}`;
      };
    }>({
      method: 'GET',
      path: '/',
      handler: async (req) => {
        const {
          query: { module, action, address },
        } = req;

        if (module !== 'account') return notFound();

        const map = (() => {
          if (action === 'txlist') {
            console.log(explorerOperationByAddress);
            return explorerOperationByAddress[address];
          } else if (action === 'tokentx') {
            return explorerERC20EventsByAddress[address];
          } else if (action === 'tokennfttx') {
            return explorerERC721EventsByAddress[address];
          } else if (action === 'txlistinternal') {
            return explorerInternalByAddress[address];
          }
          return new Map();
        })();

        return map?.size
          ? {
              status: '1',
              message: 'OK-Missing/Invalid API Key, rate limit of 1/5sec applied',
              result: Array.from(map.values())
                .flat()
                .filter((op) => op?.value !== '0'),
            }
          : {
              status: '0',
              message: 'No transactions found',
              result: [],
            };
      },
    });
  },
};

export default ExplorerApi;
