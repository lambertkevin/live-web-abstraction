import { ethers } from 'ethers';

export const nodeConfig = {
  port: process.env.PAYMASTER_PORT || 4339,
};

export const provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC);
