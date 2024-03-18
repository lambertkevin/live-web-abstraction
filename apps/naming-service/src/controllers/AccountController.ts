import { notFound } from '@hapi/boom';
import { Prisma, SignerType } from '@prisma/client';
import { ExcludeOptionalProps } from '../types';
import { prisma } from '../config';

export const createAccount = async (dto: ExcludeOptionalProps<Prisma.AccountCreateInput>) => {
  const alreadyExistingAccount = await prisma.account.findFirst({
    where: {
      address: dto.address,
    },
  });

  if (alreadyExistingAccount) {
    return;
  }

  return prisma.account.create({
    data: dto,
  });
};

export const addSignerToAccount = async (accountAddress: string, signerType: SignerType, signerId: string) => {
  const account = await prisma.account.findFirst({
    where: {
      address: accountAddress,
    },
    include: {
      signers: true,
    },
  });

  if (!account) {
    throw notFound('Account not found');
  }

  if (
    account.signers &&
    account.signers.findIndex((accountSigner) => accountSigner.type === signerType && accountSigner.id === signerId) >
      -1
  ) {
    return;
  }

  return prisma.account.update({
    where: {
      id: account.id,
    },
    data: {
      signers: {
        connectOrCreate: {
          where: {
            id: signerId,
          },
          create: {
            id: signerId,
            type: signerType,
          },
        },
      },
    },
  });
};

export const findAccountByUsername = async (username: string, domain: string) => {
  console.log({ username, domain });
  return prisma.account.findFirst({
    where: {
      username,
      domain,
    },
    include: {
      signers: true,
    },
  });
};
