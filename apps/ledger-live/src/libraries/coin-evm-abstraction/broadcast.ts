import { patchOperationWithHash } from '@ledgerhq/coin-framework/lib/operation';
import type { AccountBridge } from '@ledgerhq/types-live';
import { ethers } from 'ethers';
import type { EvmAbstractionTransaction } from './types';
// import { entrypointContract } from '../../contracts';
import { deepHexlify } from '../../helpers';
import { bundler } from '../../providers';
import { UserOperation } from '../../types';

const waitForUserOp = async (
  userOpHash: string,
  userOp: UserOperation,
  maxRetries = 50,
): Promise<ethers.providers.TransactionResponse> => {
  if (maxRetries < 0) {
    throw new Error("Couldn't find the userOp broadcasted: " + userOpHash);
  }

  // const lastBlock = await provider.getBlock('latest');
  // const events = await entrypointContract.queryFilter(
  //   entrypointContract.filters.UserOperationEvent(userOpHash),
  //   lastBlock.number - 10,
  // );

  // if (events[0]) {
  //   const transaction = await events[0].getTransaction();
  //   return transaction;
  // }

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  return waitForUserOp(userOpHash, userOp, --maxRetries);
};

export const broadcast: AccountBridge<EvmAbstractionTransaction>['broadcast'] = async ({
  signedOperation: { signature, operation, rawData },
}) => {
  const { unsignedUserOp } = (rawData as { unsignedUserOp: UserOperation }) || {};
  const userOp = { ...unsignedUserOp, signature } as UserOperation;
  const userOpHash = await bundler.send('eth_sendUserOperation', [deepHexlify(userOp)]);
  const { hash } = await waitForUserOp(userOpHash, userOp);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
