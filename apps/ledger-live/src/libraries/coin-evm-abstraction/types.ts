import { BigNumber } from 'bignumber.js';
import type { GasOptions } from '@ledgerhq/coin-evm/lib/types/transaction';
import type { TransactionCommon } from '@ledgerhq/types-live';
import { Signer } from '../../types';

export type EvmAbstractionTransaction = TransactionCommon & {
  family: 'evm-abstraction';
  mode: 'send';
  sender: string;
  nonce: number;
  callData: Buffer | null;
  callGasLimit: BigNumber;
  verificationGasLimit: BigNumber;
  preVerificationGas: BigNumber;
  factory?: string;
  factoryData?: Buffer | null;
  paymaster?: string;
  paymasterVerificationGasLimit?: BigNumber;
  paymasterPostOpGasLimit?: BigNumber;
  paymasterData?: Buffer | null;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
  gasOptions?: GasOptions;
  chainId: number;
  signer: Signer;
};
