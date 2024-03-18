import { ethers } from 'ethers';
import factoryAbi from './abis/Factory.abi.json';
import accountAbi from './abis/Account.abi.json';
import erc20Abi from './abis/ERC20.abi.json';
import entrypointAbi from './abis/Entrypoint.abi.json';
import { provider } from './providers';

export const factoryContract = new ethers.Contract(import.meta.env.VITE_WALLETFACTORY_CONTRACT, factoryAbi, provider);
export const entrypointContract = new ethers.Contract(import.meta.env.VITE_ENTRYPOINT, entrypointAbi, provider);
export const accountInterface = new ethers.utils.Interface(accountAbi);
export const erc20Interface = new ethers.utils.Interface(erc20Abi);
