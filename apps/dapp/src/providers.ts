import { ethers } from 'ethers';

export const provider = new ethers.providers.StaticJsonRpcProvider(import.meta.env.VITE_NETWORK);
export const bundler = new ethers.providers.StaticJsonRpcProvider(import.meta.env.VITE_BUNDLER);
