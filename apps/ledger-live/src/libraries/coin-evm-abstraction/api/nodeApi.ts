import { BigNumber } from 'bignumber.js';
import { deepHexlify, packUserOp } from '../../../helpers';
import { entrypointContract } from '../../../contracts';
import { bundler, provider } from '../../../providers';
import type { UserOperation } from '../../../types';

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
      import.meta.env.VITE_ENTRYPOINT,
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

export const getUserOpHash = async (userOp: UserOperation): Promise<string> =>
  entrypointContract.getUserOpHash(packUserOp(userOp));

export const getNonce = async (address: string): Promise<number> => entrypointContract.getNonce(address, 0);

export const getFeeData = async () => provider.getFeeData();

export default {
  getGasEstimation,
  hasCode,
  getUserOpHash,
  getNonce,
  getFeeData,
};
