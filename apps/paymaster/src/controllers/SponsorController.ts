import { ethers } from 'ethers';
import type { UserOperation } from '../types';
import { provider, signer } from '../config';
import { packUserOp } from '../helpers';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore accessible via docker volume
// eslint-disable-next-line import/no-unresolved
import addresses from '../../contracts-config/addresses.json';

export const sponsorUserOperation = async (userOp: UserOperation) => {
  const packedUserOp = packUserOp(userOp);

  console.log({ packedUserOp });

  const latestBlock = await provider.getBlock('latest');
  const { chainId } = await provider.getNetwork();

  const gasLessPackedUserOpBytes = ethers.utils.defaultAbiCoder.encode(
    ['address', 'uint256', 'bytes32', 'bytes32', 'bytes32'],
    [
      packedUserOp.sender,
      packedUserOp.nonce,
      ethers.utils.keccak256(Buffer.from(packedUserOp.initCode.toString().slice(2), 'hex')),
      ethers.utils.keccak256(Buffer.from(packedUserOp.callData.toString().slice(2), 'hex')),
      packedUserOp.gasFees,
    ],
  );

  const gasLessPackedUserOpHash = ethers.utils.keccak256(gasLessPackedUserOpBytes);
  console.log('gasLessPackedUserOpHash', gasLessPackedUserOpHash);

  const signature = await signer.signMessage(Buffer.from(gasLessPackedUserOpHash.slice(2), 'hex'));
  const validFrom = latestBlock.timestamp;
  const validUntil = latestBlock.timestamp + 10 * 60;

  console.log(
    `valid from ${new Date(validFrom * 1000).toLocaleString('fr-FR')} until ${new Date(
      validUntil * 1000,
    ).toLocaleString('fr-FR')}`,
    { validFrom, validUntil },
  );

  return {
    paymaster: addresses.PAYMASTER_CONTRACT,
    paymasterData: ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint48', 'uint48', 'uint256', 'bytes'],
      [gasLessPackedUserOpHash, validFrom, validUntil, chainId, signature],
    ),
    paymasterVerificationGasLimit: ethers.BigNumber.from(40_000).toHexString(),
    paymasterPostOpGasLimit: ethers.BigNumber.from(20_000).toHexString(),
  };
};

export default {
  sponsorUserOperation,
};
