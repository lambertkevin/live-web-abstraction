import { EvmAbstractionTransaction } from './types';

export const getEstimatedFees = (transaction: EvmAbstractionTransaction) => {
  const { maxFeePerGas, callGasLimit, preVerificationGas, verificationGasLimit } = transaction;

  const gasLimits = callGasLimit.plus(preVerificationGas).plus(verificationGasLimit);

  return maxFeePerGas.times(gasLimits);
};
