import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { Prisma } from '@prisma/client';
import { locked, badData, unauthorized } from '@hapi/boom';
import { LOCK_DURATION_IN_MS, NS_PK, NS_SK, prisma, nsSigner } from '../config';
import { CraftSigner, ExcludeOptionalProps } from '../types';
import { craftAddSignerPayload } from '../helpers';

export const createLock = async (dto: ExcludeOptionalProps<Prisma.LockCreateInput>) => {
  const alreadyExistingLock = await prisma.lock.findFirst({
    where: { ...dto, deletedAt: undefined },
  });

  if (alreadyExistingLock && alreadyExistingLock.updatedAt > new Date(Date.now() - LOCK_DURATION_IN_MS)) {
    throw locked('Username is already locked');
  }

  const jwtToken = await jwt.sign(
    {
      username: dto.username,
      domain: dto.domain,
    },
    NS_SK,
    {
      algorithm: 'RS256',
      expiresIn: `${LOCK_DURATION_IN_MS}ms`,
    },
  );

  if (alreadyExistingLock) {
    await prisma.lock.update({
      where: {
        id: alreadyExistingLock.id,
      },
      data: { ...dto, updatedAt: new Date() },
    });
  } else {
    await prisma.lock.create({
      data: dto,
    });
  }

  return jwtToken;
};

export const getSignedPayload = async (token: string, signer: CraftSigner) => {
  try {
    if (signer.type === 'WEBAUTHN') {
      const credIdHash = ethers.utils.keccak256(Buffer.from(signer.credId.slice(2), 'hex'));
      await prisma.credentialId.upsert({
        where: {
          hash: credIdHash,
        },
        update: {
          value: signer.credId,
        },
        create: {
          hash: credIdHash,
          value: signer.credId,
        },
      });
    }

    const decoded = jwt.verify(token, NS_PK, {
      algorithms: ['RS256'],
    });

    if (typeof decoded !== 'object') {
      throw badData("JWT couldn't be decoded properly");
    }

    const { username, domain } = decoded as ExcludeOptionalProps<Prisma.LockCreateInput>;
    const alreadyExistingAccount = await prisma.account.findFirst({
      where: { username, domain },
    });

    if (alreadyExistingAccount) {
      throw unauthorized('Account is already deployed');
    }

    const encodedSignerPayload = craftAddSignerPayload(signer);
    const digest = ethers.utils.keccak256(Buffer.concat([Buffer.from(username + domain), encodedSignerPayload]));
    const signature = await nsSigner.signMessage(Buffer.from(digest.slice(2), 'hex'));

    return `0x${signature.slice(2)}${encodedSignerPayload.toString('hex')}`;
  } catch (e) {
    console.error(e);
    if (e instanceof jwt.JsonWebTokenError) {
      throw badData('Invalid jwt');
    }
    throw e;
  }
};
