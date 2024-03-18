import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import Eth from '@ledgerhq/hw-app-eth';
import type { Account } from '@ledgerhq/types-live';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildAccountBridge } from '@ledgerhq/coin-evm/lib/bridge/js';
import type { Transaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import { openNanoApp } from '../helpers';
import type { Signer } from '../types';
import type Transport from '@ledgerhq/hw-transport';

export const useBridge = (account: Account, _transaction?: Transaction, signer?: Signer | undefined) => {
  const [transport, setTransport] = useState<Transport | undefined>(undefined);
  const [transportError, setTransportError] = useState<Error | undefined>();
  useEffect(() => {
    if (!signer) return;

    if (signer.type !== 'webauthn') {
      openNanoApp(account.currency.managerAppName, signer.type).then(([trans, transErr]) => {
        if (trans) {
          setTransport(trans);
        }
        if (transErr) {
          setTransportError(transErr);
        }
      });
    }
  }, [account.currency.managerAppName, signer]);

  const bridge = useMemo(
    () =>
      buildAccountBridge(async (deviceId: string, fn) => {
        if (signer && signer?.type !== 'webauthn' && transport) {
          const app = new Eth(transport);
          return fn(app);
        }
        return fn({} as any);
      }),
    [signer, transport],
  );
  const [isPending, setIsPending] = useState(false);
  const [transaction, setTransaction] = useState<Transaction>(_transaction || bridge.createTransaction(account));
  const [status, setStatus] = useState<TransactionStatus | null>();

  const updateMethod = useCallback(
    async (partialTransaction: Partial<Transaction>, forceRerender?: boolean) => {
      if (!forceRerender && isEqual(transaction, { ...transaction, ...partialTransaction })) return;
      console.log('update');
      setIsPending(true);

      try {
        const preparedTransaction = await bridge.prepareTransaction(account, {
          ...transaction,
          ...partialTransaction,
        } as Transaction);
        const updatedTransaction = bridge.updateTransaction(transaction, preparedTransaction);
        setTransaction(updatedTransaction);
        const newStatus = await bridge.getTransactionStatus(account, updatedTransaction);
        setStatus(newStatus);
      } catch (e) {
        console.log('error in prepare');
      } finally {
        setIsPending(false);
      }
    },
    [account, bridge, transaction],
  );
  const updateTransaction = useMemo(() => debounce(updateMethod, 500), [updateMethod]);

  useEffect(() => {
    return () => updateTransaction.cancel();
  }, []);

  return {
    bridge,
    transaction,
    updateTransaction,
    status,
    isPending,
    setIsPending,
    transport,
    transportError,
  };
};
