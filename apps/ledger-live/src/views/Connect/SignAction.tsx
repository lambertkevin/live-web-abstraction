import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import { BigNumber } from 'bignumber.js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import getDeviceEvmTransactionConfig from '@ledgerhq/coin-evm/lib/deviceTransactionConfig';
import type { Transaction as EvmTransaction } from '@ledgerhq/coin-evm/lib/types/transaction';
import type { CommonDeviceTransactionField } from '@ledgerhq/coin-framework/lib-es/transaction/common';
import getDeviceEvmAbstractionTransactionConfig from '../../libraries/coin-evm-abstraction/deviceTransactionConfig';
import type { EvmAbstractionTransaction } from '../../libraries/coin-evm-abstraction/types';
import { AccountWithSigners, RawEthersTransaction, Signer } from '../../types';
import { translateError } from '../../helpers/translations';
import LedgerLogo from '../../components/icons/LedgerLogo';
import { useBridge } from '../../hooks/useBridge';
import { SignerOptions } from '../../helpers';
import { useAccountsStore } from '../../store';
import type { ACTIONS } from '.';
import CoolPasskey from '../../components/CoolPasskey';

type Props = {
  selectedAccount: AccountWithSigners | undefined;
  initialTransaction: RawEthersTransaction | undefined;
  sendParentMessage: (params: { type: string; data?: Record<string, unknown> }) => void;
  setActionName: (actionName: keyof typeof ACTIONS | undefined) => void;
};

export const SignAction = ({ selectedAccount, initialTransaction, sendParentMessage, setActionName }: Props) => {
  if (!selectedAccount) throw Error('No account selected');
  if (!initialTransaction) throw Error('No transaction provided');

  const { syncAccounts } = useAccountsStore();
  useEffect(() => {
    syncAccounts();
  }, []);

  const isSmartContractAccount = useMemo(
    () => selectedAccount.seedIdentifier.includes('.ledger.com'),
    [selectedAccount],
  );
  const [signer, setSigner] = useState<Signer | undefined>(
    selectedAccount.signers?.length === 1 && selectedAccount.signers[0].mode === 'Webauthn'
      ? selectedAccount.signers[0]
      : undefined,
  );

  const [liveTransaction, setLiveTransaction] = useState<EvmTransaction | EvmAbstractionTransaction | undefined>();
  useEffect(() => {
    const newLiveTransaction: EvmTransaction | EvmAbstractionTransaction = isSmartContractAccount
      ? {
          family: 'evm-abstraction',
          mode: 'send',
          sender: selectedAccount.freshAddress,
          amount: new BigNumber(initialTransaction.value),
          recipient: initialTransaction.to!,
          nonce: -1,
          callData: Buffer.from(initialTransaction.data.slice(2), 'hex'),
          callGasLimit: new BigNumber(0),
          verificationGasLimit: new BigNumber(0),
          preVerificationGas: new BigNumber(0),
          maxFeePerGas: new BigNumber(initialTransaction.maxFeePerGas || 0),
          maxPriorityFeePerGas: new BigNumber(initialTransaction.maxPriorityFeePerGas || 0),
          signer: selectedAccount.signers![0],
          chainId: initialTransaction.chainId,
        }
      : {
          family: 'evm',
          mode: 'send',
          amount: new BigNumber(0),
          recipient: initialTransaction.to!,
          nonce: -1,
          gasLimit: new BigNumber(0),
          data: Buffer.from(initialTransaction.data.slice(2), 'hex'),
          maxFeePerGas: new BigNumber(initialTransaction.maxFeePerGas || 0),
          maxPriorityFeePerGas: new BigNumber(initialTransaction.maxPriorityFeePerGas || 0),
          type: 2,
          chainId: initialTransaction.chainId,
        };

    if (!isEqual(newLiveTransaction, liveTransaction)) {
      setLiveTransaction(newLiveTransaction);
    }
  }, [
    liveTransaction,
    initialTransaction,
    isSmartContractAccount,
    selectedAccount.freshAddress,
    selectedAccount.signers,
  ]);

  const { bridge, status, transaction, isPending, setIsPending } = useBridge(selectedAccount, liveTransaction, signer);
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
        next: (res) => {
          if (res.type === 'signed') {
            setBroadcasting(true);
            setCheckDevice(false);
            bridge
              .broadcast({ account: selectedAccount, signedOperation: res.signedOperation })
              .then(({ hash }) => {
                onTransactionBroadcasted?.(hash);
                setIsPending(false);
              })
              .finally(() => {
                setBroadcasting(false);
              });
          }
        },
        error(err) {
          console.log({ err });
          setError(err);
          setIsPending(false);
          setCheckDevice(false);
        },
      });
    },
    [bridge, selectedAccount, setIsPending, signer?.mode, status?.errors, transaction],
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
        {mainBridgeError ? (
          <div className="alert alert-error">{translateError(mainBridgeError?.name || 'Unknown Error')}</div>
        ) : null}
        {error ? <div className="alert alert-error">{translateError(error.name)}</div> : null}
        <div className="p-2 text-center text-lg">Would you like to sign this shit ?</div>
        <div>
          {transactionConfig?.map((field, i) => (
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
                    {selectedAccount.currency.units[0].code}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-row w-full px-4 py-2">
          <div className="flex flex-col flex-grow gap-3"></div>
        </div>
        <div className="flex flex-row w-full px-4 py-2">
          <div className="flex flex-col flex-grow gap-3">
            {isSmartContractAccount && !mainBridgeError ? (
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
                          key={option!.type}
                          disabled={isPending}
                          onClick={() => {
                            setSigner(option!.signer);
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
                            setSigner(option!.signer);
                          }}
                          className={classNames([
                            'btn flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed relative',
                            signer?.type === option!.type ? 'border-1 border-blue-600 border-opacity-40' : '',
                          ])}
                        >
                          <CoolPasskey text="Passkey" />
                        </button>
                      ),
                    )}
                </div>
              </>
            ) : null}
            {!isSmartContractAccount && !mainBridgeError ? (
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
            disabled={!!mainBridgeError || isPending || !signer}
            onClick={() => {
              setError(undefined);
              signTransaction((hash) => {
                sendParentMessage({
                  type: 'sign:response',
                  data: {
                    hash,
                  },
                });
                sendParentMessage({
                  type: 'close',
                });
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
