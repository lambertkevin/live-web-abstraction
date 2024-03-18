import { BigNumber } from 'bignumber.js';
import type {
  AccountRaw,
  Operation,
  OperationRaw,
  SubAccount,
  SubAccountRaw,
  TokenAccount,
  TokenAccountRaw,
} from '@ledgerhq/types-live';
import {
  emptyHistoryCache,
  generateHistoryFromOperations,
} from '@ledgerhq/coin-framework/lib/account/balanceHistoryCache';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import { isAccountEmpty } from '@ledgerhq/coin-framework/lib/account/helpers';
import { findCryptoCurrencyById, findTokenById, getCryptoCurrencyById, getTokenById } from '@ledgerhq/cryptoassets';
import { fromOperationRaw, fromSwapOperationRaw, toOperationRaw, toSwapOperationRaw } from './operation';
import { fromNFTRaw, toNFTRaw } from './nft';
import { AccountWithSigners, Signer } from '../../types';

const anvilCurrency: CryptoCurrency = {
  type: 'CryptoCurrency',
  id: 'anvil' as any,
  name: 'Anvil',
  // the ticker name in exchanges / countervalue apis (e.g. BTC).
  ticker: 'ETH',
  // all units of a currency (e.g. Bitcoin have bitcoin, mBTC, bit, satoshi)
  // by convention, [0] is the default and have "highest" magnitude
  units: [
    {
      name: 'ETH',
      code: 'ETH',
      magnitude: 18,
    },
  ],
  managerAppName: 'Ethereum',
  coinType: 60,
  scheme: 'anvil',
  color: '#00FF00',
  family: 'evm-abstraction',
  ethereumLikeInfo: {
    chainId: 31337,
    node: {
      type: 'external',
      uri: 'http://localhost:8545',
    },
    explorer: {
      type: 'etherscan',
      uri: 'http://localhost:43371',
    },
  },
  explorerViews: [{}],
};

export function fromAccountRaw(rawAccount: AccountRaw & { signers?: Signer[] }): AccountWithSigners {
  const {
    id,
    seedIdentifier,
    derivationMode,
    index,
    xpub,
    starred,
    used,
    freshAddress,
    freshAddressPath,
    freshAddresses,
    name,
    blockHeight,
    endpointConfig,
    currencyId,
    feesCurrencyId,
    unitMagnitude,
    operations,
    operationsCount,
    pendingOperations,
    lastSyncDate,
    creationDate,
    balance,
    balanceHistoryCache,
    spendableBalance,
    subAccounts: subAccountsRaw,
    swapHistory,
    syncHash,
    nfts,
    signers,
  } = rawAccount;

  const convertOperation = (op: OperationRaw) => fromOperationRaw(op, id, subAccounts as SubAccount[]);

  const subAccounts =
    subAccountsRaw &&
    subAccountsRaw
      .map((ta) => {
        if (ta.type === 'TokenAccountRaw') {
          if (findTokenById(ta.tokenId)) {
            return fromTokenAccountRaw(ta);
          }
        } else {
          return fromSubAccountRaw(ta);
        }
      })
      .filter(Boolean);
  const currency = currencyId === 'anvil' ? anvilCurrency : getCryptoCurrencyById(currencyId);
  const feesCurrency =
    (feesCurrencyId && (findCryptoCurrencyById(feesCurrencyId) || findTokenById(feesCurrencyId))) || undefined;
  const unit = currency.units.find((u) => u.magnitude === unitMagnitude) || currency.units[0];

  const res: AccountWithSigners = {
    type: 'Account',
    id,
    starred: starred || false,
    used: false,
    // filled again below
    seedIdentifier,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    freshAddresses: freshAddresses || [
      // in case user come from an old data that didn't support freshAddresses
      {
        derivationPath: freshAddressPath,
        address: freshAddress,
      },
    ],
    name,
    blockHeight,
    creationDate: new Date(creationDate || Date.now()),
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(spendableBalance || balance),
    operations: (operations || []).map(convertOperation),
    operationsCount: operationsCount || (operations && operations.length) || 0,
    pendingOperations: (pendingOperations || []).map(convertOperation),
    unit,
    currency,
    feesCurrency,
    lastSyncDate: new Date(lastSyncDate || 0),
    swapHistory: [],
    syncHash,
    balanceHistoryCache: balanceHistoryCache || emptyHistoryCache,
    nfts: nfts?.map((n) => fromNFTRaw(n)),
    signers,
  };
  res.balanceHistoryCache = generateHistoryFromOperations(res);

  if (typeof used === 'undefined') {
    // old account data that didn't had the field yet
    res.used = !isAccountEmpty(res);
  } else {
    res.used = used;
  }

  if (xpub) {
    res.xpub = xpub;
  }

  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }

  if (subAccounts) {
    res.subAccounts = subAccounts as SubAccount[];
  }

  if (swapHistory) {
    res.swapHistory = swapHistory.map(fromSwapOperationRaw);
  }

  return res;
}

