import { EvmAbstractionTransaction } from './types';

export const getEstimatedFees = (transaction: EvmAbstractionTransaction) => {
  const {
    maxFeePerGas,
    callGasLimit,
    preVerificationGas,
    verificationGasLimit,
    paymasterVerificationGasLimit,
    paymasterPostOpGasLimit,
  } = transaction;

  const gasLimits = callGasLimit
    .plus(preVerificationGas)
    .plus(verificationGasLimit)
    .plus(paymasterVerificationGasLimit || 0)
    .plus(paymasterPostOpGasLimit || 0);

  return maxFeePerGas.times(gasLimits);
};
