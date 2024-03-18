import { BigNumber } from 'ethers';
import { EvmAbstractionTransaction } from '../types';
import type { AccountWithSigners, UserOperation } from '../../../types';

export const transactionToUserOperation = (
  account: AccountWithSigners,
  tx: EvmAbstractionTransaction,
  signature?: string,
): UserOperation => {
  return {
    sender: account.freshAddress,
    nonce: BigNumber.from(Math.max(0, tx.nonce)),
    factory: tx.factory,
    factoryData: tx.factoryData || undefined,
    callData: tx.callData || Buffer.alloc(0),
    callGasLimit: BigNumber.from(tx.callGasLimit.toString()),
    verificationGasLimit: BigNumber.from(tx.verificationGasLimit.toString()),
    preVerificationGas: BigNumber.from(tx.preVerificationGas.toString()),
    maxFeePerGas: BigNumber.from(tx.maxFeePerGas.toString()),
    maxPriorityFeePerGas: BigNumber.from(tx.maxPriorityFeePerGas.toString()),
    paymaster: tx.paymaster,
    paymasterVerificationGasLimit: tx.paymasterVerificationGasLimit
      ? BigNumber.from(tx.paymasterVerificationGasLimit.toString())
      : undefined,
    paymasterPostOpGasLimit: tx.paymasterPostOpGasLimit
      ? BigNumber.from(tx.paymasterPostOpGasLimit.toString())
      : undefined,
    paymasterData: tx.paymasterData || undefined,
    signature: signature && signature !== '0x' ? Buffer.from(signature.slice(2), 'hex') : Buffer.alloc(0),
  };
};
