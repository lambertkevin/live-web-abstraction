import { ethers } from 'ethers';

export const nodeConfig = {
  port: process.env.MOCK_ANVIL_EXPLORER_PORT || 4342,
  debug: { request: ['error'] },
  routes: {
    cors: true,
  },
};

export const provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC);
