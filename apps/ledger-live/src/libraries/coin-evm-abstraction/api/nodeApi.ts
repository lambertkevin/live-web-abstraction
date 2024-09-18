import axios from 'axios';
import { BigNumber } from 'bignumber.js';
// import { entrypointContract } from '../../../contracts';
import { deepHexlify } from '../../../helpers';
import { bundler, provider } from '../../../providers';
import type { UserOperation } from '../../../types';
// eslint-disable-next-line import/no-unresolved
// import addresses from '../../../../contracts-config/addresses.json';

export const getGasEstimation = async (
  userOp: UserOperation,
): Promise<{
  callGasLimit: BigNumber;
  verificationGasLimit: BigNumber;
  preVerificationGas: BigNumber;
}> => {
  const {
    callGasLimit,
    preVerificationGas,
    verificationGasLimit,
  }: { callGasLimit: string; preVerificationGas: string; verificationGasLimit: string } = await bundler.send(
    'eth_estimateUserOperationGas',
    [
      deepHexlify({ ...userOp, callGasLimit: 10e5, preVerificationGas: 10e5, verificationGasLimit: 10e5 }),
      // addresses.ENTRYPOINT_CONTRACT,
    ],
  );
  return {
    callGasLimit: new BigNumber(callGasLimit),
    preVerificationGas: new BigNumber(preVerificationGas),
    verificationGasLimit: new BigNumber(verificationGasLimit),
  };
};

export const hasCode = async (address: string): Promise<boolean> => {
  const code = await provider.getCode(address);
  return code !== '0x';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUserOpHash = async (_: UserOperation): Promise<string> => Promise.resolve('');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getNonce = async (_: string): Promise<number> => 0;

export const getFeeData = async () => provider.getFeeData();

export const getPaymasterAndData = async (userOp: UserOperation) =>
  axios
    .post<{
      paymaster: `0x${string}`;
      paymasterData: `0x${string}`;
      paymasterVerificationGasLimit: `0x${string}`;
      paymasterPostOpGasLimit: `0x${string}`;
    }>(import.meta.env.VITE_PAYMASTER, userOp)
    .then(({ data: { paymaster, paymasterData, paymasterVerificationGasLimit, paymasterPostOpGasLimit } }) => ({
      paymaster,
      paymasterData: Buffer.from(paymasterData.slice(2), 'hex'),
      paymasterVerificationGasLimit: new BigNumber(paymasterVerificationGasLimit),
      paymasterPostOpGasLimit: new BigNumber(paymasterPostOpGasLimit),
    }));

export default {
  getGasEstimation,
  hasCode,
  getUserOpHash,
  getNonce,
  getFeeData,
  getPaymasterAndData,
};
