import getDeviceEvmTransactionConfig from '@ledgerhq/coin-evm/lib/deviceTransactionConfig';
import type { CommonDeviceTransactionField } from '@ledgerhq/coin-framework/lib-es/transaction/common';
import { TypedEvmMessage } from '@ledgerhq/types-live/lib';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { ACTIONS } from '.';
import CoolPasskey from '../../components/CoolPasskey';
import LedgerLogo from '../../components/icons/LedgerLogo';
import { SignerOptions } from '../../helpers';
import { translateError } from '../../helpers/translations';
import { useBridge } from '../../hooks/useBridge';
import getDeviceEvmAbstractionTransactionConfig from '../../libraries/coin-evm-abstraction/deviceTransactionConfig';
import { useAccountsStore, useCurrencyPriceStore } from '../../store';
import { AccountWithSigners, RawEthersTransaction, Signer } from '../../types';

// Copied from https://www.npmjs.com/package/ethereumjs-util
export const isHexPrefixed = (str: string): boolean => {
  if (typeof str !== 'string') {
    throw new Error(`[isHexPrefixed] input must be type 'string', received type ${typeof str}`);
  }

  return str[0] === '0' && str[1] === 'x';
};

// Copied from https://www.npmjs.com/package/ethereumjs-util
export const stripHexPrefix = (str: string): string => {
  if (typeof str !== 'string') throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`);

  return isHexPrefixed(str) ? str.slice(2) : str;
};

type Props = {
  selectedAccount: AccountWithSigners | undefined;
  initialMessage: RawEthersTransaction | undefined;
  sendParentMessage: (params: { id?: string; result?: string; type?: string; data?: Record<string, unknown> }) => void;
  setActionName: (actionName: keyof typeof ACTIONS | undefined) => void;
  setActionId?: (id?: string) => void;
  actionId?: string;
};

export const SignAction = ({
  selectedAccount,
  initialMessage,
  sendParentMessage,
  setActionName,
  setActionId,
  actionId,
}: Props) => {
  if (!selectedAccount) throw Error('No account selected');
  if (!initialMessage) throw Error('No transaction provided');

  const { prices } = useCurrencyPriceStore();

  const { syncAccounts, updateAccount } = useAccountsStore();
  useEffect(() => {
    syncAccounts();
  }, []);

  const isSmartContractAccount = useMemo(
    () => selectedAccount.seedIdentifier.includes('.ledger.com'),
    [selectedAccount],
  );
  const [signer, setSigner] = useState<Signer | undefined>();

  const [liveMessage, setLiveMessage] = useState<TypedEvmMessage>();
  useEffect(() => {
    const newLiveMessage: TypedEvmMessage = {
      message,
    };

    if (!isEqual(newLiveMessage, liveMessage)) {
      setLiveMessage(newLiveMessage);
    }
  }, [
    liveMessage,
    initialMessage,
    isSmartContractAccount,
    selectedAccount.freshAddress,
    selectedAccount.signers,
    selectedAccount,
    signer,
  ]);

  const { bridge, status, transaction, isPending, setIsPending, transport } = useBridge(
    selectedAccount,
    undefined,
    signer,
  );

  const [error, setError] = useState<Error | undefined>();
  const [broadcasting, setBroadcasting] = useState(false);
  const [checkDevice, setCheckDevice] = useState(false);
  const signTransaction = useCallback(
    (onTransactionBroadcasted?: (hash: string) => void) => {
      if (!bridge || Object.values(status?.errors || {}).length || !transaction) return;
      setIsPending(true);
      if (signer?.mode === 'EOA') {
        setCheckDevice(true);
      }
      setCheckDevice(true);

      bridge.signOperation({ account: selectedAccount, deviceId: '', transaction }).subscribe({
        async next(event) {
          if (event.type === 'signed') {
            setBroadcasting(true);
            setCheckDevice(false);
            await transport?.close();

            bridge
              .broadcast({ account: selectedAccount, signedOperation: event.signedOperation })
              .then((optimisticOperation) => {
                console.log({ optimisticOperation });
                updateAccount({ ...selectedAccount, pendingOperations: [optimisticOperation] });
                onTransactionBroadcasted?.(optimisticOperation.hash);
                setIsPending(false);
              })
              .finally(() => {
                setBroadcasting(false);
              });
          }
        },
        async error(err) {
          console.log({ err });
          setError(err);
          setIsPending(false);
          setCheckDevice(false);
          await transport?.close();
        },
      });
    },
    [bridge, selectedAccount, setIsPending, signer?.mode, status?.errors, transaction, transport, updateAccount],
  );

  const mainBridgeError: Error | undefined = useMemo(
    () => Object.values(status?.errors || {}).sort((a) => (a.name === 'NotEnoughBalance' ? -1 : 1))?.[0],
    [status?.errors],
  );

  const [transactionConfig, setTransactionConfig] = useState<CommonDeviceTransactionField[] | undefined>();
  useEffect(() => {
    if (transaction.family === 'evm') {
      setTransactionConfig(
        getDeviceEvmTransactionConfig({
          account: selectedAccount,
          parentAccount: null,
          transaction,
          status: status || ({} as any),
        }),
      );
    } else {
      getDeviceEvmAbstractionTransactionConfig({
        account: selectedAccount,
        parentAccount: null,
        transaction,
        status: status || ({} as any),
      })
        .then(setTransactionConfig)
        .catch((e) => {
          console.log('TRANSACTION CONFIG ERROR', e);
        });
    }
  }, [selectedAccount, status, transaction]);

  return (
    <div className="flex flex-col flex-grow w-32 p-10 bg-zinc-950">
      <div
        className={classNames([
          'opacity-0 flex flex-col flex-grow justify-center items-center absolute h-full w-full left-0 top-0 bg-zinc-950 z-50 pointer-events-none transition-opacity',
          broadcasting || checkDevice ? 'opacity-100 bg-opacity-70 pointer-events-auto' : '',
        ])}
      >
        <span className="text-3xl text-white text-opacity-100">
          {checkDevice ? 'Check your device.' : 'Broadcasting...'}
        </span>
        {signer?.mode === 'EOA' ? <img src="/confirm-nano.png" className="py-10" /> : null}
      </div>
      <div
        className={classNames([
          'flex flex-col flex-grow justify-between transition-opacity',
          broadcasting || checkDevice ? 'opacity-50 pointer-events-none' : '',
        ])}
      >
        <div className="flex flex-col items-center">
          <LedgerLogo size={50} />
          <span className="w-full text-center text-lg p-2 uppercase rounded border-t border-zinc-800 border-solid">
            Connection to Ledger Live Web
          </span>
        </div>
        {mainBridgeError && signer && !isPending ? (
          <div className="alert alert-error">{translateError(mainBridgeError?.name || 'Unknown Error')}</div>
        ) : null}
        {error ? <div className="alert alert-error">{translateError(error.name)}</div> : null}
        <div className="p-2 text-center text-lg">Would you like to sign this shit ?</div>
        <div>
          {transactionConfig ? (
            transactionConfig?.map((field, i) => (
              <div key={i} className="flex flew-row justify-between">
                <div className="w-4/12 text-sm text-zinc-400">{field.label}</div>
                <div className="w-7/12 text-sm mb-2 text-right break-keep">
                  {field.type === 'amount' && (
                    <>
                      {transaction.amount.dividedBy(10 ** selectedAccount.currency.units[0].magnitude).toFixed()}{' '}
                      {selectedAccount.currency.units[0].code}
                    </>
                  )}
                  {field.type === 'address' && <span className="break-all">{field.address}</span>}
                  {field.type === 'text' && <span className="break-all">{field.value}</span>}
                  {field.type === 'fees' && (
                    <>
                      {status?.estimatedFees.dividedBy(10 ** selectedAccount.currency.units[0].magnitude).toFixed()}{' '}
                      {selectedAccount.currency.units[0].code} <br />$
                      {status?.estimatedFees
                        .dividedBy(10 ** selectedAccount.currency.units[0].magnitude)
                        .times(prices[selectedAccount.unit.code.toLowerCase()] || 0)
                        .toFixed(2)}
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <>
              <span className="loading loading-ring loading-lg"></span>
            </>
          )}
        </div>
        <div className="flex flex-row w-full px-4 py-2">
          <div className="flex flex-col flex-grow gap-3"></div>
        </div>
        <div className="flex flex-row w-full px-4 py-2">
          <div className="flex flex-col flex-grow gap-3">
            {isSmartContractAccount ? (
              <>
                <div className="text-lg pb-2">Pick a Signer:</div>
                <div className="flex flex-row flex-grow gap-4">
                  {SignerOptions.flatMap((option) => {
                    const signers = selectedAccount.signers!.filter(({ mode }) => option.mode === mode);
                    return signers.length
                      ? signers.map((s) => ({
                          ...option,
                          signer: s,
                        }))
                      : null;
                  })
                    .filter(Boolean)
                    .map((option) =>
                      option?.mode === 'EOA' ? (
                        <button
                          key={option.type}
                          disabled={isPending}
                          onClick={async () => {
                            setSigner({
                              ...option.signer,
                              transport,
                              type: option.type,
                              mode: option.mode,
                            } as Signer);
                          }}
                          className={classNames([
                            'btn flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed hover:border hover:border-accent',
                            signer?.type === option!.type ? 'btn-accent' : '',
                          ])}
                        >
                          <span>{option!.name}</span>
                        </button>
                      ) : (
                        <button
                          key={option!.type}
                          disabled={isPending}
                          onClick={() => {
                            setSigner({
                              ...option!.signer,
                              type: option!.type,
                              mode: option!.mode,
                            } as Signer);
                          }}
                          className={classNames([
                            'btn flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed relative ring-2 ring-blue-500/10 ring-offset-2 ring-offset-transparent hover:ring-blue-500/25 border-1 border-transparent hover:border-transparent focus:outline-none outline-none transition-all',
                            signer?.type === option!.type ? 'border-blue-600/40 ring-blue-500/25' : '',
                          ])}
                        >
                          <CoolPasskey text="Passkey" />
                        </button>
                      ),
                    )}
                </div>
              </>
            ) : null}
            {!isSmartContractAccount ? (
              <>
                <div className="text-lg pb-2">Pick a Signer:</div>
                <div className="flex flex-row flex-grow gap-4">
                  {SignerOptions.filter(({ mode }) => mode === 'EOA').map((option) => (
                    <button
                      key={option.type}
                      disabled={isPending}
                      onClick={() => {
                        setSigner({
                          type: option.type,
                          mode: option.mode,
                        } as Signer);
                      }}
                      className={classNames([
                        'btn flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed hover:border hover:border-accent',
                        signer?.type === option.type ? 'btn-accent' : '',
                      ])}
                    >
                      <span>{option.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex flew-row flew-grow justify-between gap-2 items-stretch my-4 px-4">
          <button className="btn btn-secondary" onClick={() => sendParentMessage({ type: 'close' })}>
            Nope.
          </button>
          <button
            className="btn btn-accent"
            disabled={!!mainBridgeError || isPending || !signer || (signer.mode === 'EOA' && !transport)}
            onClick={() => {
              setError(undefined);
              signTransaction((hash) => {
                sendParentMessage({
                  id: actionId,
                  result: hash,
                });
                sendParentMessage({
                  type: 'close',
                });
                setActionId?.(undefined);
                setActionName(undefined);
              });
            }}
          >
            Yes please
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(SignAction);