export function toAccountRaw(account: AccountWithSigners): AccountRaw & { signers?: Signer[] | undefined } {
  const {
    id,
    seedIdentifier,
    xpub,
    name,
    starred,
    used,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    freshAddresses,
    blockHeight,
    currency,
    feesCurrency,
    creationDate,
    operationsCount,
    operations,
    pendingOperations,
    unit,
    lastSyncDate,
    balance,
    balanceHistoryCache,
    spendableBalance,
    subAccounts,
    endpointConfig,
    swapHistory,
    syncHash,
    nfts,
    signers,
  } = account;

  const convertOperation = (op: Operation) => toOperationRaw(op, undefined);

  const res: AccountRaw & { signers?: Signer[] | undefined } = {
    id,
    seedIdentifier,
    name,
    starred,
    used,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    freshAddresses,
    blockHeight,
    syncHash,
    creationDate: creationDate.toISOString(),
    operationsCount,
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    currencyId: currency.id,
    unitMagnitude: unit.magnitude,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toFixed(),
    spendableBalance: spendableBalance.toFixed(),
    nfts: nfts?.map((n) => toNFTRaw(n)),
    signers,
  };

  if (feesCurrency) {
    res.feesCurrencyId = feesCurrency.id;
  }

  if (balanceHistoryCache) {
    res.balanceHistoryCache = balanceHistoryCache;
  }

  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }

  if (xpub) {
    res.xpub = xpub;
  }

  if (subAccounts) {
    res.subAccounts = subAccounts.map((a) => toSubAccountRaw(a));
  }

  if (swapHistory) {
    res.swapHistory = swapHistory.map(toSwapOperationRaw);
  }

  return res;
}

//-- TokenAccount

function fromTokenAccountRaw(raw: TokenAccountRaw): TokenAccount {
  const {
    id,
    parentId,
    tokenId,
    starred,
    operations,
    pendingOperations,
    creationDate,
    balance,
    spendableBalance,
    balanceHistoryCache,
    swapHistory,
    approvals,
  } = raw;
  const token = getTokenById(tokenId);

  const convertOperation = (op: OperationRaw) => fromOperationRaw(op, id, null);

  const res = {
    type: 'TokenAccount',
    id,
    parentId,
    token,
    starred: starred || false,
    balance: new BigNumber(balance),
    spendableBalance: spendableBalance ? new BigNumber(spendableBalance) : new BigNumber(balance),
    creationDate: new Date(creationDate || Date.now()),
    operationsCount: raw.operationsCount || (operations && operations.length) || 0,
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    swapHistory: (swapHistory || []).map(fromSwapOperationRaw),
    approvals,
    balanceHistoryCache: balanceHistoryCache || emptyHistoryCache,
  };
  res.balanceHistoryCache = generateHistoryFromOperations(res as TokenAccount);
  return res as TokenAccount;
}
function toTokenAccountRaw(ta: TokenAccount): TokenAccountRaw {
  const {
    id,
    parentId,
    token,
    starred,
    operations,
    operationsCount,
    pendingOperations,
    balance,
    spendableBalance,
    balanceHistoryCache,
    swapHistory,
    approvals,
  } = ta;

  const convertOperation = (op: Operation) => toOperationRaw(op, undefined);

  return {
    type: 'TokenAccountRaw',
    id,
    parentId,
    starred,
    tokenId: token.id,
    balance: balance.toString(),
    spendableBalance: spendableBalance.toString(),
    balanceHistoryCache,
    creationDate: ta.creationDate.toISOString(),
    operationsCount,
    operations: operations.map(convertOperation),
    pendingOperations: pendingOperations.map(convertOperation),
    swapHistory: (swapHistory || []).map(toSwapOperationRaw),
    approvals,
  };
}

//-- SubAccount

function fromSubAccountRaw(raw: SubAccountRaw): SubAccount {
  switch (raw.type) {
    case 'TokenAccountRaw':
      return fromTokenAccountRaw(raw);

    default:
      throw new Error('invalid raw.type=' + (raw as SubAccountRaw).type);
  }
}
function toSubAccountRaw(subAccount: SubAccount): SubAccountRaw {
  switch (subAccount.type) {
    case 'TokenAccount':
      return toTokenAccountRaw(subAccount);

    default:
      throw new Error('invalid subAccount.type=' + (subAccount as SubAccount).type);
  }
}
