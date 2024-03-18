import { BigNumber } from 'bignumber.js';
import type { AccountBridge, TokenAccount } from '@ledgerhq/types-live';
import type { EvmAbstractionTransaction } from './types';
import type { AccountWithSigners } from '../../types';

export const createTransaction: AccountBridge<EvmAbstractionTransaction>['createTransaction'] = (account) => {
  const currency = account.type === 'Account' ? account.currency : (account as TokenAccount).token.parentCurrency;

  return {
    family: 'evm-abstraction',
    mode: 'send',
    amount: new BigNumber(0),
    recipient: '',
    subAccountId: account.type === 'TokenAccount' ? account.id : null,
    sender: (account as AccountWithSigners)?.freshAddress || '',
    nonce: -1,
    callData: null,
    callGasLimit: new BigNumber(0),
    verificationGasLimit: new BigNumber(0),
    preVerificationGas: new BigNumber(0),
    maxFeePerGas: new BigNumber(0),
    maxPriorityFeePerGas: new BigNumber(0),
    chainId: currency.ethereumLikeInfo?.chainId || 0,
  };
};
