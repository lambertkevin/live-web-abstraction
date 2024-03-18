import type { ServerOptions } from '@hapi/hapi';
import { ethers } from 'ethers';

export const nodeConfig: ServerOptions = {
  port: process.env.PAYMASTER_PORT || 4339,
  debug: { request: ['error'] },
  routes: {
    cors: true,
  },
};

export const provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC);

export const signer = new ethers.Wallet(process.env.PAYMASTER_SK!);
