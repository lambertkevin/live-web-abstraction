import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import Eth from '@ledgerhq/hw-app-eth';
import TransportWebUsb from '@ledgerhq/hw-transport-webusb';
import type { Account } from '@ledgerhq/types-live';
import type Transport from '@ledgerhq/hw-transport';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildAccountBridge } from '@ledgerhq/coin-evm/lib/bridge/js';
import type { Transaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';

const openEthereumApp = async (): Promise<Transport> => {
  const transport = await TransportWebUsb.create().catch((eee) => {
    console.log({ eee });
    throw eee;
  });
  console.log('Create new transport');
  // getAppAndVersion
  const getAppAndVersionBuffer = await transport.send(0xb0, 0x01, 0x00, 0x00).catch((eeee) => {
    console.log({ eeee });
    throw eeee;
  });
  console.log({ getAppAndVersionBuffer });
  const nanoAppNameLength = getAppAndVersionBuffer[1];
  const nanoAppName = getAppAndVersionBuffer.slice(2, 2 + nanoAppNameLength).toString('ascii');
  console.log({ nanoAppName });

  if (nanoAppName !== 'Ethereum') {
    console.log('Not in Ethereum App');
    // quitApp
    await transport.send(0xb0, 0xa7, 0x00, 0x00);
    console.log('Back to dashboard');
    console.log('Requesting Ethereum App');
    // open Ethereum
    await transport.send(0xe0, 0xd8, 0x00, 0x00, Buffer.from('Ethereum'));
    console.log('Should be opened now');

    await transport.close();
    console.log('closing the transport');
    await new Promise((resolve) => {
      setTimeout(() => resolve(undefined), 2500);
    });
    console.log('waiting 2.5s');
    // retry
    return openEthereumApp();
  }
  return transport;
};

export const useBridge = (account: Account, _transaction?: Transaction) => {
  const bridge = useMemo(
    () =>
      buildAccountBridge(async (deviceId: string, fn) => {
        const transport = await openEthereumApp();
        const signer = new Eth(transport);
        return fn(signer);
      }),
    [],
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
  };
};
