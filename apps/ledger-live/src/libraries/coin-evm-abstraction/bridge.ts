import { BigNumber } from 'bignumber.js';
import { sync } from '@ledgerhq/coin-evm/lib/synchronization';
import type { AccountBridge, CurrencyBridge } from '@ledgerhq/types-live';
import { preload, hydrate } from '@ledgerhq/coin-evm/lib/preload';
import { getTransactionStatus } from './getTransactionStatus';
import { prepareTransaction } from './prepareTransaction';
import type { EvmAbstractionTransaction } from './types';
import { updateTransaction } from './updateTransaction';
import { createTransaction } from './createTransaction';
import { buildScanAccounts } from './scanAccounts';
import { signOperation } from './signOperation';
import type { Signer } from '../../types';
import { broadcast } from './broadcast';
import { receive } from './receive';

export function buildCurrencyBridge(signer: Signer): CurrencyBridge {
  return {
    preload,
    hydrate,
    scanAccounts: buildScanAccounts(signer),
  };
}

export function buildAccountBridge(): AccountBridge<EvmAbstractionTransaction> {
  return {
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    broadcast,
    estimateMaxSpendable: async () => new BigNumber(0),
  };
}
