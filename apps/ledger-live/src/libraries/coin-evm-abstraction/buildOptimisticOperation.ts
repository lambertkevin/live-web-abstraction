import type { Operation, OperationType } from '@ledgerhq/types-live';
import { encodeOperationId } from '@ledgerhq/coin-framework/lib/operation';
import type { EvmAbstractionTransaction } from './types';
import type { AccountWithSigners } from '../../types';
import { getEstimatedFees } from './logic';

export const buildOptimisticOperation = (
  account: AccountWithSigners,
  transaction: EvmAbstractionTransaction,
  transactionType?: OperationType,
): Operation => {
  const type = transactionType ?? 'OUT';
  const estimatedFees = getEstimatedFees(transaction);
  const value = transaction.amount.plus(!transaction.paymasterData ? estimatedFees : 0);

  // keys marked with a <-- will be updated by the broadcast method
  const operation: Operation = {
    id: encodeOperationId(account.id, '', type), // <--
    hash: '', // <--
    type,
    value,
    fee: estimatedFees,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    transactionSequenceNumber: transaction.nonce,
    subOperations: [],
    nftOperations: [],
    date: new Date(),
    extra: {
      sponsored: !!transaction.paymasterData,
      sponsoredFees: transaction.paymasterData ? estimatedFees : null,
    },
  };

  return operation;
};
