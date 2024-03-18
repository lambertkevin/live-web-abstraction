import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import Eth from '@ledgerhq/hw-app-eth';
import type Transport from '@ledgerhq/hw-transport';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildAccountBridge } from '@ledgerhq/coin-evm/lib/bridge/js';
import type { Transaction as EvmTransaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import { EvmAbstractionTransaction } from '../libraries/coin-evm-abstraction/types';
import { buildAccountBridge as buildSmartAccountBridge } from '../libraries/coin-evm-abstraction/bridge';
import type { AccountWithSigners, Signer } from '../types';
import { openNanoApp } from '../helpers';

export const useBridge = (
  account: AccountWithSigners,
  _transaction?: EvmTransaction | EvmAbstractionTransaction,
  signer?: Signer | undefined,
) => {
  const [transport, setTransport] = useState<Transport | undefined>(undefined);
  const [transportError, setTransportError] = useState<Error | undefined>();
  useEffect(() => {
    if (!signer) return;

    if (signer.type !== 'webauthn') {
      openNanoApp('Ethereum', signer.type).then(([trans, transErr]) => {
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
      account.seedIdentifier.includes('.ledger.com')
        ? buildSmartAccountBridge()
        : buildAccountBridge(async (_, fn) => {
            if (signer?.mode === 'EOA' && transport) {
              const app = new Eth(transport);
              return fn(app);
            }
            return fn({} as any);
          }),

    [account.seedIdentifier, signer, transport],
  );
  const [isPending, setIsPending] = useState(false);
  const [transaction, setTransaction] = useState<EvmTransaction | EvmAbstractionTransaction>(
    _transaction || bridge.createTransaction(account),
  );
  const [status, setStatus] = useState<TransactionStatus | null>();

  const updateMethod = useCallback(
    async (partialTransaction: Partial<EvmTransaction | EvmAbstractionTransaction>, forceRerender?: boolean) => {
      console.log({ partialTransaction });
      if (!forceRerender && isEqual(transaction, { ...transaction, ...partialTransaction, signer })) return;
      console.log('update');
      setIsPending(true);

      try {
        const patchedTransaction = {
          ...transaction,
          ...partialTransaction,
          signer,
        } as EvmTransaction | EvmAbstractionTransaction;
        const preparedTransaction = await bridge.prepareTransaction(account, patchedTransaction);
        const updatedTransaction = bridge.updateTransaction(transaction, preparedTransaction);
        setTransaction(updatedTransaction);
        const newStatus = await bridge.getTransactionStatus(account, updatedTransaction);
        setStatus(newStatus);
      } catch (e) {
        console.log('error in prepare', e);
      } finally {
        setIsPending(false);
      }
    },
    [account, bridge, signer, transaction],
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
