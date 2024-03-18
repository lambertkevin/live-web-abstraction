import { ethers } from 'ethers';
import { RawEthersTransaction } from './types';

export const toRawEthersTransaction = (transaction: ethers.Transaction): RawEthersTransaction => {
  return {
    to: transaction.to,
    from: transaction.from,
    nonce: transaction.nonce,
    gasLimit: transaction.gasLimit.toHexString(),
    gasPrice: transaction.gasPrice?.toHexString(),
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas?.toHexString(),
    maxFeePerGas: transaction.maxFeePerGas?.toHexString(),
    data: transaction.data,
    value: transaction.value.toHexString(),
    chainId: transaction.chainId,
  };
};
