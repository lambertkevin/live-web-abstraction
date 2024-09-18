import { ethers } from 'ethers';
// import factoryAbi from './abis/Factory.abi.json';
import accountAbi from './abis/Account.abi.json';
import erc20Abi from './abis/ERC20.abi.json';
// import entrypointAbi from './abis/Entrypoint.abi.json';
// import { provider } from './providers';
// eslint-disable-next-line import/no-unresolved
// import addresses from '../contracts-config/addresses.json';

// export const factoryContract = new ethers.Contract(addresses.FACTORY_CONTRACT, factoryAbi, provider);
// export const entrypointContract = new ethers.Contract(addresses.ENTRYPOINT_CONTRACT, entrypointAbi, provider);
export const accountInterface = new ethers.utils.Interface(accountAbi);
export const erc20Interface = new ethers.utils.Interface(erc20Abi);
