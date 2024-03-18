import { ethers } from 'ethers';
import accountAbi from './abis/Account.abi.json';
import entrypointAbi from './abis/Entrypoint.abi.json';
import { provider } from './config';

export const entrypointContract = new ethers.Contract(process.env.ENTRYPOINT_CONTRACT!, entrypointAbi, provider);
export const accountInterface = new ethers.utils.Interface(accountAbi);
